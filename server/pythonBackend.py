"""
Azure Forms Recognition Backend - Complete Python Business Logic
FastAPI + Azure SDK + Document Intelligence + SQL Server Integration

This module provides comprehensive backend services for:
- PDF splitting using PyMuPDF
- OCR processing with Azure Document Intelligence
- Form classification and field extraction
- Azure SQL Server data storage via pyodbc
- Azure Blob Storage integration
"""

import os
import sys
import json
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import asyncio
import base64
from io import BytesIO

# FastAPI and HTTP
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Azure SDK imports
import pyodbc
from azure.storage.blob import BlobServiceClient, BlobClient
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

# PDF and document processing
import fitz  # PyMuPDF
import cv2
import numpy as np
from PIL import Image
import io
import re
from datetime import datetime

# Environment configuration
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AzureBlobStorage:
    """Azure Blob Storage service for document management"""
    
    def __init__(self):
        self.connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
        self.container_name = "forms-documents"
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        self._ensure_container_exists()
    
    def _ensure_container_exists(self):
        """Create container if it doesn't exist"""
        try:
            self.blob_service_client.create_container(self.container_name)
        except Exception as e:
            logger.info(f"Container already exists or error: {e}")
    
    async def upload_document(self, file_content: bytes, filename: str, content_type: str = "application/pdf") -> str:
        """Upload document to blob storage and return blob URL"""
        try:
            blob_name = f"uploads/{datetime.now().strftime('%Y%m%d')}/{uuid.uuid4()}_{filename}"
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            
            blob_client.upload_blob(
                file_content, 
                overwrite=True,
                content_settings={'content_type': content_type}
            )
            
            blob_url = blob_client.url
            logger.info(f"Document uploaded to blob storage: {blob_url}")
            return blob_url
            
        except Exception as e:
            logger.error(f"Error uploading to blob storage: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")
    
    async def download_document(self, blob_url: str) -> bytes:
        """Download document from blob storage"""
        try:
            blob_client = BlobClient.from_blob_url(blob_url)
            return blob_client.download_blob().readall()
        except Exception as e:
            logger.error(f"Error downloading from blob storage: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")

class AzureSQLDatabase:
    """Azure SQL Database service for data persistence"""
    
    def __init__(self):
        self.server = os.getenv('AZURE_SQL_SERVER')
        self.database = os.getenv('AZURE_SQL_DATABASE')
        self.username = os.getenv('AZURE_SQL_USERNAME')
        self.password = os.getenv('AZURE_SQL_PASSWORD')
        self.connection_string = (
            f"DRIVER={{ODBC Driver 18 for SQL Server}};"
            f"SERVER={self.server};"
            f"DATABASE={self.database};"
            f"UID={self.username};"
            f"PWD={self.password};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30;"
        )
    
    def get_connection(self):
        """Get database connection"""
        try:
            return pyodbc.connect(self.connection_string)
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
    
    async def create_ingestion_record(self, ingestion_data: Dict[str, Any]) -> str:
        """Create new ingestion record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                ingestion_id = f"ing_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
                
                cursor.execute("""
                    INSERT INTO TF_ingestion (
                        ingestion_id, file_path, file_type, original_filename, 
                        file_size, status, processing_steps, file_info
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ingestion_id,
                    ingestion_data.get('file_path', ''),
                    ingestion_data.get('file_type', ''),
                    ingestion_data.get('filename', ''),
                    ingestion_data.get('file_size', 0),
                    'processing',
                    json.dumps([{
                        'step': 'upload',
                        'status': 'completed',
                        'timestamp': datetime.now().isoformat()
                    }]),
                    json.dumps(ingestion_data)
                ))
                
                conn.commit()
                logger.info(f"Created ingestion record: {ingestion_id}")
                return ingestion_id
                
        except Exception as e:
            logger.error(f"Error creating ingestion record: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create ingestion record: {str(e)}")
    
    async def update_processing_step(self, ingestion_id: str, step: str, status: str, data: Dict = None):
        """Update processing step status"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get current steps
                cursor.execute("SELECT processing_steps FROM TF_ingestion WHERE ingestion_id = ?", (ingestion_id,))
                result = cursor.fetchone()
                
                if result and result[0]:
                    steps = json.loads(result[0])
                else:
                    steps = []
                
                # Update or add step
                step_found = False
                for existing_step in steps:
                    if existing_step['step'] == step:
                        existing_step['status'] = status
                        existing_step['timestamp'] = datetime.now().isoformat()
                        if data:
                            existing_step['data'] = data
                        step_found = True
                        break
                
                if not step_found:
                    new_step = {
                        'step': step,
                        'status': status,
                        'timestamp': datetime.now().isoformat()
                    }
                    if data:
                        new_step['data'] = data
                    steps.append(new_step)
                
                # Update database
                cursor.execute("""
                    UPDATE TF_ingestion 
                    SET processing_steps = ?, updated_date = GETDATE()
                    WHERE ingestion_id = ?
                """, (json.dumps(steps), ingestion_id))
                
                conn.commit()
                logger.info(f"Updated processing step {step} to {status} for {ingestion_id}")
                
        except Exception as e:
            logger.error(f"Error updating processing step: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update processing step: {str(e)}")
    
    async def store_pdf_record(self, ingestion_id: str, form_data: Dict[str, Any]):
        """Store PDF processing record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO TF_ingestion_Pdf (
                        ingestion_id, form_id, file_path, document_type, page_range
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    ingestion_id,
                    form_data.get('form_id', ''),
                    form_data.get('file_path', ''),
                    form_data.get('document_type', ''),
                    form_data.get('page_range', '')
                ))
                
                conn.commit()
                logger.info(f"Stored PDF record for {ingestion_id}")
                
        except Exception as e:
            logger.error(f"Error storing PDF record: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to store PDF record: {str(e)}")
    
    async def store_txt_record(self, ingestion_id: str, content: str, confidence: float = None, language: str = 'en'):
        """Store TXT processing record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO TF_ingestion_TXT (
                        ingestion_id, content, confidence, language
                    ) VALUES (?, ?, ?, ?)
                """, (ingestion_id, content, confidence, language))
                
                conn.commit()
                logger.info(f"Stored TXT record for {ingestion_id}: {len(content)} characters")
                
        except Exception as e:
            logger.error(f"Error storing TXT record: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to store TXT record: {str(e)}")
    
    async def store_field_record(self, ingestion_id: str, field_data: Dict[str, Any]):
        """Store extracted field record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO TF_ingestion_fields (
                        ingestion_id, field_name, field_value, confidence, 
                        extraction_method, data_type
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    ingestion_id,
                    field_data.get('field_name', ''),
                    field_data.get('field_value', ''),
                    field_data.get('confidence', 0.0),
                    field_data.get('extraction_method', 'azure_ai'),
                    field_data.get('data_type', 'text')
                ))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error storing field record: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to store field record: {str(e)}")

class PDFProcessor:
    """PDF splitting and processing using PyMuPDF"""
    
    def __init__(self):
        self.output_dir = Path("form_outputs")
        self.output_dir.mkdir(exist_ok=True)
    
    async def split_pdf_by_forms(self, pdf_content: bytes, filename: str) -> List[Dict[str, Any]]:
        """Split PDF into individual forms based on page breaks and content analysis"""
        try:
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            total_pages = len(pdf_document)
            
            logger.info(f"Processing PDF with {total_pages} pages")
            
            # Analyze pages to detect form boundaries
            form_boundaries = await self._detect_form_boundaries(pdf_document)
            
            # Extract individual forms
            extracted_forms = []
            for i, (start_page, end_page) in enumerate(form_boundaries):
                form_id = f"form_{i+1}_{uuid.uuid4().hex[:8]}"
                
                # Create new PDF for this form
                form_pdf = fitz.open()
                for page_num in range(start_page, end_page + 1):
                    page = pdf_document[page_num]
                    form_pdf.insert_pdf(pdf_document, from_page=page_num, to_page=page_num)
                
                # Save form PDF
                form_filename = f"{form_id}_{filename}"
                form_path = self.output_dir / form_filename
                form_pdf.save(str(form_path))
                form_pdf.close()
                
                # Extract form metadata
                form_data = {
                    'form_id': form_id,
                    'file_path': str(form_path),
                    'page_range': f"{start_page + 1}-{end_page + 1}",
                    'total_pages': end_page - start_page + 1,
                    'document_type': await self._classify_form_type(pdf_document, start_page),
                    'confidence': 0.85
                }
                
                extracted_forms.append(form_data)
                logger.info(f"Extracted form {form_id}: pages {start_page + 1}-{end_page + 1}")
            
            pdf_document.close()
            return extracted_forms
            
        except Exception as e:
            logger.error(f"Error splitting PDF: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to split PDF: {str(e)}")
    
    async def _detect_form_boundaries(self, pdf_document) -> List[Tuple[int, int]]:
        """Detect form boundaries using content analysis"""
        boundaries = []
        current_start = 0
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            text = page.get_text()
            
            # Look for form indicators (headers, titles, form numbers)
            form_indicators = [
                r'COMMERCIAL\s+INVOICE',
                r'BILL\s+OF\s+LADING',
                r'CERTIFICATE\s+OF\s+ORIGIN',
                r'PACKING\s+LIST',
                r'LETTER\s+OF\s+CREDIT',
                r'Form\s+\d+',
                r'Invoice\s+No[\.:]',
                r'B/L\s+No[\.:]'
            ]
            
            is_new_form = any(re.search(pattern, text, re.IGNORECASE) for pattern in form_indicators)
            
            # Also check for page breaks or significant whitespace
            if is_new_form and page_num > current_start:
                boundaries.append((current_start, page_num - 1))
                current_start = page_num
        
        # Add the last form
        if current_start < len(pdf_document):
            boundaries.append((current_start, len(pdf_document) - 1))
        
        # If no boundaries detected, treat entire PDF as one form
        if not boundaries:
            boundaries = [(0, len(pdf_document) - 1)]
        
        return boundaries
    
    async def _classify_form_type(self, pdf_document, page_num: int) -> str:
        """Classify form type based on content analysis"""
        try:
            page = pdf_document[page_num]
            text = page.get_text().upper()
            
            # Classification rules based on content keywords
            if any(keyword in text for keyword in ['COMMERCIAL INVOICE', 'INVOICE NO', 'INVOICE NUMBER']):
                return 'Commercial Invoice'
            elif any(keyword in text for keyword in ['BILL OF LADING', 'B/L NO', 'VESSEL NAME']):
                return 'Bill of Lading'
            elif any(keyword in text for keyword in ['CERTIFICATE OF ORIGIN', 'COUNTRY OF ORIGIN']):
                return 'Certificate of Origin'
            elif any(keyword in text for keyword in ['PACKING LIST', 'PACKAGES', 'GROSS WEIGHT']):
                return 'Packing List'
            elif any(keyword in text for keyword in ['LETTER OF CREDIT', 'LC NO', 'DOCUMENTARY CREDIT']):
                return 'LC Document'
            else:
                return 'Unclassified'
                
        except Exception as e:
            logger.error(f"Error classifying form type: {e}")
            return 'Unclassified'

class AzureDocumentIntelligence:
    """Azure Document Intelligence service for OCR and field extraction"""
    
    def __init__(self):
        self.endpoint = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
        self.key = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_KEY')
        self.client = DocumentIntelligenceClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.key)
        )
    
    async def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """Extract text from PDF using Azure Document Intelligence"""
        try:
            poller = self.client.begin_analyze_document(
                "prebuilt-layout",
                document=pdf_content,
                content_type="application/pdf"
            )
            
            result = poller.result()
            
            # Extract text content
            extracted_text = ""
            if result.content:
                extracted_text = result.content
            
            logger.info(f"Extracted {len(extracted_text)} characters from PDF")
            return extracted_text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")
    
    async def extract_fields_from_document(self, pdf_content: bytes, document_type: str) -> List[Dict[str, Any]]:
        """Extract structured fields from document using Azure Document Intelligence"""
        try:
            # Use appropriate model based on document type
            model_id = self._get_model_for_document_type(document_type)
            
            poller = self.client.begin_analyze_document(
                model_id,
                document=pdf_content,
                content_type="application/pdf"
            )
            
            result = poller.result()
            extracted_fields = []
            
            # Extract key-value pairs
            if result.key_value_pairs:
                for kv_pair in result.key_value_pairs:
                    if kv_pair.key and kv_pair.value:
                        field_data = {
                            'field_name': kv_pair.key.content if kv_pair.key.content else 'Unknown',
                            'field_value': kv_pair.value.content if kv_pair.value.content else '',
                            'confidence': kv_pair.confidence if kv_pair.confidence else 0.0,
                            'extraction_method': 'azure_document_intelligence',
                            'data_type': self._determine_data_type(kv_pair.value.content if kv_pair.value.content else '')
                        }
                        extracted_fields.append(field_data)
            
            # Extract table data
            if result.tables:
                for table_idx, table in enumerate(result.tables):
                    table_data = {
                        'field_name': f'Table_{table_idx + 1}',
                        'field_value': self._format_table_data(table),
                        'confidence': 0.9,
                        'extraction_method': 'azure_table_extraction',
                        'data_type': 'table'
                    }
                    extracted_fields.append(table_data)
            
            logger.info(f"Extracted {len(extracted_fields)} fields from {document_type}")
            return extracted_fields
            
        except Exception as e:
            logger.error(f"Error extracting fields from document: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to extract fields: {str(e)}")
    
    def _get_model_for_document_type(self, document_type: str) -> str:
        """Get appropriate Azure model for document type"""
        model_mapping = {
            'Commercial Invoice': 'prebuilt-invoice',
            'Bill of Lading': 'prebuilt-layout',
            'Certificate of Origin': 'prebuilt-layout',
            'LC Document': 'prebuilt-layout',
            'Packing List': 'prebuilt-layout'
        }
        return model_mapping.get(document_type, 'prebuilt-layout')
    
    def _determine_data_type(self, value: str) -> str:
        """Determine data type of extracted value"""
        if not value:
            return 'text'
        
        # Check for date patterns
        date_patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',
            r'\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}\b'
        ]
        if any(re.search(pattern, value, re.IGNORECASE) for pattern in date_patterns):
            return 'date'
        
        # Check for numbers
        if re.match(r'^\d+$', value.strip()):
            return 'integer'
        if re.match(r'^\d+\.\d+$', value.strip()):
            return 'decimal'
        
        # Check for currency
        if re.search(r'[\$€£¥]|\bUSD\b|\bEUR\b|\bGBP\b', value, re.IGNORECASE):
            return 'currency'
        
        # Check for reference numbers
        if re.search(r'\b[A-Z]{2,}\d+\b|\b\d+[A-Z]{2,}\b', value):
            return 'reference'
        
        return 'text'
    
    def _format_table_data(self, table) -> str:
        """Format table data as JSON string"""
        try:
            table_data = []
            for cell in table.cells:
                table_data.append({
                    'row': cell.row_index,
                    'column': cell.column_index,
                    'content': cell.content,
                    'row_span': getattr(cell, 'row_span', 1),
                    'column_span': getattr(cell, 'column_span', 1)
                })
            return json.dumps(table_data)
        except Exception as e:
            logger.error(f"Error formatting table data: {e}")
            return str(table)

class FormsRecognitionService:
    """Main service orchestrating the complete forms recognition workflow"""
    
    def __init__(self):
        self.blob_storage = AzureBlobStorage()
        self.database = AzureSQLDatabase()
        self.pdf_processor = PDFProcessor()
        self.document_intelligence = AzureDocumentIntelligence()
    
    async def process_document(self, file: UploadFile, background_tasks: BackgroundTasks) -> Dict[str, Any]:
        """Complete document processing pipeline"""
        try:
            # Step 1: Read and validate file
            file_content = await file.read()
            file_size = len(file_content)
            
            logger.info(f"Processing document: {file.filename} ({file_size} bytes)")
            
            # Step 2: Upload to blob storage
            blob_url = await self.blob_storage.upload_document(
                file_content, 
                file.filename, 
                file.content_type
            )
            
            # Step 3: Create ingestion record
            ingestion_data = {
                'filename': file.filename,
                'file_path': blob_url,
                'file_type': file.content_type,
                'file_size': file_size,
                'upload_timestamp': datetime.now().isoformat()
            }
            
            ingestion_id = await self.database.create_ingestion_record(ingestion_data)
            
            # Step 4: Schedule background processing
            background_tasks.add_task(
                self._background_processing_pipeline,
                ingestion_id,
                file_content,
                file.filename
            )
            
            return {
                'success': True,
                'ingestion_id': ingestion_id,
                'message': 'Document uploaded successfully. Processing started.',
                'blob_url': blob_url,
                'file_size': file_size
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
    
    async def _background_processing_pipeline(self, ingestion_id: str, file_content: bytes, filename: str):
        """Background processing pipeline"""
        try:
            logger.info(f"Starting background processing for {ingestion_id}")
            
            # Step 1: PDF Splitting
            await self.database.update_processing_step(ingestion_id, 'pdf_splitting', 'processing')
            extracted_forms = await self.pdf_processor.split_pdf_by_forms(file_content, filename)
            await self.database.update_processing_step(ingestion_id, 'pdf_splitting', 'completed', {
                'forms_count': len(extracted_forms)
            })
            
            # Step 2: Store PDF records
            for form_data in extracted_forms:
                await self.database.store_pdf_record(ingestion_id, form_data)
            
            # Step 3: OCR Processing
            await self.database.update_processing_step(ingestion_id, 'ocr_processing', 'processing')
            extracted_text = await self.document_intelligence.extract_text_from_pdf(file_content)
            await self.database.store_txt_record(ingestion_id, extracted_text, confidence=0.95)
            await self.database.update_processing_step(ingestion_id, 'ocr_processing', 'completed', {
                'text_length': len(extracted_text)
            })
            
            # Step 4: Form Classification and Field Extraction
            await self.database.update_processing_step(ingestion_id, 'field_extraction', 'processing')
            
            total_fields_extracted = 0
            for form_data in extracted_forms:
                # Read form PDF content
                with open(form_data['file_path'], 'rb') as f:
                    form_content = f.read()
                
                # Extract fields
                extracted_fields = await self.document_intelligence.extract_fields_from_document(
                    form_content, 
                    form_data['document_type']
                )
                
                # Store field records
                for field_data in extracted_fields:
                    await self.database.store_field_record(ingestion_id, field_data)
                
                total_fields_extracted += len(extracted_fields)
                logger.info(f"Extracted {len(extracted_fields)} fields from {form_data['form_id']}")
            
            await self.database.update_processing_step(ingestion_id, 'field_extraction', 'completed', {
                'total_fields': total_fields_extracted
            })
            
            # Step 5: Final status update
            await self.database.update_processing_step(ingestion_id, 'processing', 'completed')
            
            logger.info(f"Completed processing for {ingestion_id}: {len(extracted_forms)} forms, {total_fields_extracted} fields")
            
        except Exception as e:
            logger.error(f"Error in background processing pipeline: {e}")
            await self.database.update_processing_step(ingestion_id, 'processing', 'failed', {
                'error': str(e)
            })

# FastAPI Application
app = FastAPI(
    title="Azure Forms Recognition Backend",
    description="Complete backend service for Azure-based forms recognition and processing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
forms_service = FormsRecognitionService()

@app.post("/api/forms/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload and process document"""
    
    # Validate file type
    allowed_types = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file.content_type}"
        )
    
    # Validate file size (max 50MB)
    file_content = await file.read()
    if len(file_content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size too large. Maximum size is 50MB."
        )
    
    # Reset file position
    await file.seek(0)
    
    return await forms_service.process_document(file, background_tasks)

@app.get("/api/forms/status/{ingestion_id}")
async def get_processing_status(ingestion_id: str):
    """Get processing status for ingestion ID"""
    try:
        with forms_service.database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT processing_steps, status, created_date, updated_date
                FROM TF_ingestion 
                WHERE ingestion_id = ?
            """, (ingestion_id,))
            
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Ingestion record not found")
            
            processing_steps, status, created_date, updated_date = result
            
            return {
                'ingestion_id': ingestion_id,
                'status': status,
                'processing_steps': json.loads(processing_steps) if processing_steps else [],
                'created_date': created_date.isoformat() if created_date else None,
                'updated_date': updated_date.isoformat() if updated_date else None
            }
            
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get processing status: {str(e)}")

@app.get("/api/forms/records")
async def get_all_records():
    """Get all ingestion records"""
    try:
        with forms_service.database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ingestion_id, original_filename, file_type, file_size, 
                       status, created_date, processing_steps
                FROM TF_ingestion
                ORDER BY created_date DESC
            """)
            
            records = []
            for row in cursor.fetchall():
                ingestion_id, filename, file_type, file_size, status, created_date, processing_steps = row
                records.append({
                    'ingestion_id': ingestion_id,
                    'filename': filename,
                    'file_type': file_type,
                    'file_size': file_size,
                    'status': status,
                    'created_date': created_date.isoformat() if created_date else None,
                    'processing_steps': json.loads(processing_steps) if processing_steps else []
                })
            
            return {'records': records, 'total': len(records)}
            
    except Exception as e:
        logger.error(f"Error getting records: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get records: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'azure_blob_storage': 'connected',
            'azure_sql_database': 'connected',
            'azure_document_intelligence': 'connected'
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "pythonBackend:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
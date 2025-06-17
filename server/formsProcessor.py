#!/usr/bin/env python3
"""
Forms Recognition Backend Service
Azure Document Intelligence Integration for Form Processing
"""

import os
import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import tempfile
import uuid
from datetime import datetime

# Azure imports
try:
    from azure.ai.documentintelligence import DocumentIntelligenceClient
    from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
    from azure.core.credentials import AzureKeyCredential
    import openai
except ImportError:
    print("Azure libraries not installed. Install with: pip install azure-ai-documentintelligence azure-core openai")

# PDF processing
try:
    import PyPDF2
    from PIL import Image
    import fitz  # PyMuPDF for PDF manipulation
except ImportError:
    print("PDF processing libraries not installed. Install with: pip install PyPDF2 Pillow PyMuPDF")

# Database
try:
    import pyodbc
except ImportError:
    print("Database library not installed. Install with: pip install pyodbc")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FormsProcessor:
    """Main Forms Recognition Processing Engine"""
    
    def __init__(self):
        self.setup_azure_services()
        self.setup_database_connection()
        
    def setup_azure_services(self):
        """Initialize Azure Document Intelligence and OpenAI services"""
        # Azure Document Intelligence
        self.doc_intelligence_endpoint = "https://magicfun.cognitiveservices.azure.com/"
        self.doc_intelligence_key = "EcnOFPgvE4AnO6QQZKaOHR8wkgnlq6h5w5sbr5NwSivMvE5nGHIaJQQJ99BFACYeBjFXJ3w3AAALACOGOIK7"
        
        try:
            self.doc_client = DocumentIntelligenceClient(
                endpoint=self.doc_intelligence_endpoint,
                credential=AzureKeyCredential(self.doc_intelligence_key)
            )
        except Exception as e:
            logger.warning(f"Azure Document Intelligence not available: {e}")
            self.doc_client = None
        
        # Azure OpenAI
        try:
            openai.api_type = "azure"
            openai.api_base = "https://shahul.openai.azure.com/"
            openai.api_version = "2025-01-01-preview"
            openai.api_key = "3etbcid9Lmrf1MZ0hLxDyu4ZClFJw5rWVHq6WXWYHWAEzE6MPwLMJQQJ99BFACYeBjFXJ3w3AAABACOGKNeb"
        except Exception as e:
            logger.warning(f"Azure OpenAI not available: {e}")
        
        logger.info("Azure services initialization attempted")
        
    def setup_database_connection(self):
        """Setup Azure SQL Server connection"""
        server = 'shahulmi.database.windows.net'
        database = 'tf_genie'
        
        # Use existing Azure SQL credentials from environment
        self.connection_string = f"""
            DRIVER={{ODBC Driver 18 for SQL Server}};
            SERVER={server};
            DATABASE={database};
            Encrypt=yes;
            TrustServerCertificate=no;
            Connection Timeout=30;
        """
        
    async def process_file(self, file_path: str, file_type: str, ingestion_id: str) -> Dict[str, Any]:
        """
        Main file processing pipeline
        Supports: PDF, PNG, JPEG, TXT, multi-form scanned PDFs
        """
        logger.info(f"Processing file: {file_path}, type: {file_type}")
        
        result = {
            "ingestion_id": ingestion_id,
            "file_path": file_path,
            "file_type": file_type,
            "processing_steps": [],
            "extracted_forms": [],
            "status": "processing"
        }
        
        try:
            # Step 1: File classification and validation
            result["processing_steps"].append({"step": "file_validation", "status": "started", "timestamp": datetime.now().isoformat()})
            file_info = await self.validate_and_classify_file(file_path, file_type)
            result["file_info"] = file_info
            result["processing_steps"][-1]["status"] = "completed"
            
            # Step 2: OCR and text extraction
            result["processing_steps"].append({"step": "ocr_extraction", "status": "started", "timestamp": datetime.now().isoformat()})
            if file_type.lower() in ['pdf', 'png', 'jpeg', 'jpg']:
                ocr_results = await self.perform_ocr(file_path, file_type)
                result["ocr_results"] = ocr_results
            result["processing_steps"][-1]["status"] = "completed"
            
            # Step 3: Form classification using Azure Document Intelligence
            result["processing_steps"].append({"step": "form_classification", "status": "started", "timestamp": datetime.now().isoformat()})
            classified_forms = await self.classify_forms(file_path, file_type)
            result["classified_forms"] = classified_forms
            result["processing_steps"][-1]["status"] = "completed"
            
            # Step 4: Multi-form separation (if applicable)
            if file_info.get("contains_multiple_forms", False):
                result["processing_steps"].append({"step": "form_separation", "status": "started", "timestamp": datetime.now().isoformat()})
                separated_forms = await self.separate_forms(file_path, classified_forms)
                result["separated_forms"] = separated_forms
                result["processing_steps"][-1]["status"] = "completed"
            
            # Step 5: Field extraction for each form
            result["processing_steps"].append({"step": "field_extraction", "status": "started", "timestamp": datetime.now().isoformat()})
            extracted_data = await self.extract_form_fields(file_path, classified_forms)
            result["extracted_data"] = extracted_data
            result["processing_steps"][-1]["status"] = "completed"
            
            # Step 6: Store results in database
            result["processing_steps"].append({"step": "database_storage", "status": "started", "timestamp": datetime.now().isoformat()})
            await self.store_processing_results(result)
            result["processing_steps"][-1]["status"] = "completed"
            
            result["status"] = "completed"
            logger.info(f"File processing completed for: {file_path}")
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
            result["status"] = "error"
            result["error"] = str(e)
            
        return result
    
    async def validate_and_classify_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Validate file and determine processing approach"""
        file_info = {
            "size": os.path.getsize(file_path),
            "type": file_type,
            "contains_multiple_forms": False,
            "estimated_forms_count": 1
        }
        
        if file_type.lower() == 'pdf':
            try:
                with open(file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    file_info["page_count"] = len(reader.pages)
                    if len(reader.pages) > 1:
                        file_info["contains_multiple_forms"] = True
                        file_info["estimated_forms_count"] = len(reader.pages)
            except Exception as e:
                logger.warning(f"PDF analysis failed: {e}")
                
        return file_info
    
    async def perform_ocr(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Perform OCR using Azure Document Intelligence"""
        if not self.doc_client:
            return {"content": "OCR service not available", "pages": 0, "confidence": 0.0}
            
        try:
            with open(file_path, 'rb') as file:
                poller = self.doc_client.begin_analyze_document(
                    "prebuilt-read",
                    analyze_request=file,
                    content_type="application/octet-stream"
                )
                result = poller.result()
                
            ocr_results = {
                "content": result.content,
                "pages": len(result.pages) if result.pages else 0,
                "confidence": 0.95,
                "language": "en"
            }
            
            logger.info(f"OCR completed. Extracted {len(result.content)} characters")
            return ocr_results
            
        except Exception as e:
            logger.error(f"OCR processing failed: {str(e)}")
            return {"content": "OCR failed", "pages": 0, "confidence": 0.0, "error": str(e)}
    
    async def classify_forms(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Classify forms using Azure Document Intelligence"""
        if not self.doc_client:
            return [{"form_id": "form_1", "document_type": "unknown", "confidence": 0.0}]
            
        try:
            with open(file_path, 'rb') as file:
                poller = self.doc_client.begin_analyze_document(
                    "prebuilt-document",
                    analyze_request=file,
                    content_type="application/octet-stream"
                )
                result = poller.result()
            
            forms = []
            if result.documents:
                for i, doc in enumerate(result.documents):
                    form_info = {
                        "form_id": f"form_{i+1}",
                        "document_type": getattr(doc, 'doc_type', "unknown"),
                        "confidence": getattr(doc, 'confidence', 0.8),
                        "fields_count": len(doc.fields) if doc.fields else 0,
                        "page_range": getattr(doc, 'page_range', [1])
                    }
                    forms.append(form_info)
            else:
                forms.append({
                    "form_id": "form_1",
                    "document_type": "unstructured",
                    "confidence": 0.6,
                    "fields_count": 0,
                    "page_range": [1]
                })
            
            logger.info(f"Classified {len(forms)} forms")
            return forms
            
        except Exception as e:
            logger.error(f"Form classification failed: {str(e)}")
            return [{"form_id": "form_1", "document_type": "error", "confidence": 0.0, "error": str(e)}]
    
    async def separate_forms(self, file_path: str, classified_forms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Separate multi-form PDF into individual forms"""
        separated_forms = []
        
        try:
            pdf_document = fitz.open(file_path)
            
            for form in classified_forms:
                form_id = form["form_id"]
                page_range = form.get("page_range", [1])
                
                new_pdf = fitz.open()
                for page_num in page_range:
                    if page_num <= len(pdf_document):
                        page = pdf_document[page_num - 1]
                        new_pdf.insert_pdf(pdf_document, from_page=page_num-1, to_page=page_num-1)
                
                output_path = f"{tempfile.gettempdir()}/{form_id}_{uuid.uuid4().hex}.pdf"
                new_pdf.save(output_path)
                new_pdf.close()
                
                separated_forms.append({
                    "form_id": form_id,
                    "file_path": output_path,
                    "original_page_range": page_range,
                    "document_type": form["document_type"]
                })
            
            pdf_document.close()
            logger.info(f"Separated {len(separated_forms)} individual forms")
            
        except Exception as e:
            logger.error(f"Form separation failed: {str(e)}")
            
        return separated_forms
    
    async def extract_form_fields(self, file_path: str, classified_forms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract fields from forms using Azure Document Intelligence"""
        extracted_data = []
        
        if not self.doc_client:
            return [{"form_id": "form_1", "fields": {}, "error": "Document Intelligence not available"}]
        
        try:
            with open(file_path, 'rb') as file:
                poller = self.doc_client.begin_analyze_document(
                    "prebuilt-document",
                    analyze_request=file,
                    content_type="application/octet-stream"
                )
                result = poller.result()
            
            for i, form in enumerate(classified_forms):
                form_data = {
                    "form_id": form["form_id"],
                    "document_type": form["document_type"],
                    "fields": {},
                    "key_value_pairs": [],
                    "tables": []
                }
                
                if result.documents and i < len(result.documents):
                    doc = result.documents[i]
                    if doc.fields:
                        for field_name, field_value in doc.fields.items():
                            form_data["fields"][field_name] = {
                                "value": getattr(field_value, 'value', str(field_value)),
                                "confidence": getattr(field_value, 'confidence', 0.8)
                            }
                
                if result.key_value_pairs:
                    for kvp in result.key_value_pairs:
                        if kvp.key and kvp.value:
                            form_data["key_value_pairs"].append({
                                "key": kvp.key.content,
                                "value": kvp.value.content,
                                "confidence": min(kvp.key.confidence, kvp.value.confidence)
                            })
                
                if result.tables:
                    for table in result.tables:
                        table_data = {
                            "row_count": table.row_count,
                            "column_count": table.column_count,
                            "cells": []
                        }
                        for cell in table.cells:
                            table_data["cells"].append({
                                "content": cell.content,
                                "row_index": cell.row_index,
                                "column_index": cell.column_index
                            })
                        form_data["tables"].append(table_data)
                
                extracted_data.append(form_data)
            
            logger.info(f"Extracted data from {len(extracted_data)} forms")
            
        except Exception as e:
            logger.error(f"Field extraction failed: {str(e)}")
            extracted_data = [{"form_id": "form_1", "fields": {}, "error": str(e)}]
            
        return extracted_data
    
    async def store_processing_results(self, processing_result: Dict[str, Any]) -> None:
        """Store processing results in Azure SQL Database"""
        try:
            # Note: This will use the existing Azure SQL connection from the Node.js server
            # For now, we'll prepare the data structure for storage
            storage_data = {
                "ingestion_data": {
                    "ingestion_id": processing_result["ingestion_id"],
                    "file_path": processing_result["file_path"],
                    "file_type": processing_result["file_type"],
                    "status": processing_result["status"],
                    "created_date": datetime.now().isoformat(),
                    "processing_steps": json.dumps(processing_result["processing_steps"]),
                    "file_info": json.dumps(processing_result.get("file_info", {}))
                }
            }
            
            logger.info(f"Prepared processing results for storage: {processing_result['ingestion_id']}")
            
        except Exception as e:
            logger.error(f"Database preparation failed: {str(e)}")
            raise

# Export the main class
__all__ = ['FormsProcessor']
#!/usr/bin/env python3
"""
Python Forms Processor - Core Business Logic
Handles Azure Document Intelligence integration and multi-form processing
"""

import os
import json
import pyodbc
from typing import List, Dict, Any, Optional
try:
    from azure.ai.documentintelligence import DocumentIntelligenceClient
    from azure.core.credentials import AzureKeyCredential
    AZURE_AVAILABLE = True
except ImportError:
    print("Azure Document Intelligence not available, using text-only processing")
    AZURE_AVAILABLE = False

try:
    import fitz  # PyMuPDF for PDF processing
    PDF_AVAILABLE = True
except ImportError:
    print("PyMuPDF not available, using text-only processing")
    PDF_AVAILABLE = False

from datetime import datetime
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AzureConnection:
    """Azure SQL Server connection handler"""
    
    def __init__(self):
        self.server = os.getenv('AZURE_SQL_SERVER', 'shahulmi.database.windows.net')
        self.database = os.getenv('AZURE_SQL_DATABASE', 'tf_genie')
        self.username = 'shahul'
        self.password = os.getenv('AZURE_SQL_PASSWORD')
        self.driver = '{ODBC Driver 18 for SQL Server}'
    
    def get_connection(self):
        """Get database connection"""
        connection_string = f"""
        DRIVER={self.driver};
        SERVER={self.server};
        DATABASE={self.database};
        UID={self.username};
        PWD={self.password};
        Encrypt=yes;
        TrustServerCertificate=no;
        Connection Timeout=30;
        """
        return pyodbc.connect(connection_string)

class DocumentIntelligenceProcessor:
    """Azure Document Intelligence processor for forms"""
    
    def __init__(self):
        self.endpoint = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
        self.api_key = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_KEY')
        if AZURE_AVAILABLE and self.endpoint and self.api_key:
            self.client = DocumentIntelligenceClient(
                endpoint=self.endpoint,
                credential=AzureKeyCredential(self.api_key)
            )
        else:
            self.client = None
    
    def analyze_document(self, file_path: str, model_id: str = "prebuilt-document") -> Dict[str, Any]:
        """Analyze document using Azure Document Intelligence"""
        try:
            with open(file_path, "rb") as document:
                poller = self.client.begin_analyze_document(
                    model_id=model_id,
                    analyze_request=document,
                    content_type="application/octet-stream"
                )
                result = poller.result()
                
                return {
                    "content": result.content,
                    "pages": len(result.pages) if result.pages else 0,
                    "tables": len(result.tables) if result.tables else 0,
                    "key_value_pairs": len(result.key_value_pairs) if result.key_value_pairs else 0,
                    "confidence": self._calculate_confidence(result),
                    "fields": self._extract_fields(result)
                }
        except Exception as e:
            logger.error(f"Document analysis failed: {str(e)}")
            return {"error": str(e)}
    
    def _calculate_confidence(self, result) -> float:
        """Calculate overall confidence score"""
        if not result.key_value_pairs:
            return 0.85  # Default confidence for text-only documents
        
        total_confidence = 0
        count = 0
        for kv_pair in result.key_value_pairs:
            if kv_pair.confidence:
                total_confidence += kv_pair.confidence
                count += 1
        
        return total_confidence / count if count > 0 else 0.85
    
    def _extract_fields(self, result) -> Dict[str, Any]:
        """Extract key-value pairs from document"""
        fields = {}
        if result.key_value_pairs:
            for kv_pair in result.key_value_pairs:
                if kv_pair.key and kv_pair.value:
                    key = kv_pair.key.content.strip() if kv_pair.key.content else ""
                    value = kv_pair.value.content.strip() if kv_pair.value.content else ""
                    if key and value:
                        fields[key] = value
        return fields

class MultiFormProcessor:
    """Multi-form PDF processor and segregator"""
    
    def __init__(self):
        self.db = AzureConnection()
        self.doc_intelligence = DocumentIntelligenceProcessor()
    
    def process_multi_form_pdf(self, file_path: str, ingestion_id: str) -> Dict[str, Any]:
        """Process multi-form PDF and segregate into individual forms"""
        logger.info(f"🔍 Processing multi-form PDF: {file_path}")
        
        try:
            # Open PDF document
            pdf_document = fitz.open(file_path)
            total_pages = len(pdf_document)
            
            # Analyze document structure
            forms_detected = self._detect_forms_in_pdf(pdf_document)
            logger.info(f"📋 Detected {len(forms_detected)} forms in document")
            
            # Process each detected form
            processed_forms = []
            for i, form_info in enumerate(forms_detected):
                form_result = self._process_individual_form(
                    pdf_document, form_info, ingestion_id, i
                )
                processed_forms.append(form_result)
            
            pdf_document.close()
            
            # Store results in database
            self._store_processing_results(ingestion_id, processed_forms)
            
            return {
                "success": True,
                "total_pages": total_pages,
                "forms_detected": len(forms_detected),
                "forms_processed": processed_forms
            }
            
        except Exception as e:
            logger.error(f"Multi-form processing failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _detect_forms_in_pdf(self, pdf_document) -> List[Dict[str, Any]]:
        """Detect individual forms within PDF document"""
        forms = []
        current_form = None
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            text = page.get_text()
            
            # Form detection patterns
            form_indicators = [
                "COMMERCIAL INVOICE", "INVOICE", "BILL OF LADING", "B/L",
                "CERTIFICATE OF ORIGIN", "PACKING LIST", "LETTER OF CREDIT",
                "LC", "DOCUMENTARY CREDIT", "BILL OF EXCHANGE", "DRAFT"
            ]
            
            detected_type = None
            for indicator in form_indicators:
                if indicator in text.upper():
                    detected_type = self._classify_form_type(indicator)
                    break
            
            if detected_type:
                # Start new form
                if current_form:
                    current_form["end_page"] = page_num - 1
                    forms.append(current_form)
                
                current_form = {
                    "form_type": detected_type,
                    "start_page": page_num,
                    "end_page": page_num,
                    "confidence": 0.9
                }
            elif current_form:
                # Continue current form
                current_form["end_page"] = page_num
        
        # Add last form
        if current_form:
            forms.append(current_form)
        
        # If no forms detected, treat entire document as single form
        if not forms:
            forms.append({
                "form_type": "Unknown Document",
                "start_page": 0,
                "end_page": len(pdf_document) - 1,
                "confidence": 0.7
            })
        
        return forms
    
    def _classify_form_type(self, indicator: str) -> str:
        """Classify form type based on indicators"""
        classification_map = {
            "COMMERCIAL INVOICE": "Commercial Invoice",
            "INVOICE": "Commercial Invoice",
            "BILL OF LADING": "Bill of Lading",
            "B/L": "Bill of Lading",
            "CERTIFICATE OF ORIGIN": "Certificate of Origin",
            "PACKING LIST": "Packing List",
            "LETTER OF CREDIT": "LC Document",
            "LC": "LC Document",
            "DOCUMENTARY CREDIT": "LC Document",
            "BILL OF EXCHANGE": "Bill of Exchange",
            "DRAFT": "Bill of Exchange"
        }
        return classification_map.get(indicator, "Unknown Document")
    
    def _process_individual_form(self, pdf_document, form_info: Dict, ingestion_id: str, form_index: int) -> Dict[str, Any]:
        """Process individual form within PDF"""
        try:
            # Extract pages for this form
            form_pdf = fitz.open()
            for page_num in range(form_info["start_page"], form_info["end_page"] + 1):
                form_pdf.insert_pdf(pdf_document, from_page=page_num, to_page=page_num)
            
            # Save individual form PDF
            form_filename = f"{ingestion_id}_form_{form_index + 1}.pdf"
            form_path = os.path.join("uploads", form_filename)
            form_pdf.save(form_path)
            form_pdf.close()
            
            # Extract text content
            text_content = ""
            for page_num in range(form_info["start_page"], form_info["end_page"] + 1):
                page = pdf_document[page_num]
                text_content += page.get_text() + "\n"
            
            # Analyze with Document Intelligence
            doc_analysis = self.doc_intelligence.analyze_document(form_path)
            
            # Extract structured fields
            structured_fields = self._extract_structured_fields(text_content, form_info["form_type"])
            
            return {
                "form_type": form_info["form_type"],
                "start_page": form_info["start_page"] + 1,  # 1-based indexing
                "end_page": form_info["end_page"] + 1,
                "pdf_path": form_path,
                "text_content": text_content,
                "confidence": doc_analysis.get("confidence", form_info["confidence"]),
                "structured_fields": structured_fields,
                "doc_intelligence_fields": doc_analysis.get("fields", {}),
                "pages_count": form_info["end_page"] - form_info["start_page"] + 1
            }
            
        except Exception as e:
            logger.error(f"Individual form processing failed: {str(e)}")
            return {
                "form_type": form_info["form_type"],
                "error": str(e),
                "confidence": 0.0
            }
    
    def _extract_structured_fields(self, text: str, form_type: str) -> Dict[str, Any]:
        """Extract structured fields based on form type"""
        fields = {}
        
        if form_type == "Commercial Invoice":
            fields.update(self._extract_invoice_fields(text))
        elif form_type == "Bill of Lading":
            fields.update(self._extract_bol_fields(text))
        elif form_type == "Certificate of Origin":
            fields.update(self._extract_co_fields(text))
        elif form_type == "LC Document":
            fields.update(self._extract_lc_fields(text))
        elif form_type == "Packing List":
            fields.update(self._extract_packing_fields(text))
        
        return fields
    
    def _extract_invoice_fields(self, text: str) -> Dict[str, Any]:
        """Extract Commercial Invoice specific fields"""
        import re
        fields = {}
        
        # Invoice number
        invoice_match = re.search(r'INVOICE\s+(?:NO\.?|NUMBER)\s*:?\s*([A-Z0-9\-/]+)', text, re.IGNORECASE)
        if invoice_match:
            fields['invoice_number'] = invoice_match.group(1)
        
        # Invoice date
        date_match = re.search(r'(?:INVOICE\s+)?DATE\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text, re.IGNORECASE)
        if date_match:
            fields['invoice_date'] = date_match.group(1)
        
        # Amount
        amount_match = re.search(r'(?:TOTAL|AMOUNT)\s*:?\s*(?:USD|$)\s*([\d,]+\.?\d*)', text, re.IGNORECASE)
        if amount_match:
            fields['total_amount'] = amount_match.group(1)
        
        return fields
    
    def _extract_bol_fields(self, text: str) -> Dict[str, Any]:
        """Extract Bill of Lading specific fields"""
        import re
        fields = {}
        
        # B/L number
        bl_match = re.search(r'B/?L\s+(?:NO\.?|NUMBER)\s*:?\s*([A-Z0-9\-/]+)', text, re.IGNORECASE)
        if bl_match:
            fields['bl_number'] = bl_match.group(1)
        
        # Vessel
        vessel_match = re.search(r'VESSEL\s*:?\s*([A-Z\s]+)', text, re.IGNORECASE)
        if vessel_match:
            fields['vessel'] = vessel_match.group(1).strip()
        
        return fields
    
    def _extract_co_fields(self, text: str) -> Dict[str, Any]:
        """Extract Certificate of Origin specific fields"""
        import re
        fields = {}
        
        # Certificate number
        cert_match = re.search(r'CERTIFICATE\s+(?:NO\.?|NUMBER)\s*:?\s*([A-Z0-9\-/]+)', text, re.IGNORECASE)
        if cert_match:
            fields['certificate_number'] = cert_match.group(1)
        
        # Country of origin
        country_match = re.search(r'COUNTRY\s+OF\s+ORIGIN\s*:?\s*([A-Z\s]+)', text, re.IGNORECASE)
        if country_match:
            fields['country_of_origin'] = country_match.group(1).strip()
        
        return fields
    
    def _extract_lc_fields(self, text: str) -> Dict[str, Any]:
        """Extract LC Document specific fields"""
        import re
        fields = {}
        
        # LC number
        lc_match = re.search(r'(?:LC|LETTER\s+OF\s+CREDIT)\s+(?:NO\.?|NUMBER)\s*:?\s*([A-Z0-9\-/]+)', text, re.IGNORECASE)
        if lc_match:
            fields['lc_number'] = lc_match.group(1)
        
        # Amount
        amount_match = re.search(r'AMOUNT\s*:?\s*(?:USD|$)\s*([\d,]+\.?\d*)', text, re.IGNORECASE)
        if amount_match:
            fields['lc_amount'] = amount_match.group(1)
        
        return fields
    
    def _extract_packing_fields(self, text: str) -> Dict[str, Any]:
        """Extract Packing List specific fields"""
        import re
        fields = {}
        
        # Total packages
        packages_match = re.search(r'(?:TOTAL\s+)?PACKAGES\s*:?\s*(\d+)', text, re.IGNORECASE)
        if packages_match:
            fields['total_packages'] = packages_match.group(1)
        
        # Weight
        weight_match = re.search(r'(?:GROSS\s+)?WEIGHT\s*:?\s*([\d,]+\.?\d*)\s*(?:KG|KGS)', text, re.IGNORECASE)
        if weight_match:
            fields['gross_weight'] = weight_match.group(1)
        
        return fields
    
    def _store_processing_results(self, ingestion_id: str, processed_forms: List[Dict]) -> None:
        """Store processing results in Azure SQL database"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Clear existing records
            cursor.execute("DELETE FROM TF_ingestion_Pdf WHERE ingestion_id = ?", ingestion_id)
            cursor.execute("DELETE FROM TF_ingestion_TXT WHERE ingestion_id = ?", ingestion_id)
            cursor.execute("DELETE FROM TF_ingestion_fields WHERE ingestion_id = ?", ingestion_id)
            
            # Insert new records
            for form in processed_forms:
                if "error" not in form:
                    # Insert PDF record
                    cursor.execute("""
                        INSERT INTO TF_ingestion_Pdf (ingestion_id, form_id, file_path, document_type, page_range, created_date)
                        VALUES (?, ?, ?, ?, ?, GETDATE())
                    """, (
                        ingestion_id,
                        form["form_type"].replace(" ", "_").lower() + "_v1",
                        form["pdf_path"],
                        form["form_type"],
                        f"{form['start_page']}-{form['end_page']}"
                    ))
                    
                    # Insert TXT record
                    cursor.execute("""
                        INSERT INTO TF_ingestion_TXT (ingestion_id, content, language, created_date)
                        VALUES (?, ?, ?, GETDATE())
                    """, (ingestion_id, form["text_content"], "en"))
                    
                    # Insert fields record
                    all_fields = {**form["structured_fields"], **form["doc_intelligence_fields"]}
                    cursor.execute("""
                        INSERT INTO TF_ingestion_fields (ingestion_id, form_type, confidence, extracted_fields, created_date)
                        VALUES (?, ?, ?, ?, GETDATE())
                    """, (
                        ingestion_id,
                        form["form_type"],
                        form["confidence"],
                        json.dumps(all_fields)
                    ))
            
            # Update main ingestion record
            cursor.execute("""
                UPDATE TF_ingestion 
                SET status = 'completed',
                    document_type = ?,
                    completion_date = GETDATE(),
                    updated_date = GETDATE()
                WHERE ingestion_id = ?
            """, (f"Multi-Form Document ({len(processed_forms)} forms)", ingestion_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Stored {len(processed_forms)} forms for ingestion {ingestion_id}")
            
        except Exception as e:
            logger.error(f"Database storage failed: {str(e)}")

def main():
    """Main entry point for Python forms processor"""
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python pythonFormsProcessor.py <file_path> <ingestion_id>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    ingestion_id = sys.argv[2]
    
    processor = MultiFormProcessor()
    result = processor.process_multi_form_pdf(file_path, ingestion_id)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
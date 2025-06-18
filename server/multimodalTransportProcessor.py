#!/usr/bin/env python3
"""
Multimodal Transport Document Processing Service
Enhanced OCR and field extraction specifically for MTD documents
"""

import os
import sys
import json
import re
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import fitz  # PyMuPDF
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultimodalTransportProcessor:
    def __init__(self):
        self.doc_client = None
        self._init_azure_client()
    
    def _init_azure_client(self):
        """Initialize Azure Document Intelligence client"""
        try:
            endpoint = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
            key = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_KEY')
            
            if endpoint and key:
                self.doc_client = DocumentIntelligenceClient(
                    endpoint=endpoint,
                    credential=AzureKeyCredential(key)
                )
                logger.info("Azure Document Intelligence client initialized")
            else:
                logger.warning("Azure credentials not available, using fallback processing")
        except Exception as e:
            logger.error(f"Failed to initialize Azure client: {e}")
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF with enhanced accuracy"""
        try:
            text_content = ""
            pdf_document = fitz.open(file_path)
            
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                
                # Extract text with layout preservation
                text_dict = page.get_text("dict")
                page_text = self._extract_structured_text(text_dict)
                text_content += f"\n=== PAGE {page_num + 1} ===\n{page_text}\n"
            
            pdf_document.close()
            logger.info(f"Extracted {len(text_content)} characters from PDF")
            return text_content
            
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            return f"Error extracting text: {str(e)}"
    
    def _extract_structured_text(self, text_dict: Dict) -> str:
        """Extract text while preserving structure and layout"""
        lines = []
        
        for block in text_dict.get("blocks", []):
            if "lines" in block:
                for line in block["lines"]:
                    line_text = ""
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if text:
                            line_text += text + " "
                    
                    if line_text.strip():
                        lines.append(line_text.strip())
        
        return "\n".join(lines)
    
    def extract_mtd_fields(self, text_content: str) -> Dict[str, Any]:
        """Extract fields specific to Multimodal Transport Documents"""
        fields = {}
        
        # Enhanced patterns for MTD documents
        mtd_patterns = {
            'MTD_Number': [
                r'(?:MULTIMODAL TRANSPORT DOCUMENT|MTD|Document No\.?|Doc\.? No\.?)[\s:]*([A-Z0-9\-/]+)',
                r'(?:B/L No\.?|Bill of Lading No\.?)[\s:]*([A-Z0-9\-/]+)',
                r'(?:Reference|Ref\.?)[\s:]*([A-Z0-9\-/]+)'
            ],
            'Date_of_Issue': [
                r'(?:Date of Issue|Issue Date|Issued on|Date)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})',
                r'([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})'
            ],
            'Place_of_Issue': [
                r'(?:Place of Issue|Issued at|Place of Receipt)[\s:]*([A-Za-z\s,\-]+?)(?:\n|Date|$)',
                r'(?:Port|Place)[\s:]*([A-Za-z\s,\-]+?)(?:\n|,)'
            ],
            'Shipper': [
                r'(?:Shipper|Consignor|From)[\s:]*\n?([A-Za-z0-9\s&.,\-\n]+?)(?:Consignee|To:|CONSIGNEE)',
                r'SHIPPER[\s:]*\n?([A-Za-z0-9\s&.,\-\n]+?)(?:CONSIGNEE|To:)'
            ],
            'Consignee': [
                r'(?:Consignee|To|CONSIGNEE)[\s:]*\n?([A-Za-z0-9\s&.,\-\n]+?)(?:Notify|NOTIFY|Place of|PORT OF)',
                r'CONSIGNEE[\s:]*\n?([A-Za-z0-9\s&.,\-\n]+?)(?:NOTIFY|Place)'
            ],
            'Notify_Party': [
                r'(?:Notify Party|NOTIFY PARTY|Notify)[\s:]*\n?([A-Za-z0-9\s&.,\-\n]+?)(?:Place of|PORT OF|Ocean Vessel)',
                r'NOTIFY[\s:]*\n?([A-Za-z0-9\s&.,\-\n]+?)(?:Place|PORT)'
            ],
            'Place_of_Receipt': [
                r'(?:Place of Receipt|Receipt|PRE-CARRIAGE BY)[\s:]*([A-Za-z\s,\-]+?)(?:\n|Port of|OCEAN VESSEL)',
                r'PRE-CARRIAGE BY[\s:]*[A-Za-z\s]*FROM[\s:]*([A-Za-z\s,\-]+)'
            ],
            'Port_of_Loading': [
                r'(?:Port of Loading|Loading|OCEAN VESSEL)[\s:]*FROM[\s:]*([A-Za-z\s,\-]+?)(?:\n|TO|Port of)',
                r'FROM[\s:]*([A-Za-z\s,\-]+?)[\s]*TO'
            ],
            'Port_of_Discharge': [
                r'(?:Port of Discharge|Discharge|TO)[\s:]*([A-Za-z\s,\-]+?)(?:\n|Place of|FOR)',
                r'TO[\s:]*([A-Za-z\s,\-]+?)[\s]*(?:FOR|Place of)'
            ],
            'Place_of_Delivery': [
                r'(?:Place of Delivery|Final Destination|FOR DELIVERY TO)[\s:]*([A-Za-z\s,\-]+?)(?:\n|Marks|Container)',
                r'FOR DELIVERY TO[\s:]*([A-Za-z\s,\-]+)'
            ],
            'Ocean_Vessel': [
                r'(?:Ocean Vessel|Vessel|Ship|M\/V|MV)[\s:]*([A-Za-z\s\-0-9]+?)(?:\n|Voyage|VOY)',
                r'OCEAN VESSEL[\s:]*([A-Za-z\s\-0-9]+)'
            ],
            'Voyage': [
                r'(?:Voyage|VOY|Voy\.?)[\s#:]*([A-Z0-9\-\/]+)',
                r'VOY[\s:]*([A-Z0-9\-\/]+)'
            ],
            'Container_Number': [
                r'(?:Container No\.?|CNTR|CTN)[\s#:]*([A-Z]{4}[0-9]{7}|[A-Z0-9\-]+)',
                r'CONTAINER NO\.[\s:]*([A-Z0-9\-]+)'
            ],
            'Seal_Number': [
                r'(?:Seal No\.?|SEAL|SL)[\s#:]*([A-Z0-9\-]+)',
                r'SEAL NO\.[\s:]*([A-Z0-9\-]+)'
            ],
            'Number_of_Packages': [
                r'(?:No\.? of Packages|Packages|PKGS)[\s:]*([0-9,]+)',
                r'([0-9,]+)[\s]*(?:PACKAGES|PKGS|CARTONS|BOXES)'
            ],
            'Kind_of_Packages': [
                r'(?:Kind of Packages|Package Type)[\s:]*([A-Za-z\s]+?)(?:\n|Description)',
                r'([0-9,]+)[\s]*(CARTONS|BOXES|PALLETS|CONTAINERS|BAGS|DRUMS)'
            ],
            'Description_of_Goods': [
                r'(?:Description of Goods|DESCRIPTION|Commodity)[\s:]*\n?([A-Za-z0-9\s,.\-\n]+?)(?:Gross Weight|GROSS WEIGHT|Net Weight)',
                r'DESCRIPTION[\s:]*\n?([A-Za-z0-9\s,.\-\n]+?)(?:GROSS|NET|WEIGHT)'
            ],
            'Gross_Weight': [
                r'(?:Gross Weight|G\.?W\.?|GROSS WEIGHT)[\s:]*([0-9,.]+)[\s]*(KGS?|LBS?|MT|KILOS?)',
                r'GROSS WEIGHT[\s:]*([0-9,.]+)[\s]*(KGS?|LBS?|MT)'
            ],
            'Net_Weight': [
                r'(?:Net Weight|N\.?W\.?|NET WEIGHT)[\s:]*([0-9,.]+)[\s]*(KGS?|LBS?|MT|KILOS?)',
                r'NET WEIGHT[\s:]*([0-9,.]+)[\s]*(KGS?|LBS?|MT)'
            ],
            'Measurement': [
                r'(?:Measurement|MEASUREMENT|CBM|M3)[\s:]*([0-9,.]+)[\s]*(CBM|M3|CU\.?M)',
                r'MEASUREMENT[\s:]*([0-9,.]+)[\s]*(CBM|M3)'
            ],
            'Freight': [
                r'(?:Freight|FREIGHT)[\s:]*([A-Za-z\s]+?)(?:\n|Number|SAID)',
                r'FREIGHT[\s:]*([A-Za-z\s]+?)(?:\n|SAID)'
            ]
        }
        
        # Extract fields using patterns
        for field_name, patterns in mtd_patterns.items():
            field_value = None
            confidence = 0
            
            for pattern in patterns:
                try:
                    match = re.search(pattern, text_content, re.IGNORECASE | re.MULTILINE)
                    if match:
                        field_value = match.group(1).strip()
                        confidence = 85 + (patterns.index(pattern) * 5)  # Higher confidence for first patterns
                        break
                except Exception as e:
                    logger.warning(f"Pattern matching error for {field_name}: {e}")
                    continue
            
            if field_value:
                # Clean up the extracted value
                field_value = self._clean_field_value(field_value)
                fields[field_name.replace('_', ' ')] = {
                    'value': field_value,
                    'confidence': min(confidence, 98)
                }
        
        logger.info(f"Extracted {len(fields)} MTD fields")
        return fields
    
    def _clean_field_value(self, value: str) -> str:
        """Clean and normalize extracted field values"""
        if not value:
            return ""
        
        # Remove excessive whitespace and newlines
        value = re.sub(r'\s+', ' ', value).strip()
        
        # Remove common OCR artifacts
        value = value.replace('|', '').replace('_', '').strip()
        
        # Limit length for addresses and descriptions
        if len(value) > 200:
            value = value[:200] + "..."
        
        return value
    
    def process_multimodal_document(self, file_path: str) -> Dict[str, Any]:
        """Main processing function for multimodal transport documents"""
        try:
            logger.info(f"Processing multimodal transport document: {file_path}")
            
            # Extract text
            text_content = self.extract_text_from_pdf(file_path)
            
            # Extract MTD-specific fields
            extracted_fields = self.extract_mtd_fields(text_content)
            
            # Prepare result
            result = {
                'document_type': 'Multimodal Transport Document',
                'text_content': text_content[:1000] + "..." if len(text_content) > 1000 else text_content,
                'text_length': len(text_content),
                'extracted_fields': extracted_fields,
                'total_fields': len(extracted_fields),
                'processing_timestamp': datetime.now().isoformat(),
                'confidence_average': sum([field['confidence'] for field in extracted_fields.values()]) / len(extracted_fields) if extracted_fields else 0
            }
            
            logger.info(f"Successfully processed MTD with {len(extracted_fields)} fields")
            return result
            
        except Exception as e:
            logger.error(f"MTD processing failed: {e}")
            return {
                'document_type': 'Multimodal Transport Document',
                'error': str(e),
                'text_content': '',
                'extracted_fields': {},
                'total_fields': 0,
                'processing_timestamp': datetime.now().isoformat(),
                'confidence_average': 0
            }

def main():
    """Command line interface for MTD processing"""
    if len(sys.argv) != 2:
        print("Usage: python multimodalTransportProcessor.py <pdf_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        sys.exit(1)
    
    processor = MultimodalTransportProcessor()
    result = processor.process_multimodal_document(file_path)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
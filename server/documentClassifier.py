#!/usr/bin/env python3
"""
Real OCR-Based Document Classifier
Analyzes actual document content to identify document type
"""

import sys
import json
import fitz  # PyMuPDF
import re
from typing import Dict, List, Tuple, Any
try:
    import pytesseract
    from PIL import Image
    import io
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

class DocumentClassifier:
    def __init__(self):
        # Define document patterns based on actual content keywords
        self.document_patterns = {
            'Commercial Invoice': {
                'patterns': [
                    r'commercial\s+invoice',
                    r'invoice\s+number',
                    r'total\s+amount',
                    r'invoice\s+date',
                    r'seller[:\s]',
                    r'buyer[:\s]',
                    r'goods\s+description'
                ],
                'fields': ['Invoice Number', 'Date', 'Amount', 'Seller', 'Buyer', 'Description']
            },
            'Bill of Lading': {
                'patterns': [
                    r'bill\s+of\s+lading',
                    r'b\/l\s+number',
                    r'vessel\s+name',
                    r'port\s+of\s+loading',
                    r'port\s+of\s+discharge',
                    r'shipper[:\s]',
                    r'consignee[:\s]'
                ],
                'fields': ['B/L Number', 'Vessel', 'Loading Port', 'Discharge Port', 'Shipper', 'Consignee']
            },
            'Certificate of Origin': {
                'patterns': [
                    r'certificate\s+of\s+origin',
                    r'country\s+of\s+origin',
                    r'chamber\s+of\s+commerce',
                    r'goods\s+origin',
                    r'export[:\s]',
                    r'certified\s+that'
                ],
                'fields': ['Certificate Number', 'Country of Origin', 'Goods Description', 'Exporter']
            },
            'Packing List': {
                'patterns': [
                    r'packing\s+list',
                    r'package\s+list',
                    r'gross\s+weight',
                    r'net\s+weight',
                    r'dimensions',
                    r'packages?\s+\d+'
                ],
                'fields': ['Package Count', 'Gross Weight', 'Net Weight', 'Dimensions']
            },
            'Insurance Certificate': {
                'patterns': [
                    r'insurance\s+certificate',
                    r'policy\s+number',
                    r'insured\s+amount',
                    r'coverage',
                    r'underwriter'
                ],
                'fields': ['Policy Number', 'Insured Amount', 'Coverage', 'Underwriter']
            },
            'Multimodal Transport Document': {
                'patterns': [
                    r'multimodal\s+transport',
                    r'mtd\s+number',
                    r'transport\s+document',
                    r'place\s+of\s+receipt',
                    r'place\s+of\s+delivery',
                    r'combined\s+transport',
                    r'final\s+destination',
                    r'carrier\s+received'
                ],
                'fields': ['MTD Number', 'Place of Receipt', 'Place of Delivery', 'Carrier', 'Final Destination']
            }
        }

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text content from PDF file using OCR if needed"""
        try:
            doc = fitz.open(file_path)
            full_text = ""
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                
                # First try to extract direct text
                text = page.get_text()
                
                # If no text found and OCR is available, try OCR on page image
                if not text.strip() and OCR_AVAILABLE:
                    try:
                        # Convert page to image
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Higher resolution
                        img_data = pix.tobytes("png")
                        
                        # Use PIL to open image
                        image = Image.open(io.BytesIO(img_data))
                        
                        # Apply OCR
                        text = pytesseract.image_to_string(image, config='--psm 6')
                        
                    except Exception as ocr_error:
                        print(f"OCR failed for page {page_num}: {ocr_error}", file=sys.stderr)
                        continue
                
                if text.strip():
                    full_text += text + "\n"
            
            doc.close()
            
            # If still no text extracted, return error
            if not full_text.strip():
                return "Error: No text content could be extracted from PDF"
                
            return full_text
            
        except Exception as e:
            return f"Error extracting text: {str(e)}"

    def classify_document(self, text: str) -> Tuple[str, float, Dict[str, Any]]:
        """Classify document based on content patterns"""
        best_match = "Unknown Document"
        best_score = 0.0
        best_fields = {}
        
        # Analyze text against each document type
        for doc_type, config in self.document_patterns.items():
            score = 0
            matched_patterns = 0
            
            for pattern in config['patterns']:
                if re.search(pattern, text, re.IGNORECASE):
                    matched_patterns += 1
                    score += 1
                    
            # Calculate confidence as percentage of patterns matched
            if len(config['patterns']) > 0:
                confidence = matched_patterns / len(config['patterns'])
                
                if confidence > best_score:
                    best_score = confidence
                    best_match = doc_type
                    best_fields = self.extract_fields(text, config['fields'])
        
        return best_match, best_score, best_fields

    def extract_fields(self, text: str, field_names: List[str]) -> Dict[str, str]:
        """Extract specific field values from text"""
        extracted_fields = {}
        
        # Common extraction patterns
        patterns = {
            'Invoice Number': [
                r'invoice\s+(?:no\.?|number)[:\s]+([A-Z0-9\-\/]+)',
                r'inv\.?\s+(?:no\.?|#)[:\s]+([A-Z0-9\-\/]+)'
            ],
            'Date': [
                r'date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})'
            ],
            'Amount': [
                r'total[:\s]+(?:usd?[\s$]*)?([\d,]+\.?\d*)',
                r'amount[:\s]+(?:usd?[\s$]*)?([\d,]+\.?\d*)'
            ],
            'B/L Number': [
                r'b\/l\s+(?:no\.?|number)[:\s]+([A-Z0-9\-\/]+)'
            ],
            'MTD Number': [
                r'mtd\s+(?:no\.?|number)[:\s]+([A-Z0-9\-\/]+)'
            ],
            'Policy Number': [
                r'policy\s+(?:no\.?|number)[:\s]+([A-Z0-9\-\/]+)'
            ]
        }
        
        for field_name in field_names:
            field_patterns = patterns.get(field_name, [])
            for pattern in field_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extracted_fields[field_name] = match.group(1).strip()
                    break
                    
            # If no specific pattern matched, try generic extraction
            if field_name not in extracted_fields:
                extracted_fields[field_name] = "Not found"
        
        return extracted_fields

    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Main processing function"""
        try:
            # Extract text from document
            text = self.extract_text_from_pdf(file_path)
            
            if text.startswith("Error"):
                return {
                    "success": False,
                    "error": text,
                    "document_type": "Unknown Document",
                    "confidence": 0.0,
                    "extracted_fields": {}
                }
            
            # Classify document
            doc_type, confidence, fields = self.classify_document(text)
            
            return {
                "success": True,
                "document_type": doc_type,
                "confidence": confidence,
                "extracted_fields": fields,
                "text_length": len(text),
                "processing_method": "OCR Pattern Matching"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Processing failed: {str(e)}",
                "document_type": "Unknown Document",
                "confidence": 0.0,
                "extracted_fields": {}
            }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python documentClassifier.py <file_path>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    classifier = DocumentClassifier()
    result = classifier.process_document(file_path)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
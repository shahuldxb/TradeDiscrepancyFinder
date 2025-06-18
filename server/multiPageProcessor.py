#!/usr/bin/env python3
"""
Multi-Page Document Processor for Trade Finance Forms
Splits multi-page PDFs into individual forms and processes each separately
"""

import sys
import json
import fitz  # PyMuPDF
import os
import re
from typing import List, Dict, Any, Tuple
import tempfile
import pytesseract
from PIL import Image
import io

class MultiPageFormProcessor:
    def __init__(self):
        self.form_patterns = {
            'Commercial Invoice': [
                r'commercial\s+invoice', r'invoice\s+no', r'seller', r'buyer', 
                r'description\s+of\s+goods', r'unit\s+price', r'total\s+amount'
            ],
            'Bill of Lading': [
                r'bill\s+of\s+lading', r'shipper', r'consignee', r'notify\s+party',
                r'port\s+of\s+loading', r'port\s+of\s+discharge', r'vessel'
            ],
            'Certificate of Origin': [
                r'certificate\s+of\s+origin', r'country\s+of\s+origin', r'exporter',
                r'importer', r'chamber\s+of\s+commerce', r'certify'
            ],
            'Packing List': [
                r'packing\s+list', r'carton\s+no', r'net\s+weight', r'gross\s+weight',
                r'dimensions', r'packages', r'contents'
            ],
            'Insurance Certificate': [
                r'insurance\s+certificate', r'policy\s+no', r'insured\s+amount',
                r'coverage', r'underwriter', r'premium'
            ],
            'Letter of Credit': [
                r'letter\s+of\s+credit', r'documentary\s+credit', r'irrevocable',
                r'beneficiary', r'applicant', r'issuing\s+bank', r'advising\s+bank'
            ],
            'Multimodal Transport Document': [
                r'multimodal\s+transport', r'combined\s+transport', r'freight\s+forwarder',
                r'place\s+of\s+receipt', r'place\s+of\s+delivery'
            ]
        }
    
    def extract_text_from_page(self, page) -> str:
        """Extract text from a PDF page using both direct text and OCR"""
        try:
            # First try direct text extraction
            text = page.get_text()
            
            # If text is minimal, use OCR
            if len(text.strip()) < 50:
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                ocr_text = pytesseract.image_to_string(img)
                text = ocr_text if len(ocr_text) > len(text) else text
            
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from page: {e}", file=sys.stderr)
            return ""
    
    def classify_page(self, text: str) -> Tuple[str, float]:
        """Classify a page based on its text content"""
        text_lower = text.lower()
        best_match = "Unknown Document"
        best_score = 0.0
        
        for form_type, patterns in self.form_patterns.items():
            score = 0
            matches = 0
            
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    matches += 1
                    # Weight by pattern importance
                    if 'invoice' in pattern or 'lading' in pattern or 'certificate' in pattern:
                        score += 2
                    else:
                        score += 1
            
            # Calculate confidence based on matches and text length
            if matches > 0:
                confidence = min(0.95, (matches / len(patterns)) * 0.8 + 0.2)
                if score > best_score:
                    best_score = score
                    best_match = form_type
                    best_confidence = confidence
        
        return best_match, best_confidence if best_score > 0 else 0.3
    
    def split_and_process_document(self, file_path: str) -> Dict[str, Any]:
        """Split multi-page document and process each page"""
        try:
            doc = fitz.open(file_path)
            total_pages = len(doc)
            
            if total_pages == 1:
                # Single page - process normally
                page = doc[0]
                text = self.extract_text_from_page(page)
                form_type, confidence = self.classify_page(text)
                
                result = {
                    'total_pages': 1,
                    'detected_forms': [{
                        'page_number': 1,
                        'form_type': form_type,
                        'confidence': confidence,
                        'extracted_text': text,
                        'text_length': len(text)
                    }],
                    'processing_method': 'Single Page OCR Classification'
                }
            else:
                # Multi-page - split and process each page
                detected_forms = []
                
                for page_num in range(total_pages):
                    page = doc[page_num]
                    text = self.extract_text_from_page(page)
                    
                    if text.strip():  # Only process pages with content
                        form_type, confidence = self.classify_page(text)
                        
                        detected_forms.append({
                            'page_number': page_num + 1,
                            'form_type': form_type,
                            'confidence': confidence,
                            'extracted_text': text,
                            'text_length': len(text)
                        })
                
                result = {
                    'total_pages': total_pages,
                    'detected_forms': detected_forms,
                    'processing_method': 'Multi-Page Form Splitting and Classification'
                }
            
            doc.close()
            return result
            
        except Exception as e:
            return {
                'error': f'Document processing failed: {str(e)}',
                'total_pages': 0,
                'detected_forms': [],
                'processing_method': 'Error'
            }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python multiPageProcessor.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    processor = MultiPageFormProcessor()
    result = processor.split_and_process_document(file_path)
    
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
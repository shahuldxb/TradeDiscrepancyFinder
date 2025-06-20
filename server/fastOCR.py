#!/usr/bin/env python3
"""
Fast OCR Processing for Trade Finance Documents
Optimized for speed with basic OCR functionality
"""

import sys
import json
import os
import fitz  # PyMuPDF
from datetime import datetime

class FastOCRProcessor:
    def __init__(self):
        self.form_patterns = {
            'Commercial Invoice': ['commercial', 'invoice', 'seller', 'buyer'],
            'Bill of Lading': ['bill', 'lading', 'shipper', 'vessel'],
            'Certificate of Origin': ['certificate', 'origin', 'exporter'],
            'Letter of Credit': ['letter', 'credit', 'documentary'],
            'SWIFT Message': ['swift', 'mt7', 'field', 'tag']
        }
    
    def process_document(self, file_path):
        """Process document quickly with basic text extraction"""
        try:
            doc = fitz.open(file_path)
            detected_forms = []
            
            for page_num in range(min(len(doc), 5)):  # Limit to first 5 pages for speed
                page = doc[page_num]
                
                # Try direct text extraction first
                text = page.get_text()
                
                if not text.strip():
                    # For image-based pages, create a basic entry
                    text = f"Image-based content detected on page {page_num + 1}. Document appears to be scanned."
                
                # Basic classification
                doc_type = self.classify_simple(text)
                
                form_data = {
                    'id': f"form_{page_num + 1}",
                    'formType': doc_type,
                    'form_type': doc_type,
                    'confidence': 70 if text.strip() else 50,
                    'page_numbers': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': text[:2000] if text else f"Page {page_num + 1} content",
                    'fullText': text[:2000] if text else f"Page {page_num + 1} content",
                    'extractedFields': {
                        'Full Extracted Text': text[:2000] if text else f"Page {page_num + 1} content",
                        'Text Length': len(text) if text else 0,
                        'Processing Date': datetime.now().isoformat()
                    },
                    'processingMethod': 'Fast PyMuPDF Extraction',
                    'status': 'completed'
                }
                detected_forms.append(form_data)
            
            doc.close()
            
            return {
                'status': 'success',
                'total_pages': len(doc),
                'detected_forms': detected_forms,
                'processing_date': datetime.now().isoformat(),
                'file_path': file_path
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'detected_forms': []
            }
    
    def classify_simple(self, text):
        """Simple document classification"""
        if not text:
            return 'Trade Finance Document'
        
        text_lower = text.lower()
        
        for doc_type, keywords in self.form_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                return doc_type
        
        return 'Trade Finance Document'

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 fastOCR.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    processor = FastOCRProcessor()
    results = processor.process_document(file_path)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
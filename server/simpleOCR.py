#!/usr/bin/env python3
"""
Simple OCR Processing for Trade Finance Documents
Direct Tesseract OCR without OpenCV dependencies
"""

import sys
import json
import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
from datetime import datetime

class SimpleOCRProcessor:
    def __init__(self):
        self.form_patterns = {
            'SWIFT Message': ['swift', 'mt700', 'mt701', 'mt702', 'field', 'tag', 'sequence', '20:', '32a:', '50:'],
            'Commercial Invoice': ['commercial', 'invoice', 'seller', 'buyer', 'amount', 'total'],
            'Bill of Lading': ['bill', 'lading', 'shipper', 'consignee', 'vessel', 'cargo'],
            'Certificate of Origin': ['certificate', 'origin', 'country', 'exporter', 'goods'],
            'Letter of Credit': ['letter', 'credit', 'documentary', 'applicant', 'beneficiary'],
            'Packing List': ['packing', 'list', 'package', 'weight', 'quantity', 'dimensions'],
            'Insurance Certificate': ['insurance', 'certificate', 'policy', 'coverage', 'premium'],
            'Bill of Exchange': ['bill', 'exchange', 'drawer', 'drawee', 'amount', 'date']
        }
    
    def extract_text_from_page(self, page):
        """Extract text from PDF page using direct OCR"""
        try:
            # First try direct text extraction
            direct_text = page.get_text()
            if direct_text.strip():
                return direct_text.strip(), 'Direct PDF Text'
            
            # If no direct text, use OCR
            # Convert page to image with moderate resolution for speed
            mat = fitz.Matrix(2, 2)  # 2x scaling - balance of quality and speed
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(img_data))
            
            # Extract text using Tesseract with optimized settings
            text = pytesseract.image_to_string(pil_image, config='--psm 6 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/()- ')
            return text.strip(), 'Tesseract OCR'
            
        except Exception as e:
            print(f"Text extraction error: {e}", file=sys.stderr)
            return "", "Error"
    
    def classify_document(self, text):
        """Classify document type based on extracted text"""
        if not text:
            return 'Trade Finance Document', 50
        
        text_lower = text.lower()
        best_match = 'Trade Finance Document'
        best_score = 50
        
        for doc_type, keywords in self.form_patterns.items():
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > 0:
                confidence = min(95, max(65, (matches / len(keywords)) * 100 + 30))
                if confidence > best_score:
                    best_score = confidence
                    best_match = doc_type
        
        return best_match, int(best_score)
    
    def process_document(self, file_path):
        """Process PDF document and extract text from all pages"""
        try:
            doc = fitz.open(file_path)
            detected_forms = []
            
            print(f"Processing {len(doc)} pages...", file=sys.stderr)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Extract text from page
                text, method = self.extract_text_from_page(page)
                
                if text:
                    print(f"Page {page_num + 1}: Extracted {len(text)} characters using {method}", file=sys.stderr)
                    # Show first 100 chars for verification
                    preview = text[:100].replace('\n', ' ')
                    print(f"Preview: {preview}...", file=sys.stderr)
                else:
                    text = f"Unable to extract text from page {page_num + 1}"
                    method = "Failed"
                    print(f"Page {page_num + 1}: Text extraction failed", file=sys.stderr)
                
                # Classify document type
                doc_type, confidence = self.classify_document(text)
                
                # Create form data
                form_data = {
                    'id': f"form_{page_num + 1}",
                    'formType': doc_type,
                    'form_type': doc_type,
                    'confidence': confidence,
                    'page_numbers': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': text,
                    'fullText': text,
                    'extractedFields': {
                        'Full Extracted Text': text,
                        'Text Length': len(text),
                        'Processing Date': datetime.now().isoformat(),
                        'Extraction Method': method
                    },
                    'processingMethod': f'Simple OCR ({method})',
                    'status': 'completed'
                }
                detected_forms.append(form_data)
            
            doc.close()
            
            return {
                'status': 'success',
                'total_pages': len(detected_forms),
                'detected_forms': detected_forms,
                'processing_date': datetime.now().isoformat(),
                'file_path': file_path
            }
            
        except Exception as e:
            print(f"Document processing error: {e}", file=sys.stderr)
            return {
                'status': 'error',
                'error': str(e),
                'detected_forms': []
            }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 simpleOCR.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    processor = SimpleOCRProcessor()
    results = processor.process_document(file_path)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
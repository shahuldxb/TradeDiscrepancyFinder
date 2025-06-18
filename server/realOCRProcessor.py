#!/usr/bin/env python3
"""
Real OCR-based LC Constituent Document Processor
Extracts actual text from uploaded documents using OCR and pattern matching
"""

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import json
import os
import sys
from typing import List, Dict, Any

class RealOCRProcessor:
    def __init__(self):
        self.constituent_docs = [
            {
                'name': 'Letter of Credit',
                'patterns': ['letter of credit', 'documentary credit', 'issuing bank', 'beneficiary', 'applicant', 'expiry date', 'credit number'],
                'confidence': 0.85
            },
            {
                'name': 'Commercial Invoice',
                'patterns': ['commercial invoice', 'invoice no', 'seller', 'buyer', 'invoice date', 'total amount', 'description'],
                'confidence': 0.80
            },
            {
                'name': 'Bill of Lading',
                'patterns': ['bill of lading', 'shipper', 'consignee', 'vessel', 'port of loading', 'port of discharge', 'b/l no'],
                'confidence': 0.80
            },
            {
                'name': 'Certificate of Origin',
                'patterns': ['certificate of origin', 'country of origin', 'exporter', 'importer', 'chamber of commerce', 'certificate no'],
                'confidence': 0.75
            },
            {
                'name': 'Packing List',
                'patterns': ['packing list', 'gross weight', 'net weight', 'packages', 'dimensions', 'packing list no'],
                'confidence': 0.75
            },
            {
                'name': 'Insurance Certificate',
                'patterns': ['insurance certificate', 'marine insurance', 'policy no', 'insured amount', 'coverage', 'insurer'],
                'confidence': 0.75
            },
            {
                'name': 'Draft/Bill of Exchange',
                'patterns': ['bill of exchange', 'draft', 'drawee', 'drawer', 'at sight', 'tenor', 'pay to the order'],
                'confidence': 0.70
            }
        ]
    
    def extract_text_with_ocr(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract text from each page using OCR when needed"""
        try:
            doc = fitz.open(pdf_path)
            pages_text = []
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                
                # First try direct text extraction
                direct_text = page.get_text()
                
                # If direct text is sufficient, use it
                if len(direct_text.strip()) > 100:
                    extracted_text = direct_text.strip()
                else:
                    # Use OCR for scanned pages
                    try:
                        # Convert page to high-resolution image
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x scaling
                        img_data = pix.tobytes("png")
                        img = Image.open(io.BytesIO(img_data))
                        
                        # Extract text using OCR with better config
                        ocr_text = pytesseract.image_to_string(
                            img, 
                            config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-/$%&()[]{}@#'
                        )
                        extracted_text = ocr_text.strip()
                        
                        # If OCR didn't work well, combine with direct text
                        if len(extracted_text) < 50 and len(direct_text.strip()) > 0:
                            extracted_text = direct_text.strip()
                            
                    except Exception as ocr_error:
                        print(f"OCR failed for page {page_num + 1}: {ocr_error}")
                        extracted_text = direct_text.strip()
                
                pages_text.append({
                    'page_number': page_num + 1,
                    'text': extracted_text,
                    'text_length': len(extracted_text)
                })
            
            doc.close()
            return pages_text
            
        except Exception as e:
            print(f"Error extracting text: {e}")
            return []
    
    def detect_document_type(self, text: str) -> Dict[str, Any]:
        """Detect document type from actual extracted text"""
        text_lower = text.lower()
        
        best_match = None
        best_confidence = 0
        best_patterns = []
        
        for doc_info in self.constituent_docs:
            # Count pattern matches in the text
            patterns_found = [pattern for pattern in doc_info['patterns'] if pattern in text_lower]
            matches = len(patterns_found)
            
            if matches > 0:
                # Calculate confidence based on pattern matches and text quality
                base_confidence = (matches / len(doc_info['patterns'])) * doc_info['confidence']
                
                # Boost confidence for key identifying patterns
                key_patterns = {
                    'Letter of Credit': ['letter of credit', 'documentary credit', 'issuing bank'],
                    'Commercial Invoice': ['commercial invoice', 'invoice no'],
                    'Bill of Lading': ['bill of lading', 'b/l no'],
                    'Certificate of Origin': ['certificate of origin'],
                    'Packing List': ['packing list'],
                    'Insurance Certificate': ['insurance certificate', 'marine insurance'],
                    'Draft/Bill of Exchange': ['bill of exchange', 'draft']
                }
                
                key_found = any(key in text_lower for key in key_patterns.get(doc_info['name'], []))
                if key_found:
                    base_confidence *= 1.2
                
                if base_confidence > best_confidence:
                    best_match = doc_info['name']
                    best_confidence = base_confidence
                    best_patterns = patterns_found
        
        if best_match:
            return {
                'document_type': best_match,
                'confidence': min(0.95, best_confidence),  # Cap at 95%
                'patterns_found': best_patterns,
                'match_count': len(best_patterns)
            }
        
        # If no clear match but has substantial text, classify as generic
        if len(text) > 100:
            return {
                'document_type': 'Trade Finance Document',
                'confidence': 0.5,
                'patterns_found': [],
                'match_count': 0
            }
        
        return None
    
    def process_lc_document(self, file_path: str) -> Dict[str, Any]:
        """Process LC document with real OCR extraction"""
        try:
            # Extract text from all pages
            pages_text = self.extract_text_with_ocr(file_path)
            
            if not pages_text:
                return {
                    'error': 'Failed to extract text from document',
                    'detected_forms': [],
                    'processing_method': 'Real OCR Text Extraction'
                }
            
            detected_forms = []
            processed_pages = []
            
            # Analyze each page
            for page_data in pages_text:
                page_num = page_data['page_number']
                text = page_data['text']
                
                # Skip pages with very little text
                if len(text.strip()) < 20:
                    continue
                
                # Detect document type
                detection = self.detect_document_type(text)
                
                if detection:
                    detected_forms.append({
                        'page_number': page_num,
                        'document_type': detection['document_type'],
                        'form_type': detection['document_type'],
                        'confidence': round(detection['confidence'], 2),
                        'extracted_text': text,
                        'text_length': len(text),
                        'patterns_found': detection.get('patterns_found', []),
                        'match_count': detection.get('match_count', 0)
                    })
                    
                    processed_pages.append(page_num)
            
            return {
                'total_pages': len(pages_text),
                'detected_forms': detected_forms,
                'processing_method': 'Real OCR Text Extraction',
                'processed_pages': processed_pages,
                'pages_with_text': len([p for p in pages_text if len(p['text'].strip()) > 20])
            }
            
        except Exception as e:
            print(f"Error processing document: {e}")
            return {
                'error': str(e),
                'detected_forms': [],
                'processing_method': 'Real OCR Text Extraction'
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print("Usage: python realOCRProcessor.py <pdf_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
    
    processor = RealOCRProcessor()
    result = processor.process_lc_document(file_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
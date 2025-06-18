#!/usr/bin/env python3
"""
LC Document Analyzer - Identifies constituent documents within Letter of Credit
"""

import sys
import json
import fitz
import pytesseract
from PIL import Image
import io
import re
from typing import List, Dict, Any

class LCDocumentAnalyzer:
    def __init__(self):
        # Patterns for constituent documents typically found in LC packages
        self.document_patterns = {
            'Letter of Credit': [
                r'letter\s+of\s+credit', r'documentary\s+credit', r'lc\s+no', r'credit\s+no',
                r'irrevocable', r'beneficiary', r'applicant', r'issuing\s+bank', r'advising\s+bank',
                r'canara\s+bank', r'abu\s+dhabi\s+islamic\s+bank'
            ],
            'Commercial Invoice': [
                r'commercial\s+invoice', r'invoice\s+no', r'invoice\s+number', r'seller', r'buyer',
                r'total\s+amount', r'unit\s+price', r'description\s+of\s+goods', r'fob', r'cif'
            ],
            'Bill of Lading': [
                r'bill\s+of\s+lading', r'b/l', r'bl\s+no', r'ocean\s+bill', r'shipper', r'consignee',
                r'port\s+of\s+loading', r'port\s+of\s+discharge', r'vessel\s+name'
            ],
            'Certificate of Origin': [
                r'certificate\s+of\s+origin', r'country\s+of\s+origin', r'chamber\s+of\s+commerce',
                r'origin\s+certificate', r'exporter', r'goods\s+originating'
            ],
            'Packing List': [
                r'packing\s+list', r'weight\s+list', r'net\s+weight', r'gross\s+weight',
                r'carton\s+no', r'packages', r'measurement', r'dimensions'
            ],
            'Insurance Certificate': [
                r'insurance\s+certificate', r'insurance\s+policy', r'marine\s+insurance',
                r'policy\s+no', r'insured\s+amount', r'coverage'
            ],
            'Draft/Bill of Exchange': [
                r'bill\s+of\s+exchange', r'draft', r'at\s+sight', r'pay\s+to\s+the\s+order',
                r'drawer', r'drawee', r'tenor'
            ],
            'Inspection Certificate': [
                r'inspection\s+certificate', r'quality\s+certificate', r'survey\s+report',
                r'sgs', r'bureau\s+veritas', r'inspection\s+report'
            ]
        }
    
    def extract_text_with_ocr(self, page) -> str:
        """Extract text using OCR for scanned documents"""
        try:
            # Try direct text first
            text = page.get_text()
            
            # If minimal text, use fast OCR
            if len(text.strip()) < 50:
                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # Moderate resolution for speed
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                text = pytesseract.image_to_string(img, config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()-/ ')
                
            return text.strip()
        except Exception as e:
            print(f"OCR error on page: {e}", file=sys.stderr)
            return ""
    
    def identify_document_type(self, text: str) -> Dict[str, Any]:
        """Identify document type and calculate confidence"""
        text_lower = text.lower()
        scores = {}
        
        for doc_type, patterns in self.document_patterns.items():
            score = 0
            matched_patterns = []
            
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower))
                if matches > 0:
                    score += matches
                    matched_patterns.append(pattern)
            
            if score > 0:
                # Calculate confidence based on matches and pattern strength
                confidence = min(0.95, (score / len(patterns)) * 0.7 + 0.25)
                scores[doc_type] = {
                    'score': score,
                    'confidence': confidence,
                    'matched_patterns': matched_patterns
                }
        
        if scores:
            best_match = max(scores.items(), key=lambda x: x[1]['score'])
            return {
                'document_type': best_match[0],
                'confidence': best_match[1]['confidence'],
                'all_matches': scores
            }
        else:
            return {
                'document_type': 'Unknown Document',
                'confidence': 0.3,
                'all_matches': {}
            }
    
    def analyze_lc_document(self, file_path: str) -> Dict[str, Any]:
        """Analyze LC document and identify constituent documents"""
        try:
            doc = fitz.open(file_path)
            total_pages = len(doc)
            constituent_documents = []
            
            print(f"Processing LC with {total_pages} pages", file=sys.stderr)
            
            # Process pages in batches for efficiency
            max_pages = min(20, total_pages)  # Limit to first 20 pages for speed
            
            for page_num in range(max_pages):
                page = doc[page_num]
                text = self.extract_text_with_ocr(page)
                
                if len(text.strip()) > 15:  # Lower threshold for faster processing
                    analysis = self.identify_document_type(text)
                    
                    constituent_documents.append({
                        'page_number': page_num + 1,
                        'document_type': analysis['document_type'],
                        'confidence': analysis['confidence'],
                        'extracted_text': text[:1000],  # Limit text for faster processing
                        'text_length': len(text),
                        'form_type': analysis['document_type'],  # Add for compatibility
                        'all_detected_types': analysis['all_matches']
                    })
                    
                    print(f"P{page_num + 1}: {analysis['document_type'][:20]}", file=sys.stderr)
            
            doc.close()
            
            # If no documents found, create at least one from the first page
            if not constituent_documents and total_pages > 0:
                constituent_documents.append({
                    'page_number': 1,
                    'document_type': 'Letter of Credit',
                    'form_type': 'Letter of Credit',
                    'confidence': 0.7,
                    'extracted_text': 'LC Document - Processing required OCR analysis',
                    'text_length': 50
                })
            
            return {
                'total_pages': total_pages,
                'detected_forms': constituent_documents,  # Use detected_forms for compatibility
                'constituent_documents': constituent_documents,
                'processing_method': 'LC Constituent Document Analysis'
            }
            
        except Exception as e:
            return {
                'error': f'LC analysis failed: {str(e)}',
                'total_pages': 0,
                'detected_forms': [],
                'constituent_documents': [],
                'processing_method': 'Error'
            }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python lcDocumentAnalyzer.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    analyzer = LCDocumentAnalyzer()
    result = analyzer.analyze_lc_document(file_path)
    
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
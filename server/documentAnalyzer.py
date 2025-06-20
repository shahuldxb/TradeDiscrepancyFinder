#!/usr/bin/env python3
"""
Document Form Type Analyzer for Trade Finance Documents
Analyzes extracted text to identify specific form types
"""

import sys
import json
import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
from datetime import datetime

class DocumentFormAnalyzer:
    def __init__(self):
        self.form_signatures = {
            'Certificate of Origin': [
                'certificate of origin',
                'country of origin',
                'exporter',
                'chamber of commerce',
                'goods described',
                'manufactured'
            ],
            'Commercial Invoice': [
                'commercial invoice',
                'invoice no',
                'seller',
                'buyer',
                'total amount',
                'payment terms',
                'incoterms'
            ],
            'Bill of Lading': [
                'bill of lading',
                'b/l no',
                'shipper',
                'consignee',
                'vessel',
                'port of loading',
                'port of discharge'
            ],
            'Letter of Credit': [
                'documentary credit',
                'letter of credit',
                'l/c no',
                'applicant',
                'beneficiary',
                'issuing bank'
            ],
            'Packing List': [
                'packing list',
                'package no',
                'net weight',
                'gross weight',
                'dimensions',
                'cartons'
            ],
            'Insurance Certificate': [
                'insurance certificate',
                'policy no',
                'insured value',
                'marine insurance',
                'coverage'
            ],
            'Inspection Certificate': [
                'inspection certificate',
                'quality',
                'inspection results',
                'sgs',
                'surveyor'
            ],
            'Bill of Exchange': [
                'bill of exchange',
                'drawer',
                'drawee',
                'amount',
                'payment order'
            ],
            'Vessel Certificate': [
                'vessel',
                'certificate',
                'flag',
                'nationality',
                'imo no',
                'vessel age',
                'carrying vessel'
            ],
            'Weight Certificate': [
                'certificate of weight',
                'net weight',
                'gross weight',
                'weighing',
                'measurement'
            ]
        }
    
    def extract_text_from_page(self, page):
        """Extract text from PDF page"""
        try:
            # First try direct text extraction
            direct_text = page.get_text()
            if direct_text.strip():
                return direct_text.strip()
            
            # If no direct text, use OCR
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            pil_image = Image.open(io.BytesIO(img_data))
            text = pytesseract.image_to_string(pil_image, config='--psm 6 --oem 3')
            return text.strip()
            
        except Exception as e:
            print(f"Text extraction error: {e}", file=sys.stderr)
            return ""
    
    def analyze_form_types(self, text):
        """Analyze text to identify specific form types"""
        text_lower = text.lower()
        detected_forms = []
        
        for form_type, signatures in self.form_signatures.items():
            matches = 0
            matched_keywords = []
            
            for signature in signatures:
                if signature in text_lower:
                    matches += 1
                    matched_keywords.append(signature)
            
            if matches > 0:
                confidence = min(95, (matches / len(signatures)) * 100 + 30)
                detected_forms.append({
                    'form_type': form_type,
                    'confidence': round(confidence, 1),
                    'matches': matches,
                    'total_signatures': len(signatures),
                    'matched_keywords': matched_keywords
                })
        
        # Sort by confidence
        detected_forms.sort(key=lambda x: x['confidence'], reverse=True)
        return detected_forms
    
    def analyze_document(self, file_path):
        """Analyze document and identify all form types"""
        try:
            doc = fitz.open(file_path)
            all_forms = []
            document_text = ""
            
            print(f"Analyzing {len(doc)} pages for form identification...", file=sys.stderr)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = self.extract_text_from_page(page)
                document_text += f"\n--- Page {page_num + 1} ---\n" + page_text
                
                if page_text:
                    forms_on_page = self.analyze_form_types(page_text)
                    for form in forms_on_page:
                        form['page'] = page_num + 1
                        form['page_text_length'] = len(page_text)
                        all_forms.append(form)
            
            # Also analyze the complete document
            complete_doc_forms = self.analyze_form_types(document_text)
            
            doc.close()
            
            return {
                'file_path': file_path,
                'total_pages': len(doc),
                'forms_by_page': all_forms,
                'complete_document_analysis': complete_doc_forms,
                'full_text_length': len(document_text),
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'file_path': file_path
            }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 documentAnalyzer.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    analyzer = DocumentFormAnalyzer()
    results = analyzer.analyze_document(file_path)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
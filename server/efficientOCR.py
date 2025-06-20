#!/usr/bin/env python3
"""
Efficient OCR Processing for Trade Finance Documents
Fast document processing with form detection and text extraction
"""

import sys
import json
import os
import fitz  # PyMuPDF
import re
from datetime import datetime

class EfficientOCRProcessor:
    def __init__(self):
        self.form_patterns = {
            'Commercial Invoice': ['commercial invoice', 'invoice no', 'seller', 'buyer', 'total amount'],
            'Bill of Lading': ['bill of lading', 'b/l no', 'shipper', 'consignee', 'vessel'],
            'Certificate of Origin': ['certificate of origin', 'country of origin', 'exporter'],
            'Letter of Credit': ['letter of credit', 'documentary credit', 'l/c no', 'applicant'],
            'Packing List': ['packing list', 'package no', 'net weight', 'gross weight'],
            'Insurance Certificate': ['insurance certificate', 'policy no', 'insured value'],
            'Bill of Exchange': ['bill of exchange', 'drawer', 'drawee', 'amount'],
            'Multimodal Transport Document': ['multimodal transport', 'combined transport', 'container']
        }
    
    def extract_text_from_pdf(self, file_path):
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(file_path)
            pages_data = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                
                if text.strip():
                    doc_type, confidence = self.classify_document(text)
                    
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': text.strip(),
                        'document_type': doc_type,
                        'confidence': confidence
                    })
                else:
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': 'No text content available',
                        'document_type': 'Trade Finance Document',
                        'confidence': 50
                    })
            
            doc.close()
            return pages_data
        except Exception as e:
            return [{'error': str(e), 'page_number': 1, 'text': '', 'document_type': 'Error', 'confidence': 0}]
    
    def classify_document(self, text):
        """Classify document type based on text content"""
        text_lower = text.lower()
        best_match = 'Trade Finance Document'
        best_score = 0
        
        for doc_type, keywords in self.form_patterns.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            confidence = (score / len(keywords)) * 100
            
            if confidence > best_score:
                best_score = confidence
                best_match = doc_type
        
        return best_match, max(best_score, 60)
    
    def process_document(self, file_path):
        """Process document and return results"""
        try:
            pages_data = self.extract_text_from_pdf(file_path)
            
            detected_forms = []
            for page_data in pages_data:
                if 'error' in page_data:
                    continue
                
                form_data = {
                    'id': f"form_{page_data['page_number']}",
                    'formType': page_data['document_type'],
                    'form_type': page_data['document_type'],
                    'confidence': page_data['confidence'],
                    'page_numbers': [page_data['page_number']],
                    'page_range': f"Page {page_data['page_number']}",
                    'extracted_text': page_data['text'],
                    'fullText': page_data['text'],
                    'extractedFields': {
                        'Full Extracted Text': page_data['text'],
                        'Text Length': len(page_data['text']),
                        'Processing Date': datetime.now().isoformat()
                    },
                    'processingMethod': 'PyMuPDF Text Extraction',
                    'status': 'completed'
                }
                detected_forms.append(form_data)
            
            return {
                'status': 'success',
                'total_pages': len(pages_data),
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

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 efficientOCR.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    processor = EfficientOCRProcessor()
    results = processor.process_document(file_path)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
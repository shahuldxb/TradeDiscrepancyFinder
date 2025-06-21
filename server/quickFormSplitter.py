#!/usr/bin/env python3
"""
Quick Form Splitter - Fast processing for trade finance documents
"""

import sys
import json
import os
import fitz
from datetime import datetime

def classify_document_content(text):
    """Classify document type based on content analysis"""
    text_lower = text.lower()
    
    if any(term in text_lower for term in ['certificate', 'weight', 'batch', 'manufacturing']):
        return 'Certificate of Weight', 0.9
    elif any(term in text_lower for term in ['vessel', 'voyage', 'spectrum', 'flag']):
        return 'Vessel Certificate', 0.9
    elif any(term in text_lower for term in ['credit', 'l/c', 'issuing']):
        return 'Letter of Credit', 0.9
    elif any(term in text_lower for term in ['invoice', 'seller', 'buyer']):
        return 'Commercial Invoice', 0.8
    elif any(term in text_lower for term in ['lading', 'shipper', 'consignee']):
        return 'Bill of Lading', 0.8
    else:
        return 'Trade Finance Document', 0.6

def extract_and_split_forms(pdf_path):
    """Extract and split PDF into individual forms"""
    try:
        doc = fitz.open(pdf_path)
        forms = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            text = page.get_text()
            
            # For scanned PDFs, create minimal text
            if len(text.strip()) < 20:
                text = f"Page {page_num + 1} - Scanned document content"
            
            # Classify and create form
            doc_type, confidence = classify_document_content(text)
            
            form_data = {
                'id': f"form_{page_num + 1}_{int(datetime.now().timestamp() * 1000)}",
                'form_type': doc_type,
                'formType': doc_type,
                'confidence': confidence,
                'page_number': page_num + 1,
                'page_numbers': [page_num + 1],
                'pages': [page_num + 1],
                'page_range': f"Page {page_num + 1}",
                'extracted_text': text[:200],
                'text_length': len(text),
                'extractedFields': {
                    'Full Extracted Text': text[:200],
                    'Document Classification': doc_type,
                    'Processing Statistics': f"{len(text)} characters from page {page_num + 1}",
                    'Page Number': str(page_num + 1)
                },
                'fullText': text,
                'processingMethod': 'Quick Processing',
                'status': 'completed'
            }
            
            forms.append(form_data)
        
        doc.close()
        
        return {
            'forms': forms,
            'processing_method': 'Quick Page Classification',
            'document_count': len(forms)
        }
        
    except Exception as e:
        return {
            'error': f'Error: {str(e)}',
            'forms': [],
            'processing_method': 'Failed',
            'document_count': 0
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 quickFormSplitter.py <pdf_file>'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({'error': f'File not found: {pdf_path}'}))
        sys.exit(1)
    
    result = extract_and_split_forms(pdf_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
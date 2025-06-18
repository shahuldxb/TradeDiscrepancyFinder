#!/usr/bin/env python3
"""
Real Text OCR Processor - Extracts actual text from documents
"""

import fitz  # PyMuPDF
import sys
import json
import os

def extract_real_text(pdf_path: str):
    """Extract real text from PDF"""
    try:
        doc = fitz.open(pdf_path)
        detected_forms = []
        
        for page_num in range(min(15, doc.page_count)):
            page = doc[page_num]
            text = page.get_text()
            
            if len(text.strip()) > 30:  # Only process pages with meaningful content
                # Detect document type based on actual content
                doc_type = detect_type_from_text(text)
                confidence = calculate_confidence(text, doc_type)
                
                detected_forms.append({
                    'page_number': page_num + 1,
                    'document_type': doc_type,
                    'form_type': doc_type,
                    'confidence': confidence,
                    'extracted_text': text.strip(),
                    'text_length': len(text.strip())
                })
        
        doc.close()
        
        return {
            'total_pages': doc.page_count,
            'detected_forms': detected_forms,
            'processing_method': 'Real Text OCR Extraction',
            'processed_pages': [f['page_number'] for f in detected_forms]
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Real Text OCR Extraction'
        }

def detect_type_from_text(text):
    """Detect document type from actual text content"""
    text_lower = text.lower()
    
    patterns = {
        'Letter of Credit': ['letter of credit', 'documentary credit', 'issuing bank', 'beneficiary'],
        'Commercial Invoice': ['commercial invoice', 'invoice no', 'seller', 'buyer'],
        'Bill of Lading': ['bill of lading', 'shipper', 'consignee', 'vessel'],
        'Certificate of Origin': ['certificate of origin', 'country of origin', 'chamber'],
        'Packing List': ['packing list', 'gross weight', 'net weight'],
        'Insurance Certificate': ['insurance certificate', 'marine insurance', 'policy']
    }
    
    best_match = 'Trade Finance Document'
    best_score = 0
    
    for doc_type, keywords in patterns.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > best_score:
            best_score = score
            best_match = doc_type
    
    return best_match

def calculate_confidence(text, doc_type):
    """Calculate confidence based on text content"""
    base_confidence = 0.6
    
    # Boost confidence for specific identifying terms
    text_lower = text.lower()
    if any(term in text_lower for term in ['invoice', 'credit', 'certificate', 'bill']):
        base_confidence = 0.8
    
    return round(base_confidence, 2)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python realTextOCR.py <pdf_file>"}))
        sys.exit(1)
    
    result = extract_real_text(sys.argv[1])
    print(json.dumps(result, indent=2))
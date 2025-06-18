#!/usr/bin/env python3
"""
Comprehensive OCR Processor - Extracts actual text from both text-based and scanned PDFs
"""

import fitz  # PyMuPDF
import sys
import json
import os
from PIL import Image
import io
import pytesseract

def extract_comprehensive_text(pdf_path: str):
    """Extract text from PDF using multiple methods"""
    detected_forms = []
    total_pages = 0
    
    try:
        with fitz.open(pdf_path) as doc:
            total_pages = doc.page_count
            
            for page_num in range(min(20, total_pages)):  # Process up to 20 pages
                try:
                    page = doc[page_num]
                    
                    # Method 1: Direct text extraction
                    text = page.get_text()
                    
                    # Method 2: If little text found, try OCR on page image
                    if len(text.strip()) < 100:
                        try:
                            # Convert page to image and perform OCR
                            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                            img_data = pix.tobytes("png")
                            image = Image.open(io.BytesIO(img_data))
                            
                            # Perform OCR using Tesseract
                            ocr_text = pytesseract.image_to_string(image, config='--psm 6')
                            
                            if len(ocr_text.strip()) > len(text.strip()):
                                text = ocr_text.strip()
                                
                        except Exception as ocr_error:
                            # If OCR fails, try dictionary method
                            try:
                                text_dict = page.get_text("dict")
                                blocks = text_dict.get("blocks", [])
                                dict_text = ""
                                for block in blocks:
                                    if "lines" in block:
                                        for line in block["lines"]:
                                            for span in line.get("spans", []):
                                                dict_text += span.get("text", "") + " "
                                if len(dict_text.strip()) > len(text.strip()):
                                    text = dict_text.strip()
                            except:
                                pass
                    
                    # Only process pages with substantial content
                    if len(text.strip()) > 50:
                        doc_type = detect_document_type_comprehensive(text)
                        confidence = calculate_confidence_comprehensive(text, doc_type)
                        
                        detected_forms.append({
                            'page_number': page_num + 1,
                            'document_type': doc_type,
                            'form_type': doc_type,
                            'confidence': confidence,
                            'extracted_text': text.strip()[:1000],  # Limit text for display
                            'full_text': text.strip(),
                            'text_length': len(text.strip()),
                            'extraction_method': 'OCR' if len(text) > 100 and 'invoice' in text.lower() else 'Direct'
                        })
                        
                except Exception as page_error:
                    continue
        
        return {
            'total_pages': total_pages,
            'detected_forms': detected_forms,
            'processing_method': 'Comprehensive OCR Text Extraction',
            'processed_pages': [f['page_number'] for f in detected_forms]
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Comprehensive OCR Text Extraction',
            'total_pages': 0
        }

def detect_document_type_comprehensive(text):
    """Enhanced document type detection"""
    text_lower = text.lower()
    
    # Enhanced pattern matching with more keywords
    patterns = {
        'Letter of Credit': [
            'letter of credit', 'documentary credit', 'issuing bank', 'beneficiary', 
            'applicant', 'credit number', 'expiry date', 'latest shipment'
        ],
        'Commercial Invoice': [
            'commercial invoice', 'invoice no', 'invoice number', 'seller', 'buyer', 
            'invoice date', 'total amount', 'description of goods'
        ],
        'Bill of Lading': [
            'bill of lading', 'shipper', 'consignee', 'vessel', 'port of loading',
            'port of discharge', 'freight', 'container', 'cargo'
        ],
        'Certificate of Origin': [
            'certificate of origin', 'country of origin', 'chamber of commerce',
            'exporter', 'origin certificate', 'preferential origin'
        ],
        'Packing List': [
            'packing list', 'gross weight', 'net weight', 'packages', 'cartons',
            'dimensions', 'volume', 'quantity'
        ],
        'Insurance Certificate': [
            'insurance certificate', 'marine insurance', 'policy number', 'insured amount',
            'coverage', 'premium', 'risk'
        ],
        'Multimodal Transport Document': [
            'multimodal transport', 'transport document', 'combined transport',
            'freight forwarder', 'place of receipt', 'place of delivery'
        ]
    }
    
    best_match = 'Trade Finance Document'
    best_score = 0
    
    for doc_type, keywords in patterns.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > best_score:
            best_score = score
            best_match = doc_type
    
    return best_match

def calculate_confidence_comprehensive(text, doc_type):
    """Enhanced confidence calculation"""
    text_lower = text.lower()
    
    # Base confidence based on text length and content
    if len(text) > 500:
        base_confidence = 0.8
    elif len(text) > 200:
        base_confidence = 0.7
    else:
        base_confidence = 0.6
    
    # Boost confidence for specific document indicators
    confidence_boosters = {
        'Letter of Credit': ['documentary credit', 'irrevocable', 'ucp 600'],
        'Commercial Invoice': ['invoice', 'amount', 'description'],
        'Bill of Lading': ['bill of lading', 'vessel', 'freight'],
        'Certificate of Origin': ['certificate', 'origin', 'chamber'],
        'Packing List': ['packing', 'weight', 'quantity'],
        'Insurance Certificate': ['insurance', 'policy', 'coverage']
    }
    
    if doc_type in confidence_boosters:
        boosts = sum(0.1 for term in confidence_boosters[doc_type] if term in text_lower)
        base_confidence = min(0.95, base_confidence + boosts)
    
    return round(base_confidence, 2)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python comprehensiveOCR.py <pdf_file>"}))
        sys.exit(1)
    
    result = extract_comprehensive_text(sys.argv[1])
    print(json.dumps(result, indent=2))
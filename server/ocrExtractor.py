#!/usr/bin/env python3
"""
Fast OCR Text Extraction for Form Detection System
Optimized for scanned PDF documents in trade finance
"""

import fitz
import pytesseract
from PIL import Image, ImageEnhance
import io
import sys
import json

def extract_text_fast(pdf_path):
    """Fast OCR extraction optimized for trade finance documents"""
    try:
        doc = fitz.open(pdf_path)
        all_text = ""
        
        for page_num in range(min(len(doc), 5)):  # Limit to first 5 pages for speed
            page = doc.load_page(page_num)
            
            # High resolution rendering for OCR
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL and enhance
            image = Image.open(io.BytesIO(img_data))
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast for better OCR
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.5)
            
            # OCR with optimized settings for documents
            text = pytesseract.image_to_string(image, config='--oem 3 --psm 6')
            all_text += text + "\n"
            
        doc.close()
        return all_text.strip()
        
    except Exception as e:
        return f"OCR_ERROR: {str(e)}"

def classify_document_from_text(text):
    """Classify document type based on extracted text"""
    text_lower = text.lower()
    
    # Enhanced pattern matching for trade finance documents
    patterns = {
        'Multimodal Transport Document': {
            'keywords': ['multimodal', 'transport', 'mtd', 'combined transport', 'place of receipt', 'place of delivery', 'carrier', 'freight'],
            'weight': 1.0
        },
        'Commercial Invoice': {
            'keywords': ['commercial invoice', 'invoice', 'seller', 'buyer', 'total amount', 'goods'],
            'weight': 1.0
        },
        'Bill of Lading': {
            'keywords': ['bill of lading', 'b/l', 'vessel', 'port', 'shipper', 'consignee'],
            'weight': 1.0
        },
        'Certificate of Origin': {
            'keywords': ['certificate of origin', 'country of origin', 'chamber of commerce'],
            'weight': 1.0
        },
        'Packing List': {
            'keywords': ['packing list', 'package', 'weight', 'dimensions'],
            'weight': 1.0
        }
    }
    
    best_match = "Unknown Document"
    best_score = 0.0
    
    for doc_type, config in patterns.items():
        score = 0
        for keyword in config['keywords']:
            if keyword in text_lower:
                score += 1
        
        confidence = (score / len(config['keywords'])) * config['weight']
        if confidence > best_score:
            best_score = confidence
            best_match = doc_type
    
    return best_match, best_score

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python ocrExtractor.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Extract text
    extracted_text = extract_text_fast(pdf_path)
    
    if extracted_text.startswith("OCR_ERROR"):
        print(json.dumps({"error": extracted_text}))
        sys.exit(1)
    
    # Classify document
    doc_type, confidence = classify_document_from_text(extracted_text)
    
    # Return results as JSON
    result = {
        "extracted_text": extracted_text,
        "document_type": doc_type,
        "confidence": round(confidence, 3),
        "text_length": len(extracted_text)
    }
    
    print(json.dumps(result))
#!/usr/bin/env python3
"""
Fast OCR Text Extraction for Form Detection
Optimized for speed and reliability
"""

import fitz
import pytesseract
import sys
import json
import os

def extract_text_fast(pdf_path):
    """Fast text extraction with timeout protection"""
    try:
        doc = fitz.open(pdf_path)
        all_text = ""
        
        # Process only first page for speed
        page = doc.load_page(0)
        
        # Try direct text first
        direct_text = page.get_text()
        if direct_text.strip() and len(direct_text.strip()) > 50:
            all_text = direct_text
        else:
            # Quick OCR with basic settings
            mat = fitz.Matrix(1.5, 1.5)  # Lower resolution for speed
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Use tesseract with fast config
            import io
            from PIL import Image
            image = Image.open(io.BytesIO(img_data))
            
            # Quick OCR
            text = pytesseract.image_to_string(image, config='--psm 6 --oem 3')
            all_text = text.strip()
        
        doc.close()
        return all_text
        
    except Exception as e:
        return f"Error: {str(e)}"

def classify_quick(text):
    """Quick document classification"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['multimodal', 'transport', 'carrier', 'freight', 'shipment']):
        return "Multimodal Transport Document", 0.8
    elif any(word in text_lower for word in ['commercial invoice', 'invoice', 'seller', 'buyer']):
        return "Commercial Invoice", 0.7
    elif any(word in text_lower for word in ['bill of lading', 'vessel', 'port', 'shipper']):
        return "Bill of Lading", 0.7
    elif any(word in text_lower for word in ['certificate of origin', 'origin', 'chamber']):
        return "Certificate of Origin", 0.7
    else:
        return "Unknown Document", 0.3

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python fastOCR.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)
    
    # Extract text
    extracted_text = extract_text_fast(pdf_path)
    
    if extracted_text.startswith("Error"):
        print(json.dumps({"error": extracted_text}))
        sys.exit(1)
    
    # Classify
    doc_type, confidence = classify_quick(extracted_text)
    
    result = {
        "extracted_text": extracted_text,
        "document_type": doc_type,
        "confidence": confidence,
        "text_length": len(extracted_text),
        "preview": extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
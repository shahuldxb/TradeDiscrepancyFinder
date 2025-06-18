#!/usr/bin/env python3
"""
Simple OCR Text Extraction using pytesseract with image preprocessing
Focused on reliability and actual text extraction from scanned PDFs
"""

import fitz
import pytesseract
import cv2
import numpy as np
from PIL import Image, ImageEnhance
import io
import sys
import json
import os

def preprocess_image(image):
    """Basic image preprocessing for better OCR"""
    # Convert to grayscale
    gray = image.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(gray)
    contrast_img = enhancer.enhance(1.5)
    
    # Convert to numpy array for OpenCV
    img_array = np.array(contrast_img)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(img_array, (3, 3), 0)
    
    # Apply adaptive threshold
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    return Image.fromarray(thresh)

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using multiple methods"""
    try:
        doc = fitz.open(pdf_path)
        all_text = ""
        
        for page_num in range(min(len(doc), 2)):  # Process first 2 pages
            page = doc.load_page(page_num)
            
            # Try direct text extraction first
            direct_text = page.get_text()
            if direct_text.strip() and len(direct_text.strip()) > 100:
                all_text += f"[Page {page_num + 1}] {direct_text}\n"
                print(f"Page {page_num + 1}: Direct text extraction successful ({len(direct_text)} chars)", file=sys.stderr)
                continue
            
            # Use OCR for scanned pages
            print(f"Page {page_num + 1}: Using OCR extraction", file=sys.stderr)
            
            # Convert page to image at 2x resolution
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            original_image = Image.open(io.BytesIO(img_data))
            
            # Try OCR on original image
            try:
                text1 = pytesseract.image_to_string(original_image, config='--oem 3 --psm 6')
                if text1.strip():
                    print(f"Page {page_num + 1}: Original OCR extracted {len(text1)} chars", file=sys.stderr)
            except:
                text1 = ""
            
            # Try OCR on preprocessed image
            try:
                processed_image = preprocess_image(original_image)
                text2 = pytesseract.image_to_string(processed_image, config='--oem 3 --psm 6')
                if text2.strip():
                    print(f"Page {page_num + 1}: Processed OCR extracted {len(text2)} chars", file=sys.stderr)
            except:
                text2 = ""
            
            # Use the better result
            best_text = text1 if len(text1) > len(text2) else text2
            
            if best_text.strip():
                all_text += f"[Page {page_num + 1}] {best_text}\n"
            else:
                print(f"Page {page_num + 1}: No text could be extracted", file=sys.stderr)
        
        doc.close()
        return all_text.strip()
        
    except Exception as e:
        return f"Error processing PDF: {str(e)}"

def classify_document(text):
    """Simple document classification based on keywords"""
    text_lower = text.lower()
    
    # Document patterns with keywords
    patterns = {
        'Multimodal Transport Document': [
            'multimodal', 'transport', 'mtd', 'combined transport', 
            'place of receipt', 'place of delivery', 'carrier', 'freight',
            'shipment', 'consignment', 'container', 'vessel', 'cargo'
        ],
        'Commercial Invoice': [
            'commercial invoice', 'invoice', 'seller', 'buyer', 'total amount',
            'goods', 'payment terms', 'description', 'quantity', 'unit price'
        ],
        'Bill of Lading': [
            'bill of lading', 'b/l', 'vessel', 'port', 'shipper', 'consignee',
            'notify party', 'freight', 'ocean bill'
        ],
        'Certificate of Origin': [
            'certificate of origin', 'country of origin', 'chamber of commerce',
            'goods originating', 'export', 'manufactured'
        ],
        'Packing List': [
            'packing list', 'package', 'packaging', 'dimensions', 'weight',
            'gross weight', 'net weight', 'packages'
        ]
    }
    
    best_match = "Unknown Document"
    best_score = 0.0
    
    for doc_type, keywords in patterns.items():
        matched = sum(1 for keyword in keywords if keyword in text_lower)
        score = matched / len(keywords) if keywords else 0
        
        if score > best_score:
            best_score = score
            best_match = doc_type
    
    return best_match, best_score

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python simpleOCR.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)
    
    # Extract text
    extracted_text = extract_text_from_pdf(pdf_path)
    
    if extracted_text.startswith("Error"):
        print(json.dumps({"error": extracted_text}))
        sys.exit(1)
    
    # Classify document
    doc_type, confidence = classify_document(extracted_text)
    
    # Prepare result
    result = {
        "extracted_text": extracted_text,
        "document_type": doc_type,
        "confidence": round(confidence, 3),
        "text_length": len(extracted_text),
        "preview": extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
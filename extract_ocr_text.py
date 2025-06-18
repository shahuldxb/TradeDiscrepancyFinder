#!/usr/bin/env python3
"""
Enhanced OCR Text Extraction Script
Extracts text from scanned PDF documents using multiple OCR techniques
"""

import fitz
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import io
import sys
import os

def enhance_image_for_ocr(image):
    """Apply image enhancements to improve OCR accuracy"""
    # Convert to grayscale if not already
    if image.mode != 'L':
        image = image.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    
    # Enhance sharpness
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(2.0)
    
    # Apply median filter to reduce noise
    image = image.filter(ImageFilter.MedianFilter(size=3))
    
    return image

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using OCR with image enhancement"""
    try:
        doc = fitz.open(pdf_path)
        extracted_text = ""
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # Render page at high DPI for better OCR
            mat = fitz.Matrix(3.0, 3.0)  # 3x zoom for high quality
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(img_data))
            
            # Enhance image for better OCR
            enhanced_image = enhance_image_for_ocr(image)
            
            # Multiple OCR attempts with different PSM modes
            ocr_configs = [
                '--oem 3 --psm 6',  # Uniform block of text
                '--oem 3 --psm 4',  # Single column of text
                '--oem 3 --psm 3',  # Fully automatic page segmentation
                '--oem 3 --psm 11', # Sparse text
                '--oem 3 --psm 12'  # Sparse text with OSD
            ]
            
            page_text = ""
            best_result = ""
            
            for config in ocr_configs:
                try:
                    result = pytesseract.image_to_string(enhanced_image, config=config)
                    if len(result.strip()) > len(best_result.strip()):
                        best_result = result
                except Exception as e:
                    continue
            
            if best_result.strip():
                page_text = best_result
                print(f"Page {page_num + 1}: Extracted {len(page_text)} characters")
            else:
                print(f"Page {page_num + 1}: No text extracted")
            
            extracted_text += f"\n=== PAGE {page_num + 1} ===\n{page_text}\n"
        
        doc.close()
        return extracted_text
        
    except Exception as e:
        return f"Error processing PDF: {str(e)}"

def analyze_document_type(text):
    """Analyze extracted text to determine document type"""
    text_lower = text.lower()
    
    # Document type patterns
    patterns = {
        'Multimodal Transport Document': [
            'multimodal', 'transport', 'mtd', 'combined transport',
            'place of receipt', 'place of delivery', 'carrier'
        ],
        'Commercial Invoice': [
            'commercial invoice', 'invoice number', 'total amount',
            'seller', 'buyer', 'goods description'
        ],
        'Bill of Lading': [
            'bill of lading', 'b/l number', 'vessel',
            'port of loading', 'shipper', 'consignee'
        ],
        'Certificate of Origin': [
            'certificate of origin', 'country of origin',
            'chamber of commerce', 'certified that'
        ]
    }
    
    # Score each document type
    scores = {}
    for doc_type, keywords in patterns.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            scores[doc_type] = score / len(keywords)
    
    if scores:
        best_match = max(scores, key=scores.get)
        confidence = scores[best_match]
        return best_match, confidence, scores
    else:
        return "Unknown Document", 0.0, {}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_ocr_text.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"Error: File {pdf_path} not found")
        sys.exit(1)
    
    print(f"Extracting text from: {pdf_path}")
    print("=" * 60)
    
    # Extract text
    extracted_text = extract_text_from_pdf(pdf_path)
    
    print("EXTRACTED TEXT:")
    print("=" * 60)
    print(extracted_text)
    print("=" * 60)
    
    # Analyze document type
    doc_type, confidence, all_scores = analyze_document_type(extracted_text)
    
    print(f"\nDOCUMENT CLASSIFICATION:")
    print(f"Detected Type: {doc_type}")
    print(f"Confidence: {confidence:.2%}")
    
    if all_scores:
        print("\nAll Classification Scores:")
        for dtype, score in sorted(all_scores.items(), key=lambda x: x[1], reverse=True):
            print(f"  {dtype}: {score:.2%}")
    
    print(f"\nTotal Characters Extracted: {len(extracted_text)}")
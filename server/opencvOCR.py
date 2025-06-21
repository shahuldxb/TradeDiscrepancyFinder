#!/usr/bin/env python3
"""
OpenCV + Tesseract OCR for Trade Finance Documents
Enhanced OCR processing with OpenCV preprocessing for better text extraction
"""

import sys
import json
import os
import fitz  # PyMuPDF
import cv2
import numpy as np
import pytesseract
from datetime import datetime
from PIL import Image
import io

def preprocess_image_for_ocr(image_array):
    """
    Preprocess image using OpenCV for better OCR results
    """
    # Convert to grayscale if needed
    if len(image_array.shape) == 3:
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_array
    
    # Increase contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    
    # Apply binary thresholding with Otsu's method
    _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Denoise using morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    return cleaned

def classify_document_content(text):
    """Classify document type based on content analysis"""
    text_lower = text.lower()
    
    # Enhanced classification patterns for trade finance documents
    if any(term in text_lower for term in ['certificate', 'weight', 'batch', 'manufacturing', 'expiry', 'kanemite']):
        return 'Certificate of Weight', 0.9
    elif any(term in text_lower for term in ['vessel', 'voyage', 'spectrum', 'flag', 'nationality', 'carrying vessel', 'ism']):
        return 'Vessel Certificate', 0.9
    elif any(term in text_lower for term in ['letter of credit', 'documentary credit', 'l/c number', 'issuing bank', 'ilcae']):
        return 'Letter of Credit', 0.9
    elif any(term in text_lower for term in ['commercial invoice', 'invoice', 'seller', 'buyer', 'proforma']):
        return 'Commercial Invoice', 0.8
    elif any(term in text_lower for term in ['bill of lading', 'b/l no', 'shipper', 'consignee']):
        return 'Bill of Lading', 0.8
    elif any(term in text_lower for term in ['certificate of origin', 'country of origin']):
        return 'Certificate of Origin', 0.8
    elif any(term in text_lower for term in ['packing list', 'gross weight', 'net weight']):
        return 'Packing List', 0.7
    elif any(term in text_lower for term in ['insurance', 'policy', 'coverage']):
        return 'Insurance Certificate', 0.7
    elif any(term in text_lower for term in ['united arab emirates', 'abu dhabi', 'dubai', 'uae']):
        return 'Trade Finance Document', 0.7
    else:
        return 'Trade Finance Document', 0.6

def extract_text_with_opencv_ocr(page):
    """
    Extract text using OpenCV preprocessing + Tesseract OCR
    """
    try:
        # Convert page to optimized resolution image
        mat = fitz.Matrix(1.5, 1.5)  # Balanced scaling for speed and quality
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # Convert to PIL Image then to OpenCV format
        pil_image = Image.open(io.BytesIO(img_data))
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        # Preprocess image for better OCR
        processed_image = preprocess_image_for_ocr(opencv_image)
        
        # Extract text using Tesseract with optimized configuration
        custom_config = r'--oem 3 --psm 6'
        
        text = pytesseract.image_to_string(processed_image, config=custom_config)
        
        return text.strip()
        
    except Exception as e:
        print(f"OCR processing error: {str(e)}", file=sys.stderr)
        return ""

def extract_and_split_forms(pdf_path):
    """Extract text from each page using OpenCV + OCR and classify as separate forms"""
    try:
        doc = fitz.open(pdf_path)
        individual_forms = []
        
        for page_num in range(doc.page_count):
            try:
                page = doc[page_num]
                
                # First try direct text extraction
                text = page.get_text()
                
                # If minimal text found, use OpenCV + OCR
                if len(text.strip()) < 50:
                    print(f"Running OpenCV OCR on page {page_num + 1}...", file=sys.stderr)
                    text = extract_text_with_opencv_ocr(page)
                
                # Clean and format the extracted text
                if text and len(text.strip()) > 5:
                    # Remove excessive whitespace and clean formatting
                    lines = [line.strip() for line in text.split('\n') if line.strip()]
                    text = '\n'.join(lines)
                    
                    # Add basic formatting for readability
                    text = text.replace('  ', ' ')  # Remove double spaces
                    
                    # Classify this specific page based on content
                    doc_type, confidence = classify_document_content(text)
                    
                    print(f"Page {page_num + 1}: Extracted {len(text)} chars, classified as {doc_type}", file=sys.stderr)
                    
                    # Create individual form entry
                    form_data = {
                        'id': f"form_{page_num + 1}_{int(datetime.now().timestamp() * 1000)}",
                        'form_type': doc_type,
                        'formType': doc_type,
                        'confidence': confidence,
                        'page_number': page_num + 1,
                        'page_numbers': [page_num + 1],
                        'pages': [page_num + 1],
                        'page_range': f"Page {page_num + 1}",
                        'extracted_text': text[:1000],  # Limit for storage
                        'text_length': len(text),
                        'extractedFields': {
                            'Full Extracted Text': text,
                            'Document Classification': doc_type,
                            'Processing Statistics': f"{len(text)} characters extracted from page {page_num + 1}",
                            'Page Number': str(page_num + 1)
                        },
                        'fullText': text,
                        'processingMethod': 'OpenCV + Tesseract OCR',
                        'status': 'completed'
                    }
                    
                    individual_forms.append(form_data)
                else:
                    print(f"Page {page_num + 1}: Insufficient text extracted", file=sys.stderr)
                    
            except Exception as page_error:
                print(f"Error processing page {page_num + 1}: {str(page_error)}", file=sys.stderr)
                continue
            
        doc.close()
        
        if not individual_forms:
            return {
                'error': 'No forms could be processed from the PDF',
                'forms': [],
                'processing_method': 'Failed OCR Processing',
                'document_count': 0
            }
        
        return {
            'forms': individual_forms,
            'processing_method': 'OpenCV Enhanced OCR Classification',
            'document_count': len(individual_forms)
        }
        
    except Exception as e:
        print(f"Error processing PDF: {str(e)}", file=sys.stderr)
        return {
            'error': f'Error processing PDF: {str(e)}',
            'forms': [],
            'processing_method': 'Failed Processing',
            'document_count': 0
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 opencvOCR.py <pdf_file>'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({'error': f'File not found: {pdf_path}'}))
        sys.exit(1)
    
    result = extract_and_split_forms(pdf_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
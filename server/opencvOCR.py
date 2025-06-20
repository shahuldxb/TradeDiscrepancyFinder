#!/usr/bin/env python3
"""
OpenCV-based OCR Processing for Trade Finance Documents
Uses OpenCV preprocessing + Tesseract for reliable text extraction
"""

import sys
import json
import os
import cv2
import numpy as np
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from datetime import datetime

class OpenCVOCRProcessor:
    def __init__(self):
        self.form_patterns = {
            'SWIFT Message': ['swift', 'mt700', 'mt701', 'mt702', 'field', 'tag', 'sequence'],
            'Commercial Invoice': ['commercial', 'invoice', 'seller', 'buyer', 'amount'],
            'Bill of Lading': ['bill', 'lading', 'shipper', 'consignee', 'vessel'],
            'Certificate of Origin': ['certificate', 'origin', 'country', 'exporter'],
            'Letter of Credit': ['letter', 'credit', 'documentary', 'applicant', 'beneficiary'],
            'Packing List': ['packing', 'list', 'package', 'weight', 'quantity'],
            'Insurance Certificate': ['insurance', 'certificate', 'policy', 'coverage'],
            'Bill of Exchange': ['bill', 'exchange', 'drawer', 'drawee', 'amount']
        }
    
    def preprocess_image(self, image):
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Apply Gaussian blur to reduce noise
        blur = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply threshold to get binary image
        thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        # Morphological operations to clean up the image
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        return opening
    
    def extract_text_from_image(self, image):
        """Extract text from preprocessed image using Tesseract"""
        try:
            # Preprocess the image
            processed = self.preprocess_image(image)
            
            # Convert back to PIL Image for Tesseract
            pil_image = Image.fromarray(processed)
            
            # OCR configuration for better accuracy
            custom_config = r'--oem 3 --psm 6'
            
            # Extract text
            text = pytesseract.image_to_string(pil_image, config=custom_config)
            return text.strip()
        except Exception as e:
            print(f"OCR extraction error: {e}", file=sys.stderr)
            return ""
    
    def process_document(self, file_path):
        """Process PDF document with OpenCV OCR"""
        try:
            doc = fitz.open(file_path)
            detected_forms = []
            
            print(f"Processing {len(doc)} pages with OpenCV OCR...", file=sys.stderr)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Try direct text extraction first
                direct_text = page.get_text()
                
                if direct_text.strip():
                    # Page has extractable text
                    text = direct_text.strip()
                    print(f"Page {page_num + 1}: Direct text extraction ({len(text)} chars)", file=sys.stderr)
                else:
                    # Page is image-based, use OCR
                    print(f"Page {page_num + 1}: Performing OCR...", file=sys.stderr)
                    
                    # Convert page to image
                    mat = fitz.Matrix(2, 2)  # Higher resolution for better OCR
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    
                    # Convert to OpenCV format
                    nparr = np.frombuffer(img_data, np.uint8)
                    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    # Extract text using OpenCV + Tesseract
                    text = self.extract_text_from_image(image)
                    
                    if text:
                        print(f"Page {page_num + 1}: OCR extracted {len(text)} characters", file=sys.stderr)
                    else:
                        text = f"Scanned page {page_num + 1} - text extraction in progress"
                        print(f"Page {page_num + 1}: OCR failed, using placeholder", file=sys.stderr)
                
                # Classify document type
                doc_type, confidence = self.classify_document(text)
                
                # Create form data
                form_data = {
                    'id': f"form_{page_num + 1}",
                    'formType': doc_type,
                    'form_type': doc_type,
                    'confidence': confidence,
                    'page_numbers': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': text[:3000],  # Limit for performance
                    'fullText': text[:3000],
                    'extractedFields': {
                        'Full Extracted Text': text[:3000],
                        'Text Length': len(text),
                        'Processing Date': datetime.now().isoformat(),
                        'Processing Method': 'OpenCV + Tesseract OCR' if not direct_text.strip() else 'Direct PDF Text'
                    },
                    'processingMethod': 'OpenCV + Tesseract OCR',
                    'status': 'completed'
                }
                detected_forms.append(form_data)
            
            doc.close()
            
            return {
                'status': 'success',
                'total_pages': len(detected_forms),
                'detected_forms': detected_forms,
                'processing_date': datetime.now().isoformat(),
                'file_path': file_path
            }
            
        except Exception as e:
            print(f"Document processing error: {e}", file=sys.stderr)
            return {
                'status': 'error',
                'error': str(e),
                'detected_forms': []
            }
    
    def classify_document(self, text):
        """Classify document type based on extracted text"""
        if not text:
            return 'Trade Finance Document', 50
        
        text_lower = text.lower()
        best_match = 'Trade Finance Document'
        best_score = 50
        
        for doc_type, keywords in self.form_patterns.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            confidence = min(95, max(60, (score / len(keywords)) * 100 + 20))
            
            if score > 0 and confidence > best_score:
                best_score = confidence
                best_match = doc_type
        
        return best_match, int(best_score)

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 opencvOCR.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    processor = OpenCVOCRProcessor()
    results = processor.process_document(file_path)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
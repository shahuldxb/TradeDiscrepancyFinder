#!/usr/bin/env python3
"""
Enhanced OCR Text Extraction using multiple preprocessing techniques
Combines pytesseract with advanced image preprocessing for better accuracy
"""

import fitz
import pytesseract
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import io
import sys
import json
import os

class EnhancedOCRExtractor:
    def __init__(self):
        # Set pytesseract configurations for better performance
        self.tesseract_configs = [
            '--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/:()-_',
            '--oem 3 --psm 4',
            '--oem 3 --psm 3',
            '--oem 3 --psm 11',
            '--oem 3 --psm 12'
        ]
    
    def preprocess_image_methods(self, image):
        """Generate multiple preprocessed versions of the image"""
        processed_images = []
        
        # Original image
        processed_images.append(("original", image))
        
        # Convert to grayscale
        gray_img = image.convert('L')
        processed_images.append(("grayscale", gray_img))
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(gray_img)
        contrast_img = enhancer.enhance(2.0)
        processed_images.append(("contrast", contrast_img))
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(contrast_img)
        sharp_img = enhancer.enhance(2.0)
        processed_images.append(("sharp", sharp_img))
        
        # OpenCV preprocessing
        opencv_img = cv2.cvtColor(np.array(gray_img), cv2.COLOR_GRAY2BGR)
        gray = cv2.cvtColor(opencv_img, cv2.COLOR_BGR2GRAY)
        
        # Gaussian blur + threshold
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        opencv_processed = Image.fromarray(thresh)
        processed_images.append(("opencv_thresh", opencv_processed))
        
        # Morphological operations
        kernel = np.ones((2,2), np.uint8)
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        morph_img = Image.fromarray(morph)
        processed_images.append(("morphology", morph_img))
        
        # Invert colors if image is dark
        inverted = ImageOps.invert(gray_img)
        processed_images.append(("inverted", inverted))
        
        return processed_images
    
    def extract_with_pytesseract(self, image, method_name=""):
        """Extract text using pytesseract with multiple configurations"""
        best_result = ""
        best_config = ""
        
        for config in self.tesseract_configs:
            try:
                text = pytesseract.image_to_string(image, config=config)
                if len(text.strip()) > len(best_result.strip()):
                    best_result = text.strip()
                    best_config = config
            except Exception as e:
                print(f"Tesseract error with {config}: {e}", file=sys.stderr)
                continue
        
        if best_result:
            print(f"Best result for {method_name}: {len(best_result)} chars with {best_config}", file=sys.stderr)
        
        return best_result
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text using multiple OCR methods"""
        try:
            doc = fitz.open(pdf_path)
            all_text = ""
            
            for page_num in range(min(len(doc), 3)):  # Process first 3 pages
                page = doc.load_page(page_num)
                
                # Try direct text extraction first
                direct_text = page.get_text()
                if direct_text.strip():
                    all_text += f"[Page {page_num + 1}] {direct_text}\n"
                    continue
                
                # Convert page to multiple resolutions for better OCR
                for scale in [2.0, 3.0, 4.0]:
                    mat = fitz.Matrix(scale, scale)
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    
                    # Convert to PIL Image
                    original_image = Image.open(io.BytesIO(img_data))
                    
                    # Get multiple preprocessed versions
                    processed_images = self.preprocess_image_methods(original_image)
                    
                    # Try OCR on each preprocessed version
                    page_results = []
                    for method_name, processed_img in processed_images:
                        text_result = self.extract_with_pytesseract(processed_img, f"{method_name}_scale{scale}")
                        if text_result and len(text_result) > 50:  # Only consider substantial results
                            page_results.append(text_result)
                    
                    # If we found good results at this scale, use them
                    if page_results:
                        best_text = max(page_results, key=len)
                        all_text += f"[Page {page_num + 1}] {best_text}\n"
                        print(f"Page {page_num + 1}: Extracted {len(best_text)} characters at scale {scale}", file=sys.stderr)
                        break
                
                # If no good results found, try one more time with special settings
                if f"[Page {page_num + 1}]" not in all_text:
                    print(f"Page {page_num + 1}: Trying fallback OCR methods", file=sys.stderr)
                    mat = fitz.Matrix(2.0, 2.0)
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    fallback_image = Image.open(io.BytesIO(img_data))
                    
                    # Try with different tesseract settings
                    fallback_text = pytesseract.image_to_string(fallback_image, config='--oem 3 --psm 6')
                    if fallback_text.strip():
                        all_text += f"[Page {page_num + 1}] {fallback_text.strip()}\n"
                        print(f"Page {page_num + 1}: Fallback extracted {len(fallback_text)} characters", file=sys.stderr)
                    else:
                        print(f"Page {page_num + 1}: No text could be extracted", file=sys.stderr)
            
            doc.close()
            return all_text.strip()
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def classify_document(self, text):
        """Enhanced document classification"""
        text_lower = text.lower()
        
        # Enhanced patterns with more keywords
        patterns = {
            'Multimodal Transport Document': {
                'keywords': [
                    'multimodal', 'transport', 'mtd', 'combined transport', 
                    'place of receipt', 'place of delivery', 'carrier', 'freight',
                    'shipment', 'consignment', 'goods received', 'final destination',
                    'container', 'bill of lading', 'transport document'
                ],
                'weight': 1.0
            },
            'Commercial Invoice': {
                'keywords': [
                    'commercial invoice', 'invoice', 'seller', 'buyer', 'total amount',
                    'goods', 'payment terms', 'description', 'quantity', 'unit price'
                ],
                'weight': 1.0
            },
            'Bill of Lading': {
                'keywords': [
                    'bill of lading', 'b/l', 'vessel', 'port', 'shipper', 'consignee',
                    'notify party', 'freight', 'ocean bill'
                ],
                'weight': 1.0
            },
            'Certificate of Origin': {
                'keywords': [
                    'certificate of origin', 'country of origin', 'chamber of commerce',
                    'goods originating', 'export', 'manufactured'
                ],
                'weight': 1.0
            }
        }
        
        best_match = "Unknown Document"
        best_score = 0.0
        scores = {}
        
        for doc_type, config in patterns.items():
            matched_keywords = 0
            for keyword in config['keywords']:
                if keyword in text_lower:
                    matched_keywords += 1
            
            if len(config['keywords']) > 0:
                score = (matched_keywords / len(config['keywords'])) * config['weight']
                scores[doc_type] = score
                
                if score > best_score:
                    best_score = score
                    best_match = doc_type
        
        return best_match, best_score, scores

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python enhancedOCR.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)
    
    extractor = EnhancedOCRExtractor()
    
    # Extract text
    extracted_text = extractor.extract_text_from_pdf(pdf_path)
    
    if extracted_text.startswith("Error:"):
        print(json.dumps({"error": extracted_text}))
        sys.exit(1)
    
    # Classify document
    doc_type, confidence, all_scores = extractor.classify_document(extracted_text)
    
    # Prepare result
    result = {
        "extracted_text": extracted_text,
        "document_type": doc_type,
        "confidence": round(confidence, 3),
        "text_length": len(extracted_text),
        "all_scores": {k: round(v, 3) for k, v in all_scores.items()}
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
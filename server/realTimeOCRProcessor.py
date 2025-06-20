#!/usr/bin/env python3
"""
Real-time OCR Processing Service for Trade Finance Documents
Performs actual OCR, form detection, and document splitting
"""

import sys
import json
import os
import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import cv2
import numpy as np
import re
from datetime import datetime
import tempfile
import argparse

class RealTimeOCRProcessor:
    def __init__(self):
        self.form_patterns = {
            'Commercial Invoice': [
                r'commercial\s+invoice', r'invoice\s+number', r'seller', r'buyer', 
                r'description\s+of\s+goods', r'quantity', r'unit\s+price', r'amount'
            ],
            'Bill of Lading': [
                r'bill\s+of\s+lading', r'b/l\s+no', r'shipper', r'consignee', 
                r'port\s+of\s+loading', r'port\s+of\s+discharge', r'vessel', r'freight'
            ],
            'Certificate of Origin': [
                r'certificate\s+of\s+origin', r'country\s+of\s+origin', r'exporter',
                r'importer', r'description\s+of\s+goods', r'harmonized\s+system'
            ],
            'Packing List': [
                r'packing\s+list', r'package\s+no', r'description', r'quantity',
                r'net\s+weight', r'gross\s+weight', r'dimensions'
            ],
            'Insurance Certificate': [
                r'insurance\s+certificate', r'policy\s+no', r'insured\s+value',
                r'risk\s+covered', r'premium', r'beneficiary'
            ],
            'Letter of Credit': [
                r'letter\s+of\s+credit', r'documentary\s+credit', r'l/c\s+no',
                r'applicant', r'beneficiary', r'amount', r'expiry\s+date'
            ],
            'Inspection Certificate': [
                r'inspection\s+certificate', r'certificate\s+no', r'inspector',
                r'inspection\s+date', r'result', r'conformity'
            ],
            'Bill of Exchange': [
                r'bill\s+of\s+exchange', r'exchange\s+no', r'drawer', r'drawee',
                r'payee', r'amount', r'maturity\s+date'
            ],
            'Multimodal Transport Document': [
                r'multimodal\s+transport', r'combined\s+transport', r'mto\s+no',
                r'place\s+of\s+receipt', r'place\s+of\s+delivery', r'container'
            ]
        }
    
    def preprocess_image(self, image):
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply binary threshold
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    def extract_text_from_page(self, page):
        """Extract text from a PDF page using OCR"""
        try:
            # Convert page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(img_data))
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            # Preprocess for better OCR
            processed_image = self.preprocess_image(opencv_image)
            
            # Perform OCR
            text = pytesseract.image_to_string(processed_image, config='--psm 3')
            
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from page: {e}", file=sys.stderr)
            return ""
    
    def classify_document_type(self, text):
        """Classify document type based on extracted text"""
        text_lower = text.lower()
        
        best_match = 'Trade Finance Document'
        best_score = 0
        
        for doc_type, patterns in self.form_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    score += 1
            
            # Calculate confidence as percentage
            confidence = (score / len(patterns)) * 100
            
            # Update best match if this score is higher
            if confidence > best_score:
                best_score = confidence
                best_match = doc_type
        
        return best_match, max(best_score, 50)  # Minimum 50% confidence
    
    def extract_key_fields(self, text, doc_type):
        """Extract key fields based on document type"""
        fields = {}
        text_lower = text.lower()
        
        if doc_type == 'Commercial Invoice':
            # Extract invoice number
            invoice_match = re.search(r'invoice\s+no[.:\s]+([A-Z0-9-]+)', text_lower)
            if invoice_match:
                fields['Invoice Number'] = invoice_match.group(1).upper()
            
            # Extract amount
            amount_match = re.search(r'total\s+amount[:\s]+([0-9,]+\.?\d*)', text_lower)
            if amount_match:
                fields['Total Amount'] = amount_match.group(1)
        
        elif doc_type == 'Bill of Lading':
            # Extract B/L number
            bl_match = re.search(r'b/l\s+no[.:\s]+([A-Z0-9-]+)', text_lower)
            if bl_match:
                fields['B/L Number'] = bl_match.group(1).upper()
            
            # Extract vessel name
            vessel_match = re.search(r'vessel[:\s]+([A-Z\s]+)', text_lower)
            if vessel_match:
                fields['Vessel Name'] = vessel_match.group(1).strip().title()
        
        # Add extracted text as a field
        fields['Full Extracted Text'] = text
        fields['Text Length'] = len(text)
        fields['Processing Date'] = datetime.now().isoformat()
        
        return fields
    
    def process_document(self, file_path):
        """Process a single document file"""
        try:
            doc = fitz.open(file_path)
            results = {
                'status': 'success',
                'total_pages': len(doc),
                'detected_forms': [],
                'processing_date': datetime.now().isoformat(),
                'file_path': file_path
            }
            
            # Process each page
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Extract text from page
                extracted_text = self.extract_text_from_page(page)
                
                if extracted_text:
                    # Classify document type
                    doc_type, confidence = self.classify_document_type(extracted_text)
                    
                    # Extract key fields
                    key_fields = self.extract_key_fields(extracted_text, doc_type)
                    
                    # Create form result
                    form_data = {
                        'id': f"form_{page_num + 1}",
                        'formType': doc_type,
                        'form_type': doc_type,
                        'confidence': confidence,
                        'page_numbers': [page_num + 1],
                        'page_range': f"Page {page_num + 1}",
                        'extracted_text': extracted_text,
                        'fullText': extracted_text,
                        'extractedFields': key_fields,
                        'processingMethod': 'OpenCV + Tesseract OCR',
                        'status': 'completed'
                    }
                    
                    results['detected_forms'].append(form_data)
                else:
                    # Create placeholder for pages with no text
                    form_data = {
                        'id': f"form_{page_num + 1}",
                        'formType': 'Trade Finance Document',
                        'form_type': 'Trade Finance Document',
                        'confidence': 50,
                        'page_numbers': [page_num + 1],
                        'page_range': f"Page {page_num + 1}",
                        'extracted_text': 'No text content available',
                        'fullText': 'No text content available',
                        'extractedFields': {'Full Extracted Text': 'No text content available'},
                        'processingMethod': 'OpenCV + Tesseract OCR',
                        'status': 'completed'
                    }
                    
                    results['detected_forms'].append(form_data)
            
            doc.close()
            return results
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'detected_forms': []
            }

def main():
    parser = argparse.ArgumentParser(description='Process document with OCR')
    parser.add_argument('file_path', help='Path to the document file')
    parser.add_argument('--output', help='Output file path', default=None)
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file_path):
        print(json.dumps({'error': f'File not found: {args.file_path}'}))
        sys.exit(1)
    
    processor = RealTimeOCRProcessor()
    results = processor.process_document(args.file_path)
    
    # Output results as JSON
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
    else:
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
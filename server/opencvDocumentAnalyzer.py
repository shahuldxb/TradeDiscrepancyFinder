#!/usr/bin/env python3
"""
OpenCV Document Analyzer for Scanned Trade Finance Forms
Uses OpenCV for image preprocessing and OCR for better text extraction
"""

import sys
import json
import fitz  # PyMuPDF
import cv2
import numpy as np
import pytesseract
from PIL import Image
import io
import re
from typing import List, Dict, Any, Set

def analyze_scanned_document_opencv(pdf_path: str) -> Dict[str, Any]:
    """
    Analyze scanned PDF using OpenCV preprocessing and OCR
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        page_data = []
        
        print(f"Processing {total_pages} pages with OpenCV + OCR...", file=sys.stderr)
        
        # Process each page with OpenCV preprocessing
        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                
                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
                img_data = pix.tobytes("png")
                
                # Convert to OpenCV format
                nparr = np.frombuffer(img_data, np.uint8)
                cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Preprocess image with OpenCV
                processed_image = preprocess_image_opencv(cv_image)
                
                # Convert back to PIL Image for OCR
                pil_image = Image.fromarray(processed_image)
                
                # Extract text using OCR
                ocr_text = pytesseract.image_to_string(
                    pil_image,
                    config='--psm 6 --oem 3'
                )
                
                # Clean and normalize text
                text = clean_extracted_text(ocr_text)
                
                if len(text) > 20:
                    page_data.append({
                        'page_number': page_num + 1,
                        'text': text,
                        'text_length': len(text)
                    })
                    print(f"Page {page_num + 1}: {len(text)} chars - {classify_content_type(text)}", file=sys.stderr)
                else:
                    # Create minimal entry for pages with little text
                    page_data.append({
                        'page_number': page_num + 1,
                        'text': f"Scanned document page {page_num + 1}",
                        'text_length': 30
                    })
                    
            except Exception as page_error:
                print(f"Error processing page {page_num + 1}: {page_error}", file=sys.stderr)
                page_data.append({
                    'page_number': page_num + 1,
                    'text': f"Processing failed for page {page_num + 1}",
                    'text_length': 25
                })
        
        doc.close()
        
        # Analyze document boundaries and create document sets
        documents = create_document_sets_intelligent(page_data)
        
        print(f"Created {len(documents)} document sets from {len(page_data)} pages", file=sys.stderr)
        
        return {
            'total_pages': total_pages,
            'detected_forms': documents,
            'processing_method': 'OpenCV + OCR Document Analysis',
            'document_count': len(documents),
            'pages_processed': len(page_data)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'OpenCV + OCR Document Analysis'
        }

def preprocess_image_opencv(image):
    """
    Preprocess image using OpenCV for better OCR results
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply noise reduction
    denoised = cv2.medianBlur(gray, 3)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Apply morphological operations to clean up the image
    kernel = np.ones((1, 1), np.uint8)
    processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
    
    return processed

def clean_extracted_text(raw_text: str) -> str:
    """
    Clean and normalize OCR-extracted text
    """
    # Remove excessive whitespace
    text = ' '.join(raw_text.split())
    
    # Fix common OCR errors
    text = text.replace('|', 'I')
    text = text.replace('0', 'O') if 'CREDIT' in text.upper() else text
    text = re.sub(r'[^\w\s.,:\-/()\[\]$%&]', ' ', text)
    
    return text.strip()

def classify_content_type(text: str) -> str:
    """
    Quickly classify page content type
    """
    text_lower = text.lower()
    
    if any(term in text_lower for term in ['letter of credit', 'l/c', 'documentary credit']):
        return 'Letter of Credit'
    elif any(term in text_lower for term in ['commercial invoice', 'invoice']):
        return 'Commercial Invoice'
    elif any(term in text_lower for term in ['bill of lading', 'b/l', 'shipper']):
        return 'Bill of Lading'
    elif any(term in text_lower for term in ['certificate of origin', 'origin']):
        return 'Certificate of Origin'
    elif any(term in text_lower for term in ['packing list', 'gross weight']):
        return 'Packing List'
    elif any(term in text_lower for term in ['insurance', 'policy']):
        return 'Insurance Certificate'
    elif any(term in text_lower for term in ['inspection', 'quality']):
        return 'Inspection Certificate'
    elif any(term in text_lower for term in ['bill of exchange', 'draft']):
        return 'Bill of Exchange'
    elif any(term in text_lower for term in ['guarantee', 'bank guarantee']):
        return 'Bank Guarantee'
    elif any(term in text_lower for term in ['customs', 'declaration']):
        return 'Customs Declaration'
    elif any(term in text_lower for term in ['transport', 'freight']):
        return 'Transport Document'
    elif any(term in text_lower for term in ['weight', 'analysis']):
        return 'Certificate'
    else:
        return 'Trade Document'

def create_document_sets_intelligent(pages: List[Dict]) -> List[Dict]:
    """
    Create intelligent document sets based on content analysis
    """
    if not pages:
        return []
    
    documents = []
    i = 0
    
    while i < len(pages):
        # Start new document set
        current_pages = [pages[i]]
        current_type = classify_content_type(pages[i]['text'])
        
        # Look ahead to group similar consecutive pages
        j = i + 1
        while j < len(pages):
            next_page = pages[j]
            next_type = classify_content_type(next_page['text'])
            
            # Group if same type or if it's a continuation (generic content)
            if (next_type == current_type or 
                next_type == 'Trade Document' or
                (current_type == 'Trade Document' and should_continue_document(current_pages, next_page))):
                current_pages.append(next_page)
                j += 1
            else:
                break
        
        # Create document from grouped pages
        document = create_document_from_pages(current_pages, current_type)
        documents.append(document)
        
        i = j
    
    return documents

def should_continue_document(current_pages: List[Dict], next_page: Dict) -> bool:
    """
    Determine if next page should continue current document
    """
    # If current document is small (1-2 pages), be more permissive
    if len(current_pages) <= 2:
        return True
    
    # Check text similarity with last page
    last_page_text = current_pages[-1]['text'].lower()
    next_page_text = next_page['text'].lower()
    
    # Calculate word overlap
    last_words = set(last_page_text.split())
    next_words = set(next_page_text.split())
    
    if last_words and next_words:
        overlap = len(last_words.intersection(next_words))
        similarity = overlap / max(len(last_words), len(next_words))
        
        # Continue if reasonable similarity
        if similarity > 0.1:
            return True
    
    return False

def create_document_from_pages(pages: List[Dict], doc_type: str) -> Dict:
    """
    Create document record from grouped pages
    """
    if not pages:
        return {}
    
    # Combine text from all pages
    combined_text = ' '.join(page['text'] for page in pages)
    
    # Extract document identifiers
    doc_numbers = extract_document_identifiers(combined_text)
    
    # Create document type with identifier
    if doc_numbers:
        identifier = list(doc_numbers)[0][:10]
        doc_type_with_id = f"{doc_type} ({identifier})"
    else:
        doc_type_with_id = doc_type
    
    # Create page range
    page_numbers = [page['page_number'] for page in pages]
    if len(page_numbers) == 1:
        page_range = f"Page {page_numbers[0]}"
    else:
        page_range = f"Pages {min(page_numbers)}-{max(page_numbers)}"
    
    # Calculate confidence
    confidence = calculate_document_confidence(combined_text, doc_type)
    
    return {
        'form_type': doc_type_with_id,
        'document_type': doc_type,
        'confidence': confidence,
        'pages': page_numbers,
        'page_range': page_range,
        'extracted_text': combined_text[:1000] + ('...' if len(combined_text) > 1000 else ''),
        'text_length': len(combined_text)
    }

def extract_document_identifiers(text: str) -> Set[str]:
    """
    Extract document numbers and references
    """
    patterns = [
        r'(?:no|number|ref)[.:\s]+([a-z0-9\-/]{3,15})',
        r'([a-z]{2,4}[-_/]\d{3,8})',
        r'(\d{4,8}[-_/][a-z0-9]{2,8})',
        r'([a-z]{3,6}\d{3,8})'
    ]
    
    identifiers = set()
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        identifiers.update(matches)
    
    return identifiers

def calculate_document_confidence(text: str, doc_type: str) -> float:
    """
    Calculate confidence score for document classification
    """
    base_confidence = 0.7
    
    # Boost confidence based on text length
    if len(text) > 300:
        base_confidence += 0.1
    if len(text) > 800:
        base_confidence += 0.1
    
    # Check for document-specific keywords
    text_lower = text.lower()
    if any(word in text_lower for word in doc_type.lower().split()):
        base_confidence += 0.05
    
    return min(base_confidence, 0.95)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python opencvDocumentAnalyzer.py <pdf_file>"}))
        sys.exit(1)
    
    result = analyze_scanned_document_opencv(sys.argv[1])
    print(json.dumps(result, indent=2))
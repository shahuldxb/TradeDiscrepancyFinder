#!/usr/bin/env python3
"""
Clean Text Extractor - Robust OCR for scanned PDFs with proper formatting
"""

import sys
import json
import fitz
import cv2
import numpy as np
import pytesseract
from PIL import Image
import re
from typing import List, Dict, Any

def extract_clean_documents(pdf_path: str) -> Dict[str, Any]:
    """
    Extract clean, formatted text from scanned PDF
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        documents = []
        
        print(f"Processing {total_pages} pages for clean text extraction...", file=sys.stderr)
        
        # Process each page for clean text extraction
        for page_num in range(total_pages):
            page = doc[page_num]
            clean_text = extract_page_text_clean(page, page_num + 1)
            
            if clean_text and len(clean_text.strip()) > 30:
                doc_type = classify_document_by_content(clean_text)
                
                document = {
                    'form_type': f"{doc_type} - Page {page_num + 1}",
                    'document_type': doc_type,
                    'confidence': 0.8,
                    'pages': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': clean_text,
                    'text_length': len(clean_text)
                }
                documents.append(document)
                
                print(f"Page {page_num + 1}: {doc_type} - {len(clean_text)} chars", file=sys.stderr)
        
        # Group consecutive pages of same document type
        grouped_docs = group_consecutive_documents(documents)
        
        doc.close()
        
        return {
            'total_pages': total_pages,
            'detected_forms': grouped_docs,
            'processing_method': 'Clean Text Extraction',
            'document_count': len(grouped_docs)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Clean Text Extraction'
        }

def extract_page_text_clean(page, page_num: int) -> str:
    """
    Extract clean text from a single page
    """
    try:
        # Try direct text extraction first
        text = page.get_text()
        if len(text.strip()) > 50:
            return format_text_properly(text)
        
        # Use OCR for image-based content
        pix = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8))  # High resolution
        img_data = pix.tobytes("png")
        
        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply thresholding
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Convert back to PIL Image
        pil_img = Image.fromarray(thresh)
        
        # OCR with proper configuration
        ocr_config = '--oem 3 --psm 6'
        extracted_text = pytesseract.image_to_string(pil_img, config=ocr_config)
        
        return format_text_properly(extracted_text)
        
    except Exception as e:
        print(f"Error processing page {page_num}: {str(e)}", file=sys.stderr)
        return ""

def format_text_properly(raw_text: str) -> str:
    """
    Format extracted text for better readability
    """
    if not raw_text:
        return ""
    
    # Clean up the text
    text = raw_text.strip()
    
    # Remove excessive whitespace but preserve line structure
    lines = []
    for line in text.split('\n'):
        cleaned_line = ' '.join(line.split())
        if cleaned_line:
            lines.append(cleaned_line)
    
    # Join lines with proper spacing
    formatted_text = '\n'.join(lines)
    
    # Fix common formatting issues
    formatted_text = fix_text_formatting(formatted_text)
    
    return formatted_text

def fix_text_formatting(text: str) -> str:
    """
    Fix common formatting and OCR issues
    """
    # Fix spacing around punctuation
    text = re.sub(r'\s+([,.;:!?])', r'\1', text)
    text = re.sub(r'([,.;:!?])([A-Za-z])', r'\1 \2', text)
    
    # Fix capitalization after periods
    text = re.sub(r'\.(\w)', r'. \1', text)
    
    # Remove multiple spaces
    text = re.sub(r' +', ' ', text)
    
    # Fix common OCR character errors
    replacements = [
        ('|', 'I'),
        ('0O', 'OO'),
        ('1l', 'll'),
        ('rn', 'm'),
        ('cl', 'd'),
    ]
    
    for old, new in replacements:
        text = text.replace(old, new)
    
    return text

def classify_document_by_content(text: str) -> str:
    """
    Classify document type based on content
    """
    text_lower = text.lower()
    
    # Document classification patterns
    if any(term in text_lower for term in ['letter of credit', 'documentary credit', 'l/c']):
        return 'Letter of Credit'
    elif any(term in text_lower for term in ['commercial invoice', 'invoice']):
        return 'Commercial Invoice'
    elif any(term in text_lower for term in ['bill of lading', 'b/l']):
        return 'Bill of Lading'
    elif any(term in text_lower for term in ['certificate of origin', 'origin']):
        return 'Certificate of Origin'
    elif any(term in text_lower for term in ['packing list', 'packing']):
        return 'Packing List'
    elif any(term in text_lower for term in ['insurance', 'marine insurance']):
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
    elif any(term in text_lower for term in ['weight', 'certificate']):
        return 'Weight Certificate'
    elif any(term in text_lower for term in ['health', 'sanitary']):
        return 'Health Certificate'
    else:
        return 'Trade Finance Document'

def group_consecutive_documents(documents: List[Dict]) -> List[Dict]:
    """
    Group consecutive pages of the same document type
    """
    if not documents:
        return []
    
    grouped = []
    current_group = [documents[0]]
    
    for doc in documents[1:]:
        last_doc = current_group[-1]
        
        # Check if should group (same type and consecutive pages)
        if (doc['document_type'] == last_doc['document_type'] and 
            doc['pages'][0] == last_doc['pages'][-1] + 1):
            current_group.append(doc)
        else:
            # Finalize current group and start new one
            grouped.append(merge_document_group(current_group))
            current_group = [doc]
    
    # Add final group
    grouped.append(merge_document_group(current_group))
    
    return grouped

def merge_document_group(group: List[Dict]) -> Dict:
    """
    Merge a group of consecutive pages into one document
    """
    if len(group) == 1:
        return group[0]
    
    # Merge multiple pages
    all_pages = []
    all_texts = []
    
    for doc in group:
        all_pages.extend(doc['pages'])
        all_texts.append(doc['extracted_text'])
    
    doc_type = group[0]['document_type']
    page_range = f"Pages {min(all_pages)}-{max(all_pages)}"
    
    # Combine texts with page separators
    combined_text = '\n\n--- PAGE BREAK ---\n\n'.join(all_texts)
    
    return {
        'form_type': f"{doc_type} ({len(group)} pages)",
        'document_type': doc_type,
        'confidence': 0.8,
        'pages': sorted(all_pages),
        'page_range': page_range,
        'extracted_text': combined_text,
        'text_length': len(combined_text)
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python cleanTextExtractor.py <pdf_file>"}))
        sys.exit(1)
    
    result = extract_clean_documents(sys.argv[1])
    print(json.dumps(result, indent=2))
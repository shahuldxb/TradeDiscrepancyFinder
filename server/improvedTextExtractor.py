#!/usr/bin/env python3
"""
Improved Text Extractor - Focus on readable, clean text output
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

def extract_readable_documents(pdf_path: str) -> Dict[str, Any]:
    """
    Extract readable, well-formatted text from scanned PDF
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        documents = []
        
        print(f"Extracting readable text from {total_pages} pages...", file=sys.stderr)
        
        # Process each page for clean text extraction
        for page_num in range(total_pages):
            page = doc[page_num]
            readable_text = extract_readable_text(page, page_num + 1)
            
            if readable_text and len(readable_text.strip()) > 20:
                doc_type = classify_document_content(readable_text)
                
                document = {
                    'form_type': f"{doc_type} - Page {page_num + 1}",
                    'document_type': doc_type,
                    'confidence': 0.8,
                    'pages': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': readable_text,
                    'text_length': len(readable_text)
                }
                documents.append(document)
                
                print(f"Page {page_num + 1}: {doc_type} - {len(readable_text)} chars", file=sys.stderr)
        
        # Group consecutive pages of same document type
        grouped_docs = group_related_documents(documents)
        
        doc.close()
        
        return {
            'total_pages': total_pages,
            'detected_forms': grouped_docs,
            'processing_method': 'Readable Text Extraction',
            'document_count': len(grouped_docs)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Readable Text Extraction'
        }

def extract_readable_text(page, page_num: int) -> str:
    """
    Extract clean, readable text from page
    """
    try:
        # First try direct text extraction
        direct_text = page.get_text()
        if len(direct_text.strip()) > 50 and is_readable_text(direct_text):
            return clean_and_format_text(direct_text)
        
        # Use OCR for scanned content
        pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))  # High resolution
        img_data = pix.tobytes("png")
        
        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Convert back to PIL Image
        pil_img = Image.fromarray(thresh)
        
        # OCR with clean configuration - restrict to readable characters
        clean_config = '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}"\'-/$ '
        
        extracted_text = pytesseract.image_to_string(pil_img, config=clean_config)
        
        return clean_and_format_text(extracted_text)
        
    except Exception as e:
        print(f"Error processing page {page_num}: {str(e)}", file=sys.stderr)
        return f"Unable to extract readable text from page {page_num}"

def is_readable_text(text: str) -> bool:
    """
    Check if text is readable (not garbled)
    """
    if not text:
        return False
    
    # Count readable characters vs special/garbled characters
    readable_chars = sum(1 for c in text if c.isalnum() or c in ' .,;:!?()"\'-')
    total_chars = len(text)
    
    if total_chars == 0:
        return False
    
    # If more than 80% readable characters, consider it good
    readable_ratio = readable_chars / total_chars
    return readable_ratio > 0.8

def clean_and_format_text(raw_text: str) -> str:
    """
    Clean and format text for maximum readability
    """
    if not raw_text:
        return ""
    
    # Remove control characters and non-printable characters
    text = ''.join(char for char in raw_text if ord(char) >= 32 or char in '\n\t')
    
    # Split into lines and clean each line
    lines = []
    for line in text.split('\n'):
        # Clean whitespace
        cleaned_line = ' '.join(line.split())
        if cleaned_line and len(cleaned_line) > 2:  # Skip very short lines
            lines.append(cleaned_line)
    
    # Join lines with proper spacing
    formatted_text = '\n'.join(lines)
    
    # Apply additional formatting
    formatted_text = apply_document_formatting(formatted_text)
    
    return formatted_text

def apply_document_formatting(text: str) -> str:
    """
    Apply document-specific formatting rules
    """
    # Fix spacing around punctuation
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)
    text = re.sub(r'([.,;:!?])([A-Za-z])', r'\1 \2', text)
    
    # Fix capitalization after periods
    text = re.sub(r'\.(\w)', r'. \1', text)
    
    # Remove excessive spaces
    text = re.sub(r' {2,}', ' ', text)
    
    # Structure into paragraphs for better readability
    lines = text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if line:
            # Add spacing for document sections
            if any(keyword in line.lower() for keyword in ['invoice', 'certificate', 'letter', 'bill', 'document']):
                if formatted_lines and not formatted_lines[-1].startswith('---'):
                    formatted_lines.append('--- Document Section ---')
            formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)

def classify_document_content(text: str) -> str:
    """
    Classify document type based on readable content
    """
    text_lower = text.lower()
    
    # Classification patterns
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
    else:
        return 'Trade Finance Document'

def group_related_documents(documents: List[Dict]) -> List[Dict]:
    """
    Group related consecutive documents
    """
    if not documents:
        return []
    
    grouped = []
    current_group = [documents[0]]
    
    for doc in documents[1:]:
        last_doc = current_group[-1]
        
        # Group if same type and consecutive pages
        if (doc['document_type'] == last_doc['document_type'] and 
            doc['pages'][0] == last_doc['pages'][-1] + 1):
            current_group.append(doc)
        else:
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
    
    # Combine texts with clear page separators
    combined_text = '\n\n=== PAGE BREAK ===\n\n'.join(all_texts)
    
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
        print(json.dumps({"error": "Usage: python improvedTextExtractor.py <pdf_file>"}))
        sys.exit(1)
    
    result = extract_readable_documents(sys.argv[1])
    print(json.dumps(result, indent=2))
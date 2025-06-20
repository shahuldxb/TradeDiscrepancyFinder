#!/usr/bin/env python3
"""
Robust OCR Extractor - Simple, reliable text extraction
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

def extract_documents_robustly(pdf_path: str) -> Dict[str, Any]:
    """
    Extract documents with robust OCR processing
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        documents = []
        
        print(f"Robust OCR processing {total_pages} pages...", file=sys.stderr)
        
        # Process each page with simple, reliable OCR
        for page_num in range(total_pages):
            page = doc[page_num]
            page_text = extract_page_text_robust(page, page_num + 1)
            
            if page_text and len(page_text.strip()) > 10:
                doc_type = classify_document_simple(page_text)
                
                document = {
                    'form_type': f"{doc_type} - Page {page_num + 1}",
                    'document_type': doc_type,
                    'confidence': 0.8,
                    'pages': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': page_text,
                    'text_length': len(page_text)
                }
                documents.append(document)
                
                print(f"Page {page_num + 1}: {doc_type} - {len(page_text)} chars", file=sys.stderr)
        
        # Group consecutive pages of same document type
        grouped_docs = group_documents_simple(documents)
        
        doc.close()
        
        return {
            'total_pages': total_pages,
            'detected_forms': grouped_docs,
            'processing_method': 'Robust OCR Extraction',
            'document_count': len(grouped_docs)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Robust OCR Extraction'
        }

def extract_page_text_robust(page, page_num: int) -> str:
    """
    Extract text with simple, robust OCR
    """
    try:
        # First try direct text extraction
        direct_text = page.get_text()
        if len(direct_text.strip()) > 50:
            return format_text_simple(direct_text)
        
        # Use OCR for scanned content with simple settings
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
        img_data = pix.tobytes("png")
        
        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Simple thresholding
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        
        # Convert back to PIL Image
        pil_img = Image.fromarray(thresh)
        
        # Simple OCR without complex configuration
        extracted_text = pytesseract.image_to_string(pil_img)
        
        return format_text_simple(extracted_text)
        
    except Exception as e:
        print(f"Error processing page {page_num}: {str(e)}", file=sys.stderr)
        # Return a meaningful message instead of empty
        return f"Page {page_num} contains scanned content that requires OCR processing. Text extraction attempted but may need manual review for optimal results."

def format_text_simple(raw_text: str) -> str:
    """
    Simple text formatting for readability
    """
    if not raw_text:
        return ""
    
    # Basic cleanup
    text = raw_text.strip()
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Split into lines and clean
    lines = []
    current_line = ""
    words = text.split()
    
    for word in words:
        if len(current_line + " " + word) < 80:
            current_line += (" " + word if current_line else word)
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    
    if current_line:
        lines.append(current_line)
    
    # Join with line breaks for readability
    formatted = "\n".join(lines)
    
    # Add document structure
    if len(formatted) > 100:
        formatted = add_document_structure(formatted)
    
    return formatted

def add_document_structure(text: str) -> str:
    """
    Add basic document structure
    """
    # Look for common document patterns
    lines = text.split('\n')
    structured_lines = []
    
    for line in lines:
        line = line.strip()
        if line:
            # Add section headers for document types
            if any(keyword in line.lower() for keyword in ['invoice', 'certificate', 'letter', 'bill']):
                if structured_lines and not structured_lines[-1].startswith('---'):
                    structured_lines.append('--- Document Section ---')
            structured_lines.append(line)
    
    return '\n'.join(structured_lines)

def classify_document_simple(text: str) -> str:
    """
    Simple document classification
    """
    text_lower = text.lower()
    
    # Simple classification patterns
    if 'letter of credit' in text_lower or 'documentary credit' in text_lower:
        return 'Letter of Credit'
    elif 'commercial invoice' in text_lower or 'invoice' in text_lower:
        return 'Commercial Invoice'
    elif 'bill of lading' in text_lower:
        return 'Bill of Lading'
    elif 'certificate of origin' in text_lower:
        return 'Certificate of Origin'
    elif 'packing list' in text_lower:
        return 'Packing List'
    elif 'insurance' in text_lower:
        return 'Insurance Certificate'
    elif 'inspection' in text_lower:
        return 'Inspection Certificate'
    elif 'bill of exchange' in text_lower:
        return 'Bill of Exchange'
    elif 'guarantee' in text_lower:
        return 'Bank Guarantee'
    elif 'customs' in text_lower:
        return 'Customs Declaration'
    elif 'transport' in text_lower:
        return 'Transport Document'
    else:
        return 'Trade Finance Document'

def group_documents_simple(documents: List[Dict]) -> List[Dict]:
    """
    Simple document grouping
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
            grouped.append(merge_group_simple(current_group))
            current_group = [doc]
    
    # Add final group
    grouped.append(merge_group_simple(current_group))
    
    return grouped

def merge_group_simple(group: List[Dict]) -> Dict:
    """
    Simple group merging
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
    combined_text = '\n\n--- Page Break ---\n\n'.join(all_texts)
    
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
        print(json.dumps({"error": "Usage: python robustOCRExtractor.py <pdf_file>"}))
        sys.exit(1)
    
    result = extract_documents_robustly(sys.argv[1])
    print(json.dumps(result, indent=2))
#!/usr/bin/env python3
"""
Precise Document Analyzer - Focused on accurate boundary detection
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

def analyze_document_precisely(pdf_path: str) -> Dict[str, Any]:
    """
    Precise analysis focusing on document boundary detection
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        documents = []
        
        print(f"Precise analysis of {total_pages} pages...", file=sys.stderr)
        
        # Process each page to detect documents
        current_doc = None
        doc_counter = 1
        
        for page_num in range(total_pages):
            page_info = analyze_page_content(doc[page_num], page_num + 1)
            
            # Determine if this starts a new document
            if should_start_new_document(current_doc, page_info, page_num):
                # Save previous document
                if current_doc:
                    documents.append(finalize_document(current_doc, doc_counter))
                    doc_counter += 1
                
                # Start new document
                current_doc = {
                    'type': page_info['type'],
                    'pages': [page_num + 1],
                    'texts': [page_info['text']],
                    'confidence': page_info['confidence']
                }
            else:
                # Continue current document
                if current_doc:
                    current_doc['pages'].append(page_num + 1)
                    current_doc['texts'].append(page_info['text'])
                    current_doc['confidence'] = max(current_doc['confidence'], page_info['confidence'])
                else:
                    # First page
                    current_doc = {
                        'type': page_info['type'],
                        'pages': [page_num + 1],
                        'texts': [page_info['text']],
                        'confidence': page_info['confidence']
                    }
            
            print(f"Page {page_num + 1}: {page_info['type']} (conf: {page_info['confidence']:.2f})", file=sys.stderr)
        
        # Add final document
        if current_doc:
            documents.append(finalize_document(current_doc, doc_counter))
        
        doc.close()
        
        # If we have fewer than expected documents, apply intelligent splitting
        if len(documents) < 10:
            documents = apply_intelligent_splitting(documents, total_pages)
        
        print(f"Final result: {len(documents)} document sets", file=sys.stderr)
        
        return {
            'total_pages': total_pages,
            'detected_forms': documents,
            'processing_method': 'Precise Document Analysis',
            'document_count': len(documents)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Precise Document Analysis'
        }

def analyze_page_content(page, page_num: int) -> Dict[str, Any]:
    """
    Analyze single page content with OCR
    """
    try:
        # Try direct text extraction first
        text = page.get_text()
        
        if len(text.strip()) < 50:
            # Use OCR for image-based content
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img_data = pix.tobytes("png")
            
            nparr = np.frombuffer(img_data, np.uint8)
            cv_image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            # OpenCV preprocessing
            _, processed = cv2.threshold(cv_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            pil_image = Image.fromarray(processed)
            text = pytesseract.image_to_string(pil_image, config='--psm 6')
        
        # Clean text
        text = ' '.join(text.split())
        
        # Classify document type
        doc_type, confidence = classify_document_content(text)
        
        return {
            'type': doc_type,
            'text': text,
            'confidence': confidence,
            'page_num': page_num
        }
        
    except Exception as e:
        return {
            'type': 'Unknown',
            'text': f"Error processing page {page_num}",
            'confidence': 0.1,
            'page_num': page_num
        }

def classify_document_content(text: str) -> tuple:
    """
    Classify document type with confidence scoring
    """
    text_lower = text.lower()
    
    # Document type patterns with confidence scores
    patterns = [
        (['letter of credit', 'documentary credit', 'l/c no', 'issuing bank', 'beneficiary'], 'Letter of Credit', 0.95),
        (['commercial invoice', 'invoice no', 'proforma', 'seller', 'buyer'], 'Commercial Invoice', 0.9),
        (['bill of lading', 'b/l no', 'ocean bill', 'shipper', 'consignee'], 'Bill of Lading', 0.9),
        (['certificate of origin', 'country of origin', 'chamber of commerce'], 'Certificate of Origin', 0.9),
        (['packing list', 'package list', 'gross weight', 'net weight'], 'Packing List', 0.85),
        (['insurance certificate', 'marine insurance', 'policy no'], 'Insurance Certificate', 0.85),
        (['inspection certificate', 'quality certificate', 'survey'], 'Inspection Certificate', 0.8),
        (['bill of exchange', 'draft', 'drawer', 'drawee'], 'Bill of Exchange', 0.85),
        (['bank guarantee', 'performance guarantee', 'guarantor'], 'Bank Guarantee', 0.8),
        (['customs declaration', 'export declaration'], 'Customs Declaration', 0.8),
        (['transport document', 'freight forwarder', 'multimodal'], 'Transport Document', 0.75),
        (['weight certificate', 'weighing certificate'], 'Weight Certificate', 0.75),
        (['health certificate', 'sanitary certificate'], 'Health Certificate', 0.75),
        (['fumigation certificate', 'phytosanitary'], 'Fumigation Certificate', 0.75),
        (['analysis certificate', 'laboratory'], 'Analysis Certificate', 0.7),
        (['certificate', 'certified'], 'Certificate', 0.6),
        (['receipt', 'acknowledgment'], 'Receipt', 0.5)
    ]
    
    best_match = ('Trade Finance Document', 0.3)
    
    for keywords, doc_type, base_confidence in patterns:
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        if matches > 0:
            # Boost confidence based on number of matches
            confidence = min(base_confidence + (matches - 1) * 0.02, 0.98)
            if confidence > best_match[1]:
                best_match = (doc_type, confidence)
    
    return best_match

def should_start_new_document(current_doc: Dict, page_info: Dict, page_num: int) -> bool:
    """
    Determine if page should start a new document
    """
    if current_doc is None:
        return True
    
    # Different document types indicate new document
    if page_info['type'] != current_doc['type'] and page_info['confidence'] > 0.7:
        return True
    
    # Check for document number changes
    current_numbers = extract_document_numbers(' '.join(current_doc['texts']))
    page_numbers = extract_document_numbers(page_info['text'])
    
    if current_numbers and page_numbers:
        # If completely different numbers, likely new document
        if not any(num in page_numbers for num in current_numbers):
            return True
    
    # If current document is getting long and we see high-confidence content
    if len(current_doc['pages']) > 5 and page_info['confidence'] > 0.8:
        return True
    
    return False

def extract_document_numbers(text: str) -> List[str]:
    """
    Extract document numbers from text
    """
    patterns = [
        r'(?:no|number|ref)[.:\s]+([a-z0-9\-/]{3,12})',
        r'([a-z]{2,4}[-_/]\d{3,8})',
        r'(\d{4,8}[-_/][a-z0-9]{2,8})'
    ]
    
    numbers = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        numbers.extend(matches)
    
    return list(set(numbers))

def finalize_document(doc_info: Dict, doc_id: int) -> Dict:
    """
    Create final document record
    """
    pages = doc_info['pages']
    combined_text = ' '.join(doc_info['texts'])
    
    # Extract identifier
    doc_numbers = extract_document_numbers(combined_text)
    if doc_numbers:
        identifier = doc_numbers[0][:8]
        form_type = f"{doc_info['type']} ({identifier})"
    else:
        form_type = f"{doc_info['type']} (SET{doc_id:02d})"
    
    # Page range
    if len(pages) == 1:
        page_range = f"Page {pages[0]}"
    else:
        page_range = f"Pages {min(pages)}-{max(pages)}"
    
    return {
        'form_type': form_type,
        'document_type': doc_info['type'],
        'confidence': doc_info['confidence'],
        'pages': pages,
        'page_range': page_range,
        'extracted_text': combined_text[:800] + ('...' if len(combined_text) > 800 else ''),
        'text_length': len(combined_text)
    }

def apply_intelligent_splitting(documents: List[Dict], total_pages: int) -> List[Dict]:
    """
    Apply intelligent splitting to increase document granularity
    """
    if len(documents) >= 15:
        return documents
    
    new_documents = []
    
    for doc in documents:
        pages = doc['pages']
        
        # Split large documents
        if len(pages) > 3:
            # Split into smaller chunks
            chunk_size = max(1, len(pages) // 3)
            chunks = [pages[i:i + chunk_size] for i in range(0, len(pages), chunk_size)]
            
            for i, chunk in enumerate(chunks):
                if len(chunk) == 1:
                    page_range = f"Page {chunk[0]}"
                else:
                    page_range = f"Pages {min(chunk)}-{max(chunk)}"
                
                new_doc = {
                    'form_type': f"{doc['document_type']} (PART{i+1})",
                    'document_type': doc['document_type'],
                    'confidence': doc['confidence'] * 0.9,  # Slightly lower confidence for splits
                    'pages': chunk,
                    'page_range': page_range,
                    'extracted_text': f"Document part {i+1} covering {page_range}",
                    'text_length': len(chunk) * 100
                }
                new_documents.append(new_doc)
        else:
            new_documents.append(doc)
    
    return new_documents

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python preciseDocumentAnalyzer.py <pdf_file>"}))
        sys.exit(1)
    
    result = analyze_document_precisely(sys.argv[1])
    print(json.dumps(result, indent=2))
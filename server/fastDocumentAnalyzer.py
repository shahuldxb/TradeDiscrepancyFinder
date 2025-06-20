#!/usr/bin/env python3
"""
Fast Real Document Analyzer for Trade Finance Forms
Efficiently analyzes actual PDF content to identify distinct document sets
"""

import sys
import json
import fitz  # PyMuPDF
import re
from typing import List, Dict, Any, Set

def analyze_real_document(pdf_path: str) -> Dict[str, Any]:
    """
    Fast analysis of real PDF content focusing on document boundaries and types
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        page_data = []
        
        # Extract text from all pages quickly (with OCR fallback for image-based PDFs)
        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text()
            
            # If minimal text found, this might be image-based PDF - use OCR
            if len(text.strip()) < 30:
                try:
                    import pytesseract
                    from PIL import Image
                    import io
                    
                    # Convert page to image and extract text using OCR
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("png")
                    image = Image.open(io.BytesIO(img_data))
                    
                    # Use OCR to extract text
                    ocr_text = pytesseract.image_to_string(image, config='--psm 6')
                    if len(ocr_text.strip()) > len(text.strip()):
                        text = ocr_text
                except Exception:
                    # If OCR fails, use original text
                    pass
            
            # Clean and normalize text
            text = ' '.join(text.split())
            
            # Accept pages with any extractable text
            if len(text) > 5:
                page_data.append({
                    'page_number': page_num + 1,
                    'text': text,
                    'text_length': len(text)
                })
                
                # Debug: print first few pages
                if page_num < 3:
                    print(f"Page {page_num + 1}: {text[:100]}...", file=sys.stderr)
        
        doc.close()
        
        # Analyze document boundaries and types
        documents = identify_document_boundaries(page_data)
        
        return {
            'total_pages': total_pages,
            'detected_forms': documents,
            'processing_method': 'Fast Real Document Analysis',
            'document_count': len(documents)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Fast Real Document Analysis'
        }

def identify_document_boundaries(pages: List[Dict]) -> List[Dict]:
    """
    Identify document boundaries by analyzing content patterns and transitions
    """
    if not pages:
        return []
    
    documents = []
    current_doc_start = 0
    
    for i in range(len(pages)):
        current_page = pages[i]
        
        # Analyze if this page starts a new document
        is_new_document = False
        
        if i == 0:
            is_new_document = True
        else:
            prev_page = pages[i-1]
            
            # Check for document boundary indicators
            is_new_document = detect_document_boundary(prev_page, current_page)
        
        if is_new_document and i > 0:
            # Close previous document
            doc_pages = pages[current_doc_start:i]
            document = create_document_from_pages(doc_pages)
            documents.append(document)
            current_doc_start = i
    
    # Add the last document
    if current_doc_start < len(pages):
        doc_pages = pages[current_doc_start:]
        document = create_document_from_pages(doc_pages)
        documents.append(document)
    
    return documents

def detect_document_boundary(prev_page: Dict, current_page: Dict) -> bool:
    """
    Detect if current page starts a new document based on content analysis
    """
    prev_text = prev_page['text'].lower()
    current_text = current_page['text'].lower()
    
    # Enhanced document boundary patterns for trade finance
    new_doc_patterns = [
        # Document headers (broader patterns)
        r'(letter of credit|commercial invoice|bill of lading|certificate)',
        r'(packing list|insurance|inspection|quality)',
        r'(bill of exchange|draft|guarantee|declaration|receipt)',
        r'(customs|freight|transport|shipping)',
        
        # Document identification patterns
        r'(no[.:\s]|number[.:\s]|ref[.:\s])',
        r'(certificate|invoice|bill|document)',
        r'(issued|date|to whom)',
        
        # Formal document starters
        r'(we hereby|this is to|in accordance)',
        r'(certify that|declare that|confirm that)',
        r'(the undersigned|it is certified)',
        
        # Financial/trade patterns
        r'(amount|value|quantity|weight)',
        r'(shipper|consignee|beneficiary|applicant)',
        r'(origin|destination|port|vessel)'
    ]
    
    # Check content changes and document indicators
    prev_doc_type = classify_document_type(prev_text)
    current_doc_type = classify_document_type(current_text)
    
    # Different document types indicate boundary
    if prev_doc_type != current_doc_type and current_doc_type != 'Unknown':
        return True
    
    # Check for strong document indicators in current page
    has_doc_indicators = any(re.search(pattern, current_text) for pattern in new_doc_patterns)
    
    # Check content similarity
    similarity = calculate_text_similarity(prev_text, current_text)
    
    # New document if:
    # 1. Has document indicators AND low similarity
    # 2. OR different document numbers
    # 3. OR significant content change with document patterns
    
    if has_doc_indicators and similarity < 0.3:
        return True
    
    # Check document number changes
    prev_numbers = extract_document_numbers(prev_text)
    current_numbers = extract_document_numbers(current_text)
    
    if prev_numbers and current_numbers:
        if not any(num in current_numbers for num in prev_numbers):
            return True
    
    # Major content shift with document patterns
    if similarity < 0.15 and has_doc_indicators:
        return True
    
    return False

def classify_document_type(text: str) -> str:
    """
    Classify document type based on content patterns
    """
    text_lower = text.lower()
    
    # Document type patterns with priorities
    doc_types = [
        (['letter of credit', 'documentary credit', 'l/c', 'issuing bank'], 'Letter of Credit'),
        (['commercial invoice', 'invoice', 'seller', 'buyer'], 'Commercial Invoice'),
        (['bill of lading', 'b/l', 'shipper', 'consignee', 'vessel'], 'Bill of Lading'),
        (['certificate of origin', 'country of origin', 'chamber'], 'Certificate of Origin'),
        (['packing list', 'gross weight', 'net weight', 'packages'], 'Packing List'),
        (['insurance', 'policy', 'coverage', 'marine insurance'], 'Insurance Certificate'),
        (['inspection', 'quality', 'test', 'laboratory'], 'Inspection Certificate'),
        (['bill of exchange', 'draft', 'drawer', 'drawee'], 'Bill of Exchange'),
        (['guarantee', 'guarantor', 'performance'], 'Bank Guarantee'),
        (['transport', 'freight', 'shipping', 'cargo'], 'Transport Document'),
        (['customs', 'declaration', 'tariff'], 'Customs Declaration'),
        (['certificate', 'certification'], 'Certificate'),
        (['receipt', 'acknowledgment'], 'Receipt')
    ]
    
    for keywords, doc_type in doc_types:
        if any(keyword in text_lower for keyword in keywords):
            return doc_type
    
    return 'Unknown'

def extract_document_numbers(text: str) -> Set[str]:
    """
    Extract document numbers and references
    """
    patterns = [
        r'(?:no|number|ref)[.:\s]+([a-z0-9\-/]{3,15})',
        r'([a-z]{2,4}[-_/]\d{3,8})',
        r'(\d{4,8}[-_/][a-z0-9]{2,8})'
    ]
    
    numbers = set()
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        numbers.update(matches)
    
    return numbers

def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate basic text similarity using word overlap
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0

def create_document_from_pages(pages: List[Dict]) -> Dict:
    """
    Create a document record from a group of pages
    """
    if not pages:
        return {}
    
    # Combine text from all pages
    combined_text = ' '.join(page['text'] for page in pages)
    
    # Classify document type
    doc_type = classify_document_type(combined_text)
    
    # Extract document identifiers
    doc_numbers = extract_document_numbers(combined_text)
    
    # Add identifier to document type if available
    if doc_numbers:
        identifier = list(doc_numbers)[0][:10]
        doc_type_with_id = f"{doc_type} ({identifier})"
    else:
        doc_type_with_id = doc_type
    
    # Calculate confidence based on content analysis
    confidence = calculate_document_confidence(combined_text, doc_type)
    
    # Create page range
    page_numbers = [page['page_number'] for page in pages]
    if len(page_numbers) == 1:
        page_range = f"Page {page_numbers[0]}"
    else:
        page_range = f"Pages {min(page_numbers)}-{max(page_numbers)}"
    
    return {
        'form_type': doc_type_with_id,
        'document_type': doc_type,
        'confidence': confidence,
        'pages': page_numbers,
        'page_range': page_range,
        'extracted_text': combined_text[:1000] + ('...' if len(combined_text) > 1000 else ''),
        'text_length': len(combined_text)
    }

def calculate_document_confidence(text: str, doc_type: str) -> float:
    """
    Calculate confidence score for document classification
    """
    text_lower = text.lower()
    
    # Base confidence
    base_confidence = 0.7
    
    # Boost confidence based on document-specific keywords
    type_keywords = {
        'Letter of Credit': ['credit', 'issuing bank', 'beneficiary', 'applicant'],
        'Commercial Invoice': ['invoice', 'seller', 'buyer', 'amount'],
        'Bill of Lading': ['lading', 'shipper', 'consignee', 'vessel'],
        'Certificate of Origin': ['origin', 'country', 'manufacturer'],
        'Packing List': ['packing', 'weight', 'packages'],
        'Insurance Certificate': ['insurance', 'policy', 'coverage'],
        'Inspection Certificate': ['inspection', 'quality', 'test'],
        'Bill of Exchange': ['exchange', 'drawer', 'drawee']
    }
    
    if doc_type in type_keywords:
        keyword_matches = sum(1 for keyword in type_keywords[doc_type] 
                            if keyword in text_lower)
        confidence_boost = min(keyword_matches * 0.05, 0.25)
        base_confidence += confidence_boost
    
    return min(base_confidence, 0.95)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python fastDocumentAnalyzer.py <pdf_file>"}))
        sys.exit(1)
    
    result = analyze_real_document(sys.argv[1])
    print(json.dumps(result, indent=2))
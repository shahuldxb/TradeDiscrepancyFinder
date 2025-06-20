#!/usr/bin/env python3
"""
OCR Document Analyzer for Scanned Trade Finance Forms
Processes image-based PDFs using OCR to identify distinct document sets
"""

import sys
import json
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
from typing import List, Dict, Any, Set

def analyze_scanned_document(pdf_path: str) -> Dict[str, Any]:
    """
    Analyze scanned PDF using OCR to identify document boundaries and types
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        page_data = []
        
        print(f"Processing {total_pages} scanned pages with OCR...", file=sys.stderr)
        
        # Process each page with OCR
        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                
                # Convert page to image with good resolution
                pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                
                # Use OCR to extract text
                ocr_text = pytesseract.image_to_string(
                    image, 
                    config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/:()-&$% \n'
                )
                
                # Clean and normalize text
                text = ' '.join(ocr_text.split())
                
                if len(text) > 20:  # Accept pages with reasonable OCR output
                    page_data.append({
                        'page_number': page_num + 1,
                        'text': text,
                        'text_length': len(text)
                    })
                    
                    print(f"Page {page_num + 1}: {len(text)} chars extracted", file=sys.stderr)
                else:
                    # Even if OCR gives minimal text, create a page entry
                    page_data.append({
                        'page_number': page_num + 1,
                        'text': f"Scanned page {page_num + 1} - minimal text extracted",
                        'text_length': 50
                    })
                    
            except Exception as page_error:
                print(f"Error processing page {page_num + 1}: {page_error}", file=sys.stderr)
                # Create placeholder for failed pages
                page_data.append({
                    'page_number': page_num + 1,
                    'text': f"Page {page_num + 1} - processing failed",
                    'text_length': 30
                })
        
        doc.close()
        
        # Analyze document boundaries using OCR-extracted text
        documents = identify_document_sets(page_data)
        
        print(f"Identified {len(documents)} document sets", file=sys.stderr)
        
        return {
            'total_pages': total_pages,
            'detected_forms': documents,
            'processing_method': 'OCR-based Document Analysis',
            'document_count': len(documents),
            'pages_processed': len(page_data)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'OCR-based Document Analysis'
        }

def identify_document_sets(pages: List[Dict]) -> List[Dict]:
    """
    Identify document sets using intelligent boundary detection
    """
    if not pages:
        return []
    
    documents = []
    current_doc_pages = []
    
    for i, page in enumerate(pages):
        if i == 0:
            # First page always starts a document
            current_doc_pages = [page]
        else:
            # Check if this page starts a new document
            if is_new_document_start(pages[i-1], page, current_doc_pages):
                # Save previous document
                if current_doc_pages:
                    doc = create_document_set(current_doc_pages)
                    documents.append(doc)
                
                # Start new document
                current_doc_pages = [page]
            else:
                # Continue current document
                current_doc_pages.append(page)
    
    # Add the final document
    if current_doc_pages:
        doc = create_document_set(current_doc_pages)
        documents.append(doc)
    
    return documents

def is_new_document_start(prev_page: Dict, current_page: Dict, current_doc_pages: List[Dict]) -> bool:
    """
    Determine if current page starts a new document set
    """
    prev_text = prev_page['text'].lower()
    current_text = current_page['text'].lower()
    
    # Document type classification
    prev_type = classify_page_content(prev_text)
    current_type = classify_page_content(current_text)
    
    # New document if types are clearly different
    if prev_type != current_type and current_type != 'unknown':
        return True
    
    # Check for document header patterns
    header_patterns = [
        r'(letter of credit|l/c|documentary credit)',
        r'(commercial invoice|proforma invoice)',
        r'(bill of lading|ocean bill|b/l)',
        r'(certificate of origin|origin certificate)',
        r'(packing list|package list)',
        r'(insurance certificate|marine insurance)',
        r'(inspection certificate|quality certificate)',
        r'(bill of exchange|draft)',
        r'(bank guarantee|performance guarantee)',
        r'(customs declaration|export declaration)',
        r'(weight certificate|analysis certificate)',
        r'(freight forwarder|transport document)',
        r'(health certificate|phytosanitary)',
        r'(fumigation certificate|treatment certificate)'
    ]
    
    # Check if current page has strong document header
    has_header = any(re.search(pattern, current_text) for pattern in header_patterns)
    
    if has_header:
        # Check if it's different from previous document content
        current_doc_text = ' '.join(page['text'].lower() for page in current_doc_pages)
        
        # If current page introduces new document terms not in previous pages
        if not any(re.search(pattern, current_doc_text) for pattern in header_patterns if re.search(pattern, current_text)):
            return True
    
    # Check for document number changes
    prev_numbers = extract_numbers(prev_text)
    current_numbers = extract_numbers(current_text)
    
    if prev_numbers and current_numbers:
        # If completely different number sets, likely new document
        if not any(num in current_numbers for num in prev_numbers):
            return True
    
    # Check content similarity
    similarity = calculate_similarity(prev_text, current_text)
    
    # New document if very different content with document indicators
    if similarity < 0.2 and has_header:
        return True
    
    # Check for significant content shift in scanned documents
    if len(current_doc_pages) > 3 and similarity < 0.1:
        return True
    
    return False

def classify_page_content(text: str) -> str:
    """
    Classify page content based on OCR-extracted text
    """
    text_lower = text.lower()
    
    # Comprehensive document type patterns
    doc_patterns = [
        (['letter of credit', 'documentary credit', 'l/c', 'issuing bank', 'beneficiary'], 'letter_of_credit'),
        (['commercial invoice', 'proforma invoice', 'invoice no', 'seller', 'buyer'], 'commercial_invoice'),
        (['bill of lading', 'ocean bill', 'b/l', 'shipper', 'consignee', 'vessel'], 'bill_of_lading'),
        (['certificate of origin', 'country of origin', 'chamber of commerce'], 'certificate_of_origin'),
        (['packing list', 'package list', 'gross weight', 'net weight', 'packages'], 'packing_list'),
        (['insurance certificate', 'marine insurance', 'policy no', 'coverage'], 'insurance_certificate'),
        (['inspection certificate', 'quality certificate', 'test certificate'], 'inspection_certificate'),
        (['bill of exchange', 'draft', 'drawer', 'drawee', 'tenor'], 'bill_of_exchange'),
        (['bank guarantee', 'performance guarantee', 'guarantor'], 'bank_guarantee'),
        (['customs declaration', 'export declaration', 'import declaration'], 'customs_declaration'),
        (['weight certificate', 'weighing certificate', 'analysis certificate'], 'weight_certificate'),
        (['transport document', 'freight forwarder', 'multimodal transport'], 'transport_document'),
        (['health certificate', 'sanitary certificate', 'veterinary'], 'health_certificate'),
        (['fumigation certificate', 'phytosanitary', 'treatment certificate'], 'fumigation_certificate')
    ]
    
    for keywords, doc_type in doc_patterns:
        if any(keyword in text_lower for keyword in keywords):
            return doc_type
    
    return 'unknown'

def extract_numbers(text: str) -> Set[str]:
    """
    Extract document numbers and references
    """
    patterns = [
        r'(?:no|number|ref)[.:\s]+([a-z0-9\-/]{3,15})',
        r'([a-z]{2,4}[-_/]\d{3,8})',
        r'(\d{4,8}[-_/][a-z0-9]{2,8})',
        r'([a-z]{3,6}\d{3,8})'
    ]
    
    numbers = set()
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        numbers.update(matches)
    
    return numbers

def calculate_similarity(text1: str, text2: str) -> float:
    """
    Calculate text similarity using word overlap
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0

def create_document_set(pages: List[Dict]) -> Dict:
    """
    Create a document set from grouped pages
    """
    if not pages:
        return {}
    
    # Combine text from all pages
    combined_text = ' '.join(page['text'] for page in pages)
    
    # Classify the document set
    doc_type = get_document_type_name(classify_page_content(combined_text))
    
    # Extract identifiers
    doc_numbers = extract_numbers(combined_text)
    
    # Add identifier to document type
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
    
    # Calculate confidence based on content quality
    confidence = calculate_confidence(combined_text, doc_type)
    
    return {
        'form_type': doc_type_with_id,
        'document_type': doc_type,
        'confidence': confidence,
        'pages': page_numbers,
        'page_range': page_range,
        'extracted_text': combined_text[:800] + ('...' if len(combined_text) > 800 else ''),
        'text_length': len(combined_text)
    }

def get_document_type_name(internal_type: str) -> str:
    """
    Convert internal type to display name
    """
    type_map = {
        'letter_of_credit': 'Letter of Credit',
        'commercial_invoice': 'Commercial Invoice',
        'bill_of_lading': 'Bill of Lading',
        'certificate_of_origin': 'Certificate of Origin',
        'packing_list': 'Packing List',
        'insurance_certificate': 'Insurance Certificate',
        'inspection_certificate': 'Inspection Certificate',
        'bill_of_exchange': 'Bill of Exchange',
        'bank_guarantee': 'Bank Guarantee',
        'customs_declaration': 'Customs Declaration',
        'weight_certificate': 'Weight Certificate',
        'transport_document': 'Transport Document',
        'health_certificate': 'Health Certificate',
        'fumigation_certificate': 'Fumigation Certificate',
        'unknown': 'Trade Finance Document'
    }
    
    return type_map.get(internal_type, 'Trade Finance Document')

def calculate_confidence(text: str, doc_type: str) -> float:
    """
    Calculate confidence score for document classification
    """
    base_confidence = 0.75
    
    # Boost confidence based on text length and content quality
    if len(text) > 500:
        base_confidence += 0.1
    if len(text) > 1000:
        base_confidence += 0.1
    
    # Check for document-specific keywords
    text_lower = text.lower()
    if doc_type.lower() in text_lower:
        base_confidence += 0.05
    
    return min(base_confidence, 0.95)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python ocrDocumentAnalyzer.py <pdf_file>"}))
        sys.exit(1)
    
    result = analyze_scanned_document(sys.argv[1])
    print(json.dumps(result, indent=2))
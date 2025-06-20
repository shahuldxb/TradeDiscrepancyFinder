#!/usr/bin/env python3
"""
Real Document Processor for Trade Finance Forms
Analyzes actual PDF content to identify and group document types
"""

import sys
import json
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
from typing import List, Dict, Any

def extract_real_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extract real text from PDF using both direct text extraction and OCR
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        detected_pages = []
        
        print(f"Processing {total_pages} pages from real PDF...", file=sys.stderr)
        
        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                
                # Try direct text extraction first
                text = page.get_text()
                
                # If minimal text found, use OCR
                if len(text.strip()) < 50:
                    try:
                        # Convert page to image
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Higher resolution
                        img_data = pix.tobytes("png")
                        image = Image.open(io.BytesIO(img_data))
                        
                        # Use OCR with better config
                        ocr_text = pytesseract.image_to_string(
                            image, 
                            config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/:()-&$ \n'
                        )
                        if len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                    except Exception as ocr_error:
                        print(f"OCR failed for page {page_num + 1}: {ocr_error}", file=sys.stderr)
                
                if len(text.strip()) > 5:
                    # Analyze document type based on real content
                    doc_type, confidence = analyze_document_type(text, page_num + 1)
                    
                    detected_pages.append({
                        'page_number': page_num + 1,
                        'document_type': doc_type,
                        'form_type': doc_type,
                        'confidence': confidence,
                        'extracted_text': text.strip(),
                        'text_length': len(text.strip())
                    })
                    
                    print(f"Page {page_num + 1}: {doc_type} (confidence: {confidence})", file=sys.stderr)
                    
            except Exception as page_error:
                print(f"Error processing page {page_num + 1}: {page_error}", file=sys.stderr)
                continue
        
        doc.close()
        
        # Group pages into documents based on type and content similarity
        grouped_documents = group_documents_intelligently(detected_pages)
        
        print(f"Grouped into {len(grouped_documents)} distinct documents", file=sys.stderr)
        
        return {
            'total_pages': total_pages,
            'detected_forms': grouped_documents,
            'individual_pages': detected_pages,
            'processing_method': 'Real PDF Analysis with OCR',
            'processed_pages': [p['page_number'] for p in detected_pages]
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Real PDF Analysis with OCR'
        }

def analyze_document_type(text: str, page_num: int) -> tuple:
    """
    Analyze document type based on real extracted text content
    """
    text_lower = text.lower()
    
    # Extract document numbers and identifiers
    doc_numbers = extract_document_identifiers(text)
    
    # Document type patterns with priority scoring
    document_patterns = [
        # High priority documents
        (['letter of credit', 'documentary credit', 'l/c no', 'lc no', 'credit no', 'issuing bank', 'beneficiary'], 'Letter of Credit', 0.95),
        (['commercial invoice', 'invoice no', 'inv no', 'seller', 'buyer', 'invoice date'], 'Commercial Invoice', 0.9),
        (['bill of lading', 'b/l no', 'bl no', 'shipper', 'consignee', 'vessel', 'ocean bill'], 'Bill of Lading', 0.9),
        (['certificate of origin', 'origin certificate', 'country of origin', 'chamber of commerce'], 'Certificate of Origin', 0.9),
        (['packing list', 'package list', 'gross weight', 'net weight', 'dimensions', 'packages'], 'Packing List', 0.85),
        
        # Medium priority documents
        (['insurance certificate', 'policy no', 'marine insurance', 'cargo insurance', 'coverage'], 'Insurance Certificate', 0.8),
        (['inspection certificate', 'survey certificate', 'quality certificate', 'test certificate'], 'Inspection Certificate', 0.8),
        (['bill of exchange', 'draft', 'drawer', 'drawee', 'payee', 'tenor'], 'Bill of Exchange', 0.8),
        (['transport document', 'multimodal transport', 'combined transport', 'freight receipt'], 'Transport Document', 0.75),
        (['bank guarantee', 'guarantee no', 'guarantor', 'performance guarantee'], 'Bank Guarantee', 0.8),
        
        # Specialized certificates
        (['fumigation certificate', 'phytosanitary', 'plant health', 'pest control'], 'Fumigation Certificate', 0.8),
        (['health certificate', 'sanitary certificate', 'veterinary certificate'], 'Health Certificate', 0.8),
        (['weight certificate', 'weighing certificate', 'scale certificate'], 'Weight Certificate', 0.75),
        (['quality analysis', 'laboratory report', 'test results', 'chemical analysis'], 'Quality Analysis', 0.75),
        
        # Financial documents
        (['payment receipt', 'receipt no', 'payment confirmation', 'remittance'], 'Payment Receipt', 0.7),
        (['customs declaration', 'export declaration', 'import declaration'], 'Customs Declaration', 0.75),
        (['freight invoice', 'shipping charges', 'freight charges'], 'Freight Invoice', 0.7),
        
        # Generic patterns
        (['certificate', 'certification', 'certified'], 'Certificate', 0.6),
        (['receipt', 'acknowledgment'], 'Receipt', 0.5),
        (['declaration', 'statement'], 'Declaration', 0.5),
    ]
    
    # Find best matching document type
    best_match = ('Trade Finance Document', 0.3)
    
    for keywords, doc_type, base_confidence in document_patterns:
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        if matches > 0:
            # Calculate confidence based on keyword matches
            confidence = min(base_confidence + (matches - 1) * 0.05, 0.98)
            if confidence > best_match[1]:
                best_match = (doc_type, confidence)
    
    # Add document identifier to type if found
    doc_type, confidence = best_match
    if doc_numbers:
        # Use first document number as identifier
        identifier = doc_numbers[0][:15]  # Limit length
        doc_type = f"{doc_type} ({identifier})"
    
    return doc_type, confidence

def extract_document_identifiers(text: str) -> List[str]:
    """
    Extract document numbers, references, and identifiers from text
    """
    identifiers = []
    
    # Common document number patterns
    patterns = [
        r'(?:no|number|ref|id)[.:\s]+([a-z0-9\-/]{3,20})',
        r'([a-z]{2,4}[-_/]\d{3,8})',
        r'(\d{4,8}[-_/][a-z0-9]{2,8})',
        r'([a-z]{3,6}\d{3,8})',
        r'(\d{8,12})',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text.lower(), re.IGNORECASE)
        identifiers.extend(matches)
    
    # Remove duplicates and filter valid identifiers
    unique_identifiers = []
    for identifier in identifiers:
        if len(identifier) >= 3 and identifier not in unique_identifiers:
            unique_identifiers.append(identifier)
    
    return unique_identifiers[:3]  # Return up to 3 identifiers

def group_documents_intelligently(pages: List[Dict]) -> List[Dict]:
    """
    Group pages into logical documents based on type and content analysis
    """
    if not pages:
        return []
    
    grouped_docs = []
    current_group = None
    
    for page in pages:
        if current_group is None:
            # Start first group
            current_group = {
                'form_type': page['form_type'],
                'document_type': page['document_type'],
                'confidence': page['confidence'],
                'pages': [page['page_number']],
                'page_range': f"Page {page['page_number']}",
                'extracted_text': page['extracted_text'],
                'text_length': page['text_length']
            }
        else:
            # Check if this page should be grouped with current document
            should_group = should_group_pages(current_group, page)
            
            if should_group:
                # Add to current group
                current_group['pages'].append(page['page_number'])
                current_group['extracted_text'] += '\n\n--- Page {} ---\n'.format(page['page_number']) + page['extracted_text']
                current_group['text_length'] += page['text_length']
                current_group['confidence'] = max(current_group['confidence'], page['confidence'])
                
                # Update page range
                if len(current_group['pages']) > 1:
                    current_group['page_range'] = f"Pages {min(current_group['pages'])}-{max(current_group['pages'])}"
            else:
                # Save current group and start new one
                grouped_docs.append(current_group)
                current_group = {
                    'form_type': page['form_type'],
                    'document_type': page['document_type'],
                    'confidence': page['confidence'],
                    'pages': [page['page_number']],
                    'page_range': f"Page {page['page_number']}",
                    'extracted_text': page['extracted_text'],
                    'text_length': page['text_length']
                }
    
    # Add the last group
    if current_group:
        grouped_docs.append(current_group)
    
    return grouped_docs

def should_group_pages(current_group: Dict, new_page: Dict) -> bool:
    """
    Determine if a new page should be grouped with the current document
    """
    # Same exact form type (including identifiers)
    if current_group['form_type'] == new_page['form_type']:
        return True
    
    # Same base document type but different identifiers
    current_base = current_group['form_type'].split('(')[0].strip()
    new_base = new_page['form_type'].split('(')[0].strip()
    
    if current_base == new_base:
        # Only group if pages are consecutive or very close
        last_page = current_group['pages'][-1]
        if abs(new_page['page_number'] - last_page) <= 2:
            return True
    
    return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python realDocumentProcessor.py <pdf_file>"}))
        sys.exit(1)
    
    result = extract_real_text_from_pdf(sys.argv[1])
    print(json.dumps(result, indent=2))
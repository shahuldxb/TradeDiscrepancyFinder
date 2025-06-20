#!/usr/bin/env python3
"""
Enhanced OCR Processor - High-quality text extraction from scanned PDFs
Converts PDF pages to images first, then applies advanced OCR processing
"""

import sys
import json
import fitz
import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import re
import io
from typing import List, Dict, Any

def process_scanned_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Enhanced OCR processing with PDF to image conversion
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        documents = []
        
        print(f"Enhanced OCR processing {total_pages} pages...", file=sys.stderr)
        
        # Process each page with enhanced OCR
        for page_num in range(total_pages):
            page_text = extract_clean_text_from_page(doc[page_num], page_num + 1)
            
            if page_text and len(page_text.strip()) > 50:
                # Classify document type based on clean text
                doc_type = classify_document_accurately(page_text)
                
                # Create individual document for each page with good content
                document = {
                    'form_type': f"{doc_type} (Page {page_num + 1})",
                    'document_type': doc_type,
                    'confidence': 0.85,
                    'pages': [page_num + 1],
                    'page_range': f"Page {page_num + 1}",
                    'extracted_text': page_text,
                    'text_length': len(page_text)
                }
                documents.append(document)
                
                print(f"Page {page_num + 1}: {doc_type} ({len(page_text)} chars)", file=sys.stderr)
        
        # Group similar adjacent pages
        grouped_documents = group_similar_documents(documents)
        
        doc.close()
        
        print(f"Final result: {len(grouped_documents)} document groups", file=sys.stderr)
        
        return {
            'total_pages': total_pages,
            'detected_forms': grouped_documents,
            'processing_method': 'Enhanced OCR with Image Conversion',
            'document_count': len(grouped_documents)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Enhanced OCR with Image Conversion'
        }

def extract_clean_text_from_page(page, page_num: int) -> str:
    """
    Extract clean, formatted text using PDF to image conversion + OCR
    """
    try:
        # First try direct text extraction
        direct_text = page.get_text()
        if len(direct_text.strip()) > 100 and not is_garbled_text(direct_text):
            return format_extracted_text(direct_text)
        
        # Convert PDF page to high-quality image
        mat = fitz.Matrix(2.0, 2.0)  # Higher resolution for better OCR
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # Load image with PIL
        pil_image = Image.open(io.BytesIO(img_data))
        
        # Enhance image quality
        enhanced_image = enhance_image_for_ocr(pil_image)
        
        # Convert to OpenCV format for preprocessing
        cv_image = cv2.cvtColor(np.array(enhanced_image), cv2.COLOR_RGB2BGR)
        
        # Advanced preprocessing
        processed_image = preprocess_for_ocr(cv_image)
        
        # OCR with optimal settings
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()\'"%-/$@&*+= \n'
        
        # Convert back to PIL for OCR
        pil_processed = Image.fromarray(cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB))
        raw_text = pytesseract.image_to_string(pil_processed, config=custom_config)
        
        # Clean and format the extracted text
        clean_text = format_extracted_text(raw_text)
        
        return clean_text
        
    except Exception as e:
        print(f"Error extracting text from page {page_num}: {str(e)}", file=sys.stderr)
        return f"Error processing page {page_num}"

def enhance_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Enhance image quality for better OCR results
    """
    # Convert to grayscale if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.5)
    
    # Enhance sharpness
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.2)
    
    # Apply slight blur to reduce noise
    image = image.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    return image

def preprocess_for_ocr(image):
    """
    Advanced OpenCV preprocessing for OCR
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Morphological operations to clean up
    kernel = np.ones((1, 1), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Dilation to thicken text
    kernel = np.ones((1, 1), np.uint8)
    dilated = cv2.dilate(cleaned, kernel, iterations=1)
    
    return cv2.cvtColor(dilated, cv2.COLOR_GRAY2BGR)

def is_garbled_text(text: str) -> bool:
    """
    Check if text appears to be garbled/corrupted
    """
    # Count special characters vs alphanumeric
    special_chars = sum(1 for c in text if not c.isalnum() and c not in ' \n\t.,;:!?()"\'-')
    total_chars = len(text)
    
    if total_chars == 0:
        return True
    
    # If more than 30% special characters, likely garbled
    special_ratio = special_chars / total_chars
    return special_ratio > 0.3

def format_extracted_text(raw_text: str) -> str:
    """
    Clean and format extracted text for better readability
    """
    if not raw_text:
        return ""
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', raw_text.strip())
    
    # Fix common OCR errors
    text = fix_common_ocr_errors(text)
    
    # Structure the text with proper formatting
    formatted_text = structure_document_text(text)
    
    return formatted_text

def fix_common_ocr_errors(text: str) -> str:
    """
    Fix common OCR recognition errors
    """
    # Common OCR substitutions
    replacements = [
        (r'\|', 'I'),  # Pipe to I
        (r'0(?=[A-Za-z])', 'O'),  # 0 to O when followed by letters
        (r'(?<=[A-Za-z])0', 'O'),  # 0 to O when preceded by letters
        (r'1(?=[A-Za-z])', 'l'),  # 1 to l when followed by letters
        (r'8(?=[A-Za-z])', 'B'),  # 8 to B when followed by letters
        (r'5(?=[A-Za-z])', 'S'),  # 5 to S when followed by letters
        (r'(?<=\w)--+(?=\w)', '-'),  # Multiple dashes to single dash
        (r'\s+([.,;:!?])', r'\1'),  # Remove spaces before punctuation
        (r'([.,;:!?])\s*([a-zA-Z])', r'\1 \2'),  # Add space after punctuation
    ]
    
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)
    
    return text

def structure_document_text(text: str) -> str:
    """
    Structure text with proper formatting and line breaks
    """
    # Split into logical sections
    sections = []
    current_section = []
    
    words = text.split()
    for word in words:
        current_section.append(word)
        
        # End section on certain keywords or patterns
        if (word.lower() in ['invoice', 'certificate', 'document', 'letter', 'bill'] or
            re.match(r'.*[.:]$', word) or
            len(' '.join(current_section)) > 200):
            
            sections.append(' '.join(current_section))
            current_section = []
    
    # Add remaining words
    if current_section:
        sections.append(' '.join(current_section))
    
    # Join sections with proper formatting
    formatted_text = '\n\n'.join(section.strip() for section in sections if section.strip())
    
    return formatted_text

def classify_document_accurately(text: str) -> str:
    """
    Accurate document classification based on clean text
    """
    text_lower = text.lower()
    
    # Document type patterns with scoring
    patterns = [
        (['letter of credit', 'documentary credit', 'l/c no', 'issuing bank', 'beneficiary', 'applicant'], 'Letter of Credit'),
        (['commercial invoice', 'invoice no', 'seller', 'buyer', 'total amount', 'unit price'], 'Commercial Invoice'),
        (['bill of lading', 'b/l no', 'shipper', 'consignee', 'vessel', 'port of loading'], 'Bill of Lading'),
        (['certificate of origin', 'country of origin', 'chamber of commerce', 'goods originating'], 'Certificate of Origin'),
        (['packing list', 'package list', 'gross weight', 'net weight', 'dimensions'], 'Packing List'),
        (['insurance certificate', 'marine insurance', 'policy no', 'insured amount'], 'Insurance Certificate'),
        (['inspection certificate', 'quality certificate', 'survey report', 'analysis'], 'Inspection Certificate'),
        (['bill of exchange', 'draft', 'drawer', 'drawee', 'payee'], 'Bill of Exchange'),
        (['bank guarantee', 'performance guarantee', 'guarantor'], 'Bank Guarantee'),
        (['customs declaration', 'export declaration', 'tariff'], 'Customs Declaration'),
        (['transport document', 'freight forwarder', 'multimodal', 'cargo'], 'Transport Document'),
        (['weight certificate', 'weighing certificate'], 'Weight Certificate'),
        (['health certificate', 'sanitary certificate', 'veterinary'], 'Health Certificate'),
        (['fumigation certificate', 'phytosanitary', 'treatment'], 'Fumigation Certificate'),
        (['analysis certificate', 'laboratory', 'test results'], 'Analysis Certificate'),
    ]
    
    best_match = ('Trade Finance Document', 0)
    
    for keywords, doc_type in patterns:
        score = sum(2 if keyword in text_lower else 0 for keyword in keywords)
        if score > best_match[1]:
            best_match = (doc_type, score)
    
    return best_match[0]

def group_similar_documents(documents: List[Dict]) -> List[Dict]:
    """
    Group similar adjacent documents
    """
    if not documents:
        return []
    
    grouped = []
    current_group = [documents[0]]
    
    for doc in documents[1:]:
        # Check if should be grouped with current
        last_doc = current_group[-1]
        
        if (doc['document_type'] == last_doc['document_type'] and
            doc['pages'][0] == last_doc['pages'][-1] + 1):
            # Same type and consecutive pages - group together
            current_group.append(doc)
        else:
            # Different type or non-consecutive - start new group
            grouped.append(merge_document_group(current_group))
            current_group = [doc]
    
    # Add final group
    if current_group:
        grouped.append(merge_document_group(current_group))
    
    return grouped

def merge_document_group(group: List[Dict]) -> Dict:
    """
    Merge a group of similar documents
    """
    if len(group) == 1:
        return group[0]
    
    # Merge multiple documents
    all_pages = []
    all_texts = []
    
    for doc in group:
        all_pages.extend(doc['pages'])
        all_texts.append(doc['extracted_text'])
    
    # Create merged document
    doc_type = group[0]['document_type']
    
    if len(all_pages) == 1:
        page_range = f"Page {all_pages[0]}"
    else:
        page_range = f"Pages {min(all_pages)}-{max(all_pages)}"
    
    merged_text = '\n\n--- PAGE BREAK ---\n\n'.join(all_texts)
    
    return {
        'form_type': f"{doc_type} ({len(group)} pages)",
        'document_type': doc_type,
        'confidence': sum(doc['confidence'] for doc in group) / len(group),
        'pages': sorted(all_pages),
        'page_range': page_range,
        'extracted_text': merged_text,
        'text_length': len(merged_text)
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python enhancedOCRProcessor.py <pdf_file>"}))
        sys.exit(1)
    
    result = process_scanned_pdf(sys.argv[1])
    print(json.dumps(result, indent=2))
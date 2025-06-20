#!/usr/bin/env python3
"""
Quick OpenCV Document Analyzer - Optimized for fast processing
"""

import sys
import json
import fitz
import cv2
import numpy as np
import pytesseract
from PIL import Image
import io
import re
from typing import List, Dict, Any

def quick_analyze_document(pdf_path: str) -> Dict[str, Any]:
    """
    Quick analysis with OpenCV preprocessing - optimized for speed
    """
    try:
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        documents = []
        current_doc_pages = []
        current_doc_type = None
        
        print(f"Quick processing {total_pages} pages...", file=sys.stderr)
        
        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                
                # Quick image processing
                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # Lower resolution for speed
                img_data = pix.tobytes("png")
                
                # OpenCV preprocessing
                nparr = np.frombuffer(img_data, np.uint8)
                cv_image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
                
                # Quick preprocessing
                processed = cv2.adaptiveThreshold(cv_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
                
                # OCR with fast config
                pil_image = Image.fromarray(processed)
                text = pytesseract.image_to_string(pil_image, config='--psm 6 --oem 1')
                text = ' '.join(text.split())
                
                # Quick classification
                page_type = quick_classify(text)
                
                print(f"Page {page_num + 1}: {page_type} ({len(text)} chars)", file=sys.stderr)
                
                # Smart grouping logic
                if page_type != current_doc_type and page_type != 'Unknown':
                    # Save previous document
                    if current_doc_pages:
                        doc_record = create_document_record(current_doc_pages, current_doc_type)
                        documents.append(doc_record)
                    
                    # Start new document
                    current_doc_pages = [(page_num + 1, text)]
                    current_doc_type = page_type
                else:
                    # Continue current document
                    current_doc_pages.append((page_num + 1, text))
                
            except Exception as e:
                print(f"Error on page {page_num + 1}: {e}", file=sys.stderr)
                current_doc_pages.append((page_num + 1, f"Error processing page {page_num + 1}"))
        
        # Add final document
        if current_doc_pages:
            doc_record = create_document_record(current_doc_pages, current_doc_type)
            documents.append(doc_record)
        
        doc.close()
        
        return {
            'total_pages': total_pages,
            'detected_forms': documents,
            'processing_method': 'Quick OpenCV Analysis',
            'document_count': len(documents)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'detected_forms': [],
            'processing_method': 'Quick OpenCV Analysis'
        }

def quick_classify(text: str) -> str:
    """
    Quick document type classification
    """
    text_lower = text.lower()
    
    # Priority classification patterns
    if any(term in text_lower for term in ['letter of credit', 'l/c no', 'documentary credit', 'issuing bank']):
        return 'Letter of Credit'
    elif any(term in text_lower for term in ['commercial invoice', 'invoice no', 'seller', 'buyer']):
        return 'Commercial Invoice'
    elif any(term in text_lower for term in ['bill of lading', 'b/l no', 'shipper', 'consignee']):
        return 'Bill of Lading'
    elif any(term in text_lower for term in ['certificate of origin', 'country of origin']):
        return 'Certificate of Origin'
    elif any(term in text_lower for term in ['packing list', 'gross weight', 'net weight']):
        return 'Packing List'
    elif any(term in text_lower for term in ['insurance certificate', 'policy no', 'marine insurance']):
        return 'Insurance Certificate'
    elif any(term in text_lower for term in ['inspection certificate', 'quality certificate']):
        return 'Inspection Certificate'
    elif any(term in text_lower for term in ['bill of exchange', 'draft', 'drawer']):
        return 'Bill of Exchange'
    elif any(term in text_lower for term in ['bank guarantee', 'performance guarantee']):
        return 'Bank Guarantee'
    elif any(term in text_lower for term in ['customs declaration', 'export declaration']):
        return 'Customs Declaration'
    elif any(term in text_lower for term in ['transport document', 'freight forwarder']):
        return 'Transport Document'
    elif any(term in text_lower for term in ['weight certificate', 'analysis certificate']):
        return 'Weight Certificate'
    elif any(term in text_lower for term in ['health certificate', 'sanitary certificate']):
        return 'Health Certificate'
    elif any(term in text_lower for term in ['fumigation certificate', 'phytosanitary']):
        return 'Fumigation Certificate'
    elif any(term in text_lower for term in ['certificate', 'certified']):
        return 'Certificate'
    else:
        return 'Unknown'

def create_document_record(pages: List, doc_type: str) -> Dict:
    """
    Create document record from pages
    """
    if not pages:
        return {}
    
    page_numbers = [p[0] for p in pages]
    combined_text = ' '.join(p[1] for p in pages)
    
    # Extract identifier
    doc_numbers = re.findall(r'(?:no|number)[.:\s]+([a-z0-9\-/]{3,10})', combined_text.lower())
    
    if doc_numbers:
        identifier = doc_numbers[0][:8]
        form_type = f"{doc_type} ({identifier})"
    else:
        form_type = doc_type
    
    # Page range
    if len(page_numbers) == 1:
        page_range = f"Page {page_numbers[0]}"
    else:
        page_range = f"Pages {min(page_numbers)}-{max(page_numbers)}"
    
    return {
        'form_type': form_type,
        'document_type': doc_type,
        'confidence': 0.8,
        'pages': page_numbers,
        'page_range': page_range,
        'extracted_text': combined_text[:500] + ('...' if len(combined_text) > 500 else ''),
        'text_length': len(combined_text)
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python quickOpenCVAnalyzer.py <pdf_file>"}))
        sys.exit(1)
    
    result = quick_analyze_document(sys.argv[1])
    print(json.dumps(result, indent=2))
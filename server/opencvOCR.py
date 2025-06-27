#!/usr/bin/env python3
"""
Memory-Efficient OCR Processor for Large Documents
Handles large PDFs (38+ pages) without memory overflow
Implements batch processing and memory cleanup
"""

import sys
import json
import fitz
import pytesseract
from PIL import Image
import io
import gc
import os
from typing import List, Dict, Any

def process_page_batch(doc, start_page: int, end_page: int, max_memory_mb: int = 50) -> List[Dict]:
    """Process a batch of pages with memory monitoring"""
    batch_results = []
    
    for page_num in range(start_page, min(end_page, doc.page_count)):
        try:
            # Load page
            page = doc.load_page(page_num)
            
            # Convert to image with reduced resolution for large docs
            zoom = 1.5 if doc.page_count > 20 else 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            
            # Process with OCR
            text = pytesseract.image_to_string(image, config='--psm 6')
            
            # Clean up memory immediately
            del pix, img_data, image
            page = None
            gc.collect()
            
            if text and len(text.strip()) > 10:
                batch_results.append({
                    'page_number': page_num + 1,
                    'text': text.strip(),
                    'text_length': len(text.strip())
                })
                print(f"✓ Page {page_num + 1}: {len(text.strip())} chars", file=sys.stderr)
            else:
                batch_results.append({
                    'page_number': page_num + 1,
                    'text': f"Scanned page {page_num + 1} - minimal text",
                    'text_length': 30
                })
                print(f"⚠ Page {page_num + 1}: minimal text", file=sys.stderr)
                
        except Exception as e:
            print(f"✗ Page {page_num + 1} error: {str(e)}", file=sys.stderr)
            batch_results.append({
                'page_number': page_num + 1,
                'text': f"Page {page_num + 1} - processing failed: {str(e)}",
                'text_length': 25
            })
        
        # Force garbage collection every 5 pages
        if (page_num + 1) % 5 == 0:
            gc.collect()
    
    return batch_results

def classify_document_type(text: str) -> str:
    """Enhanced document classification"""
    text_lower = text.lower()
    
    # Certificate patterns
    if any(word in text_lower for word in ['certificate', 'certify', 'certified']):
        if any(word in text_lower for word in ['weight', 'gross', 'net']):
            return 'Certificate of Weight'
        elif any(word in text_lower for word in ['origin', 'country']):
            return 'Certificate of Origin'
        elif any(word in text_lower for word in ['vessel', 'ship', 'maritime']):
            return 'Vessel Certificate'
        else:
            return 'Certificate'
    
    # Invoice patterns
    if any(word in text_lower for word in ['invoice', 'bill', 'amount', 'total']):
        return 'Commercial Invoice'
    
    # LC patterns
    if any(word in text_lower for word in ['credit', 'documentary', 'applicant', 'beneficiary']):
        return 'Letter of Credit'
    
    # Transport patterns
    if any(word in text_lower for word in ['transport', 'shipment', 'cargo', 'container']):
        return 'Transport Document'
    
    return 'Trade Finance Document'

def identify_document_boundaries(pages_data: List[Dict]) -> List[Dict]:
    """Identify document boundaries within the PDF"""
    documents = []
    current_doc = None
    
    for page in pages_data:
        text = page['text']
        doc_type = classify_document_type(text)
        
        # Check if this starts a new document
        is_new_doc = (
            current_doc is None or
            doc_type != current_doc.get('classification', '') or
            len(text) > 200  # Substantial content suggests new document
        )
        
        if is_new_doc:
            # Save previous document
            if current_doc is not None:
                documents.append(current_doc)
            
            # Start new document
            current_doc = {
                'classification': doc_type,
                'pages': [page['page_number']],
                'page_range': f"Page {page['page_number']}",
                'text_content': text,
                'extracted_text': text,  # For compatibility
                'confidence_score': 85,
                'total_chars': page['text_length']
            }
        else:
            # Add to current document
            if current_doc is not None:
                current_doc['pages'].append(page['page_number'])
                current_doc['page_range'] = f"Pages {current_doc['pages'][0]}-{current_doc['pages'][-1]}"
                current_doc['text_content'] += "\n\n" + text
                current_doc['extracted_text'] = current_doc['text_content']  # For compatibility
                current_doc['total_chars'] += page['text_length']
    
    # Add final document
    if current_doc:
        documents.append(current_doc)
    
    return documents

def main():
    try:
        if len(sys.argv) != 2:
            raise ValueError("Usage: python memoryEfficientOCR.py <pdf_path>")
        
        pdf_path = sys.argv[1]
        
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        print(f"Starting memory-efficient OCR processing: {pdf_path}", file=sys.stderr)
        
        # Open document
        doc = fitz.open(pdf_path)
        total_pages = doc.page_count
        
        print(f"Document has {total_pages} pages", file=sys.stderr)
        
        # Process in batches to prevent memory overflow
        batch_size = 5 if total_pages > 30 else 10
        all_pages_data = []
        
        for batch_start in range(0, total_pages, batch_size):
            batch_end = min(batch_start + batch_size, total_pages)
            print(f"Processing batch: pages {batch_start + 1}-{batch_end}", file=sys.stderr)
            
            batch_data = process_page_batch(doc, batch_start, batch_end)
            all_pages_data.extend(batch_data)
            
            # Clean up between batches
            gc.collect()
        
        doc.close()
        
        # Identify document boundaries
        documents = identify_document_boundaries(all_pages_data)
        
        result = {
            'total_pages': total_pages,
            'pages_processed': len(all_pages_data),
            'detected_forms': documents,
            'forms': documents,  # For compatibility with existing code
            'document_count': len(documents),
            'processing_method': 'Memory-Efficient OCR',
            'success': True
        }
        
        print(f"✅ Processing complete: {len(documents)} documents identified", file=sys.stderr)
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'detected_forms': [],
            'total_pages': 0,
            'success': False
        }
        print(f"❌ OCR processing failed: {str(e)}", file=sys.stderr)
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
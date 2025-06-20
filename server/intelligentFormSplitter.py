#!/usr/bin/env python3
"""
Intelligent Form Splitter - Groups pages by document type rather than splitting page-by-page
Analyzes content patterns to identify and group related pages into complete documents
"""

import sys
import json
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
import time
from typing import List, Dict, Any, Tuple

def extract_text_from_page(page) -> str:
    """Extract text from a PDF page using direct extraction + OCR fallback"""
    # Try direct text extraction first
    text = page.get_text()
    
    # If minimal text, use OCR
    if len(text.strip()) < 50:
        # Convert page to image for OCR
        mat = fitz.Matrix(2, 2)  # 2x scaling for better OCR
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # Convert to PIL Image and extract with pytesseract
        pil_image = Image.open(io.BytesIO(img_data))
        text = pytesseract.image_to_string(pil_image)
    
    return text.strip()

def classify_document_type(text: str) -> Tuple[str, float]:
    """Enhanced document classification with higher accuracy patterns"""
    text_lower = text.lower()
    
    # Enhanced classification patterns with specific keywords and confidence scoring
    classification_patterns = [
        # High confidence patterns (0.9+)
        (['certificate of weight', 'weight certificate', 'gross weight', 'net weight', 'cargo weight'], 'Certificate of Weight', 0.95),
        (['vessel certificate', 'vessel voyage', 'flag / nationality', 'imo no', 'carrying vessel'], 'Vessel Certificate', 0.95),
        (['commercial invoice', 'invoice no', 'invoice date', 'beneficiary', 'proforma invoice'], 'Commercial Invoice', 0.9),
        (['bill of lading', 'b/l no', 'shipper', 'consignee', 'port of loading'], 'Bill of Lading', 0.9),
        (['certificate of origin', 'country of origin', 'origin certificate'], 'Certificate of Origin', 0.9),
        (['letter of credit', 'l/c number', 'documentary credit', 'applicant'], 'Letter of Credit', 0.9),
        
        # Medium confidence patterns (0.7-0.8)
        (['packing list', 'packing', 'packages', 'cartons', 'quantity'], 'Packing List', 0.8),
        (['insurance certificate', 'insurance policy', 'coverage', 'insured'], 'Insurance Certificate', 0.8),
        (['inspection certificate', 'quality certificate', 'inspection', 'tested'], 'Inspection Certificate', 0.8),
        (['bill of exchange', 'draft', 'exchange', 'drawn on'], 'Bill of Exchange', 0.7),
        
        # Lower confidence fallback
        (['trade', 'finance', 'document', 'international'], 'Trade Finance Document', 0.6)
    ]
    
    best_match = ('Trade Finance Document', 0.6)
    
    for keywords, doc_type, base_confidence in classification_patterns:
        # Count keyword matches
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        if matches > 0:
            # Calculate confidence based on keyword density
            confidence = min(base_confidence + (matches - 1) * 0.05, 0.99)
            if confidence > best_match[1]:
                best_match = (doc_type, confidence)
    
    return best_match

def group_pages_by_document_type(pdf_path: str) -> Dict[str, Any]:
    """Group pages by document type instead of splitting page-by-page"""
    try:
        doc = fitz.open(pdf_path)
        pages_data = []
        
        # Extract text and classify each page
        for page_num in range(doc.page_count):
            page = doc[page_num]
            text = extract_text_from_page(page)
            
            if len(text) < 20:  # Skip pages with minimal content
                continue
                
            doc_type, confidence = classify_document_type(text)
            
            pages_data.append({
                'page_number': page_num + 1,
                'text': text,
                'document_type': doc_type,
                'confidence': confidence,
                'text_length': len(text)
            })
        
        # Group consecutive pages of same document type
        grouped_documents = []
        current_group = None
        
        for page_data in pages_data:
            if current_group is None:
                # Start new group
                current_group = {
                    'document_type': page_data['document_type'],
                    'pages': [page_data],
                    'confidence': page_data['confidence']
                }
            elif current_group['document_type'] == page_data['document_type']:
                # Add to current group
                current_group['pages'].append(page_data)
                current_group['confidence'] = max(current_group['confidence'], page_data['confidence'])
            else:
                # Different document type - finalize current group and start new one
                grouped_documents.append(current_group)
                current_group = {
                    'document_type': page_data['document_type'],
                    'pages': [page_data],
                    'confidence': page_data['confidence']
                }
        
        # Add the last group
        if current_group:
            grouped_documents.append(current_group)
        
        # Convert groups to final format
        detected_forms = []
        for i, group in enumerate(grouped_documents):
            # Combine text from all pages in the group
            combined_text = '\n\n--- PAGE BREAK ---\n\n'.join([p['text'] for p in group['pages']])
            page_numbers = [p['page_number'] for p in group['pages']]
            
            # Create page range description
            if len(page_numbers) == 1:
                page_range = f"Page {page_numbers[0]}"
            else:
                page_range = f"Pages {min(page_numbers)}-{max(page_numbers)}"
            
            form_id = f"form_{i + 1}_{int(time.time() * 1000)}"
            
            detected_forms.append({
                "id": form_id,
                "form_type": group['document_type'],
                "formType": group['document_type'],
                "confidence": group['confidence'],
                "page_number": page_numbers[0] if len(page_numbers) == 1 else None,
                "page_numbers": page_numbers,
                "pages": page_numbers,
                "page_range": page_range,
                "extracted_text": combined_text,
                "text_length": len(combined_text),
                "extractedFields": {
                    "Full Extracted Text": combined_text,
                    "Document Classification": group['document_type'],
                    "Processing Statistics": f"{len(combined_text)} characters extracted from {group['document_type']}",
                    "Page Range": page_range,
                    "Confidence Score": f"{int(group['confidence'] * 100)}%",
                    "Pages Included": len(page_numbers)
                },
                "fullText": combined_text,
                "processingMethod": "Intelligent Document Grouping",
                "status": "completed"
            })
        
        doc.close()
        
        return {
            "status": "success",
            "total_pages": doc.page_count,
            "detected_forms": detected_forms,
            "processing_method": "Intelligent Document Grouping",
            "document_count": len(detected_forms),
            "message": f"Successfully grouped {doc.page_count} pages into {len(detected_forms)} documents"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Failed to process document: {str(e)}"
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python intelligentFormSplitter.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = group_pages_by_document_type(pdf_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
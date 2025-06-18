#!/usr/bin/env python3
"""
Quick OCR processor for immediate results
"""
import fitz
import json
import sys
import os

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python quickOCR.py <pdf_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)
    
    try:
        # Extract text from PDF
        doc = fitz.open(pdf_path)
        text = ""
        
        # Process first page only for speed
        if len(doc) > 0:
            page = doc.load_page(0)
            text = page.get_text()
            
            # If no direct text, try OCR on the image
            if not text.strip():
                try:
                    import pytesseract
                    from PIL import Image
                    import io
                    
                    # Get image from PDF page
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    
                    # Perform OCR
                    text = pytesseract.image_to_string(img)
                except Exception as ocr_error:
                    text = f"OCR processing failed: {str(ocr_error)}"
        
        doc.close()
        
        # Content-based classification using extracted text only
        text_lower = text.lower()
        doc_type = "Unknown Document"
        confidence = 0.0
        
        # Commercial Invoice patterns
        if any(keyword in text_lower for keyword in ['invoice', 'inv no', 'invoice number', 'seller', 'buyer', 'total amount']):
            doc_type = "Commercial Invoice"
            confidence = 0.85
        
        # Bill of Lading patterns
        elif any(keyword in text_lower for keyword in ['bill of lading', 'b/l', 'vessel', 'port of loading', 'port of discharge', 'shipper', 'consignee']):
            doc_type = "Bill of Lading"
            confidence = 0.85
        
        # Certificate of Origin patterns
        elif any(keyword in text_lower for keyword in ['certificate of origin', 'country of origin', 'chamber of commerce', 'exporter', 'goods origin']):
            doc_type = "Certificate of Origin"
            confidence = 0.85
        
        # Packing List patterns
        elif any(keyword in text_lower for keyword in ['packing list', 'package', 'gross weight', 'net weight', 'measurement', 'cbm']):
            doc_type = "Packing List"
            confidence = 0.85
        
        # Insurance Certificate patterns
        elif any(keyword in text_lower for keyword in ['insurance certificate', 'policy number', 'insured amount', 'marine insurance', 'coverage']):
            doc_type = "Insurance Certificate"
            confidence = 0.85
        
        # Vessel Certificate patterns (NEW)
        elif any(keyword in text_lower for keyword in ['vessel certificate', 'certificate', 'vessel', 'ship', 'maritime', 'seaworthy', 'classification', 'registry']):
            doc_type = "Vessel Certificate"
            confidence = 0.85
        
        # Multimodal Transport patterns
        elif any(keyword in text_lower for keyword in ['multimodal', 'transport document', 'combined transport', 'intermodal']):
            doc_type = "Multimodal Transport Document"
            confidence = 0.85
        
        # If still unknown, try partial matches
        elif any(keyword in text_lower for keyword in ['certificate', 'document', 'transport']):
            doc_type = "General Certificate"
            confidence = 0.60
        
        result = {
            "extracted_text": text if text.strip() else f"Scanned document detected from file: {os.path.basename(pdf_path)}",
            "document_type": doc_type,
            "confidence": confidence,
            "text_length": len(text),
            "preview": text[:300] + "..." if len(text) > 300 else text
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": f"Processing error: {str(e)}",
            "document_type": "Unknown Document",
            "confidence": 0,
            "extracted_text": "",
            "text_length": 0
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
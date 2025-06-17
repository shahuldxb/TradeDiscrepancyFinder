#!/usr/bin/env python3
"""
Form Detection & Classification Service
Handles multi-form PDF segregation using Azure Document Intelligence
"""

import os
import sys
import json
import fitz  # PyMuPDF
from io import BytesIO
from typing import List, Dict, Any, Tuple
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest

class FormDetectionService:
    def __init__(self):
        self.endpoint = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
        self.api_key = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_KEY')
        
        if not self.endpoint or not self.api_key:
            raise ValueError("Azure Document Intelligence credentials not found")
        
        self.client = DocumentIntelligenceClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.api_key)
        )
        
        # Form detection patterns for classification
        self.form_signatures = {
            'commercial_invoice': [
                'commercial invoice',
                'invoice number',
                'invoice date',
                'seller',
                'buyer',
                'ship to',
                'bill to',
                'description of goods',
                'unit price',
                'total amount'
            ],
            'bill_of_lading': [
                'bill of lading',
                'shipper',
                'consignee',
                'vessel',
                'port of loading',
                'port of discharge',
                'container number',
                'seal number',
                'freight terms'
            ],
            'certificate_of_origin': [
                'certificate of origin',
                'country of origin',
                'exporter',
                'importer',
                'commodity',
                'harmonized system',
                'chamber of commerce',
                'certify that'
            ],
            'packing_list': [
                'packing list',
                'package',
                'quantity',
                'weight',
                'dimensions',
                'marks and numbers',
                'gross weight',
                'net weight',
                'total packages'
            ],
            'lc_document': [
                'letter of credit',
                'documentary credit',
                'credit number',
                'applicant',
                'beneficiary',
                'issuing bank',
                'advising bank',
                'expiry date',
                'latest shipment'
            ],
            'bill_of_exchange': [
                'bill of exchange',
                'exchange for',
                'pay to the order',
                'drawn under',
                'drawer',
                'drawee',
                'payee',
                'tenor',
                'draft'
            ]
        }

    def detect_forms_in_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Detect individual forms within a multi-form PDF
        Returns list of detected form information
        """
        try:
            detected_forms = []
            
            # Open PDF document
            pdf_document = fitz.open(pdf_path)
            total_pages = pdf_document.page_count
            
            print(f"Analyzing PDF with {total_pages} pages for form detection...")
            
            # Analyze the entire document first with Azure Document Intelligence
            with open(pdf_path, 'rb') as pdf_file:
                pdf_bytes = pdf_file.read()
                
            # Use layout model for initial page analysis
            poller = self.client.begin_analyze_document(
                "prebuilt-layout",
                pdf_bytes,
                content_type="application/pdf"
            )
            
            layout_result = poller.result()
            
            # Group pages by potential forms
            form_groups = self._group_pages_by_forms(pdf_document, layout_result)
            
            # Create individual form information
            for form_group in form_groups:
                form_info = {
                    'start_page': form_group['start_page'],
                    'end_page': form_group['end_page'],
                    'page_count': form_group['end_page'] - form_group['start_page'] + 1,
                    'form_type': form_group['form_type'],
                    'confidence': form_group['confidence'],
                    'extracted_text': form_group['text_content'],
                    'key_fields': form_group['key_fields']
                }
                detected_forms.append(form_info)
            
            pdf_document.close()
            
            print(f"Detected {len(detected_forms)} forms in PDF")
            return detected_forms
            
        except Exception as e:
            print(f"Error detecting forms: {str(e)}")
            return []

    def _group_pages_by_forms(self, pdf_document, layout_result) -> List[Dict[str, Any]]:
        """
        Group consecutive pages that belong to the same form
        """
        form_groups = []
        current_form = None
        
        # Extract text from each page and analyze
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text().lower()
            
            # Detect form type on this page
            detected_type, confidence, key_fields = self._classify_form_type(page_text)
            
            if current_form is None:
                # Start new form group
                current_form = {
                    'start_page': page_num + 1,
                    'end_page': page_num + 1,
                    'form_type': detected_type,
                    'confidence': confidence,
                    'text_content': page_text,
                    'key_fields': key_fields
                }
            elif detected_type == current_form['form_type'] and confidence > 0.6:
                # Continue current form group
                current_form['end_page'] = page_num + 1
                current_form['text_content'] += f"\n\n--- Page {page_num + 1} ---\n" + page_text
                current_form['key_fields'].update(key_fields)
            else:
                # Start new form group
                form_groups.append(current_form)
                current_form = {
                    'start_page': page_num + 1,
                    'end_page': page_num + 1,
                    'form_type': detected_type,
                    'confidence': confidence,
                    'text_content': page_text,
                    'key_fields': key_fields
                }
        
        # Add the last form group
        if current_form:
            form_groups.append(current_form)
        
        return form_groups

    def _classify_form_type(self, text_content: str) -> Tuple[str, float, Dict[str, str]]:
        """
        Classify the form type based on text content
        Returns (form_type, confidence_score, key_fields)
        """
        text_lower = text_content.lower()
        best_match = 'unclassified'
        best_score = 0.0
        key_fields = {}
        
        for form_type, signatures in self.form_signatures.items():
            matches = 0
            total_signatures = len(signatures)
            
            for signature in signatures:
                if signature.lower() in text_lower:
                    matches += 1
                    # Extract potential field value
                    key_fields[signature] = self._extract_field_value(text_content, signature)
            
            confidence = matches / total_signatures
            
            if confidence > best_score:
                best_score = confidence
                best_match = form_type
        
        # Minimum confidence threshold
        if best_score < 0.2:
            best_match = 'unclassified'
            best_score = 0.0
        
        return best_match, best_score, key_fields

    def _extract_field_value(self, text: str, field_name: str) -> str:
        """
        Extract value for a specific field from text
        """
        try:
            text_lower = text.lower()
            field_lower = field_name.lower()
            
            # Find the field name in text
            field_pos = text_lower.find(field_lower)
            if field_pos == -1:
                return ""
            
            # Extract text after the field name (next 50 characters)
            start_pos = field_pos + len(field_lower)
            extract_text = text[start_pos:start_pos + 50].strip()
            
            # Clean up the extracted text
            lines = extract_text.split('\n')
            if lines:
                return lines[0].strip(':\t ')
            
            return extract_text
            
        except Exception:
            return ""

    def segregate_pdf_by_forms(self, pdf_path: str, detected_forms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Split PDF into individual form PDFs based on detected forms
        Returns list of segregated PDF information
        """
        try:
            segregated_pdfs = []
            base_filename = os.path.splitext(os.path.basename(pdf_path))[0]
            output_dir = os.path.dirname(pdf_path)
            
            # Open source PDF
            source_pdf = fitz.open(pdf_path)
            
            for i, form_info in enumerate(detected_forms):
                # Create new PDF for this form
                form_pdf = fitz.open()
                
                # Copy pages for this form
                start_page = form_info['start_page'] - 1  # Convert to 0-based
                end_page = form_info['end_page'] - 1
                
                for page_num in range(start_page, end_page + 1):
                    if page_num < source_pdf.page_count:
                        form_pdf.insert_pdf(source_pdf, from_page=page_num, to_page=page_num)
                
                # Generate output filename
                form_type = form_info['form_type'].replace('_', ' ').title()
                output_filename = f"{base_filename}_Form_{i+1}_{form_type}.pdf"
                output_path = os.path.join(output_dir, output_filename)
                
                # Save individual form PDF
                form_pdf.save(output_path)
                form_pdf.close()
                
                # Create segregated PDF info
                segregated_info = {
                    'form_index': i + 1,
                    'form_type': form_info['form_type'],
                    'confidence': form_info['confidence'],
                    'page_range': f"{form_info['start_page']}-{form_info['end_page']}",
                    'page_count': form_info['page_count'],
                    'output_path': output_path,
                    'filename': output_filename,
                    'file_size': os.path.getsize(output_path),
                    'key_fields': form_info['key_fields']
                }
                
                segregated_pdfs.append(segregated_info)
                print(f"Created {output_filename} with {form_info['page_count']} pages")
            
            source_pdf.close()
            
            print(f"Successfully segregated PDF into {len(segregated_pdfs)} individual forms")
            return segregated_pdfs
            
        except Exception as e:
            print(f"Error segregating PDF: {str(e)}")
            return []

def main():
    """
    Main function for testing form detection
    """
    if len(sys.argv) != 2:
        print("Usage: python formDetectionService.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    try:
        # Initialize form detection service
        service = FormDetectionService()
        
        # Detect forms in PDF
        print("Starting form detection...")
        detected_forms = service.detect_forms_in_pdf(pdf_path)
        
        if not detected_forms:
            print("No forms detected in PDF")
            return
        
        # Print detection results
        print("\n=== FORM DETECTION RESULTS ===")
        for i, form in enumerate(detected_forms):
            print(f"Form {i+1}:")
            print(f"  Type: {form['form_type']}")
            print(f"  Pages: {form['start_page']}-{form['end_page']}")
            print(f"  Confidence: {form['confidence']:.2f}")
            print(f"  Key Fields: {len(form['key_fields'])}")
            print()
        
        # Segregate PDF by forms
        print("Starting PDF segregation...")
        segregated_pdfs = service.segregate_pdf_by_forms(pdf_path, detected_forms)
        
        # Print segregation results
        print("\n=== PDF SEGREGATION RESULTS ===")
        for pdf_info in segregated_pdfs:
            print(f"Created: {pdf_info['filename']}")
            print(f"  Type: {pdf_info['form_type']}")
            print(f"  Pages: {pdf_info['page_range']}")
            print(f"  Size: {pdf_info['file_size']} bytes")
            print()
        
        # Output results as JSON
        results = {
            'detected_forms': detected_forms,
            'segregated_pdfs': segregated_pdfs,
            'total_forms': len(detected_forms),
            'status': 'success'
        }
        
        print("\n=== JSON RESULTS ===")
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'status': 'error'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
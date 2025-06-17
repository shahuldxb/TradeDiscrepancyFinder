#!/usr/bin/env python3
"""
Forms Recognizer Processor - Python Backend
Handles multi-form PDF segregation using Azure Document Intelligence
"""

import os
import sys
import json
import uuid
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF
from pathlib import Path
import logging
from datetime import datetime

# Azure Document Intelligence
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FormsRecognizerProcessor:
    def __init__(self):
        # Azure Document Intelligence credentials from environment
        self.endpoint = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT', 'https://magicfun.cognitiveservices.azure.com/')
        self.api_key = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_API_KEY', 'EcnOFPgvE4AnO6QQZKaOHR8wkgnlq6h5w5sbr5NwSivMvE5nGHIaJQQJ99BFACYeBjFXJ3w3AAALACOGOIK7')
        
        # Initialize Azure client
        self.client = DocumentIntelligenceClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.api_key)
        )
        
        # Form type detection patterns
        self.form_patterns = {
            'commercial_invoice': ['commercial invoice', 'invoice', 'bill', 'seller', 'buyer', 'total amount'],
            'bill_of_lading': ['bill of lading', 'bl', 'shipper', 'consignee', 'vessel', 'port of loading'],
            'certificate_origin': ['certificate of origin', 'origin', 'chamber of commerce', 'export'],
            'packing_list': ['packing list', 'packages', 'gross weight', 'net weight', 'dimensions'],
            'bill_of_exchange': ['bill of exchange', 'draft', 'drawee', 'drawer', 'pay', 'exchange'],
            'insurance_certificate': ['insurance', 'certificate', 'coverage', 'premium', 'policy'],
            'letter_of_credit': ['letter of credit', 'lc', 'documentary credit', 'applicant', 'beneficiary'],
            'shipping_instructions': ['shipping instructions', 'freight forwarder', 'delivery', 'booking'],
            'customs_declaration': ['customs', 'declaration', 'tariff', 'duty', 'customs code'],
            'inspection_certificate': ['inspection', 'certificate', 'quality', 'quantity', 'surveyor']
        }

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(pdf_path)
            text_content = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text_content += page.get_text()
                
            doc.close()
            return text_content
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""

    def analyze_document_with_azure(self, file_path: str) -> Dict[str, Any]:
        """Analyze document using Azure Document Intelligence"""
        try:
            with open(file_path, "rb") as f:
                poller = self.client.begin_analyze_document(
                    "prebuilt-layout",
                    analyze_request=f,
                    content_type="application/octet-stream"
                )
                result = poller.result()
            
            # Extract structured data
            extracted_data = {
                'content': result.content,
                'pages': len(result.pages) if result.pages else 0,
                'tables': [],
                'key_value_pairs': {}
            }
            
            # Extract tables
            if result.tables:
                for table in result.tables:
                    table_data = []
                    for cell in table.cells:
                        table_data.append({
                            'content': cell.content,
                            'row_index': cell.row_index,
                            'column_index': cell.column_index
                        })
                    extracted_data['tables'].append(table_data)
            
            # Extract key-value pairs
            if result.key_value_pairs:
                for kv_pair in result.key_value_pairs:
                    if kv_pair.key and kv_pair.value:
                        key_content = kv_pair.key.content if kv_pair.key.content else ""
                        value_content = kv_pair.value.content if kv_pair.value.content else ""
                        extracted_data['key_value_pairs'][key_content] = value_content
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error analyzing document with Azure: {e}")
            return {'content': '', 'pages': 0, 'tables': [], 'key_value_pairs': {}}

    def detect_form_type(self, text_content: str) -> str:
        """Detect form type based on text content"""
        text_lower = text_content.lower()
        
        # Score each form type
        scores = {}
        for form_type, patterns in self.form_patterns.items():
            score = 0
            for pattern in patterns:
                if pattern in text_lower:
                    score += 1
            scores[form_type] = score
        
        # Return form type with highest score
        if scores:
            best_match = max(scores.items(), key=lambda x: x[1])
            if best_match[1] > 0:
                return best_match[0]
        
        return 'unknown_form'

    def segregate_pdf_pages(self, pdf_path: str, output_dir: str) -> List[Dict[str, Any]]:
        """Segregate PDF into individual pages and analyze each"""
        try:
            doc = fitz.open(pdf_path)
            segregated_forms = []
            
            for page_num in range(len(doc)):
                # Create single-page PDF
                single_page_doc = fitz.open()
                single_page_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
                
                # Save individual PDF
                page_filename = f"form_{page_num + 1}_{uuid.uuid4().hex[:8]}.pdf"
                page_path = os.path.join(output_dir, page_filename)
                single_page_doc.save(page_path)
                single_page_doc.close()
                
                # Extract text from this page
                page = doc.load_page(page_num)
                page_text = page.get_text()
                
                # Analyze with Azure Document Intelligence
                azure_analysis = self.analyze_document_with_azure(page_path)
                
                # Detect form type
                form_type = self.detect_form_type(page_text)
                
                # Calculate confidence based on text quality and length
                confidence = min(95.0, max(60.0, len(page_text) / 100 * 10))
                
                form_info = {
                    'page_number': page_num + 1,
                    'filename': page_filename,
                    'file_path': page_path,
                    'form_type': form_type,
                    'confidence': confidence,
                    'text_content': page_text,
                    'azure_analysis': azure_analysis,
                    'extracted_fields': azure_analysis.get('key_value_pairs', {}),
                    'character_count': len(page_text),
                    'word_count': len(page_text.split()) if page_text else 0
                }
                
                segregated_forms.append(form_info)
                
                # Save text file
                text_filename = f"form_{page_num + 1}_{uuid.uuid4().hex[:8]}.txt"
                text_path = os.path.join(output_dir, text_filename)
                with open(text_path, 'w', encoding='utf-8') as f:
                    f.write(page_text)
                
                form_info['text_file_path'] = text_path
                
                logger.info(f"Processed page {page_num + 1}: {form_type} (confidence: {confidence:.1f}%)")
            
            doc.close()
            return segregated_forms
            
        except Exception as e:
            logger.error(f"Error segregating PDF: {e}")
            return []

    def create_form_json(self, form_info: Dict[str, Any], output_dir: str) -> str:
        """Create JSON file for new form type"""
        try:
            json_filename = f"form_template_{form_info['form_type']}_{uuid.uuid4().hex[:8]}.json"
            json_path = os.path.join(output_dir, json_filename)
            
            template_data = {
                'form_type': form_info['form_type'],
                'template_version': '1.0',
                'created_date': datetime.now().isoformat(),
                'sample_fields': form_info.get('extracted_fields', {}),
                'field_definitions': self.generate_field_definitions(form_info['form_type']),
                'validation_rules': self.get_validation_rules(form_info['form_type'])
            }
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(template_data, f, indent=2, ensure_ascii=False)
            
            return json_path
            
        except Exception as e:
            logger.error(f"Error creating form JSON: {e}")
            return ""

    def generate_field_definitions(self, form_type: str) -> List[Dict[str, Any]]:
        """Generate comprehensive field definitions for each form type"""
        field_definitions = {
            'commercial_invoice': [
                {'name': 'invoice_number', 'type': 'string', 'required': True},
                {'name': 'invoice_date', 'type': 'date', 'required': True},
                {'name': 'seller_name', 'type': 'string', 'required': True},
                {'name': 'seller_address', 'type': 'text', 'required': True},
                {'name': 'buyer_name', 'type': 'string', 'required': True},
                {'name': 'buyer_address', 'type': 'text', 'required': True},
                {'name': 'currency', 'type': 'string', 'required': True},
                {'name': 'total_amount', 'type': 'decimal', 'required': True},
                {'name': 'payment_terms', 'type': 'string', 'required': False}
            ],
            'bill_of_lading': [
                {'name': 'bl_number', 'type': 'string', 'required': True},
                {'name': 'vessel_name', 'type': 'string', 'required': True},
                {'name': 'voyage_number', 'type': 'string', 'required': False},
                {'name': 'port_of_loading', 'type': 'string', 'required': True},
                {'name': 'port_of_discharge', 'type': 'string', 'required': True},
                {'name': 'shipper', 'type': 'text', 'required': True},
                {'name': 'consignee', 'type': 'text', 'required': True},
                {'name': 'notify_party', 'type': 'text', 'required': False}
            ],
            'certificate_origin': [
                {'name': 'certificate_number', 'type': 'string', 'required': True},
                {'name': 'issue_date', 'type': 'date', 'required': True},
                {'name': 'exporter', 'type': 'text', 'required': True},
                {'name': 'consignee', 'type': 'text', 'required': True},
                {'name': 'country_of_origin', 'type': 'string', 'required': True},
                {'name': 'issuing_authority', 'type': 'string', 'required': True}
            ]
        }
        
        return field_definitions.get(form_type, [
            {'name': 'document_number', 'type': 'string', 'required': False},
            {'name': 'document_date', 'type': 'date', 'required': False},
            {'name': 'issuer', 'type': 'string', 'required': False}
        ])

    def get_validation_rules(self, form_type: str) -> List[Dict[str, Any]]:
        """Get validation rules for form type"""
        return [
            {'field': 'document_date', 'rule': 'date_format', 'value': 'YYYY-MM-DD'},
            {'field': 'total_amount', 'rule': 'positive_number', 'value': True},
            {'field': 'currency', 'rule': 'currency_code', 'value': True}
        ]

def main():
    """Main processing function"""
    if len(sys.argv) != 4:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python formsRecognizerProcessor.py <input_pdf> <output_dir> <ingestion_id>'
        }))
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    output_dir = sys.argv[2]
    ingestion_id = sys.argv[3]
    
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize processor
        processor = FormsRecognizerProcessor()
        
        # Process the PDF
        logger.info(f"Starting processing for: {input_pdf}")
        
        # Segregate PDF into individual forms
        segregated_forms = processor.segregate_pdf_pages(input_pdf, output_dir)
        
        # Create JSON templates for new form types
        form_templates = []
        for form_info in segregated_forms:
            json_path = processor.create_form_json(form_info, output_dir)
            if json_path:
                form_templates.append(json_path)
        
        # Return results
        result = {
            'success': True,
            'ingestion_id': ingestion_id,
            'total_forms': len(segregated_forms),
            'segregated_forms': segregated_forms,
            'form_templates': form_templates,
            'processing_summary': {
                'total_pages_processed': len(segregated_forms),
                'form_types_detected': list(set(form['form_type'] for form in segregated_forms)),
                'total_characters': sum(form['character_count'] for form in segregated_forms),
                'total_words': sum(form['word_count'] for form in segregated_forms)
            }
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'ingestion_id': ingestion_id
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
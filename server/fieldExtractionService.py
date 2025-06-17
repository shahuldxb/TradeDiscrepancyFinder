#!/usr/bin/env python3
"""
Field Extraction Service - Step 5 Implementation
Uses AI-assisted parsing to extract key-value pairs from forms
"""

import os
import sys
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import pyodbc
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

class FieldExtractionService:
    def __init__(self):
        self.azure_endpoint = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
        self.azure_key = os.getenv('AZURE_DOCUMENT_INTELLIGENCE_KEY')
        self.sql_server = os.getenv('AZURE_SQL_SERVER')
        self.sql_database = os.getenv('AZURE_SQL_DATABASE')
        self.sql_user = os.getenv('AZURE_SQL_USER')
        self.sql_password = os.getenv('AZURE_SQL_PASSWORD')
        
        if not all([self.azure_endpoint, self.azure_key]):
            raise ValueError("Azure Document Intelligence credentials not found")
        
        self.client = DocumentIntelligenceClient(
            endpoint=self.azure_endpoint,
            credential=AzureKeyCredential(self.azure_key)
        )
        
        # Enhanced field extraction patterns for different form types
        self.field_patterns = {
            'Commercial Invoice': {
                'invoice_number': [
                    r'Invoice\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'INV[\s#]*([A-Z0-9\-\/]+)',
                    r'(?:Invoice|Bill)\s*#?\s*([A-Z0-9\-\/]+)'
                ],
                'invoice_date': [
                    r'(?:Invoice\s*)?Date[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'Dated[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})'
                ],
                'total_amount': [
                    r'Total[\s:]*\$?([0-9,]+\.?\d*)',
                    r'Amount[\s:]*\$?([0-9,]+\.?\d*)',
                    r'Grand\s*Total[\s:]*\$?([0-9,]+\.?\d*)'
                ],
                'seller_name': [
                    r'(?:From|Seller|Vendor)[\s:]*([A-Za-z\s&\.,]+)',
                    r'Bill\s*From[\s:]*([A-Za-z\s&\.,]+)',
                    r'Supplier[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'buyer_name': [
                    r'(?:To|Buyer|Customer)[\s:]*([A-Za-z\s&\.,]+)',
                    r'Bill\s*To[\s:]*([A-Za-z\s&\.,]+)',
                    r'Ship\s*To[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'currency': [
                    r'Currency[\s:]*([A-Z]{3})',
                    r'(\$|USD|EUR|GBP|JPY)',
                    r'Amount\s*in\s*([A-Z]{3})'
                ]
            },
            'Bill of Lading': {
                'bl_number': [
                    r'B\/L\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'Bill\s*of\s*Lading\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'Document\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)'
                ],
                'vessel_name': [
                    r'Vessel[\s:]*([A-Za-z\s\-]+)',
                    r'Ship\s*Name[\s:]*([A-Za-z\s\-]+)',
                    r'M\.V\.?\s*([A-Za-z\s\-]+)'
                ],
                'port_of_loading': [
                    r'Port\s*of\s*Loading[\s:]*([A-Za-z\s,]+)',
                    r'From\s*Port[\s:]*([A-Za-z\s,]+)',
                    r'Departure\s*Port[\s:]*([A-Za-z\s,]+)'
                ],
                'port_of_discharge': [
                    r'Port\s*of\s*Discharge[\s:]*([A-Za-z\s,]+)',
                    r'To\s*Port[\s:]*([A-Za-z\s,]+)',
                    r'Destination\s*Port[\s:]*([A-Za-z\s,]+)'
                ],
                'sailing_date': [
                    r'Sailing\s*Date[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'ETD[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'Departure[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})'
                ],
                'consignee': [
                    r'Consignee[\s:]*([A-Za-z\s&\.,]+)',
                    r'To[\s:]*([A-Za-z\s&\.,]+)',
                    r'Notify\s*Party[\s:]*([A-Za-z\s&\.,]+)'
                ]
            },
            'Certificate of Origin': {
                'certificate_number': [
                    r'Certificate\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'COO\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'Reference\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)'
                ],
                'country_of_origin': [
                    r'Country\s*of\s*Origin[\s:]*([A-Za-z\s]+)',
                    r'Origin[\s:]*([A-Za-z\s]+)',
                    r'Made\s*in[\s:]*([A-Za-z\s]+)'
                ],
                'exporter': [
                    r'Exporter[\s:]*([A-Za-z\s&\.,]+)',
                    r'Shipper[\s:]*([A-Za-z\s&\.,]+)',
                    r'From[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'consignee': [
                    r'Consignee[\s:]*([A-Za-z\s&\.,]+)',
                    r'To[\s:]*([A-Za-z\s&\.,]+)',
                    r'Importer[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'issue_date': [
                    r'Issue\s*Date[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'Date\s*of\s*Issue[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'Dated[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})'
                ]
            },
            'LC Document': {
                'lc_number': [
                    r'LC\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'Letter\s*of\s*Credit\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'Documentary\s*Credit\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)'
                ],
                'issuing_bank': [
                    r'Issuing\s*Bank[\s:]*([A-Za-z\s&\.,]+)',
                    r'Issued\s*by[\s:]*([A-Za-z\s&\.,]+)',
                    r'Bank[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'beneficiary': [
                    r'Beneficiary[\s:]*([A-Za-z\s&\.,]+)',
                    r'In\s*favor\s*of[\s:]*([A-Za-z\s&\.,]+)',
                    r'To[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'applicant': [
                    r'Applicant[\s:]*([A-Za-z\s&\.,]+)',
                    r'For\s*account\s*of[\s:]*([A-Za-z\s&\.,]+)',
                    r'Buyer[\s:]*([A-Za-z\s&\.,]+)'
                ],
                'lc_amount': [
                    r'LC\s*Amount[\s:]*\$?([0-9,]+\.?\d*)',
                    r'Credit\s*Amount[\s:]*\$?([0-9,]+\.?\d*)',
                    r'Value[\s:]*\$?([0-9,]+\.?\d*)'
                ],
                'expiry_date': [
                    r'Expiry\s*Date[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'Valid\s*until[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                    r'Expires[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})'
                ]
            },
            'Packing List': {
                'packing_list_number': [
                    r'Packing\s*List\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'PL\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)',
                    r'List\s*(?:No|Number|#)[\s:]*([A-Z0-9\-\/]+)'
                ],
                'total_packages': [
                    r'Total\s*Packages[\s:]*(\d+)',
                    r'No\.\s*of\s*Packages[\s:]*(\d+)',
                    r'Packages[\s:]*(\d+)'
                ],
                'gross_weight': [
                    r'Gross\s*Weight[\s:]*([0-9,]+\.?\d*)\s*(kg|lbs?|tons?)?',
                    r'Total\s*Weight[\s:]*([0-9,]+\.?\d*)\s*(kg|lbs?|tons?)?',
                    r'Weight[\s:]*([0-9,]+\.?\d*)\s*(kg|lbs?|tons?)?'
                ],
                'net_weight': [
                    r'Net\s*Weight[\s:]*([0-9,]+\.?\d*)\s*(kg|lbs?|tons?)?',
                    r'N\.W\.[\s:]*([0-9,]+\.?\d*)\s*(kg|lbs?|tons?)?'
                ],
                'dimensions': [
                    r'Dimensions[\s:]*([0-9x\s\.]+)\s*(cm|mm|in|ft)?',
                    r'Size[\s:]*([0-9x\s\.]+)\s*(cm|mm|in|ft)?',
                    r'Measurements[\s:]*([0-9x\s\.]+)\s*(cm|mm|in|ft)?'
                ]
            }
        }

    def extract_fields_from_text(self, text_content: str, document_type: str) -> Dict[str, Any]:
        """Extract fields using pattern matching and AI logic"""
        extracted_fields = {}
        confidence_scores = {}
        
        # Get patterns for the document type
        patterns = self.field_patterns.get(document_type, {})
        
        for field_name, field_patterns in patterns.items():
            best_match = None
            best_confidence = 0.0
            
            for pattern in field_patterns:
                try:
                    match = re.search(pattern, text_content, re.IGNORECASE | re.MULTILINE)
                    if match:
                        value = match.group(1).strip()
                        if value:
                            # Calculate confidence based on pattern specificity and context
                            confidence = self.calculate_field_confidence(pattern, value, text_content)
                            if confidence > best_confidence:
                                best_match = value
                                best_confidence = confidence
                except Exception as e:
                    print(f"Pattern matching error for {field_name}: {e}")
                    continue
            
            if best_match:
                extracted_fields[field_name] = best_match
                confidence_scores[field_name] = best_confidence
        
        return {
            'fields': extracted_fields,
            'confidence_scores': confidence_scores,
            'extraction_method': 'rule_based_ai',
            'document_type': document_type
        }

    def calculate_field_confidence(self, pattern: str, value: str, context: str) -> float:
        """Calculate confidence score for extracted field"""
        base_confidence = 0.7
        
        # Boost confidence for specific patterns
        if 'Number' in pattern or '#' in pattern:
            base_confidence += 0.1
        
        # Boost confidence for date patterns
        if r'\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}' in pattern:
            base_confidence += 0.1
        
        # Boost confidence for amount patterns
        if 'Amount' in pattern or '$' in pattern:
            base_confidence += 0.1
        
        # Reduce confidence for very short values
        if len(value) < 3:
            base_confidence -= 0.2
        
        # Boost confidence for longer, more specific values
        if len(value) > 10:
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)

    def enhance_with_azure_ai(self, file_path: str, document_type: str) -> Dict[str, Any]:
        """Use Azure Document Intelligence for enhanced field extraction"""
        try:
            with open(file_path, 'rb') as file:
                # Use prebuilt-layout model for general document analysis
                poller = self.client.begin_analyze_document(
                    "prebuilt-layout",
                    analyze_request=file,
                    content_type="application/octet-stream"
                )
                result = poller.result()
                
                azure_fields = {}
                azure_confidence = {}
                
                # Extract key-value pairs from Azure response
                if hasattr(result, 'key_value_pairs'):
                    for kv_pair in result.key_value_pairs:
                        if kv_pair.key and kv_pair.value:
                            key_text = kv_pair.key.content.strip().lower()
                            value_text = kv_pair.value.content.strip()
                            confidence = kv_pair.confidence if hasattr(kv_pair, 'confidence') else 0.8
                            
                            # Map Azure keys to our standardized field names
                            standardized_key = self.map_azure_key_to_standard(key_text, document_type)
                            if standardized_key:
                                azure_fields[standardized_key] = value_text
                                azure_confidence[standardized_key] = confidence
                
                # Extract tables if present
                tables_data = []
                if hasattr(result, 'tables'):
                    for table in result.tables:
                        table_data = []
                        for cell in table.cells:
                            table_data.append({
                                'content': cell.content,
                                'row_index': cell.row_index,
                                'column_index': cell.column_index
                            })
                        tables_data.append(table_data)
                
                return {
                    'fields': azure_fields,
                    'confidence_scores': azure_confidence,
                    'tables': tables_data,
                    'extraction_method': 'azure_ai',
                    'document_type': document_type
                }
                
        except Exception as e:
            print(f"Azure AI extraction error: {e}")
            return {
                'fields': {},
                'confidence_scores': {},
                'extraction_method': 'azure_ai_failed',
                'error': str(e)
            }

    def map_azure_key_to_standard(self, azure_key: str, document_type: str) -> Optional[str]:
        """Map Azure-detected keys to standardized field names"""
        key_mappings = {
            'Commercial Invoice': {
                'invoice number': 'invoice_number',
                'invoice #': 'invoice_number',
                'inv no': 'invoice_number',
                'date': 'invoice_date',
                'invoice date': 'invoice_date',
                'total': 'total_amount',
                'amount': 'total_amount',
                'seller': 'seller_name',
                'vendor': 'seller_name',
                'buyer': 'buyer_name',
                'customer': 'buyer_name'
            },
            'Bill of Lading': {
                'b/l number': 'bl_number',
                'bl no': 'bl_number',
                'vessel': 'vessel_name',
                'ship': 'vessel_name',
                'port of loading': 'port_of_loading',
                'port of discharge': 'port_of_discharge',
                'consignee': 'consignee'
            },
            'Certificate of Origin': {
                'certificate number': 'certificate_number',
                'coo number': 'certificate_number',
                'country of origin': 'country_of_origin',
                'origin': 'country_of_origin',
                'exporter': 'exporter',
                'consignee': 'consignee'
            }
        }
        
        mappings = key_mappings.get(document_type, {})
        return mappings.get(azure_key.lower(), None)

    def combine_extraction_results(self, rule_based: Dict, azure_ai: Dict) -> Dict[str, Any]:
        """Combine results from rule-based and Azure AI extraction"""
        combined_fields = {}
        combined_confidence = {}
        
        # Start with rule-based results
        combined_fields.update(rule_based.get('fields', {}))
        combined_confidence.update(rule_based.get('confidence_scores', {}))
        
        # Enhance with Azure AI results (higher confidence wins)
        azure_fields = azure_ai.get('fields', {})
        azure_confidence = azure_ai.get('confidence_scores', {})
        
        for field_name, azure_value in azure_fields.items():
            azure_conf = azure_confidence.get(field_name, 0.8)
            existing_conf = combined_confidence.get(field_name, 0.0)
            
            if azure_conf > existing_conf:
                combined_fields[field_name] = azure_value
                combined_confidence[field_name] = azure_conf
        
        return {
            'fields': combined_fields,
            'confidence_scores': combined_confidence,
            'extraction_methods': ['rule_based_ai', 'azure_ai'],
            'azure_tables': azure_ai.get('tables', [])
        }

    def save_to_database(self, ingestion_id: str, extracted_data: Dict[str, Any]) -> bool:
        """Save extracted fields to TF_ingestion_fields table"""
        try:
            connection_string = f"""
            DRIVER={{ODBC Driver 17 for SQL Server}};
            SERVER={self.sql_server};
            DATABASE={self.sql_database};
            UID={self.sql_user};
            PWD={self.sql_password};
            Encrypt=yes;
            TrustServerCertificate=no;
            Connection Timeout=30;
            """
            
            conn = pyodbc.connect(connection_string)
            cursor = conn.cursor()
            
            # Insert each extracted field as a separate record
            fields = extracted_data.get('fields', {})
            confidence_scores = extracted_data.get('confidence_scores', {})
            
            insert_query = """
            INSERT INTO TF_ingestion_fields 
            (ingestion_id, field_name, field_value, confidence, extraction_method, data_type, created_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            
            current_time = datetime.now()
            extraction_methods = extracted_data.get('extraction_methods', ['rule_based_ai'])
            method_str = ', '.join(extraction_methods)
            
            for field_name, field_value in fields.items():
                confidence = confidence_scores.get(field_name, 0.7)
                data_type = self.detect_data_type(field_value)
                
                cursor.execute(insert_query, (
                    ingestion_id,
                    field_name,
                    str(field_value),
                    float(confidence),
                    method_str,
                    data_type,
                    current_time
                ))
            
            # Also save table data if present
            tables = extracted_data.get('azure_tables', [])
            if tables:
                table_query = """
                INSERT INTO TF_ingestion_fields 
                (ingestion_id, field_name, field_value, confidence, extraction_method, data_type, created_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """
                
                for i, table in enumerate(tables):
                    table_json = json.dumps(table)
                    cursor.execute(table_query, (
                        ingestion_id,
                        f'table_{i+1}',
                        table_json,
                        0.9,
                        'azure_ai_table',
                        'table',
                        current_time
                    ))
            
            conn.commit()
            conn.close()
            
            print(f"Successfully saved {len(fields)} fields to database for ingestion {ingestion_id}")
            return True
            
        except Exception as e:
            print(f"Database save error: {e}")
            return False

    def detect_data_type(self, value: str) -> str:
        """Detect the data type of extracted field value"""
        if re.match(r'^\d+$', value):
            return 'integer'
        elif re.match(r'^\d+\.\d+$', value):
            return 'decimal'
        elif re.match(r'^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$', value):
            return 'date'
        elif re.match(r'^[A-Z0-9\-\/]+$', value):
            return 'reference'
        elif len(value) > 50:
            return 'text_long'
        else:
            return 'text'

def main():
    """Main function for field extraction processing"""
    if len(sys.argv) != 5:
        print("Usage: python fieldExtractionService.py <file_path> <document_type> <text_content_file> <ingestion_id>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    document_type = sys.argv[2]
    text_content_file = sys.argv[3]
    ingestion_id = sys.argv[4]
    
    # Read text content from file
    try:
        with open(text_content_file, 'r', encoding='utf-8') as f:
            text_content = f.read()
    except Exception as e:
        print(f"Error reading text content: {e}")
        sys.exit(1)
    
    try:
        extractor = FieldExtractionService()
        
        print(f"Starting field extraction for {document_type} - {ingestion_id}")
        
        # Perform rule-based extraction
        print("Performing rule-based field extraction...")
        rule_based_results = extractor.extract_fields_from_text(text_content, document_type)
        
        # Perform Azure AI extraction
        print("Performing Azure AI field extraction...")
        azure_results = extractor.enhance_with_azure_ai(file_path, document_type)
        
        # Combine results
        print("Combining extraction results...")
        final_results = extractor.combine_extraction_results(rule_based_results, azure_results)
        
        # Save to database
        print("Saving extracted fields to database...")
        success = extractor.save_to_database(ingestion_id, final_results)
        
        # Output results
        output_data = {
            'success': success,
            'extracted_fields_count': len(final_results.get('fields', {})),
            'fields': final_results.get('fields', {}),
            'confidence_scores': final_results.get('confidence_scores', {}),
            'extraction_methods': final_results.get('extraction_methods', []),
            'tables_count': len(final_results.get('azure_tables', []))
        }
        
        print("FIELD_EXTRACTION_RESULT:", json.dumps(output_data))
        
    except Exception as e:
        error_data = {
            'success': False,
            'error': str(e),
            'extracted_fields_count': 0
        }
        print("FIELD_EXTRACTION_ERROR:", json.dumps(error_data))
        sys.exit(1)

if __name__ == "__main__":
    main()
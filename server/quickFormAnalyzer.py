#!/usr/bin/env python3
import sys
import json
import fitz
import re

def analyze_forms(file_path):
    """Quick form type analysis"""
    try:
        doc = fitz.open(file_path)
        forms_found = []
        
        # Define form signatures with patterns
        signatures = {
            'Certificate of Origin': ['certificate.*origin', 'country.*origin', 'chamber.*commerce'],
            'Commercial Invoice': ['commercial.*invoice', 'invoice.*no', 'seller', 'buyer'],
            'Bill of Lading': ['bill.*lading', 'b/l.*no', 'vessel', 'shipper', 'consignee'],
            'Letter of Credit': ['documentary.*credit', 'letter.*credit', 'l/c.*no', 'issuing.*bank'],
            'Vessel Certificate': ['vessel.*certificate', 'vessel.*name', 'flag.*nationality', 'imo.*no'],
            'Weight Certificate': ['certificate.*weight', 'net.*weight', 'gross.*weight'],
            'Inspection Certificate': ['inspection.*certificate', 'quality.*certificate', 'surveyor'],
            'Insurance Certificate': ['insurance.*certificate', 'policy.*no', 'marine.*insurance'],
            'Packing List': ['packing.*list', 'package.*no', 'cartons', 'dimensions'],
            'Bill of Exchange': ['bill.*exchange', 'drawer', 'drawee', 'payment.*order']
        }
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text().lower()
            
            for form_type, patterns in signatures.items():
                matches = sum(1 for pattern in patterns if re.search(pattern, text))
                if matches > 0:
                    confidence = min(95, (matches / len(patterns)) * 100 + 20)
                    forms_found.append({
                        'page': page_num + 1,
                        'form_type': form_type,
                        'confidence': round(confidence, 1),
                        'matches': matches,
                        'text_preview': text[:200].replace('\n', ' ')
                    })
        
        doc.close()
        
        # Group by form type
        unique_forms = {}
        for form in forms_found:
            form_type = form['form_type']
            if form_type not in unique_forms or form['confidence'] > unique_forms[form_type]['confidence']:
                unique_forms[form_type] = form
        
        return {
            'total_pages': len(doc),
            'unique_forms_detected': len(unique_forms),
            'forms': list(unique_forms.values())
        }
        
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 quickFormAnalyzer.py <file_path>'}))
        sys.exit(1)
    
    result = analyze_forms(sys.argv[1])
    print(json.dumps(result, indent=2))
# Discrepancy Detection Logic for LC Documents

## 1. Overview

This document outlines the logic for detecting discrepancies in Letter of Credit (LC) documents, SWIFT MT messages, and master reference documents. The logic is designed to be initially implemented through CrewAI agent prompts, with future migration to automated tools.

## 2. Agent-Driven Discrepancy Detection Framework

### 2.1 Agent Roles and Responsibilities

#### Document Intake Agent
**Prompt Template:**
```
Analyze the provided document and classify it as one of the following:
1. SWIFT MT Message (specify type: MT700, MT710, etc.)
2. LC Document (specify type: Commercial Invoice, Bill of Lading, etc.)
3. Master Reference Document

Extract key metadata including:
- Document ID/Reference Number
- Date
- Issuing Party
- Document Type
- Key Parties (Applicant, Beneficiary, etc.)

Format the output as structured JSON for downstream processing.
```

#### MT Message Agent
**Prompt Template:**
```
Analyze the provided SWIFT MT message of type {message_type}.
Extract all fields according to the SWIFT standard format.
For each field, determine:
- Field code and name
- Field content
- Whether it is mandatory, conditional, or optional
- Any format requirements or restrictions

Identify any missing mandatory fields or format violations.
Format the output as structured JSON for comparison.
```

#### LC Document Agent
**Prompt Template:**
```
Analyze the provided {document_type} document.
Extract all relevant fields according to UCP 600 requirements.
For each field, determine:
- Field name
- Field content
- Whether it is mandatory, conditional, or optional based on UCP 600
- Any format requirements or restrictions

Identify any missing mandatory fields or format violations.
Format the output as structured JSON for comparison.
```

#### Comparison Agent
**Prompt Template:**
```
Compare the following documents:
1. MT Message: {mt_message_json}
2. LC Document: {lc_document_json}
3. Master Reference: {master_reference_json}

For each comparable field, determine:
- If the field exists across all applicable documents
- If the field content is consistent across documents
- If there are any contextual inconsistencies
- If quantitative values match exactly
- If qualitative descriptions are consistent

Identify all discrepancies and classify them according to the discrepancy taxonomy.
Format the output as structured JSON for reporting.
```

#### UCP Rules Agent
**Prompt Template:**
```
Analyze the following discrepancies:
{discrepancies_json}

For each discrepancy:
1. Identify the applicable UCP 600 article(s)
2. Determine if the discrepancy constitutes a violation of UCP 600
3. Provide the specific rule reference
4. Assess the severity of the discrepancy
5. Provide an explanation in banking terminology

Format the output as structured JSON for reporting.
```

#### Reporting Agent
**Prompt Template:**
```
Generate a comprehensive discrepancy report based on:
{discrepancies_with_rules_json}

The report should include:
1. Executive summary of findings
2. Detailed list of discrepancies with:
   - Description of each discrepancy
   - UCP 600 rule reference
   - Severity classification
   - Recommended action
3. Document-specific sections
4. Cross-document inconsistencies
5. Compliance assessment

Format the report for presentation to {user_role} with appropriate level of detail.
```

### 2.2 Discrepancy Detection Workflow

1. **Document Intake and Classification**
   - Documents are submitted to the Document Intake Agent
   - Agent classifies document type and extracts metadata
   - Documents are routed to specialized agents

2. **Document-Specific Analysis**
   - MT Message Agent analyzes SWIFT messages
   - LC Document Agent analyzes LC documents
   - Both extract structured data according to standards

3. **Cross-Document Comparison**
   - Comparison Agent receives structured data from all documents
   - Performs field-by-field comparison
   - Identifies discrepancies across documents

4. **Rules Application**
   - UCP Rules Agent applies UCP 600 articles to discrepancies
   - Classifies severity and provides rule references
   - Generates explanations for each discrepancy

5. **Report Generation**
   - Reporting Agent compiles findings into comprehensive report
   - Tailors report to user role and needs
   - Provides actionable insights and recommendations

## 3. Discrepancy Detection Logic

### 3.1 Field-Level Validation

#### Mandatory Field Validation
```python
def validate_mandatory_fields(document_type, extracted_fields):
    """
    Validates that all mandatory fields for a given document type are present.
    
    Args:
        document_type: Type of document (MT700, Commercial Invoice, etc.)
        extracted_fields: Dictionary of extracted field names and values
        
    Returns:
        List of missing mandatory fields
    """
    mandatory_fields = get_mandatory_fields(document_type)
    missing_fields = []
    
    for field in mandatory_fields:
        if field not in extracted_fields or not extracted_fields[field]:
            missing_fields.append(field)
            
    return missing_fields
```

#### Format Validation
```python
def validate_field_format(field_name, field_value, document_type):
    """
    Validates that a field value matches the required format.
    
    Args:
        field_name: Name of the field
        field_value: Value of the field
        document_type: Type of document
        
    Returns:
        Boolean indicating format validity and error message if invalid
    """
    format_rules = get_format_rules(field_name, document_type)
    
    # Apply format validation logic based on field type
    if format_rules['type'] == 'date':
        return validate_date_format(field_value, format_rules['format'])
    elif format_rules['type'] == 'amount':
        return validate_amount_format(field_value, format_rules['currency'])
    elif format_rules['type'] == 'text':
        return validate_text_format(field_value, format_rules['max_length'])
    # Add more format validations as needed
    
    return True, ""
```

### 3.2 Cross-Document Comparison

#### Field Consistency Check
```python
def check_field_consistency(field_name, documents):
    """
    Checks if a field is consistent across multiple documents.
    
    Args:
        field_name: Name of the field to check
        documents: Dictionary of document types and their extracted fields
        
    Returns:
        Boolean indicating consistency and description of inconsistency if any
    """
    field_values = {}
    
    for doc_type, fields in documents.items():
        if field_name in fields:
            field_values[doc_type] = fields[field_name]
    
    # If field appears in only one document, it's consistent by default
    if len(field_values) <= 1:
        return True, ""
    
    # Check if all values are identical
    unique_values = set(field_values.values())
    if len(unique_values) == 1:
        return True, ""
    
    # If values differ, return inconsistency details
    return False, f"Field '{field_name}' has inconsistent values: {field_values}"
```

#### Quantitative Comparison
```python
def compare_quantitative_fields(field_name, documents, tolerance=0):
    """
    Compares quantitative fields across documents with optional tolerance.
    
    Args:
        field_name: Name of the quantitative field
        documents: Dictionary of document types and their extracted fields
        tolerance: Acceptable difference tolerance (percentage or absolute)
        
    Returns:
        Boolean indicating consistency and description of inconsistency if any
    """
    field_values = {}
    
    for doc_type, fields in documents.items():
        if field_name in fields:
            try:
                field_values[doc_type] = float(fields[field_name])
            except ValueError:
                return False, f"Field '{field_name}' in {doc_type} is not a valid number: {fields[field_name]}"
    
    # If field appears in only one document, it's consistent by default
    if len(field_values) <= 1:
        return True, ""
    
    # Check if values are within tolerance
    min_value = min(field_values.values())
    max_value = max(field_values.values())
    
    if tolerance_type == 'percentage':
        if max_value <= min_value * (1 + tolerance/100):
            return True, ""
    else:  # absolute tolerance
        if max_value - min_value <= tolerance:
            return True, ""
    
    return False, f"Field '{field_name}' values exceed tolerance: {field_values}"
```

### 3.3 Context-Aware Validation

```python
def validate_field_context(field_name, field_value, document_context):
    """
    Validates a field value within the context of the entire document.
    
    Args:
        field_name: Name of the field
        field_value: Value of the field
        document_context: Dictionary containing all fields and document metadata
        
    Returns:
        Boolean indicating validity and error message if invalid
    """
    # Example: Shipment date must be before expiry date
    if field_name == 'shipment_date' and 'expiry_date' in document_context:
        shipment_date = parse_date(field_value)
        expiry_date = parse_date(document_context['expiry_date'])
        
        if shipment_date > expiry_date:
            return False, "Shipment date is after expiry date"
    
    # Example: Invoice amount must not exceed credit amount
    if field_name == 'invoice_amount' and 'credit_amount' in document_context:
        invoice_amount = parse_amount(field_value)
        credit_amount = parse_amount(document_context['credit_amount'])
        
        if invoice_amount > credit_amount:
            return False, "Invoice amount exceeds credit amount"
    
    # Add more context validations based on UCP 600 rules
    
    return True, ""
```

### 3.4 UCP Rule Application

```python
def apply_ucp_rules(discrepancy, document_type):
    """
    Applies UCP 600 rules to a detected discrepancy.
    
    Args:
        discrepancy: Dictionary describing the discrepancy
        document_type: Type of document where discrepancy was found
        
    Returns:
        Dictionary with UCP rule reference, severity, and explanation
    """
    rule_mapping = get_ucp_rule_mapping()
    
    # Find applicable UCP rule
    applicable_rules = []
    for rule_id, rule_info in rule_mapping.items():
        if (discrepancy['type'] in rule_info['discrepancy_types'] and
            document_type in rule_info['document_types']):
            applicable_rules.append({
                'rule_id': rule_id,
                'article': rule_info['article'],
                'severity': rule_info['severity'],
                'explanation': rule_info['explanation_template'].format(
                    field=discrepancy['field'],
                    expected=discrepancy.get('expected', 'N/A'),
                    actual=discrepancy.get('actual', 'N/A')
                )
            })
    
    return applicable_rules if applicable_rules else [{
        'rule_id': 'unknown',
        'article': 'N/A',
        'severity': 'unknown',
        'explanation': f"No specific UCP rule found for this discrepancy: {discrepancy['description']}"
    }]
```

## 4. Discrepancy Classification Taxonomy

### 4.1 Discrepancy Types

1. **Missing Mandatory Field**
   - A required field is absent from the document
   - Severity: High
   - UCP Reference: Varies by document type

2. **Field Format Violation**
   - Field exists but does not conform to required format
   - Severity: Medium to High
   - UCP Reference: Varies by field type

3. **Data Inconsistency**
   - Same field has different values across documents
   - Severity: High
   - UCP Reference: Article 14(d)

4. **Contextual Violation**
   - Field value violates contextual rules
   - Severity: Medium to High
   - UCP Reference: Varies by context

5. **Quantitative Discrepancy**
   - Numeric values do not match exactly
   - Severity: High for amounts, Medium for quantities
   - UCP Reference: Article 18(b) for amounts

6. **Qualitative Discrepancy**
   - Descriptions or qualitative data do not match
   - Severity: Medium
   - UCP Reference: Article 14(e)

7. **Document Presentation Timing**
   - Document presented outside allowed timeframe
   - Severity: High
   - UCP Reference: Article 14(c)

8. **Document Format Issue**
   - Document does not meet format requirements
   - Severity: Medium
   - UCP Reference: Article 17

### 4.2 Severity Levels

1. **Critical**
   - Discrepancy that will definitely lead to rejection
   - Violates fundamental LC requirements
   - Example: Missing Bill of Lading

2. **High**
   - Discrepancy likely to lead to rejection
   - Violates important LC terms
   - Example: Invoice amount exceeds credit amount

3. **Medium**
   - Discrepancy that may lead to rejection
   - Depends on bank's discretion
   - Example: Minor description inconsistencies

4. **Low**
   - Minor discrepancy unlikely to lead to rejection
   - Technical or formatting issue
   - Example: Non-material typos

## 5. Implementation Considerations for Agent Prompts

1. **Structured Output Format**
   - All agent outputs should use consistent JSON structure
   - Field names should be standardized across agents
   - Nested objects should be used for complex data

2. **Error Handling**
   - Agents should gracefully handle missing or malformed documents
   - Unclear cases should be flagged for human review
   - Confidence levels should be included where appropriate

3. **Context Preservation**
   - Document context should be maintained throughout the workflow
   - Related fields should be grouped for contextual validation
   - Document metadata should be preserved for reference

4. **Extensibility**
   - Logic should be modular to accommodate new document types
   - Rule references should be externalized for easy updates
   - Validation functions should be reusable across document types

5. **Future Tool Migration Path**
   - Agent prompts should map to discrete functions
   - Data structures should be consistent with API requirements
   - Logic should be separable from prompt mechanics

## 6. Example Agent Interaction Flow

1. **Document Intake**
   ```
   User: "Here is a Commercial Invoice for LC #12345"
   Document Intake Agent: [Analyzes document]
   "Document classified as Commercial Invoice.
   Metadata extracted:
   - Invoice Number: INV-2025-001
   - Date: 2025-05-15
   - Issuer: ABC Trading Co.
   - Applicant: XYZ Imports Ltd.
   - Currency: USD
   - Amount: 50,000.00"
   ```

2. **Document-Specific Analysis**
   ```
   LC Document Agent: [Analyzes Commercial Invoice]
   "Commercial Invoice analysis complete.
   Extracted 15 fields including:
   - Invoice Number: INV-2025-001
   - Description of Goods: 100 units of Model X Widgets
   - Shipment Terms: CIF New York
   - Payment Terms: 30 days
   
   Mandatory field check: All mandatory fields present.
   Format check: All fields in correct format."
   ```

3. **Cross-Document Comparison**
   ```
   Comparison Agent: [Compares with MT700 and Master Document]
   "Cross-document comparison complete.
   Found 3 discrepancies:
   1. Description of Goods differs between Invoice and MT700
      - Invoice: "100 units of Model X Widgets"
      - MT700: "100 units of Model X Machines"
   2. Invoice Amount (50,000.00 USD) exceeds Credit Amount (45,000.00 USD)
   3. Shipment Date on B/L (2025-05-20) is after Latest Shipment Date in LC (2025-05-18)"
   ```

4. **Rules Application**
   ```
   UCP Rules Agent: [Applies UCP 600 rules]
   "UCP 600 rule application complete:
   1. Description discrepancy: Article 14(e) - Medium severity
      Explanation: In documents other than the commercial invoice, the description of the goods may be in general terms not conflicting with their description in the credit.
   2. Amount discrepancy: Article 18(b) - High severity
      Explanation: A nominated bank may accept a commercial invoice issued for an amount in excess of the amount permitted by the credit, and its decision will be binding upon all parties, provided the bank in question has not honored or negotiated for an amount in excess of that permitted by the credit.
   3. Shipment Date discrepancy: Article 14(c) - Critical severity
      Explanation: A presentation including one or more original transport documents must be made not later than 21 calendar days after the date of shipment, but in any event not later than the expiry date of the credit."
   ```

5. **Reporting**
   ```
   Reporting Agent: [Generates report]
   "Discrepancy Report for LC #12345:
   
   Executive Summary:
   3 discrepancies detected (1 Critical, 1 High, 1 Medium)
   Documents likely to be rejected due to late shipment date.
   
   Detailed Findings:
   [Detailed breakdown of each discrepancy with UCP references]
   
   Recommended Actions:
   1. Request amendment to LC for shipment date
   2. Verify goods description and resolve inconsistency
   3. Confirm if bank will accept invoice amount excess"
   ```

## 7. Future Tool Migration Considerations

The agent-driven approach is designed to transition smoothly to tool-based automation by:

1. **Modular Function Design**
   - Each agent prompt maps to discrete functions
   - Input/output formats are consistent and structured
   - Logic is separated from prompt mechanics

2. **Standardized Data Structures**
   - JSON schemas for all document types
   - Consistent field naming conventions
   - Structured discrepancy representation

3. **Rule Externalization**
   - UCP rules stored in external repository
   - Rule application logic separated from rules themselves
   - Versioning support for rule updates

4. **API-Ready Architecture**
   - Functions designed for API integration
   - Stateless processing where possible
   - Clear input/output contracts

When transitioning to tools, the agent prompts will serve as functional specifications for the tool implementation, ensuring consistency in logic and approach.

"""
LC Document Discrepancy Detection System - CrewAI Agent Implementation

This module implements the CrewAI agents for detecting discrepancies in Letter of Credit documents.
"""

from crewai import Agent, Task, Crew, Process
from langchain.tools import BaseTool
from typing import Dict, List, Any, Optional
import json
import os
import re
from datetime import datetime

# Define UCP rules and document requirements
UCP_RULES = {
    "article_14d": {
        "description": "Data in a document, when read in context with the credit, the document itself and international standard banking practice, need not be identical to, but must not conflict with, data in that document, any other stipulated document or the credit.",
        "severity": "high"
    },
    "article_14e": {
        "description": "In documents other than the commercial invoice, the description of the goods, services or performance, if stated, may be in general terms not conflicting with their description in the credit.",
        "severity": "medium"
    },
    "article_18b": {
        "description": "A nominated bank acting on its nomination, a confirming bank, if any, or the issuing bank may accept a commercial invoice issued for an amount in excess of the amount permitted by the credit, and its decision will be binding upon all parties, provided the bank in question has not honoured or negotiated for an amount in excess of that permitted by the credit.",
        "severity": "high"
    },
    # Add more UCP rules as needed
}

# Document field requirements
DOCUMENT_FIELDS = {
    "commercial_invoice": {
        "mandatory": ["invoice_number", "date", "applicant", "beneficiary", "currency", "amount", "description_of_goods"],
        "conditional": ["shipment_terms", "payment_terms"],
        "optional": ["reference_number", "contact_details"]
    },
    "bill_of_lading": {
        "mandatory": ["bl_number", "carrier", "vessel_name", "port_of_loading", "port_of_discharge", "shipper", "consignee", "description_of_goods", "shipping_date"],
        "conditional": ["notify_party", "freight_terms"],
        "optional": ["marks_and_numbers", "container_numbers"]
    },
    "mt700": {
        "mandatory": ["27", "40A", "31D", "50", "59", "32B", "39A", "41D", "42C", "42D", "43P", "44A", "45A"],
        "conditional": ["71B", "46A", "47A", "49"],
        "optional": ["23", "31C", "48", "49", "78", "57A", "72Z"]
    },
    # Add more document types as needed
}

# Define tools for agents
class DocumentParsingTool(BaseTool):
    name = "document_parser"
    description = "Parses different types of LC documents and extracts structured data"
    
    def _run(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """
        Simulates parsing a document and extracting structured data
        
        Args:
            document_path: Path to the document file
            document_type: Type of document (commercial_invoice, bill_of_lading, mt700, etc.)
            
        Returns:
            Dictionary of extracted fields and values
        """
        # In a real implementation, this would use OCR, PDF parsing, or text extraction
        # For this sample, we'll return mock data
        
        if document_type == "commercial_invoice":
            return {
                "invoice_number": "INV-2025-001",
                "date": "2025-05-15",
                "applicant": "XYZ Imports Ltd.",
                "beneficiary": "ABC Trading Co.",
                "currency": "USD",
                "amount": "50000.00",
                "description_of_goods": "100 units of Model X Widgets",
                "shipment_terms": "CIF New York",
                "payment_terms": "30 days"
            }
        elif document_type == "bill_of_lading":
            return {
                "bl_number": "BL-2025-123456",
                "carrier": "Ocean Shipping Co.",
                "vessel_name": "Pacific Star",
                "port_of_loading": "Shanghai",
                "port_of_discharge": "New York",
                "shipper": "ABC Trading Co.",
                "consignee": "XYZ Imports Ltd.",
                "description_of_goods": "100 units of Model X Widgets",
                "shipping_date": "2025-05-20",
                "notify_party": "XYZ Imports Ltd.",
                "freight_terms": "Prepaid"
            }
        elif document_type == "mt700":
            return {
                "27": "1/1",
                "40A": "IRREVOCABLE",
                "20": "LC123456789",
                "31D": "250518",
                "50": "XYZ Imports Ltd.",
                "59": "ABC Trading Co.",
                "32B": "USD45000,00",
                "39A": "5PCT",
                "41D": "BY NEGOTIATION",
                "42C": "AT SIGHT",
                "42D": "CITIBANK NY",
                "43P": "NOT ALLOWED",
                "44A": "SHANGHAI/CHINA",
                "44B": "NEW YORK/USA",
                "45A": "100 units of Model X Machines"
            }
        else:
            return {"error": f"Unknown document type: {document_type}"}

class DiscrepancyDetectionTool(BaseTool):
    name = "discrepancy_detector"
    description = "Detects discrepancies between LC documents based on UCP 600 rules"
    
    def _run(self, documents: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detects discrepancies between documents
        
        Args:
            documents: Dictionary of document types and their extracted fields
            
        Returns:
            List of detected discrepancies
        """
        discrepancies = []
        
        # Check for description of goods discrepancy
        if "commercial_invoice" in documents and "mt700" in documents:
            invoice_desc = documents["commercial_invoice"].get("description_of_goods", "")
            mt700_desc = documents["mt700"].get("45A", "")
            
            if invoice_desc and mt700_desc and invoice_desc != mt700_desc:
                discrepancies.append({
                    "type": "data_inconsistency",
                    "field": "description_of_goods",
                    "documents": ["commercial_invoice", "mt700"],
                    "values": {
                        "commercial_invoice": invoice_desc,
                        "mt700": mt700_desc
                    },
                    "ucp_reference": "article_14d",
                    "severity": UCP_RULES["article_14d"]["severity"],
                    "description": f"Description of goods differs between Commercial Invoice and MT700"
                })
        
        # Check for amount discrepancy
        if "commercial_invoice" in documents and "mt700" in documents:
            try:
                invoice_amount = float(documents["commercial_invoice"].get("amount", "0").replace(",", ""))
                mt700_amount = float(documents["mt700"].get("32B", "0").replace("USD", "").replace(",", ""))
                
                if invoice_amount > mt700_amount:
                    discrepancies.append({
                        "type": "quantitative_discrepancy",
                        "field": "amount",
                        "documents": ["commercial_invoice", "mt700"],
                        "values": {
                            "commercial_invoice": invoice_amount,
                            "mt700": mt700_amount
                        },
                        "ucp_reference": "article_18b",
                        "severity": UCP_RULES["article_18b"]["severity"],
                        "description": f"Invoice amount ({invoice_amount}) exceeds credit amount ({mt700_amount})"
                    })
            except ValueError:
                discrepancies.append({
                    "type": "format_violation",
                    "field": "amount",
                    "documents": ["commercial_invoice", "mt700"],
                    "description": "Could not parse amount values for comparison"
                })
        
        # Check for shipment date discrepancy
        if "bill_of_lading" in documents and "mt700" in documents:
            try:
                bl_date = datetime.strptime(documents["bill_of_lading"].get("shipping_date", ""), "%Y-%m-%d")
                lc_date = datetime.strptime(documents["mt700"].get("31D", ""), "%y%m%d")
                
                if bl_date > lc_date:
                    discrepancies.append({
                        "type": "contextual_violation",
                        "field": "shipping_date",
                        "documents": ["bill_of_lading", "mt700"],
                        "values": {
                            "bill_of_lading": bl_date.strftime("%Y-%m-%d"),
                            "mt700": lc_date.strftime("%Y-%m-%d")
                        },
                        "ucp_reference": "article_14c",
                        "severity": "critical",
                        "description": f"Shipping date ({bl_date.strftime('%Y-%m-%d')}) is after LC expiry date ({lc_date.strftime('%Y-%m-%d')})"
                    })
            except ValueError:
                discrepancies.append({
                    "type": "format_violation",
                    "field": "date",
                    "documents": ["bill_of_lading", "mt700"],
                    "description": "Could not parse date values for comparison"
                })
        
        return discrepancies

class UcpRuleApplicationTool(BaseTool):
    name = "ucp_rule_applier"
    description = "Applies UCP 600 rules to detected discrepancies"
    
    def _run(self, discrepancies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Applies UCP 600 rules to discrepancies and adds explanations
        
        Args:
            discrepancies: List of detected discrepancies
            
        Returns:
            Enhanced discrepancies with UCP rule explanations
        """
        for discrepancy in discrepancies:
            if "ucp_reference" in discrepancy and discrepancy["ucp_reference"] in UCP_RULES:
                rule = UCP_RULES[discrepancy["ucp_reference"]]
                discrepancy["rule_explanation"] = rule["description"]
                
                # Add specific advice based on discrepancy type
                if discrepancy["type"] == "data_inconsistency" and discrepancy["field"] == "description_of_goods":
                    discrepancy["advice"] = "Ensure descriptions are consistent or use more general terms in documents other than the commercial invoice."
                elif discrepancy["type"] == "quantitative_discrepancy" and discrepancy["field"] == "amount":
                    discrepancy["advice"] = "Check if the nominated bank is willing to accept the invoice with an amount exceeding the credit amount."
                elif discrepancy["type"] == "contextual_violation" and discrepancy["field"] == "shipping_date":
                    discrepancy["advice"] = "Request amendment to the LC to extend the expiry date or consider requesting a new LC."
        
        return discrepancies

# Define CrewAI agents
document_intake_agent = Agent(
    role="Document Intake Specialist",
    goal="Accurately classify and extract metadata from LC documents",
    backstory="""You are an expert in trade finance documentation with years of experience handling Letters of Credit. 
    Your specialty is quickly identifying document types and extracting key metadata to route them for further processing.""",
    verbose=True,
    allow_delegation=False,
    tools=[DocumentParsingTool()]
)

mt_message_agent = Agent(
    role="SWIFT MT Message Analyst",
    goal="Extract and validate all fields from SWIFT MT messages according to standards",
    backstory="""You are a SWIFT messaging expert with deep knowledge of MT message formats and requirements.
    You can parse complex MT messages and identify any missing or incorrectly formatted fields.""",
    verbose=True,
    allow_delegation=False,
    tools=[DocumentParsingTool()]
)

lc_document_agent = Agent(
    role="LC Document Specialist",
    goal="Analyze LC documents for compliance with UCP 600 requirements",
    backstory="""You are a trade finance document specialist with extensive knowledge of UCP 600 rules.
    You meticulously check each document for compliance with international standards and banking practices.""",
    verbose=True,
    allow_delegation=False,
    tools=[DocumentParsingTool()]
)

comparison_agent = Agent(
    role="Document Comparison Analyst",
    goal="Identify discrepancies between LC documents and MT messages",
    backstory="""You are a detail-oriented analyst specializing in cross-document comparison.
    Your keen eye for inconsistencies helps banks avoid costly errors in trade finance transactions.""",
    verbose=True,
    allow_delegation=False,
    tools=[DiscrepancyDetectionTool()]
)

ucp_rules_agent = Agent(
    role="UCP 600 Compliance Expert",
    goal="Apply UCP 600 rules to identified discrepancies and provide explanations",
    backstory="""You are a recognized authority on UCP 600 with years of experience in international trade finance.
    Banks rely on your expertise to interpret complex rules and determine the severity of document discrepancies.""",
    verbose=True,
    allow_delegation=False,
    tools=[UcpRuleApplicationTool()]
)

reporting_agent = Agent(
    role="Discrepancy Reporting Specialist",
    goal="Generate comprehensive, actionable discrepancy reports for bank officers",
    backstory="""You are an experienced trade finance professional who excels at communicating complex findings clearly.
    Your reports help bank officers make informed decisions about LC document acceptance or rejection.""",
    verbose=True,
    allow_delegation=False
)

# Define tasks
document_intake_task = Task(
    description="""
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
    """,
    agent=document_intake_agent,
    expected_output="JSON object with document classification and metadata"
)

mt_message_analysis_task = Task(
    description="""
    Analyze the provided SWIFT MT message.
    Extract all fields according to the SWIFT standard format.
    For each field, determine:
    - Field code and name
    - Field content
    - Whether it is mandatory, conditional, or optional
    - Any format requirements or restrictions

    Identify any missing mandatory fields or format violations.
    Format the output as structured JSON for comparison.
    """,
    agent=mt_message_agent,
    expected_output="JSON object with extracted MT message fields and validation results"
)

lc_document_analysis_task = Task(
    description="""
    Analyze the provided LC document.
    Extract all relevant fields according to UCP 600 requirements.
    For each field, determine:
    - Field name
    - Field content
    - Whether it is mandatory, conditional, or optional based on UCP 600
    - Any format requirements or restrictions

    Identify any missing mandatory fields or format violations.
    Format the output as structured JSON for comparison.
    """,
    agent=lc_document_agent,
    expected_output="JSON object with extracted LC document fields and validation results"
)

comparison_task = Task(
    description="""
    Compare the following documents:
    1. MT Message
    2. LC Document
    3. Master Reference (if available)

    For each comparable field, determine:
    - If the field exists across all applicable documents
    - If the field content is consistent across documents
    - If there are any contextual inconsistencies
    - If quantitative values match exactly
    - If qualitative descriptions are consistent

    Identify all discrepancies and classify them according to the discrepancy taxonomy.
    Format the output as structured JSON for reporting.
    """,
    agent=comparison_agent,
    expected_output="JSON array of detected discrepancies with classification"
)

ucp_rules_task = Task(
    description="""
    Analyze the detected discrepancies.
    For each discrepancy:
    1. Identify the applicable UCP 600 article(s)
    2. Determine if the discrepancy constitutes a violation of UCP 600
    3. Provide the specific rule reference
    4. Assess the severity of the discrepancy
    5. Provide an explanation in banking terminology
    6. Suggest possible remediation actions

    Format the output as structured JSON for reporting.
    """,
    agent=ucp_rules_agent,
    expected_output="JSON array of discrepancies with UCP rule applications and explanations"
)

reporting_task = Task(
    description="""
    Generate a comprehensive discrepancy report based on the analyzed discrepancies.
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
    6. Overall recommendation (Accept/Reject/Seek Amendment)

    Format the report for presentation to bank officers with appropriate level of detail.
    """,
    agent=reporting_agent,
    expected_output="Comprehensive discrepancy report in markdown format"
)

# Create the crew
lc_discrepancy_crew = Crew(
    agents=[document_intake_agent, mt_message_agent, lc_document_agent, comparison_agent, ucp_rules_agent, reporting_agent],
    tasks=[document_intake_task, mt_message_analysis_task, lc_document_analysis_task, comparison_task, ucp_rules_task, reporting_task],
    verbose=2,
    process=Process.sequential  # Tasks will be executed in the order defined
)

# Example usage
def main():
    """
    Example of how to use the LC Discrepancy Detection Crew
    """
    print("Starting LC Document Discrepancy Detection")
    result = lc_discrepancy_crew.kickoff()
    print("\nFinal Report:")
    print(result)
    
    # In a real implementation, this would trigger the callback method
    # after discrepancy detection is complete
    if "discrepancies" in result:
        print("\nTriggering external callback with discrepancy results")
        # callback_after_discrepancy(result["discrepancies"])

if __name__ == "__main__":
    main()

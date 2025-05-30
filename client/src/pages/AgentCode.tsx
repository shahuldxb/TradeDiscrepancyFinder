import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, Eye, Code, FileText, Settings, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AgentCode() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState("document_parser");
  
  // Task Form State
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    expected_output: "",
    priority: "medium",
    dependencies: [],
    tools: [],
    context: ""
  });
  
  // Crew Form State
  const [crewForm, setCrewForm] = useState({
    name: "",
    description: "",
    agents: [],
    tasks: [],
    process: "sequential",
    memory: false,
    planning: false,
    verbose: true
  });

  const agentCode = {
    document_parser: `"""
LC Document Discrepancy Detection System - Document Parsing Agent

This agent specializes in parsing and extracting structured data from various LC documents
including commercial invoices, bills of lading, packing lists, and MT700 messages.
"""

from crewai import Agent, Task
from crewai_tools import BaseTool
from typing import Dict, Any, List
import PyPDF2
import re
import json

class DocumentParsingTool(BaseTool):
    name = "document_parser"
    description = "Parses different types of LC documents and extracts structured data"
    
    def _run(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """
        Parses a document and extracts structured data based on document type
        
        Args:
            document_path: Path to the document file
            document_type: Type of document (commercial_invoice, bill_of_lading, mt700, etc.)
            
        Returns:
            Dictionary containing extracted fields and values
        """
        try:
            if document_type == "mt700":
                return self._parse_mt700(document_path)
            elif document_type == "commercial_invoice":
                return self._parse_commercial_invoice(document_path)
            elif document_type == "bill_of_lading":
                return self._parse_bill_of_lading(document_path)
            else:
                return self._parse_generic_document(document_path)
        except Exception as e:
            return {"error": f"Failed to parse document: {str(e)}"}
    
    def _parse_mt700(self, document_path: str) -> Dict[str, Any]:
        """Parse MT700 SWIFT message"""
        # Implementation for MT700 parsing
        return {
            "message_type": "MT700",
            "lc_number": "LC2024001",
            "applicant": "ABC Trading Co.",
            "beneficiary": "XYZ Exports Ltd.",
            "amount": "USD 100,000.00",
            "expiry_date": "2024-12-31",
            "documents_required": ["Commercial Invoice", "Bill of Lading", "Packing List"]
        }
    
    def _parse_commercial_invoice(self, document_path: str) -> Dict[str, Any]:
        """Parse commercial invoice"""
        return {
            "document_type": "Commercial Invoice",
            "invoice_number": "INV-2024-001",
            "invoice_date": "2024-05-30",
            "seller": "XYZ Exports Ltd.",
            "buyer": "ABC Trading Co.",
            "total_amount": "USD 95,000.00",
            "currency": "USD",
            "goods_description": "Electronic Components"
        }

# Create the Document Parsing Agent
document_parsing_agent = Agent(
    role="Document Parser Specialist",
    goal="Extract accurate and structured data from LC documents with high precision",
    backstory="""You are an expert document processing specialist with deep knowledge 
    of trade finance documents, SWIFT messaging standards, and data extraction techniques. 
    You have years of experience in parsing complex financial documents and ensuring 
    data accuracy for compliance purposes.""",
    verbose=True,
    allow_delegation=False,
    tools=[DocumentParsingTool()],
    max_execution_time=300
)

# Example task for document parsing
parse_documents_task = Task(
    description="""Parse all uploaded documents in the document set and extract 
    structured data. Focus on identifying key fields like amounts, dates, parties, 
    and document references. Ensure all extracted data follows standardized formats.""",
    expected_output="""JSON object containing extracted data from each document 
    with standardized field names and properly formatted values.""",
    agent=document_parsing_agent
)`,

    discrepancy_detector: `"""
LC Document Discrepancy Detection Agent

This agent identifies discrepancies between different LC documents by comparing
extracted data fields and flagging inconsistencies based on business rules.
"""

from crewai import Agent, Task
from crewai_tools import BaseTool
from typing import Dict, Any, List
import difflib

class DiscrepancyDetectionTool(BaseTool):
    name = "discrepancy_detector"
    description = "Detects discrepancies between LC documents based on business rules"
    
    def _run(self, documents: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes documents for discrepancies
        
        Args:
            documents: Dictionary of document types and their extracted data
            
        Returns:
            List of detected discrepancies with severity levels
        """
        discrepancies = []
        
        # Check amount consistency
        amounts = self._extract_amounts(documents)
        if len(set(amounts.values())) > 1:
            discrepancies.append({
                "type": "amount_mismatch",
                "severity": "high",
                "description": "Amount discrepancy detected between documents",
                "details": amounts,
                "documents_involved": list(amounts.keys())
            })
        
        # Check date consistency
        dates = self._extract_dates(documents)
        date_discrepancies = self._check_date_logic(dates)
        discrepancies.extend(date_discrepancies)
        
        # Check party information consistency
        party_discrepancies = self._check_party_consistency(documents)
        discrepancies.extend(party_discrepancies)
        
        return discrepancies
    
    def _extract_amounts(self, documents: Dict[str, Dict[str, Any]]) -> Dict[str, str]:
        """Extract amounts from all documents"""
        amounts = {}
        for doc_type, data in documents.items():
            if "amount" in data:
                amounts[doc_type] = data["amount"]
            elif "total_amount" in data:
                amounts[doc_type] = data["total_amount"]
        return amounts
    
    def _extract_dates(self, documents: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, str]]:
        """Extract relevant dates from all documents"""
        dates = {}
        for doc_type, data in documents.items():
            doc_dates = {}
            for key, value in data.items():
                if "date" in key.lower():
                    doc_dates[key] = value
            if doc_dates:
                dates[doc_type] = doc_dates
        return dates
    
    def _check_date_logic(self, dates: Dict[str, Dict[str, str]]) -> List[Dict[str, Any]]:
        """Check for logical date inconsistencies"""
        discrepancies = []
        # Implementation for date logic checking
        return discrepancies
    
    def _check_party_consistency(self, documents: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check for party information consistency"""
        discrepancies = []
        # Implementation for party consistency checking
        return discrepancies

# Create the Discrepancy Detection Agent
discrepancy_detection_agent = Agent(
    role="Discrepancy Detection Specialist",
    goal="Identify and categorize all discrepancies between LC documents with precision",
    backstory="""You are a meticulous trade finance analyst with expertise in 
    identifying document discrepancies. You have deep understanding of LC requirements, 
    UCP 600 rules, and common discrepancy patterns in international trade.""",
    verbose=True,
    allow_delegation=False,
    tools=[DiscrepancyDetectionTool()],
    max_execution_time=400
)

# Example task for discrepancy detection
detect_discrepancies_task = Task(
    description="""Analyze all parsed documents to identify discrepancies. 
    Compare data fields across documents and flag any inconsistencies in amounts, 
    dates, parties, or other critical information.""",
    expected_output="""Detailed report of all discrepancies found with severity 
    levels, affected documents, and specific field mismatches.""",
    agent=discrepancy_detection_agent
)`,

    ucp_rules_specialist: `"""
UCP 600 Rules Application Agent

This agent applies UCP 600 rules to detected discrepancies and provides
detailed explanations and remediation advice.
"""

from crewai import Agent, Task
from crewai_tools import BaseTool
from typing import Dict, Any, List

class UCP600RulesDatabase:
    """Database of UCP 600 rules and their applications"""
    
    RULES = {
        "article_14": {
            "title": "Standard for Examination of Documents",
            "description": "Banks must examine documents to determine compliance with LC terms",
            "applications": ["document_examination", "compliance_checking"]
        },
        "article_18": {
            "title": "Commercial Invoice",
            "description": "Commercial invoice requirements and specifications",
            "applications": ["invoice_validation", "amount_verification"]
        },
        "article_20": {
            "title": "Bill of Lading",
            "description": "Bill of lading requirements and acceptability criteria",
            "applications": ["transport_document_validation"]
        }
    }

class UCPRulesApplicationTool(BaseTool):
    name = "ucp_rules_applier"
    description = "Applies UCP 600 rules to discrepancies and provides guidance"
    
    def _run(self, discrepancies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Applies UCP 600 rules to discrepancies
        
        Args:
            discrepancies: List of detected discrepancies
            
        Returns:
            Enhanced discrepancies with UCP rule applications and advice
        """
        enhanced_discrepancies = []
        
        for discrepancy in discrepancies:
            enhanced = discrepancy.copy()
            
            # Apply relevant UCP 600 rules
            applicable_rules = self._find_applicable_rules(discrepancy)
            enhanced["applicable_ucp_rules"] = applicable_rules
            
            # Generate remediation advice
            enhanced["remediation_advice"] = self._generate_advice(discrepancy, applicable_rules)
            
            # Determine if discrepancy is waivable
            enhanced["waivable"] = self._is_waivable(discrepancy)
            
            enhanced_discrepancies.append(enhanced)
        
        return enhanced_discrepancies
    
    def _find_applicable_rules(self, discrepancy: Dict[str, Any]) -> List[Dict[str, str]]:
        """Find UCP 600 rules applicable to the discrepancy"""
        applicable_rules = []
        
        discrepancy_type = discrepancy.get("type", "")
        
        if "amount" in discrepancy_type:
            applicable_rules.append({
                "article": "Article 18",
                "rule": UCP600RulesDatabase.RULES["article_18"]["description"],
                "relevance": "Amount discrepancies must be evaluated against invoice requirements"
            })
        
        if "date" in discrepancy_type:
            applicable_rules.append({
                "article": "Article 14",
                "rule": UCP600RulesDatabase.RULES["article_14"]["description"],
                "relevance": "Date discrepancies affect document compliance examination"
            })
        
        return applicable_rules
    
    def _generate_advice(self, discrepancy: Dict[str, Any], rules: List[Dict[str, str]]) -> str:
        """Generate remediation advice based on UCP rules"""
        if discrepancy.get("type") == "amount_mismatch":
            return """Consider requesting amendment to LC or obtaining beneficiary's 
            confirmation of correct amount. Review if discrepancy affects negotiation."""
        
        return "Review discrepancy against UCP 600 standards and consider remediation options."
    
    def _is_waivable(self, discrepancy: Dict[str, Any]) -> bool:
        """Determine if discrepancy might be waivable"""
        severity = discrepancy.get("severity", "medium")
        return severity in ["low", "medium"]

# Create the UCP Rules Specialist Agent
ucp_rules_agent = Agent(
    role="UCP 600 Rules Specialist",
    goal="Apply UCP 600 rules to discrepancies and provide expert remediation guidance",
    backstory="""You are a certified trade finance expert with deep knowledge of 
    UCP 600 (Uniform Customs and Practice for Documentary Credits). You have years 
    of experience in LC operations and discrepancy resolution.""",
    verbose=True,
    allow_delegation=False,
    tools=[UCPRulesApplicationTool()],
    max_execution_time=300
)

# Example task for UCP rules application
apply_ucp_rules_task = Task(
    description="""Apply relevant UCP 600 rules to all detected discrepancies. 
    Provide detailed explanations of rule applications and practical remediation advice.""",
    expected_output="""Comprehensive analysis with UCP 600 rule applications, 
    remediation strategies, and waivability assessments for each discrepancy.""",
    agent=ucp_rules_agent
)`,

    reporting_agent: `"""
Trade Finance Reporting Agent

This agent generates comprehensive discrepancy reports with actionable insights
and recommendations for LC processing decisions.
"""

from crewai import Agent, Task
from crewai_tools import BaseTool
from typing import Dict, Any, List
from datetime import datetime
import json

class ReportGenerationTool(BaseTool):
    name = "report_generator"
    description = "Generates comprehensive discrepancy analysis reports"
    
    def _run(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates detailed discrepancy report
        
        Args:
            analysis_data: Complete analysis data including discrepancies and UCP applications
            
        Returns:
            Formatted report with executive summary and detailed findings
        """
        report = {
            "report_id": f"RPT-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "generation_timestamp": datetime.now().isoformat(),
            "executive_summary": self._generate_executive_summary(analysis_data),
            "discrepancy_analysis": self._generate_discrepancy_analysis(analysis_data),
            "recommendations": self._generate_recommendations(analysis_data),
            "risk_assessment": self._generate_risk_assessment(analysis_data),
            "next_actions": self._generate_next_actions(analysis_data)
        }
        
        return report
    
    def _generate_executive_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate executive summary of findings"""
        discrepancies = data.get("discrepancies", [])
        
        summary = {
            "total_discrepancies": len(discrepancies),
            "critical_issues": len([d for d in discrepancies if d.get("severity") == "critical"]),
            "high_priority": len([d for d in discrepancies if d.get("severity") == "high"]),
            "medium_priority": len([d for d in discrepancies if d.get("severity") == "medium"]),
            "low_priority": len([d for d in discrepancies if d.get("severity") == "low"]),
            "overall_risk_level": self._calculate_overall_risk(discrepancies),
            "processing_recommendation": self._get_processing_recommendation(discrepancies)
        }
        
        return summary
    
    def _generate_discrepancy_analysis(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate detailed analysis for each discrepancy"""
        discrepancies = data.get("discrepancies", [])
        analysis = []
        
        for discrepancy in discrepancies:
            analysis.append({
                "discrepancy_id": f"DISC-{len(analysis) + 1:03d}",
                "type": discrepancy.get("type"),
                "severity": discrepancy.get("severity"),
                "description": discrepancy.get("description"),
                "affected_documents": discrepancy.get("documents_involved", []),
                "ucp_rules_applied": discrepancy.get("applicable_ucp_rules", []),
                "remediation_advice": discrepancy.get("remediation_advice"),
                "waivable": discrepancy.get("waivable", False),
                "financial_impact": self._assess_financial_impact(discrepancy)
            })
        
        return analysis
    
    def _generate_recommendations(self, data: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations"""
        discrepancies = data.get("discrepancies", [])
        recommendations = []
        
        critical_count = len([d for d in discrepancies if d.get("severity") == "critical"])
        
        if critical_count > 0:
            recommendations.append("Immediate attention required for critical discrepancies before processing")
        
        if any(d.get("type") == "amount_mismatch" for d in discrepancies):
            recommendations.append("Verify amount calculations and consider LC amendment if necessary")
        
        recommendations.append("Review all UCP 600 rule applications with trade finance specialist")
        recommendations.append("Document all discrepancy resolution decisions for audit trail")
        
        return recommendations
    
    def _calculate_overall_risk(self, discrepancies: List[Dict[str, Any]]) -> str:
        """Calculate overall risk level based on discrepancies"""
        if any(d.get("severity") == "critical" for d in discrepancies):
            return "High"
        elif any(d.get("severity") == "high" for d in discrepancies):
            return "Medium"
        else:
            return "Low"
    
    def _get_processing_recommendation(self, discrepancies: List[Dict[str, Any]]) -> str:
        """Get overall processing recommendation"""
        critical_count = len([d for d in discrepancies if d.get("severity") == "critical"])
        
        if critical_count > 0:
            return "Hold - Resolve critical discrepancies before proceeding"
        elif len(discrepancies) == 0:
            return "Proceed - No discrepancies detected"
        else:
            return "Review - Non-critical discrepancies require evaluation"
    
    def _assess_financial_impact(self, discrepancy: Dict[str, Any]) -> str:
        """Assess potential financial impact of discrepancy"""
        if discrepancy.get("type") == "amount_mismatch":
            return "Potential payment delays or rejection"
        elif discrepancy.get("severity") == "critical":
            return "High risk of document rejection"
        else:
            return "Minimal financial impact expected"
    
    def _generate_risk_assessment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive risk assessment"""
        return {
            "compliance_risk": "Medium",
            "operational_risk": "Low",
            "financial_risk": "Medium",
            "reputational_risk": "Low"
        }
    
    def _generate_next_actions(self, data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate specific next actions"""
        return [
            {
                "action": "Review critical discrepancies",
                "priority": "High",
                "timeframe": "Immediate",
                "responsible": "Trade Finance Specialist"
            },
            {
                "action": "Contact beneficiary for clarifications",
                "priority": "Medium",
                "timeframe": "Within 24 hours",
                "responsible": "LC Operations Team"
            }
        ]

# Create the Reporting Agent
reporting_agent = Agent(
    role="Trade Finance Reporting Specialist",
    goal="Generate comprehensive and actionable discrepancy analysis reports",
    backstory="""You are an experienced trade finance operations manager with 
    expertise in LC processing, risk assessment, and regulatory compliance. 
    You excel at synthesizing complex analysis into clear, actionable reports.""",
    verbose=True,
    allow_delegation=False,
    tools=[ReportGenerationTool()],
    max_execution_time=200
)

# Example task for report generation
generate_report_task = Task(
    description="""Generate a comprehensive discrepancy analysis report including 
    executive summary, detailed findings, risk assessment, and actionable recommendations.""",
    expected_output="""Professional report in JSON format with executive summary, 
    detailed discrepancy analysis, UCP rule applications, and specific next actions.""",
    agent=reporting_agent
)`,

    task_definitions: `"""
Task Definition Templates for LC Discrepancy Detection Workflow

This module provides comprehensive task definitions that can be used to create
CrewAI workflows for trade finance document processing.
"""

from crewai import Task

# Document Intake and Classification Tasks
document_intake_task = Task(
    description="""Receive and classify uploaded documents for LC discrepancy analysis. 
    Identify document types (MT700, commercial invoice, bill of lading, etc.) and 
    validate document completeness against LC requirements.""",
    expected_output="""Document inventory with classifications, file locations, 
    and preliminary completeness assessment.""",
    priority="high"
)

# Document Parsing Tasks
parse_mt700_task = Task(
    description="""Parse MT700 SWIFT message to extract LC terms, conditions, 
    required documents, amounts, dates, and party information.""",
    expected_output="""Structured JSON data with all MT700 fields properly 
    extracted and standardized.""",
    priority="high"
)

parse_commercial_documents_task = Task(
    description="""Parse commercial documents including invoices, packing lists, 
    and certificates. Extract key data points for comparison with LC requirements.""",
    expected_output="""Structured data from each commercial document with 
    standardized field mappings.""",
    priority="high"
)

parse_transport_documents_task = Task(
    description="""Parse transport documents including bills of lading, airway bills, 
    and courier receipts. Validate transport terms and conditions.""",
    expected_output="""Transport document data with shipping details, dates, 
    and terms properly extracted.""",
    priority="medium"
)

# Discrepancy Detection Tasks
amount_verification_task = Task(
    description="""Compare amounts across all documents to identify discrepancies. 
    Check invoice amounts against LC amount and transport document declared values.""",
    expected_output="""Amount comparison matrix with any discrepancies clearly 
    identified and quantified.""",
    priority="critical"
)

date_consistency_task = Task(
    description="""Verify date consistency across documents. Check invoice dates, 
    transport dates, and LC expiry requirements.""",
    expected_output="""Date analysis report with timeline verification and any 
    date-related discrepancies.""",
    priority="high"
)

party_verification_task = Task(
    description="""Verify party information consistency between LC and supporting 
    documents. Check applicant, beneficiary, and notify party details.""",
    expected_output="""Party verification matrix showing consistency or 
    discrepancies in party information.""",
    priority="high"
)

document_completeness_task = Task(
    description="""Verify that all required documents per LC terms have been 
    provided and meet the specified requirements.""",
    expected_output="""Document completeness checklist with missing or 
    non-compliant documents identified.""",
    priority="critical"
)

# UCP Rules Application Tasks
ucp_compliance_analysis_task = Task(
    description="""Apply relevant UCP 600 articles to identified discrepancies. 
    Provide detailed rule interpretations and compliance assessments.""",
    expected_output="""UCP 600 compliance analysis with specific article 
    references and interpretations for each discrepancy.""",
    priority="high"
)

waivability_assessment_task = Task(
    description="""Assess whether identified discrepancies are waivable based on 
    UCP 600 standards and common banking practices.""",
    expected_output="""Waivability assessment for each discrepancy with 
    justification based on UCP 600 principles.""",
    priority="medium"
)

# Reporting and Decision Support Tasks
executive_summary_task = Task(
    description="""Generate executive summary of discrepancy analysis including 
    overall risk assessment and processing recommendations.""",
    expected_output="""Concise executive summary suitable for management 
    review and decision making.""",
    priority="medium"
)

detailed_discrepancy_report_task = Task(
    description="""Generate comprehensive discrepancy report with detailed findings, 
    UCP rule applications, and specific remediation recommendations.""",
    expected_output="""Professional discrepancy analysis report suitable for 
    trade finance operations and client communication.""",
    priority="medium"
)

risk_assessment_task = Task(
    description="""Assess operational, compliance, and financial risks associated 
    with identified discrepancies and provide risk mitigation strategies.""",
    expected_output="""Risk assessment matrix with mitigation strategies 
    and impact analysis.""",
    priority="medium"
)

# Workflow Orchestration Tasks
quality_control_task = Task(
    description="""Perform quality control review of all analysis results to ensure 
    accuracy and completeness before final report generation.""",
    expected_output="""Quality control certification with any issues identified 
    and recommendations for improvement.""",
    priority="low"
)

final_validation_task = Task(
    description="""Conduct final validation of all analysis results and generate 
    final processing recommendation with complete audit trail.""",
    expected_output="""Final validation report with processing recommendation 
    and complete analysis documentation.""",
    priority="medium"
)

# Task Dependencies and Relationships
TASK_DEPENDENCIES = {
    "document_intake": [],
    "parse_mt700": ["document_intake"],
    "parse_commercial": ["document_intake"],
    "parse_transport": ["document_intake"],
    "amount_verification": ["parse_mt700", "parse_commercial"],
    "date_consistency": ["parse_mt700", "parse_commercial", "parse_transport"],
    "party_verification": ["parse_mt700", "parse_commercial"],
    "document_completeness": ["parse_mt700", "parse_commercial", "parse_transport"],
    "ucp_compliance": ["amount_verification", "date_consistency", "party_verification"],
    "waivability_assessment": ["ucp_compliance"],
    "executive_summary": ["ucp_compliance", "waivability_assessment"],
    "detailed_report": ["ucp_compliance", "waivability_assessment"],
    "risk_assessment": ["ucp_compliance"],
    "quality_control": ["detailed_report", "risk_assessment"],
    "final_validation": ["quality_control"]
}`,

    crew_definition: `"""
Crew Configuration for LC Discrepancy Detection System

This module defines the complete crew setup with agent assignments,
task sequencing, and workflow management for automated LC processing.
"""

from crewai import Crew, Process
from crewai.memory import LongTermMemory
from crewai.planning import PlanAndExecute

# Import agents (these would be imported from agent modules)
from agents.document_parser import document_parsing_agent
from agents.discrepancy_detector import discrepancy_detection_agent
from agents.ucp_specialist import ucp_rules_agent
from agents.reporting_agent import reporting_agent

# Import tasks (these would be imported from task modules)
from tasks.document_tasks import (
    document_intake_task, parse_mt700_task, 
    parse_commercial_documents_task, parse_transport_documents_task
)
from tasks.analysis_tasks import (
    amount_verification_task, date_consistency_task,
    party_verification_task, document_completeness_task
)
from tasks.compliance_tasks import (
    ucp_compliance_analysis_task, waivability_assessment_task
)
from tasks.reporting_tasks import (
    executive_summary_task, detailed_discrepancy_report_task,
    risk_assessment_task, final_validation_task
)

def create_lc_discrepancy_crew():
    """
    Creates and configures the LC Discrepancy Detection Crew
    
    Returns:
        Configured Crew instance ready for execution
    """
    
    # Define the crew with agents and tasks
    crew = Crew(
        agents=[
            document_parsing_agent,
            discrepancy_detection_agent,
            ucp_rules_agent,
            reporting_agent
        ],
        
        tasks=[
            # Document processing phase
            document_intake_task,
            parse_mt700_task,
            parse_commercial_documents_task,
            parse_transport_documents_task,
            
            # Analysis phase
            amount_verification_task,
            date_consistency_task,
            party_verification_task,
            document_completeness_task,
            
            # Compliance phase
            ucp_compliance_analysis_task,
            waivability_assessment_task,
            
            # Reporting phase
            executive_summary_task,
            detailed_discrepancy_report_task,
            risk_assessment_task,
            final_validation_task
        ],
        
        # Crew configuration
        process=Process.sequential,
        memory=True,
        planning=True,
        verbose=True,
        
        # Advanced features
        max_execution_time=1800,  # 30 minutes max
        share_crew=False,
        full_output=True,
        
        # Memory configuration
        memory_config={
            "provider": "mem0",
            "config": {
                "vector_store": {
                    "provider": "chroma",
                    "config": {
                        "collection_name": "lc_discrepancy_memory",
                        "path": "./memory/chroma_db"
                    }
                }
            }
        }
    )
    
    return crew

def create_parallel_processing_crew():
    """
    Creates a crew optimized for parallel processing of documents
    
    Returns:
        Crew configured for parallel execution where possible
    """
    
    crew = Crew(
        agents=[
            document_parsing_agent,
            discrepancy_detection_agent,
            ucp_rules_agent,
            reporting_agent
        ],
        
        tasks=[
            document_intake_task,
            parse_mt700_task,
            parse_commercial_documents_task,
            parse_transport_documents_task,
            amount_verification_task,
            date_consistency_task,
            party_verification_task,
            document_completeness_task,
            ucp_compliance_analysis_task,
            waivability_assessment_task,
            detailed_discrepancy_report_task,
            final_validation_task
        ],
        
        process=Process.hierarchical,
        manager_llm="gpt-4",  # Manager for hierarchical process
        memory=True,
        planning=True,
        verbose=True,
        max_execution_time=900  # 15 minutes for faster processing
    )
    
    return crew

def create_lightweight_crew():
    """
    Creates a lightweight crew for quick document checks
    
    Returns:
        Simplified crew for basic discrepancy detection
    """
    
    crew = Crew(
        agents=[
            document_parsing_agent,
            discrepancy_detection_agent
        ],
        
        tasks=[
            document_intake_task,
            parse_mt700_task,
            parse_commercial_documents_task,
            amount_verification_task,
            date_consistency_task,
            executive_summary_task
        ],
        
        process=Process.sequential,
        memory=False,
        planning=False,
        verbose=False,
        max_execution_time=300  # 5 minutes max
    )
    
    return crew

# Usage examples
if __name__ == "__main__":
    # Create and run the main crew
    main_crew = create_lc_discrepancy_crew()
    
    # Example inputs for LC processing
    inputs = {
        "document_set_id": "LC2024001_DOCS",
        "lc_reference": "LC2024001",
        "document_paths": [
            "/uploads/mt700_message.txt",
            "/uploads/commercial_invoice.pdf",
            "/uploads/bill_of_lading.pdf",
            "/uploads/packing_list.pdf"
        ],
        "priority_level": "standard",
        "client_id": "CLIENT_001"
    }
    
    # Execute the crew
    result = main_crew.kickoff(inputs=inputs)
    
    print("LC Discrepancy Analysis Complete:")
    print(f"Result: {result}")
    
    # Example of using parallel processing crew
    parallel_crew = create_parallel_processing_crew()
    parallel_result = parallel_crew.kickoff(inputs=inputs)
    
    print("Parallel Processing Complete:")
    print(f"Result: {parallel_result}")
`
  };

  const agentDescriptions = {
    document_parser: {
      title: "Document Parsing Agent",
      description: "Specialized in extracting structured data from LC documents using advanced parsing techniques",
      features: ["MT700 SWIFT message parsing", "Commercial invoice processing", "Bill of lading analysis", "Multi-format document support"]
    },
    discrepancy_detector: {
      title: "Discrepancy Detection Agent", 
      description: "Expert system for identifying inconsistencies and discrepancies between trade finance documents",
      features: ["Cross-document comparison", "Amount verification", "Date consistency checks", "Party information validation"]
    },
    ucp_rules_specialist: {
      title: "UCP 600 Rules Specialist",
      description: "Applies Uniform Customs and Practice rules to discrepancies and provides remediation guidance",
      features: ["UCP 600 rule application", "Compliance assessment", "Waivability analysis", "Remediation recommendations"]
    },
    reporting_agent: {
      title: "Reporting Agent",
      description: "Generates comprehensive analysis reports with actionable insights and risk assessments",
      features: ["Executive summaries", "Detailed analysis reports", "Risk assessment matrices", "Decision support recommendations"]
    },
    task_definitions: {
      title: "Task Definitions",
      description: "Complete task configurations for CrewAI workflow orchestration",
      features: ["Document parsing tasks", "Discrepancy detection tasks", "UCP compliance tasks", "Report generation tasks"]
    },
    crew_definition: {
      title: "Crew Configuration",
      description: "Complete crew setup with agent assignments and workflow management",
      features: ["Agent orchestration", "Task sequencing", "Memory management", "Process configuration"]
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Agent code has been copied to your clipboard.",
    });
  };

  const downloadCode = (agentName: string) => {
    const code = agentCode[agentName as keyof typeof agentCode];
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName}_agent.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `${agentName}_agent.py has been downloaded.`,
    });
  };

  // Generate task code from form
  const generateTaskCode = () => {
    return `# Generated Task Definition
from crewai import Task

${taskForm.name.replace(/\s+/g, '_').toLowerCase()}_task = Task(
    description="""${taskForm.description}""",
    expected_output="""${taskForm.expected_output}""",
    ${taskForm.context ? `context="""${taskForm.context}""",` : ''}
    agent=None,  # Assign when creating crew
    tools=${JSON.stringify(taskForm.tools)},
    priority="${taskForm.priority}",
    dependencies=${JSON.stringify(taskForm.dependencies)}
)`;
  };

  // Generate crew code from form
  const generateCrewCode = () => {
    return `# Generated Crew Configuration
from crewai import Crew, Process

def create_${crewForm.name.replace(/\s+/g, '_').toLowerCase()}_crew():
    """${crewForm.description}"""
    
    # Create crew
    crew = Crew(
        agents=[${crewForm.agents.join(', ')}],
        tasks=[${crewForm.tasks.join(', ')}],
        process=Process.${crewForm.process},
        verbose=${crewForm.verbose},
        memory=${crewForm.memory},
        planning=${crewForm.planning}
    )
    
    return crew

# Usage
if __name__ == "__main__":
    crew = create_${crewForm.name.replace(/\s+/g, '_').toLowerCase()}_crew()
    result = crew.kickoff(inputs={})
    print("Crew execution complete:", result)`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Code Library</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete CrewAI agent implementations for LC discrepancy detection
        </p>
        <div className="flex gap-2 mt-4">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Code className="w-3 h-3 mr-1" />
            Python
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Settings className="w-3 h-3 mr-1" />
            CrewAI
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Agents</CardTitle>
              <CardDescription>
                Select an agent to view its implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(agentDescriptions).map(([key, agent]) => (
                <Button
                  key={key}
                  variant={selectedAgent === key ? "default" : "ghost"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setSelectedAgent(key)}
                >
                  <div>
                    <div className="font-medium">{agent.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {agent.description}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {agentDescriptions[selectedAgent as keyof typeof agentDescriptions].title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {agentDescriptions[selectedAgent as keyof typeof agentDescriptions].description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(agentCode[selectedAgent as keyof typeof agentCode])}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode(selectedAgent)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="code">
                    <Code className="w-4 h-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    <Eye className="w-4 h-4 mr-2" />
                    Features
                  </TabsTrigger>
                  <TabsTrigger value="task-form">
                    <Plus className="w-4 h-4 mr-2" />
                    Task Builder
                  </TabsTrigger>
                  <TabsTrigger value="crew-form">
                    <Settings className="w-4 h-4 mr-2" />
                    Crew Builder
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-800 text-gray-200 p-3 flex items-center justify-between">
                      <span className="text-sm font-mono">{selectedAgent}_agent.py</span>
                      <FileText className="w-4 h-4" />
                    </div>
                    <ScrollArea className="h-[600px]">
                      <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                        <code className="text-gray-800 dark:text-gray-200">
                          {agentCode[selectedAgent as keyof typeof agentCode]}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agentDescriptions[selectedAgent as keyof typeof agentDescriptions].features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Tabs defaultValue="overview" className="mt-6">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                        <TabsTrigger value="integration">Integration</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="mt-4">
                        <div className="space-y-3">
                          <div>
                            <strong>Purpose:</strong> Specialized agent for trade finance document processing
                          </div>
                          <div>
                            <strong>Technology:</strong> Built with CrewAI framework and Python
                          </div>
                          <div>
                            <strong>Performance:</strong> Optimized for high-accuracy document analysis
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="capabilities" className="mt-4">
                        <div className="space-y-3">
                          <div>
                            <strong>Input Processing:</strong> Handles multiple document formats (PDF, text, images)
                          </div>
                          <div>
                            <strong>Data Extraction:</strong> Advanced parsing with structured output
                          </div>
                          <div>
                            <strong>Validation:</strong> Comprehensive rule-based validation engine
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="integration" className="mt-4">
                        <div className="space-y-3">
                          <div>
                            <strong>API Compatibility:</strong> RESTful API integration ready
                          </div>
                          <div>
                            <strong>Database Support:</strong> PostgreSQL and Azure SQL compatibility
                          </div>
                          <div>
                            <strong>Execution:</strong> Supports verbose logging and delegation control
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>
                
                <TabsContent value="task-form" className="mt-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-name">Task Name</Label>
                          <Input
                            id="task-name"
                            placeholder="Enter task name"
                            value={taskForm.name}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="task-priority">Priority</Label>
                          <Select
                            value={taskForm.priority}
                            onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          placeholder="Describe what this task should accomplish..."
                          value={taskForm.description}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="task-output">Expected Output</Label>
                        <Textarea
                          id="task-output"
                          placeholder="Describe the expected output format..."
                          value={taskForm.expected_output}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, expected_output: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="task-context">Additional Context (Optional)</Label>
                        <Textarea
                          id="task-context"
                          placeholder="Any additional context or requirements..."
                          value={taskForm.context}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, context: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-md font-semibold mb-4">Generated Code Preview</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-800 text-gray-200 p-3">
                          <span className="text-sm font-mono">task_definition.py</span>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                            <code className="text-gray-800 dark:text-gray-200">
                              {generateTaskCode()}
                            </code>
                          </pre>
                        </ScrollArea>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateTaskCode())}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const code = generateTaskCode();
                            const blob = new Blob([code], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'task_definition.py';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast({ title: "Download started", description: "task_definition.py has been downloaded." });
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="crew-form" className="mt-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Create New Crew</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="crew-name">Crew Name</Label>
                          <Input
                            id="crew-name"
                            placeholder="Enter crew name"
                            value={crewForm.name}
                            onChange={(e) => setCrewForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="crew-process">Process Type</Label>
                          <Select
                            value={crewForm.process}
                            onValueChange={(value) => setCrewForm(prev => ({ ...prev, process: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select process" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sequential">Sequential</SelectItem>
                              <SelectItem value="hierarchical">Hierarchical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="crew-description">Description</Label>
                        <Textarea
                          id="crew-description"
                          placeholder="Describe the purpose of this crew..."
                          value={crewForm.description}
                          onChange={(e) => setCrewForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="crew-memory"
                            checked={crewForm.memory}
                            onCheckedChange={(checked) => setCrewForm(prev => ({ ...prev, memory: !!checked }))}
                          />
                          <Label htmlFor="crew-memory">Enable Memory</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="crew-planning"
                            checked={crewForm.planning}
                            onCheckedChange={(checked) => setCrewForm(prev => ({ ...prev, planning: !!checked }))}
                          />
                          <Label htmlFor="crew-planning">Enable Planning</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="crew-verbose"
                            checked={crewForm.verbose}
                            onCheckedChange={(checked) => setCrewForm(prev => ({ ...prev, verbose: !!checked }))}
                          />
                          <Label htmlFor="crew-verbose">Verbose Output</Label>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-md font-semibold mb-4">Generated Code Preview</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-800 text-gray-200 p-3">
                          <span className="text-sm font-mono">crew_definition.py</span>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                            <code className="text-gray-800 dark:text-gray-200">
                              {generateCrewCode()}
                            </code>
                          </pre>
                        </ScrollArea>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateCrewCode())}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const code = generateCrewCode();
                            const blob = new Blob([code], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'crew_definition.py';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast({ title: "Download started", description: "crew_definition.py has been downloaded." });
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
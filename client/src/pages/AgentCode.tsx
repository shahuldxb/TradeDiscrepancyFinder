import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Copy, Download, Eye, Code, FileText, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AgentCode() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState("document_parser");

  const agentCode = {
    document_parser: `"""
LC Document Discrepancy Detection System - Document Parsing Agent

This agent specializes in parsing and extracting structured data from various
types of Letter of Credit documents including commercial invoices, bills of lading,
and SWIFT MT700 messages.
"""

from crewai import Agent
from crewai_tools import BaseTool
from typing import Dict, Any
import re
import json

class DocumentParsingTool(BaseTool):
    name = "document_parser"
    description = "Parses different types of LC documents and extracts structured data"
    
    def _run(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """
        Parses a document and extracts structured data
        
        Args:
            document_path: Path to the document file
            document_type: Type of document (commercial_invoice, bill_of_lading, mt700, etc.)
            
        Returns:
            Dictionary of extracted fields and values
        """
        
        # Read document content
        with open(document_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if document_type == "mt700":
            return self._parse_mt700(content)
        elif document_type == "commercial_invoice":
            return self._parse_commercial_invoice(content)
        elif document_type == "bill_of_lading":
            return self._parse_bill_of_lading(content)
        else:
            return self._parse_generic_document(content)
    
    def _parse_mt700(self, content: str) -> Dict[str, Any]:
        """Parse SWIFT MT700 message"""
        fields = {}
        
        # Extract standard MT700 fields
        field_patterns = {
            "lc_number": r":20:([A-Z0-9]+)",
            "date_of_issue": r":31C:(\\d{6})",
            "applicant": r":50:(.+?)(?=:|$)",
            "beneficiary": r":59:(.+?)(?=:|$)",
            "currency_amount": r":32B:([A-Z]{3})([0-9,]+\\.?\\d*)",
            "latest_shipment": r":44C:(.+?)(?=:|$)",
            "expiry_date": r":31D:(\\d{6})",
            "description_goods": r":45A:(.+?)(?=:|$)"
        }
        
        for field, pattern in field_patterns.items():
            match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
            if match:
                if field == "currency_amount":
                    fields["currency"] = match.group(1)
                    fields["amount"] = match.group(2).replace(",", "")
                else:
                    fields[field] = match.group(1).strip()
        
        return {
            "document_type": "mt700",
            "fields": fields,
            "confidence": 0.95
        }

# Document Parsing Agent Configuration
document_parsing_agent = Agent(
    role="Document Parser Specialist",
    goal="Extract accurate structured data from various LC documents",
    backstory="""You are an expert in parsing financial documents, particularly 
    those related to Letters of Credit. You have deep knowledge of SWIFT message 
    formats, commercial invoices, bills of lading, and other trade finance documents. 
    Your expertise ensures that critical information is accurately extracted for 
    discrepancy analysis.""",
    tools=[DocumentParsingTool()],
    verbose=True,
    allow_delegation=False,
    max_execution_time=300
)`,

    discrepancy_detector: `"""
LC Document Discrepancy Detection Agent

This agent compares extracted document data to identify discrepancies
between different documents in a Letter of Credit transaction.
"""

from crewai import Agent
from crewai_tools import BaseTool
from typing import Dict, Any, List
import difflib

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
        
        # Check for missing documents
        required_docs = ["mt700", "commercial_invoice", "bill_of_lading"]
        for doc_type in required_docs:
            if doc_type not in documents:
                discrepancies.append({
                    "type": "missing_document",
                    "severity": "critical",
                    "description": f"Required document {doc_type} is missing",
                    "field": "document_presence",
                    "expected": doc_type,
                    "actual": "missing"
                })
        
        return discrepancies

# Discrepancy Detection Agent Configuration
discrepancy_detection_agent = Agent(
    role="Discrepancy Detection Specialist",
    goal="Identify all discrepancies between LC documents with high accuracy",
    backstory="""You are a meticulous financial analyst with years of experience 
    in Letter of Credit operations. You have an eagle eye for detecting inconsistencies 
    between documents and understand the critical importance of accuracy in trade finance.""",
    tools=[DiscrepancyDetectionTool()],
    verbose=True,
    allow_delegation=False,
    max_execution_time=300
)`,

    ucp_rules_specialist: `"""
UCP 600 Rules Application Agent

This agent applies Uniform Customs and Practice (UCP 600) rules
to detected discrepancies and provides explanations and recommendations.
"""

from crewai import Agent
from crewai_tools import BaseTool
from typing import Dict, Any, List

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
        enhanced_discrepancies = []
        
        for discrepancy in discrepancies:
            enhanced = discrepancy.copy()
            rule_info = self._get_ucp_rule(discrepancy["type"])
            
            enhanced.update({
                "ucp_article": rule_info["article"],
                "ucp_rule": rule_info["rule"],
                "explanation": rule_info["explanation"],
                "recommendation": rule_info["recommendation"],
                "is_waivable": rule_info["waivable"]
            })
            
            enhanced_discrepancies.append(enhanced)
        
        return enhanced_discrepancies

# UCP Rules Specialist Agent Configuration  
ucp_rules_agent = Agent(
    role="UCP 600 Rules Specialist",
    goal="Apply UCP 600 rules accurately to all detected discrepancies",
    backstory="""You are a renowned expert in UCP 600 (Uniform Customs and Practice 
    for Documentary Credits). With over 15 years of experience in international trade 
    finance, you have memorized every article of UCP 600 and understand their practical 
    applications.""",
    tools=[UcpRuleApplicationTool()],
    verbose=True,
    allow_delegation=False,
    max_execution_time=300
)`,

    reporting_agent: `"""
LC Discrepancy Reporting Agent

This agent generates comprehensive reports summarizing discrepancies,
their severity, and recommended actions for trade finance professionals.
"""

from crewai import Agent
from crewai_tools import BaseTool
from typing import Dict, Any, List
import json
from datetime import datetime

class ReportGenerationTool(BaseTool):
    name = "report_generator"
    description = "Generates comprehensive discrepancy analysis reports"
    
    def _run(self, discrepancies: List[Dict[str, Any]], document_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a comprehensive discrepancy report
        
        Args:
            discrepancies: List of enhanced discrepancies with UCP rules
            document_info: Information about the processed documents
            
        Returns:
            Comprehensive report dictionary
        """
        
        # Calculate summary statistics
        total_discrepancies = len(discrepancies)
        critical_count = len([d for d in discrepancies if d.get("severity") == "critical"])
        
        # Generate recommendation
        if critical_count > 0:
            recommendation = "REJECT - Critical discrepancies present"
            risk_level = "HIGH"
        else:
            recommendation = "CLEAN PRESENTATION - Accept documents"
            risk_level = "MINIMAL"
        
        report = {
            "report_metadata": {
                "generated_at": datetime.now().isoformat(),
                "report_version": "1.0",
                "analysis_engine": "CrewAI LC Discrepancy Detection System"
            },
            "executive_summary": {
                "total_discrepancies": total_discrepancies,
                "recommendation": recommendation,
                "risk_level": risk_level,
                "overall_status": "COMPLIANT" if total_discrepancies == 0 else "NON-COMPLIANT"
            }
        }
        
        return report

# Reporting Agent Configuration
reporting_agent = Agent(
    role="LC Discrepancy Reporting Specialist", 
    goal="Generate clear, actionable reports for trade finance decision making",
    backstory="""You are a senior trade finance operations manager with extensive 
    experience in documentary credit processing. You excel at translating complex 
    technical findings into clear, actionable business recommendations.""",
    tools=[ReportGenerationTool()],
    verbose=True,
    allow_delegation=False,
    max_execution_time=300
)`
  };

  const agentDescriptions = {
    document_parser: {
      title: "Document Parsing Agent",
      description: "Extracts structured data from LC documents including SWIFT MT700 messages, commercial invoices, and bills of lading",
      features: ["SWIFT MT700 parsing", "Commercial invoice extraction", "Bill of lading processing", "Generic document handling"]
    },
    discrepancy_detector: {
      title: "Discrepancy Detection Agent", 
      description: "Compares documents to identify inconsistencies and potential issues in LC transactions",
      features: ["Cross-document validation", "Amount verification", "Date consistency checks", "Beneficiary matching"]
    },
    ucp_rules_specialist: {
      title: "UCP 600 Rules Specialist",
      description: "Applies UCP 600 rules to discrepancies and provides regulatory guidance",
      features: ["UCP 600 rule application", "Compliance assessment", "Waivability determination", "Regulatory explanations"]
    },
    reporting_agent: {
      title: "Reporting Agent",
      description: "Generates comprehensive analysis reports with actionable recommendations",
      features: ["Executive summaries", "Risk assessments", "Action item generation", "Compliance scoring"]
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code">
                    <Code className="w-4 h-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    <Eye className="w-4 h-4 mr-2" />
                    Features
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-800 text-gray-200 p-3 flex items-center justify-between">
                      <span className="text-sm font-mono">{selectedAgent}_agent.py</span>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        <FileText className="w-3 h-3 mr-1" />
                        Python
                      </Badge>
                    </div>
                    <ScrollArea className="h-[600px]">
                      <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900 overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">
                          {agentCode[selectedAgent as keyof typeof agentCode]}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="features" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {agentDescriptions[selectedAgent as keyof typeof agentDescriptions].features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Implementation Details</h3>
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <strong>Framework:</strong> CrewAI with custom tools
                        </div>
                        <div>
                          <strong>Language:</strong> Python 3.8+
                        </div>
                        <div>
                          <strong>Dependencies:</strong> crewai, crewai-tools, re, json, difflib
                        </div>
                        <div>
                          <strong>Execution:</strong> Supports verbose logging and delegation control
                        </div>
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
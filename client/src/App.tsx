import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import DocumentUpload from "@/pages/DocumentUpload";
import DocumentLibrary from "@/pages/DocumentLibrary";
import DocumentTypesOverview from "@/pages/DocumentTypesOverview";
import SubDocumentTypes from "@/pages/SubDocumentTypes";
import DocumentWorkflow from "@/pages/DocumentWorkflow";
import ValidationResults from "@/pages/ValidationResults";
import DiscrepancyAnalysis from "@/pages/DiscrepancyAnalysis";
import AgentMonitor from "@/pages/AgentMonitor";
import AgentDesigner from "@/pages/AgentDesigner";

import TradeFinanceDocuments from "@/pages/TradeFinanceDocuments";
import UCPRules from "@/pages/UCPRules";
import MT700Lifecycle from "@/pages/MT700Lifecycle";
import MessageBuilder from "@/pages/MessageBuilder";
import MTIntelligence from "@/pages/MTIntelligenceComplete";
import SwiftMessageTypes from "@/pages/SwiftMessageTypes";
import SwiftMessageDetails from "@/pages/SwiftMessageDetails";
import SwiftValidation from "@/pages/SwiftValidation";
import SwiftCategory7 from "@/pages/SwiftCategory7";
import SkillsManagement from "@/pages/SkillsManagement";
import OCRAgent from "@/pages/OCRAgent";
import AgentCode from "@/pages/AgentCode";
import IncotermsManagement from "@/pages/IncotermsManagement";
import IncotermsDataGrid from "@/pages/IncotermsDataGrid";
import IncotermsMatrix from "@/pages/IncotermsMatrix";

import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 lg:ml-72 overflow-auto">
        <div className="p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            
            {/* Incoterms Management Routes */}
            <Route path="/incoterms" component={IncotermsManagement} />
            <Route path="/incoterms-grid" component={IncotermsDataGrid} />
            <Route path="/incoterms/matrix" component={IncotermsMatrix} />
            <Route path="/incoterms/validation" component={IncotermsDataGrid} />
            <Route path="/incoterms/comparison" component={IncotermsDataGrid} />
            <Route path="/incoterms/statistics" component={IncotermsDataGrid} />
            
            {/* Document Management Routes */}
            <Route path="/document-upload" component={DocumentUpload} />
            <Route path="/documents" component={DocumentUpload} />
            <Route path="/document-management/upload-documents" component={DocumentUpload} />
            <Route path="/documents/library" component={DocumentLibrary} />
            <Route path="/documents/types" component={DocumentTypesOverview} />
            <Route path="/documents/sub-types" component={SubDocumentTypes} />
            <Route path="/documents/ocr" component={OCRAgent} />
            <Route path="/documents/validation" component={ValidationResults} />
            <Route path="/documents/workflow" component={DocumentWorkflow} />
            <Route path="/trade-finance-documents" component={TradeFinanceDocuments} />
            <Route path="/documents/trade-finance" component={TradeFinanceDocuments} />
            
            {/* AI Agents Routes */}
            <Route path="/agent-monitor" component={AgentMonitor} />
            <Route path="/agents" component={AgentMonitor} />
            <Route path="/agent-designer" component={AgentDesigner} />
            <Route path="/agent-code" component={AgentCode} />
            <Route path="/skills-management" component={SkillsManagement} />
            <Route path="/ocr-agent" component={OCRAgent} />
            <Route path="/agents/autonomous" component={AgentMonitor} />
            <Route path="/agents/performance" component={AgentMonitor} />
            
            {/* Test Drive Routes */}
            <Route path="/test-drive/ocr" component={OCRAgent} />
            <Route path="/test-drive/agent-code" component={AgentCode} />
            <Route path="/test-drive/validation" component={DiscrepancyAnalysis} />
            <Route path="/test-drive/documents" component={DocumentUpload} />
            <Route path="/test-drive/swift" component={MT700Lifecycle} />
            
            {/* SWIFT Messages Routes */}
            <Route path="/mt700-lifecycle" component={MT700Lifecycle} />
            <Route path="/swift/mt700-lifecycle" component={MT700Lifecycle} />
            <Route path="/message-builder" component={MessageBuilder} />
            <Route path="/mt-intelligence" component={MTIntelligence} />
            <Route path="/swift-message-types" component={SwiftMessageTypes} />
            <Route path="/swift-message/:messageType" component={SwiftMessageDetails} />
            <Route path="/swift/validation" component={SwiftValidation} />
            <Route path="/swift/category7" component={SwiftCategory7} />
            
            {/* Analysis & Reporting Routes */}
            <Route path="/discrepancy-analysis" component={DiscrepancyAnalysis} />
            <Route path="/analysis" component={DiscrepancyAnalysis} />
            <Route path="/analysis/performance" component={DiscrepancyAnalysis} />
            <Route path="/analysis/compliance" component={DiscrepancyAnalysis} />
            <Route path="/analysis/business" component={DiscrepancyAnalysis} />
            <Route path="/analysis/risk" component={DiscrepancyAnalysis} />
            <Route path="/analysis/audit" component={DiscrepancyAnalysis} />
            
            {/* UCP Rules */}
            <Route path="/ucp-rules" component={UCPRules} />
            
            {/* System Admin Routes */}
            <Route path="/admin/users" component={AgentMonitor} />
            <Route path="/admin/settings" component={AgentMonitor} />
            <Route path="/admin/audit" component={DiscrepancyAnalysis} />
            <Route path="/admin/security" component={AgentMonitor} />
            <Route path="/admin/backups" component={AgentMonitor} />
            <Route path="/admin/database" component={IncotermsDataGrid} />
            <Route path="/admin/api" component={AgentMonitor} />
            
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

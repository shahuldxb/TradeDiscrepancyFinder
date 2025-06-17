import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
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
import LCLifecycle from "@/pages/LCLifecycle";
import MessageBuilder from "@/pages/MessageBuilder";
import MTIntelligenceComplete from "@/pages/MTIntelligenceComplete";
import SwiftMessageTypes from "@/pages/SwiftMessageTypes";
import SwiftMessageDetails from "@/pages/SwiftMessageDetails";
import SwiftValidation from "@/pages/SwiftValidation";
import SwiftCategory7 from "@/pages/SwiftCategory7";
import SkillsManagement from "@/pages/SkillsManagement";
import OCRAgent from "@/pages/OCRAgent";
import AgentCode from "@/pages/AgentCode";
import Incoterms from "@/pages/Incoterms";
import IncotermsManagement from "@/pages/IncotermsManagement";
import IncotermsDataGrid from "@/pages/IncotermsDataGrid";

import IncotermsValidation from "@/pages/IncotermsValidation";
import IncotermsAgents from "@/pages/IncotermsAgents";
import UCP600ArticlesManagement from "@/pages/UCP600ArticlesManagement";
import UCP600RulesEngine from "@/pages/UCP600RulesEngine";
import UCPDashboard from "@/pages/UCPDashboard";
import DocumentaryCredits from "@/pages/DocumentaryCredits";
import MTIntelligence from "@/pages/MTIntelligence";
import MT7xxMessages from "@/pages/MT7xxMessages";
import LifecycleDashboard from "@/pages/lifecycle/LifecycleDashboard";
import MasterDocuments from "@/pages/lifecycle/MasterDocuments";
import SubDocuments from "@/pages/lifecycle/SubDocuments";
import LifecycleStates from "@/pages/lifecycle/LifecycleStates";
import MainUpload from "@/pages/forms/MainUpload";
import IngestionRecords from "@/pages/forms/IngestionRecords";
import BackOfficeApproval from "@/pages/forms/BackOfficeApproval";
import NewFormDetection from "@/pages/forms/NewFormDetection";
import FormApproval from "@/pages/forms/FormApproval";
import FormTemplates from "@/pages/forms/FormTemplates";
import GroupedDocuments from "@/pages/forms/GroupedDocuments";
import ComprehensiveCRUD from "@/pages/forms/ComprehensiveCRUD";
import FormsApprovalSystem from "@/pages/forms/FormsApprovalSystem";

import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-auto">
        <div className="p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            
            {/* Trade Finance Routes */}
            <Route path="/documentary-credits" component={DocumentaryCredits} />
            
            {/* UCP 600 Management Routes */}
            <Route path="/ucp600/dashboard" component={UCPDashboard} />
            <Route path="/ucp600/articles" component={UCP600ArticlesManagement} />
            <Route path="/ucp600/rules" component={UCP600RulesEngine} />
            <Route path="/ucp600/usage-rules" component={UCP600ArticlesManagement} />
            <Route path="/ucp600/message-field-rules" component={UCP600ArticlesManagement} />
            <Route path="/ucp600/document-compliance" component={UCP600ArticlesManagement} />
            <Route path="/ucp600/business-owners" component={UCP600ArticlesManagement} />
            <Route path="/ucp600/validation-results" component={UCP600ArticlesManagement} />
            <Route path="/ucp600/execution-history" component={UCP600ArticlesManagement} />

            {/* Incoterms Management Routes */}
            <Route path="/incoterms" component={Incoterms} />
            <Route path="/incoterms/management" component={IncotermsManagement} />
            <Route path="/incoterms/grid" component={IncotermsDataGrid} />
            <Route path="/incoterms/validation" component={IncotermsValidation} />
            <Route path="/incoterms/agents" component={IncotermsAgents} />
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
            <Route path="/test-drive/swift" component={LCLifecycle} />
            
            {/* SWIFT Messages Routes */}
            <Route path="/mt700-lifecycle" component={LCLifecycle} />
            <Route path="/swift/mt700-lifecycle" component={LCLifecycle} />
            <Route path="/message-builder" component={MessageBuilder} />
            <Route path="/mt-intelligence" component={MTIntelligenceComplete} />
            <Route path="/swift/mt-intelligence" component={MTIntelligence} />
            <Route path="/swift/mt7xx" component={MT7xxMessages} />
            <Route path="/swift/parser" component={SwiftMessageTypes} />
            <Route path="/swift/message-types" component={SwiftMessageTypes} />
            <Route path="/swift/field-specifications" component={SwiftMessageDetails} />
            <Route path="/swift/message-validation" component={SwiftValidation} />
            <Route path="/swift/code-generator" component={MessageBuilder} />
            <Route path="/swift/dependencies" component={SwiftCategory7} />
            <Route path="/swift/lifecycle" component={LCLifecycle} />
            <Route path="/swift/analytics" component={MTIntelligence} />
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
            
            {/* Incoterms Management Routes */}
            <Route path="/incoterms" component={Incoterms} />
            <Route path="/incoterms/matrix" component={IncotermsManagement} />
            <Route path="/incoterms/validation" component={IncotermsValidation} />
            <Route path="/incoterms/agents" component={IncotermsAgents} />
            
            {/* Lifecycle Management Routes */}
            <Route path="/lifecycle/dashboard" component={LifecycleDashboard} />
            <Route path="/lifecycle/master-documents" component={MasterDocuments} />
            <Route path="/lifecycle/sub-document-types" component={SubDocuments} />
            <Route path="/lifecycle/lifecycle-states" component={LifecycleStates} />
            <Route path="/lifecycle/document-requirements" component={LifecycleDashboard} />
            <Route path="/lifecycle/mt7-dependencies" component={LifecycleDashboard} />
            <Route path="/lifecycle/analytics" component={LifecycleDashboard} />
            
            {/* Forms Recognizer Routes */}
            <Route path="/forms/main" component={MainUpload} />
            <Route path="/forms/records" component={IngestionRecords} />
            <Route path="/forms/backoffice" component={BackOfficeApproval} />
            <Route path="/forms/new-detection" component={NewFormDetection} />
            <Route path="/forms/approval" component={FormApproval} />
            <Route path="/forms/templates" component={FormTemplates} />
            <Route path="/forms/grouped" component={GroupedDocuments} />
            <Route path="/forms/crud" component={ComprehensiveCRUD} />
            <Route path="/forms/system" component={FormsApprovalSystem} />
            
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

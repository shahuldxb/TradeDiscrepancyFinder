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
import DiscrepancyAnalysis from "@/pages/DiscrepancyAnalysis";
import AgentMonitor from "@/pages/AgentMonitor";
import AgentDesigner from "@/pages/AgentDesigner";
import MessageBuilder from "@/pages/MessageBuilder";
import MTIntelligence from "@/pages/MTIntelligenceSimple";
import SwiftMessageDetails from "@/pages/SwiftMessageDetails";
import TradeFinanceDocuments from "@/pages/TradeFinanceDocuments";
import UCPRules from "@/pages/UCPRules";
import MT700Lifecycle from "@/pages/MT700Lifecycle";
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
            
            {/* Document Management Routes */}
            <Route path="/document-upload" component={DocumentUpload} />
            <Route path="/documents" component={DocumentUpload} />
            <Route path="/trade-finance-documents" component={TradeFinanceDocuments} />
            
            {/* AI Agents Routes */}
            <Route path="/agent-monitor" component={AgentMonitor} />
            <Route path="/agents" component={AgentMonitor} />
            <Route path="/agent-designer" component={AgentDesigner} />
            <Route path="/agent-code" component={AgentCode} />
            <Route path="/skills-management" component={SkillsManagement} />
            <Route path="/ocr-agent" component={OCRAgent} />
            <Route path="/test-drive/ocr" component={OCRAgent} />
            <Route path="/test-drive/agent-code" component={AgentCode} />
            
            {/* SWIFT Messages Routes */}
            <Route path="/mt700-lifecycle" component={MT700Lifecycle} />
            <Route path="/message-builder" component={MessageBuilder} />
            <Route path="/mt-intelligence" component={MTIntelligence} />
            <Route path="/swift-message/:messageType" component={SwiftMessageDetails} />
            
            {/* Analysis & Reporting Routes */}
            <Route path="/discrepancy-analysis" component={DiscrepancyAnalysis} />
            <Route path="/analysis" component={DiscrepancyAnalysis} />
            
            {/* UCP Rules */}
            <Route path="/ucp-rules" component={UCPRules} />
            
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

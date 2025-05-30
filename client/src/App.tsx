import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/documents" component={DocumentUpload} />
          <Route path="/analysis" component={DiscrepancyAnalysis} />
          <Route path="/agents" component={AgentMonitor} />
          <Route path="/agent-designer" component={AgentDesigner} />
          <Route path="/message-builder" component={MessageBuilder} />
          <Route path="/mt-intelligence" component={MTIntelligence} />
          <Route path="/swift-message/:messageType" component={SwiftMessageDetails} />
          <Route path="/trade-finance-documents" component={TradeFinanceDocuments} />
          <Route path="/ucp-rules" component={UCPRules} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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

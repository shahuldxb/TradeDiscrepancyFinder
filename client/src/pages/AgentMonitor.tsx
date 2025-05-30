import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, Activity, Clock, CheckCircle, AlertTriangle, Settings, Play, Pause, RotateCcw, Brain, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function AgentMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const { data: agentStatus, isLoading: agentLoading } = useQuery({
    queryKey: ["/api/agents/status"],
    refetchInterval: 2000,
  });

  const { data: autonomousStatus, isLoading: autonomousLoading } = useQuery({
    queryKey: ["/api/autonomous-agents/status"],
    refetchInterval: 2000,
  });

  const { data: agentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/agent-tasks"],
    refetchInterval: 5000,
  });

  const initiateWorkflowMutation = useMutation({
    mutationFn: async (context: any) => {
      return await apiRequest("/api/autonomous-agents/initiate", "POST", context);
    },
    onSuccess: () => {
      toast({
        title: "Autonomous Workflow Initiated",
        description: "AI agents are now operating autonomously",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-agents/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate autonomous workflow",
        variant: "destructive",
      });
    },
  });

  const updateEnvironmentMutation = useMutation({
    mutationFn: async (environmentData: any) => {
      return await apiRequest("/api/autonomous-agents/environment", "POST", environmentData);
    },
    onSuccess: () => {
      toast({
        title: "Environment Updated",
        description: "Agent environment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-agents/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent environment",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-blue-500";
      case "idle":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "idle":
        return <Badge variant="outline" className="border-green-200 text-green-700">Online</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "idle":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="AI-Centric Agent Monitor"
          subtitle="Real-time monitoring of autonomous and orchestrated AI agents"
          actions={
            <div className="flex space-x-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => initiateWorkflowMutation.mutate({ trigger: "manual", context: "user_initiated" })}
                disabled={initiateWorkflowMutation.isPending}
              >
                <Brain className="h-4 w-4 mr-2" />
                {initiateWorkflowMutation.isPending ? "Starting..." : "Initiate AI Workflow"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateEnvironmentMutation.mutate({ documents_available: true, priority: "high" })}
                disabled={updateEnvironmentMutation.isPending}
              >
                <Zap className="h-4 w-4 mr-2" />
                Update Environment
              </Button>
            </div>
          }
        />
        
        <div className="p-6 space-y-6">
          {/* AI-Centric Architecture Status */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">AI-Centric Mode Active</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Autonomous Decision Making
              </Badge>
            </div>
          </div>

          {/* System Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Autonomous Agents</CardTitle>
                <Brain className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{autonomousStatus?.agents?.length || 2}</div>
                <p className="text-xs text-blue-600">
                  AI-centric agents
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Legacy Agents</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentStatus?.legacy_agents?.length || 6}</div>
                <p className="text-xs text-muted-foreground">
                  Orchestrated agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentTasks?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Autonomous Agents Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Autonomous AI Agents
              </h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                2 Active
              </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      Document Analysis Agent
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      autonomous
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    Autonomous document processing and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Capabilities</span>
                        <span className="font-medium">5</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        OCR Processing, Data Extraction, Document Classification
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                        <span className="font-medium">12 items</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Goals</span>
                        <span className="font-medium">3</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      Discrepancy Detection Agent
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      autonomous
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    Autonomous discrepancy detection and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Capabilities</span>
                        <span className="font-medium">4</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Cross-validation, UCP Rules, Trade Finance Analysis
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                        <span className="font-medium">8 items</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Goals</span>
                        <span className="font-medium">2</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Legacy Agents Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Legacy CrewAI Agents
              </h2>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                6 Orchestrated
              </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Document Intake Agent", role: "Document Collection and Initial Processing", status: "idle" },
                { name: "MT Message Analyst", role: "SWIFT MT Message Analysis", status: "processing" },
                { name: "LC Document Validator", role: "Letter of Credit Document Validation", status: "idle" },
                { name: "Cross-Document Comparator", role: "Document Cross-Validation", status: "idle" },
                { name: "UCP Rules Specialist", role: "UCP 600 Compliance Analysis", status: "idle" },
                { name: "Reporting Agent", role: "Report Generation and Distribution", status: "idle" }
              ].map((agent) => (
                <Card key={agent.name} className="border-2 hover:border-gray-300 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                        <Bot className="h-5 w-5 text-muted-foreground" />
                      </div>
                      {getStatusBadge(agent.status)}
                    </div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <CardDescription className="text-sm">{agent.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.status)}
                          <span className="text-sm">
                            {agent.status === "idle" ? "Waiting for tasks" : 
                             agent.status === "processing" ? "Processing request" : 
                             "Ready to work"}
                          </span>
                        </div>
                      </div>
                      
                      {agent.status === "processing" && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Progress</span>
                            <span className="text-xs text-muted-foreground">75%</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Architecture Comparison */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                AI-Centric vs Traditional Architecture
              </CardTitle>
              <CardDescription>
                Comparison between autonomous AI agents and traditional orchestrated systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-700">AI-Centric (Autonomous)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Agents make independent decisions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Self-initiated workflows
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Dynamic resource allocation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Learning from experience
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Traditional (Orchestrated)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      Centrally managed workflows
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      Predefined task sequences
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      Manual resource management
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      Static configuration
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
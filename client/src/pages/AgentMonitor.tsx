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
import { Bot, Activity, Clock, CheckCircle, AlertTriangle, Settings, Play, Pause, RotateCcw } from "lucide-react";

export default function AgentMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: agentStatus, isLoading: agentLoading } = useQuery({
    queryKey: ["/api/agents/status"],
    refetchInterval: 2000, // Refresh every 2 seconds for real-time monitoring
  });

  const { data: agentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/agent-tasks"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const demoProcessingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/agents/demo", {});
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start demo: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Demo Processing Started",
        description: data.message || "Agents are now processing the demo workflow",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-tasks"] });
    },
    onError: (error: any) => {
      console.error("Demo processing error:", error);
      toast({
        title: "Error Starting Demo",
        description: error.message || "Failed to start demo processing",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Settings className="h-4 w-4 animate-spin text-blue-500" />;
      case "idle":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

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

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "queued":
        return <Badge variant="outline">Queued</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Mock agent data if no real data available
  const defaultAgents = [
    {
      name: "Document Intake Agent",
      role: "Document Classification and Validation",
      goal: "Efficiently process and classify uploaded documents for LC analysis",
      status: "idle",
      currentTask: undefined,
    },
    {
      name: "MT Message Agent",
      role: "SWIFT MT Message Analysis",
      goal: "Parse and validate SWIFT MT messages according to standards",
      status: "idle",
      currentTask: undefined,
    },
    {
      name: "LC Document Agent",
      role: "LC Document Validation",
      goal: "Validate LC documents for compliance and completeness",
      status: "idle",
      currentTask: undefined,
    },
    {
      name: "Comparison Agent",
      role: "Cross-Document Comparison",
      goal: "Identify discrepancies between documents through detailed comparison",
      status: "idle",
      currentTask: undefined,
    },
    {
      name: "UCP Rules Agent",
      role: "UCP 600 Compliance Officer",
      goal: "Apply UCP 600 rules and SWIFT MT standards to validate documents",
      status: "idle",
      currentTask: undefined,
    },
    {
      name: "Reporting Agent",
      role: "Discrepancy Reporting",
      goal: "Generate comprehensive discrepancy reports with recommendations",
      status: "idle",
      currentTask: undefined,
    },
  ];

  const displayAgents = agentStatus || defaultAgents;
  const displayTasks = agentTasks || [];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="CrewAI Agent Monitor"
          subtitle="Real-time monitoring and management of AI agents"
          actions={
            <div className="flex space-x-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => demoProcessingMutation.mutate()}
                disabled={demoProcessingMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {demoProcessingMutation.isPending ? "Starting..." : "Start Demo Processing"}
              </Button>
              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause All
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Agents
              </Button>
            </div>
          }
        />
        
        <div className="p-6">
          {/* Agent Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayAgents.map((agent: any) => (
              <Card key={agent.name} className="banking-card">
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
                          {agent.currentTask || 
                           (agent.status === "idle" ? "Waiting for tasks" : 
                            agent.status === "processing" ? "Processing request" : 
                            "Ready to work")}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Goal</p>
                      <p className="text-xs text-muted-foreground">{agent.goal}</p>
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
                    
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Config
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="banking-card">
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Overall agent orchestration metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Queue Processing</span>
                    <span className="text-sm text-muted-foreground">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="banking-card">
              <CardHeader>
                <CardTitle>Agent Statistics</CardTitle>
                <CardDescription>Current agent distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-800">Online</span>
                    <span className="text-sm font-bold text-green-800">
                      {displayAgents.filter((a: any) => a.status === "idle").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium text-blue-800">Processing</span>
                    <span className="text-sm font-bold text-blue-800">
                      {displayAgents.filter((a: any) => a.status === "processing").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium text-red-800">Error</span>
                    <span className="text-sm font-bold text-red-800">
                      {displayAgents.filter((a: any) => a.status === "error").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="banking-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest agent activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Document processed</span>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">Agent started task</span>
                    <span className="text-xs text-muted-foreground">5m ago</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-muted-foreground">Discrepancy detected</span>
                    <span className="text-xs text-muted-foreground">8m ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task History */}
          <Card className="banking-card">
            <CardHeader>
              <CardTitle>Recent Agent Tasks</CardTitle>
              <CardDescription>History of executed and queued tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-4 bg-muted rounded"></div>
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-24 h-4 bg-muted rounded"></div>
                        <div className="w-16 h-4 bg-muted rounded"></div>
                        <div className="w-20 h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayTasks.length > 0 ? (
                <div className="space-y-4">
                  {displayTasks.slice(0, 10).map((task: any, index: number) => (
                    <div key={task.id || index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{task.agentName}</span>
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{task.taskType}</p>
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(task.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {task.executionTime && (
                          <span className="text-xs text-muted-foreground">
                            {(task.executionTime / 1000).toFixed(1)}s
                          </span>
                        )}
                        {getTaskStatusBadge(task.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Recent Tasks</h3>
                  <p className="text-muted-foreground">
                    Agent tasks will appear here once document processing begins.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

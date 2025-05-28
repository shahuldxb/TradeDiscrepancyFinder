import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle, Clock, AlertCircle, Settings } from "lucide-react";
import { AgentStatus } from "@/lib/api";

interface AgentStatusCardProps {
  agents?: AgentStatus[];
  isLoading: boolean;
}

export default function AgentStatusCard({ agents, isLoading }: AgentStatusCardProps) {
  if (isLoading) {
    return (
      <Card className="banking-card">
        <CardHeader>
          <CardTitle>CrewAI Agent Status</CardTitle>
          <CardDescription>Real-time agent monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-muted rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Settings className="h-4 w-4 animate-spin" />;
      case "idle":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "agent-status-processing";
      case "idle":
        return "agent-status-online";
      case "error":
        return "agent-status-error";
      default:
        return "agent-status-idle";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "idle":
        return <Badge variant="outline">Online</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  const defaultAgents: AgentStatus[] = [
    {
      name: "Document Intake Agent",
      role: "Document Classification",
      status: "idle",
    },
    {
      name: "MT Message Agent",
      role: "SWIFT Message Analysis",
      status: "idle",
    },
    {
      name: "LC Document Agent", 
      role: "LC Document Validation",
      status: "idle",
    },
    {
      name: "Comparison Agent",
      role: "Cross-Document Analysis",
      status: "idle",
    },
    {
      name: "UCP Rules Agent",
      role: "UCP 600 Compliance",
      status: "idle",
    },
    {
      name: "Reporting Agent",
      role: "Report Generation",
      status: "idle",
    },
  ];

  const displayAgents = agents || defaultAgents;

  return (
    <Card className="banking-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span>CrewAI Agent Status</span>
        </CardTitle>
        <CardDescription>Real-time agent monitoring and task execution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayAgents.map((agent) => (
            <div key={agent.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                <div>
                  <p className="font-medium text-foreground text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.currentTask || agent.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(agent.status)}
                {agent.status === "processing" && (
                  <span className="text-xs text-muted-foreground">Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Agent Performance Summary */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">System Performance</span>
            <span className="text-banking-success font-medium">Optimal</span>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div className="bg-banking-success h-2 rounded-full" style={{ width: "95%" }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Average response time: 2.3s</p>
        </div>
      </CardContent>
    </Card>
  );
}

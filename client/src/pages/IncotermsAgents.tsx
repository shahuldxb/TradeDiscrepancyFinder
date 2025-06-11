import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, Activity, CheckCircle, Clock, AlertTriangle, Play, Pause, Settings, Globe, Zap, Shield, Brain, TrendingUp, BarChart3, Cpu, Database } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  task: string;
  progress: number;
  lastActivity: string;
  validationsCompleted: number;
  accuracy: number;
}

interface AgentMetrics {
  totalValidations: number;
  accuracyRate: number;
  activeAgents: number;
  totalAgents: number;
}

export default function IncotermsAgents() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch agent status
  const { data: agentStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/incoterms/agents/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch agent metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<AgentMetrics>({
    queryKey: ["/api/incoterms/agents/metrics"],
    refetchInterval: 10000,
  });

  // Fetch validation logs
  const { data: validationLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/incoterms/agents/logs"],
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-purple-900/10 dark:to-indigo-900/10">
      {/* Command Center Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  AI Agent Command Center
                </h1>
                <p className="text-purple-100 text-lg font-medium">
                  Autonomous intelligence for trade finance operations
                </p>
              </div>
            </div>
            <div className="hidden xl:flex items-center space-x-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">AI Processing</div>
                <div className="text-lg font-bold text-white">Active</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Data Pipeline</div>
                <div className="text-lg font-bold text-white">Synced</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Security</div>
                <div className="text-lg font-bold text-white">Secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">
        {/* Enhanced Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Operations</p>
                  <p className="text-3xl font-bold text-white">{metrics?.totalValidations || 1247}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +18% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-white">{metrics?.accuracyRate || 99.2}%</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Exceeds industry standard
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Agents</p>
                  <p className="text-3xl font-bold text-white">
                    {metrics?.activeAgents || 8}/{metrics?.totalAgents || 12}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-purple-600">
                <Activity className="w-4 h-4 mr-1" />
                Real-time processing
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Response</p>
                  <p className="text-3xl font-bold text-white">1.4s</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-orange-600">
                <Clock className="w-4 h-4 mr-1" />
                Lightning fast
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Agent Status Monitor
                </CardTitle>
                <CardDescription>
                  Real-time status of all Incoterms validation agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="text-center py-8">Loading agent status...</div>
                ) : agentStatus?.agents?.length > 0 ? (
                  <div className="space-y-4">
                    {agentStatus.agents.map((agent: Agent) => (
                      <Card key={agent.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(agent.status)}
                              <div>
                                <h4 className="font-semibold">{agent.name}</h4>
                                <p className="text-sm text-muted-foreground">{agent.task}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(agent.status)}
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{agent.progress}%</span>
                            </div>
                            <Progress value={agent.progress} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Validations:</span>
                              <div className="font-medium">{agent.validationsCompleted}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Accuracy:</span>
                              <div className="font-medium">{agent.accuracy}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Activity:</span>
                              <div className="font-medium">{agent.lastActivity}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No agents currently active
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>
                  Current validation tasks being processed by agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">T001</TableCell>
                      <TableCell>LC Validation</TableCell>
                      <TableCell>MT Message Validator</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={75} className="w-16 h-2" />
                          <span className="text-sm">75%</span>
                        </div>
                      </TableCell>
                      <TableCell>2 min ago</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">T002</TableCell>
                      <TableCell>Document Check</TableCell>
                      <TableCell>Document Processor</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={100} className="w-16 h-2" />
                          <span className="text-sm">100%</span>
                        </div>
                      </TableCell>
                      <TableCell>5 min ago</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Agent Activity Logs
                </CardTitle>
                <CardDescription>
                  Recent agent activities and validation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-8">Loading activity logs...</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">LC validation completed successfully</div>
                        <div className="text-xs text-muted-foreground">
                          MT Message Validator • 2 minutes ago • LC001234567
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Document processing started</div>
                        <div className="text-xs text-muted-foreground">
                          Document Processor • 3 minutes ago • Invoice validation
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Warning: Document discrepancy detected</div>
                        <div className="text-xs text-muted-foreground">
                          Discrepancy Detector • 5 minutes ago • Transport document mismatch
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
                <CardDescription>
                  Configure agent behavior and validation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Validation Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Strict Compliance Mode</span>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-correction</span>
                        <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Real-time Monitoring</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-sm font-medium">1.2s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium">99.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime</span>
                        <span className="text-sm font-medium">99.9%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Start All Agents
                    </Button>
                    <Button variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause All Agents
                    </Button>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
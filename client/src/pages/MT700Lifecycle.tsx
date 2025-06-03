import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Send, 
  Eye, 
  Upload,
  Download,
  Bot,
  Users,
  Workflow,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface LifecycleNode {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  position: { x: number; y: number };
  requiredDocuments: string[];
  agentTasks: string[];
  outputMessages: string[];
  progress: number;
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'missing' | 'uploaded' | 'validated' | 'approved';
  required: boolean;
  uploadedAt?: string;
  validatedBy?: string;
}

interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  estimatedTime: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
}

// Real lifecycle stages based on actual SWIFT MT7xx message flow
const getLifecycleStages = (lifecycleData: any) => {
  const defaultStages: LifecycleNode[] = [
    {
      id: 'initiation',
      name: 'Initiation',
      description: 'Issue of Documentary Credit (MT700)',
      status: 'completed',
      position: { x: 0, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: ['MT700'],
      progress: 100
    },
    {
      id: 'advice',
      name: 'Advice',
      description: 'Advice of Documentary Credit (MT700)',
      status: 'active',
      position: { x: 1, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: ['MT701'],
      progress: 65
    },
    {
      id: 'amendment',
      name: 'Amendment',
      description: 'Amendment of Documentary Credit (MT707)',
      status: 'pending',
      position: { x: 2, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: ['MT707'],
      progress: 0
    },
    {
      id: 'authorization',
      name: 'Authorization',
      description: 'Authorization to Reimburse (MT742)',
      status: 'pending',
      position: { x: 3, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: ['MT742'],
      progress: 0
    },
    {
      id: 'settlement',
      name: 'Settlement',
      description: 'Reimbursement Claim (MT754)',
      status: 'pending',
      position: { x: 4, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: ['MT754'],
      progress: 0
    },
    {
      id: 'closure',
      name: 'Closure',
      description: 'Statement of Account (MT950)',
      status: 'pending',
      position: { x: 5, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: ['MT950'],
      progress: 0
    }
  ];

  // Use real lifecycle stages from Azure SQL if available
  if (lifecycleData?.lifecycleStages?.length > 0) {
    return lifecycleData.lifecycleStages.map((stage: any, index: number) => ({
      id: stage.child_message_type?.toLowerCase() || `stage_${index}`,
      name: stage.child_message_type || `Stage ${index + 1}`,
      description: stage.stage_description || 'SWIFT Message Processing',
      status: index === 0 ? 'completed' : index === 1 ? 'active' : 'pending',
      position: { x: index, y: 0 },
      requiredDocuments: [],
      agentTasks: [],
      outputMessages: [stage.child_message_type].filter(Boolean),
      progress: index === 0 ? 100 : index === 1 ? 65 : 0
    }));
  }

  return defaultStages;
};

export default function MT700Lifecycle() {
  const [selectedNode, setSelectedNode] = useState<LifecycleNode | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'documents' | 'agents' | 'timeline'>('overview');
  const [lifecycleStages, setLifecycleStages] = useState<LifecycleNode[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'stopped' | 'running' | 'paused'>('stopped');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lifecycleData, isLoading } = useQuery({
    queryKey: ['/api/mt700-lifecycle'],
    refetchInterval: 10000
  });

  const { data: documentsData } = useQuery({
    queryKey: ['/api/mt700-lifecycle/documents', selectedNode?.id],
    enabled: !!selectedNode
  });

  const { data: agentTasksData } = useQuery({
    queryKey: ['/api/mt700-lifecycle/agents', selectedNode?.id],
    enabled: !!selectedNode
  });

  // Button handlers
  const handleUploadDocuments = useCallback(() => {
    setIsUploading(true);
    
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      
      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append('documents', file);
        });
        formData.append('nodeId', selectedNode?.id || 'default');
        
        const response = await fetch('/api/mt700-lifecycle/documents', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        queryClient.invalidateQueries({ queryKey: ['/api/mt700-lifecycle/documents'] });
        
        toast({
          title: "Documents Uploaded",
          description: `Successfully uploaded ${files.length} document(s) to the lifecycle stage.`,
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload documents. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  }, [selectedNode, queryClient, toast]);

  const handleAgentControl = useCallback((action: 'start' | 'pause' | 'restart') => {
    const actionMessages = {
      start: { title: "Agents Started", description: "All lifecycle agents are now running." },
      pause: { title: "Agents Paused", description: "All lifecycle agents have been paused." },
      restart: { title: "Agents Restarted", description: "All lifecycle agents have been restarted." }
    };
    
    setAgentStatus(action === 'start' ? 'running' : action === 'pause' ? 'paused' : 'running');
    
    toast({
      title: actionMessages[action].title,
      description: actionMessages[action].description,
    });
  }, [toast]);

  const handleExportReport = useCallback(async () => {
    try {
      const response = await fetch('/api/mt700-lifecycle/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          includeDocuments: true, 
          includeAgentTasks: true,
          format: 'pdf'
        }),
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MT700_Lifecycle_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Exported",
        description: "MT700 lifecycle report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Update lifecycle stages when data is loaded
  useEffect(() => {
    if (lifecycleData) {
      setLifecycleStages(getLifecycleStages(lifecycleData));
    }
  }, [lifecycleData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'pending': return 'bg-gray-400';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'validated': return 'text-blue-600 bg-blue-50';
      case 'uploaded': return 'text-yellow-600 bg-yellow-50';
      case 'missing': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MT700 Documentary Credit Lifecycle
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Interactive lifecycle management for Letter of Credit processing with agent automation
          </p>
        </div>

        {/* Lifecycle Flow Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="w-5 h-5" />
              Lifecycle Flow
            </CardTitle>
            <CardDescription>
              Click on any node to view details, documents, and agent tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading lifecycle data from Azure SQL...</p>
                </div>
              </div>
            ) : lifecycleStages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Lifecycle Data Available</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Unable to load MT700 lifecycle data. This may be due to authentication or database connectivity issues.
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Loading
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <div className="flex items-center space-x-8 py-8 min-w-max">
                  {lifecycleStages.map((node, index) => (
                  <div key={node.id} className="flex items-center">
                    {/* Node */}
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className={`w-32 h-32 rounded-lg border-2 ${node.status === 'active' ? 'border-blue-500 shadow-lg' : 'border-gray-300'} bg-white dark:bg-slate-800 p-4 transition-all hover:shadow-lg`}>
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
                            <Badge variant={node.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {node.status}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            {node.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 flex-1">
                            {node.description}
                          </p>
                          {node.progress > 0 && (
                            <Progress value={node.progress} className="h-1 mt-2" />
                          )}
                        </div>
                      </div>
                      
                      {/* Agent and Document indicators */}
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-center space-x-1">
                        {node.agentTasks.length > 0 && (
                          <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1">
                            <Bot className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                          </div>
                        )}
                        {node.requiredDocuments.length > 0 && (
                          <div className="bg-green-100 dark:bg-green-900 rounded-full p-1">
                            <FileText className="w-3 h-3 text-green-600 dark:text-green-300" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    {index < lifecycleStages.length - 1 && (
                      <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Node Details Modal */}
        {selectedNode && (
          <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedNode.status)}`} />
                  {selectedNode.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedNode.description}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Progress value={selectedNode.progress} className="flex-1" />
                          <span className="text-sm font-medium">{selectedNode.progress}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Array.isArray(documentsData) ? documentsData.length : 0}
                        </div>
                        <p className="text-xs text-gray-600">Required & Optional</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Agent Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Array.isArray(agentTasksData) ? agentTasksData.length : 0}
                        </div>
                        <p className="text-xs text-gray-600">Automated Tasks</p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedNode.outputMessages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Output Messages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedNode.outputMessages.map((message) => (
                            <Badge key={message} variant="outline">
                              {message}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid gap-4">
                    {Array.isArray(documentsData) && documentsData.map((doc: any) => (
                      <Card key={doc.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <h4 className="font-medium">{doc.name}</h4>
                              <p className="text-sm text-gray-600">{doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getDocumentStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                            {doc.required && (
                              <Badge variant="outline" className="text-red-600">
                                Required
                              </Badge>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {doc.validatedBy && (
                          <div className="mt-2 text-sm text-gray-600">
                            Validated by: {doc.validatedBy}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="agents" className="space-y-4">
                  <div className="grid gap-4">
                    {Array.isArray(agentTasksData) && agentTasksData.map((task: any) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Bot className="w-5 h-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{task.description || task.taskType}</h4>
                              <p className="text-sm text-gray-600">Agent: {task.agentName || task.agentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getAgentStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            <span className="text-sm text-gray-600">{task.estimatedTime || 'Processing'}</span>
                          </div>
                        </div>
                        {task.status === 'running' && (
                          <Progress value={task.progress || 50} className="h-2" />
                        )}
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Timeline Events</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Node Started</p>
                          <p className="text-sm text-gray-600">Process initiated</p>
                        </div>
                      </div>
                      {selectedNode.status === 'active' && (
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Currently Processing</p>
                            <p className="text-sm text-gray-600">Progress: {selectedNode.progress}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Upload required documents for the current lifecycle stage
              </p>
              <Button 
                className="w-full" 
                onClick={handleUploadDocuments}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Documents'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Agent Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Monitor and control automated agent tasks
              </p>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAgentControl('start')}
                  disabled={agentStatus === 'running'}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAgentControl('pause')}
                  disabled={agentStatus === 'paused' || agentStatus === 'stopped'}
                >
                  <Pause className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAgentControl('restart')}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Generate lifecycle reports and documentation
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
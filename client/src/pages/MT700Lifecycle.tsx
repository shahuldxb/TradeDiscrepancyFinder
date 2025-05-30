import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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

const lifecycleNodes: LifecycleNode[] = [
  {
    id: 'initiation',
    name: 'Initiation',
    description: 'Applicant requests LC issuance and issuing bank creates MT700',
    status: 'completed',
    position: { x: 0, y: 0 },
    requiredDocuments: ['applicant_request', 'kyc_documents', 'credit_approval'],
    agentTasks: ['verify_applicant', 'draft_lc_terms'],
    outputMessages: ['MT700', 'MT701'],
    progress: 100
  },
  {
    id: 'transmission',
    name: 'Transmission',
    description: 'Issuing bank sends MT700 to advising bank via SWIFT',
    status: 'completed',
    position: { x: 1, y: 0 },
    requiredDocuments: ['mt700_message', 'transmission_log'],
    agentTasks: ['verify_swift_format', 'confirm_transmission'],
    outputMessages: [],
    progress: 100
  },
  {
    id: 'advising',
    name: 'Advising',
    description: 'Advising bank receives MT700 and notifies beneficiary',
    status: 'active',
    position: { x: 2, y: 0 },
    requiredDocuments: ['authentication_record', 'beneficiary_notification'],
    agentTasks: ['verify_authenticity', 'prepare_beneficiary_advice'],
    outputMessages: ['MT730'],
    progress: 65
  },
  {
    id: 'document_presentation',
    name: 'Document Presentation',
    description: 'Beneficiary ships goods and presents documents',
    status: 'pending',
    position: { x: 4, y: 0 },
    requiredDocuments: ['commercial_invoice', 'bill_of_lading', 'insurance_certificate', 'certificate_of_origin', 'packing_list'],
    agentTasks: ['examine_documents', 'check_compliance'],
    outputMessages: [],
    progress: 0
  },
  {
    id: 'payment_processing',
    name: 'Payment Processing',
    description: 'Bank processes payment based on document examination',
    status: 'pending',
    position: { x: 5, y: 0 },
    requiredDocuments: ['payment_instruction', 'compliance_report'],
    agentTasks: ['process_payment', 'handle_discrepancies'],
    outputMessages: ['MT754', 'MT750', 'MT734', 'MT742', 'MT756'],
    progress: 0
  },
  {
    id: 'closure',
    name: 'Closure',
    description: 'LC is discharged or cancelled',
    status: 'pending',
    position: { x: 6, y: 0 },
    requiredDocuments: ['discharge_notice', 'settlement_confirmation'],
    agentTasks: ['confirm_settlement', 'close_lc'],
    outputMessages: ['MT732', 'MT792'],
    progress: 0
  }
];

const documentsByNode: Record<string, DocumentItem[]> = {
  initiation: [
    { id: '1', name: 'Applicant Request', type: 'applicant_request', status: 'approved', required: true, uploadedAt: '2024-01-15T10:00:00Z', validatedBy: 'Document Validator Agent' },
    { id: '2', name: 'KYC Documents', type: 'kyc_documents', status: 'approved', required: true, uploadedAt: '2024-01-15T10:15:00Z', validatedBy: 'Compliance Officer Agent' },
    { id: '3', name: 'Credit Approval', type: 'credit_approval', status: 'approved', required: true, uploadedAt: '2024-01-15T10:30:00Z', validatedBy: 'Document Validator Agent' }
  ],
  transmission: [
    { id: '4', name: 'MT700 Message', type: 'mt700_message', status: 'approved', required: true, uploadedAt: '2024-01-15T11:00:00Z', validatedBy: 'SWIFT Format Agent' },
    { id: '5', name: 'Transmission Log', type: 'transmission_log', status: 'approved', required: true, uploadedAt: '2024-01-15T11:05:00Z', validatedBy: 'SWIFT Format Agent' }
  ],
  advising: [
    { id: '6', name: 'Authentication Record', type: 'authentication_record', status: 'validated', required: true, uploadedAt: '2024-01-15T12:00:00Z', validatedBy: 'Compliance Officer Agent' },
    { id: '7', name: 'Beneficiary Notification', type: 'beneficiary_notification', status: 'uploaded', required: true, uploadedAt: '2024-01-15T12:15:00Z' }
  ],
  document_presentation: [
    { id: '8', name: 'Commercial Invoice', type: 'commercial_invoice', status: 'missing', required: true },
    { id: '9', name: 'Bill of Lading', type: 'bill_of_lading', status: 'missing', required: true },
    { id: '10', name: 'Insurance Certificate', type: 'insurance_certificate', status: 'missing', required: true },
    { id: '11', name: 'Certificate of Origin', type: 'certificate_of_origin', status: 'missing', required: true },
    { id: '12', name: 'Packing List', type: 'packing_list', status: 'missing', required: true },
    { id: '13', name: 'Inspection Certificate', type: 'inspection_certificate', status: 'missing', required: false },
    { id: '14', name: 'Beneficiary Statement', type: 'beneficiary_statement', status: 'missing', required: false }
  ]
};

const agentTasksByNode: Record<string, AgentTask[]> = {
  advising: [
    {
      id: 'task_1',
      agentId: 'compliance_officer',
      description: 'Verify authenticity of received MT700',
      status: 'completed',
      estimatedTime: '5 minutes',
      startedAt: '2024-01-15T12:00:00Z',
      completedAt: '2024-01-15T12:04:00Z',
      progress: 100
    },
    {
      id: 'task_2',
      agentId: 'notification_manager',
      description: 'Prepare and send beneficiary advice',
      status: 'running',
      estimatedTime: '10 minutes',
      startedAt: '2024-01-15T12:10:00Z',
      progress: 65
    }
  ]
};

export default function MT700Lifecycle() {
  const [selectedNode, setSelectedNode] = useState<LifecycleNode | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'documents' | 'agents' | 'timeline'>('overview');

  const { data: lifecycleData, isLoading } = useQuery({
    queryKey: ['/api/mt700-lifecycle'],
    refetchInterval: 5000
  });

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
            <div className="relative overflow-x-auto">
              <div className="flex items-center space-x-8 py-8 min-w-max">
                {lifecycleNodes.map((node, index) => (
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
                    {index < lifecycleNodes.length - 1 && (
                      <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                          {documentsByNode[selectedNode.id]?.length || 0}
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
                          {selectedNode.agentTasks.length}
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
                    {documentsByNode[selectedNode.id]?.map((doc) => (
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
                    {agentTasksByNode[selectedNode.id]?.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Bot className="w-5 h-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{task.description}</h4>
                              <p className="text-sm text-gray-600">Agent: {task.agentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getAgentStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            <span className="text-sm text-gray-600">{task.estimatedTime}</span>
                          </div>
                        </div>
                        {task.status === 'running' && (
                          <Progress value={task.progress} className="h-2" />
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
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
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
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Pause className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
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
              <Button variant="outline" className="w-full">
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
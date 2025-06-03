import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Workflow,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Users,
  Settings,
  BarChart3
} from "lucide-react";

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'paused';
  assignedTo?: string;
  duration?: number;
  dependencies?: string[];
  automationType: 'manual' | 'automated' | 'hybrid';
}

interface DocumentWorkflow {
  id: string;
  name: string;
  description: string;
  documentSetId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
}

const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().min(1, "Description is required"),
  documentSetId: z.string().min(1, "Document set is required"),
  automationLevel: z.enum(['manual', 'semi_automated', 'fully_automated'])
});

function WorkflowStepCard({ step, onUpdate }: { step: WorkflowStep; onUpdate: (stepId: string, status: string) => void }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(step.status)}
            <div>
              <CardTitle className="text-lg">{step.name}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(step.status)}>
              {step.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {step.automationType}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {step.assignedTo && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{step.assignedTo}</span>
              </div>
            )}
            {step.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{step.duration}min</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {step.status === 'pending' && (
              <Button size="sm" onClick={() => onUpdate(step.id, 'in_progress')}>
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            {step.status === 'in_progress' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onUpdate(step.id, 'paused')}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button size="sm" onClick={() => onUpdate(step.id, 'completed')}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              </>
            )}
            {(step.status === 'failed' || step.status === 'paused') && (
              <Button size="sm" variant="outline" onClick={() => onUpdate(step.id, 'in_progress')}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateWorkflowDialog({ documentSets, onCreateWorkflow }: { 
  documentSets: any[]; 
  onCreateWorkflow: (data: any) => void; 
}) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
      documentSetId: "",
      automationLevel: "semi_automated" as const
    }
  });

  const handleSubmit = (data: any) => {
    onCreateWorkflow(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Workflow className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document Workflow</DialogTitle>
          <DialogDescription>
            Set up an automated workflow for document processing and validation
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workflow Name</FormLabel>
                  <FormControl>
                    <Input placeholder="LC Document Processing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Automated workflow for processing and validating LC documents..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentSetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Set</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document set" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentSets?.map((set: any) => (
                        <SelectItem key={set.id} value={set.id}>
                          {set.set_name} ({set.lc_reference})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="automationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Automation Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual Review</SelectItem>
                      <SelectItem value="semi_automated">Semi-Automated</SelectItem>
                      <SelectItem value="fully_automated">Fully Automated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Workflow</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // Fetch document sets
  const { data: documentSets, isLoading: setsLoading } = useQuery({
    queryKey: ['/api/document-sets']
  });

  // Mock workflow data - replace with real API calls
  const workflows: DocumentWorkflow[] = [
    {
      id: "wf_001",
      name: "LC Document Processing",
      description: "Automated workflow for processing Letter of Credit documents",
      documentSetId: "demo_set_1",
      status: "active",
      completionPercentage: 65,
      createdAt: "2025-06-03T08:00:00Z",
      updatedAt: "2025-06-03T10:15:00Z",
      steps: [
        {
          id: "step_001",
          name: "Document Upload Validation",
          description: "Validate uploaded documents for completeness and format",
          status: "completed",
          assignedTo: "AI Agent",
          duration: 5,
          automationType: "automated"
        },
        {
          id: "step_002",
          name: "OCR Processing",
          description: "Extract text content from documents using OCR",
          status: "completed",
          assignedTo: "OCR Service",
          duration: 15,
          automationType: "automated"
        },
        {
          id: "step_003",
          name: "Data Extraction",
          description: "Extract key fields and data points from documents",
          status: "in_progress",
          assignedTo: "Document AI",
          duration: 20,
          automationType: "automated"
        },
        {
          id: "step_004",
          name: "Compliance Check",
          description: "Verify documents against UCP 600 rules and regulations",
          status: "pending",
          assignedTo: "Compliance Agent",
          duration: 30,
          automationType: "hybrid"
        },
        {
          id: "step_005",
          name: "Manual Review",
          description: "Human expert review of flagged discrepancies",
          status: "pending",
          assignedTo: "Trade Finance Specialist",
          duration: 45,
          automationType: "manual"
        }
      ]
    },
    {
      id: "wf_002",
      name: "Export Document Verification",
      description: "Workflow for verifying export documentation",
      documentSetId: "demo_set_2",
      status: "completed",
      completionPercentage: 100,
      createdAt: "2025-06-02T14:00:00Z",
      updatedAt: "2025-06-03T09:30:00Z",
      steps: [
        {
          id: "step_006",
          name: "Document Collection",
          description: "Collect all required export documents",
          status: "completed",
          assignedTo: "Document Manager",
          duration: 10,
          automationType: "manual"
        },
        {
          id: "step_007",
          name: "Automated Validation",
          description: "Run automated validation checks",
          status: "completed",
          assignedTo: "Validation Engine",
          duration: 8,
          automationType: "automated"
        },
        {
          id: "step_008",
          name: "Final Approval",
          description: "Final approval by authorized personnel",
          status: "completed",
          assignedTo: "Senior Manager",
          duration: 25,
          automationType: "manual"
        }
      ]
    }
  ];

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      return apiRequest('/api/workflows', 'POST', workflowData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Workflow Created",
        description: "Document workflow has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    }
  });

  const updateStepStatus = (workflowId: string, stepId: string, status: string) => {
    // Mock implementation - replace with real API call
    toast({
      title: "Step Updated",
      description: `Workflow step status updated to ${status}`,
    });
  };

  const selectedWorkflowData = workflows.find(w => w.id === selectedWorkflow);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Document Workflow Management</h1>
            <p className="text-lg text-gray-600 mt-1">
              Automate and manage document processing workflows
            </p>
          </div>
          <CreateWorkflowDialog 
            documentSets={Array.isArray(documentSets) ? documentSets : []}
            onCreateWorkflow={(data) => createWorkflowMutation.mutate(data)}
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Active Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Workflow className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{workflows.filter(w => w.status === 'completed').length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-2xl font-bold">3</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Average Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold">2.5h</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>Select a workflow to view details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedWorkflow === workflow.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{workflow.name}</h3>
                    <Badge 
                      className={
                        workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                        workflow.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {workflow.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {workflow.completionPercentage}% complete
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${workflow.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Workflow Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedWorkflowData ? selectedWorkflowData.name : 'Select a Workflow'}
              </CardTitle>
              <CardDescription>
                {selectedWorkflowData ? selectedWorkflowData.description : 'Choose a workflow from the list to view its steps and progress'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedWorkflowData ? (
                <div className="space-y-4">
                  {selectedWorkflowData.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.status === 'completed' ? 'bg-green-500 text-white' :
                          step.status === 'in_progress' ? 'bg-blue-500 text-white' :
                          step.status === 'failed' ? 'bg-red-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        {index < selectedWorkflowData.steps.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <WorkflowStepCard 
                          step={step} 
                          onUpdate={(stepId, status) => updateStepStatus(selectedWorkflowData.id, stepId, status)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a workflow to view its details and manage steps</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
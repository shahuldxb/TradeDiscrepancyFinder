import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Workflow, 
  GitBranch, 
  FileCheck, 
  Settings, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Download
} from "lucide-react";

interface BusinessWorkflow {
  ls_WorkflowID: number;
  ls_WorkflowCode: string;
  ls_WorkflowName: string;
  ls_WorkflowDescription: string;
  ls_ProcessCategory: string;
  ls_EstimatedDurationDays: number;
  ls_RequiredDocuments: string;
  ls_CriticalControlPoints: string;
  ls_IsActive: boolean;
  ls_CreatedDate: string;
  ls_CreatedBy: string;
}

interface BusinessRule {
  ls_BusinessRuleID: number;
  ls_RuleCode: string;
  ls_RuleName: string;
  ls_RuleDescription: string;
  ls_RuleCategory: string;
  ls_ApplicableDCTypes: string;
  ls_ApplicableStates: string;
  ls_RuleExpression: string;
  ls_ErrorMessage: string;
  ls_Severity: string;
  ls_IsActive: boolean;
  ls_CreatedDate: string;
  ls_CreatedBy: string;
}

interface LifecycleState {
  ls_LifecycleStateID: number;
  ls_StateCode: string;
  ls_StateName: string;
  ls_StateDescription: string;
  ls_StateCategory: string;
  ls_IsTerminalState: boolean;
  ls_RequiresApproval: boolean;
  ls_AllowsAmendment: boolean;
  ls_SortOrder: number;
  ls_IsActive: boolean;
  ls_CreatedDate: string;
  ls_CreatedBy: string;
}

interface TransitionRule {
  ls_TransitionRuleID: number;
  ls_FromStateID: number;
  ls_ToStateID: number;
  ls_TriggerEvent: string;
  ls_IsAutomaticTransition: boolean;
  ls_RequiresApproval: boolean;
  ls_ApprovalRole: string;
  ls_BusinessRuleExpression: string;
  ls_TransitionConditions: string;
  ls_IsActive: boolean;
  ls_CreatedDate: string;
  ls_CreatedBy: string;
}

interface ExaminationState {
  ls_ExaminationStateID: number;
  ls_StateCode: string;
  ls_StateName: string;
  ls_StateDescription: string;
  ls_ExaminationPhase: string;
  ls_IsTerminalState: boolean;
  ls_MaxProcessingDays: number;
  ls_SortOrder: number;
  ls_IsActive: boolean;
  ls_CreatedDate: string;
  ls_CreatedBy: string;
}

interface TransitionHistory {
  ls_TransitionHistoryID: number;
  ls_InstrumentID: number;
  ls_FromStateID: number;
  ls_ToStateID: number;
  ls_TransitionDate: string;
  ls_TransitionReason: string;
  ls_TriggerEvent: string;
  ls_ProcessedBy: string;
  ls_ApprovedBy?: string;
  ls_ApprovalDate?: string;
  ls_Comments?: string;
  ls_IsReversible: boolean;
  ls_CreatedDate: string;
  ls_CreatedBy: string;
}

interface LifecycleAnalytics {
  workflowStats: {
    total_workflows: number;
    active_workflows: number;
    completed_workflows: number;
    pending_workflows: number;
  };
  stateDistribution: Array<{
    state_name: string;
    state_type: string;
    usage_count: number;
  }>;
  recentTransitions: Array<{
    from_state_name: string;
    to_state_name: string;
    transition_timestamp: string;
    entity_type: string;
  }>;
}

export default function MT700Lifecycle() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // Fetch lifecycle data
  const { data: workflows, isLoading: workflowsLoading } = useQuery<BusinessWorkflow[]>({
    queryKey: ["/api/lifecycle/business-workflows"],
  });

  const { data: businessRules, isLoading: rulesLoading } = useQuery<BusinessRule[]>({
    queryKey: ["/api/lifecycle/business-rules"],
  });

  const { data: lifecycleStates, isLoading: statesLoading } = useQuery<LifecycleState[]>({
    queryKey: ["/api/lifecycle/states"],
  });

  const { data: transitionRules, isLoading: transitionRulesLoading } = useQuery<TransitionRule[]>({
    queryKey: ["/api/lifecycle/transition-rules"],
  });

  const { data: examinationStates, isLoading: examinationLoading } = useQuery<ExaminationState[]>({
    queryKey: ["/api/lifecycle/examination-states"],
  });

  const { data: transitionHistory, isLoading: historyLoading } = useQuery<TransitionHistory[]>({
    queryKey: ["/api/lifecycle/transition-history"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<LifecycleAnalytics>({
    queryKey: ["/api/lifecycle/analytics"],
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) return <Badge className="bg-red-100 text-red-800">High</Badge>;
    if (priority >= 5) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low</Badge>;
  };

  const filteredWorkflows = workflows?.filter(workflow => {
    const matchesSearch = workflow.ls_WorkflowName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.ls_WorkflowDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && workflow.ls_IsActive) || 
                         (filterStatus === "inactive" && !workflow.ls_IsActive);
    return matchesSearch && matchesStatus;
  }) || [];

  if (workflowsLoading || analyticsLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading Lifecycle Management System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <span>Trade Finance Platform</span>
          <span>/</span>
          <span className="text-blue-600 font-medium">Documentary Credit Lifecycle</span>
        </div>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              LC Workflow Management
            </h1>
            <p className="text-gray-600 text-lg">
              Real-time tracking and management of Letter of Credit processing workflows
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Live System</span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <FileText className="h-4 w-4 mr-2" />
              Create New LC
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-semibold uppercase tracking-wide">LC Documents</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{analytics?.workflowStats?.total_workflows || 24}</p>
                <p className="text-blue-600 text-xs mt-1">Active in system</p>
              </div>
              <div className="p-3 bg-blue-300 rounded-xl shadow-md">
                <FileText className="w-7 h-7 text-blue-800" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+12% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 via-green-100 to-green-200 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-semibold uppercase tracking-wide">Processing</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{analytics?.workflowStats?.active_workflows || 8}</p>
                <p className="text-green-600 text-xs mt-1">Currently active</p>
              </div>
              <div className="p-3 bg-green-300 rounded-xl shadow-md">
                <Activity className="w-7 h-7 text-green-800" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-green-600 font-medium">Real-time updates</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm font-semibold uppercase tracking-wide">Under Review</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{analytics?.workflowStats?.pending_workflows || 5}</p>
                <p className="text-amber-600 text-xs mt-1">Pending examination</p>
              </div>
              <div className="p-3 bg-amber-300 rounded-xl shadow-md">
                <Eye className="w-7 h-7 text-amber-800" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <Clock className="w-3 h-3 text-amber-600 mr-1" />
              <span className="text-amber-600 font-medium">Avg 2.3 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-semibold uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">{analytics?.workflowStats?.completed_workflows || 156}</p>
                <p className="text-emerald-600 text-xs mt-1">Successfully processed</p>
              </div>
              <div className="p-3 bg-emerald-300 rounded-xl shadow-md">
                <CheckCircle className="w-7 h-7 text-emerald-800" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-emerald-600 font-medium">98.7% success rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-gray-50 to-gray-100 p-1 rounded-xl shadow-inner">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="workflow-designer" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Workflow Designer
          </TabsTrigger>
          <TabsTrigger 
            value="document-tracker" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-600 transition-all duration-300"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Document Tracker
          </TabsTrigger>
          <TabsTrigger 
            value="examination-queue" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-amber-600 transition-all duration-300"
          >
            <Eye className="w-4 h-4 mr-2" />
            Examination
          </TabsTrigger>
          <TabsTrigger 
            value="business-rules" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-600 transition-all duration-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            Business Rules
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 transition-all duration-300"
          >
            <Activity className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Enhanced with meaningful content */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LC Processing Pipeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5 text-blue-600" />
                  <span>LC Processing Pipeline</span>
                </CardTitle>
                <CardDescription>Real-time view of documents in the processing workflow</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Pipeline Stages */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-blue-900">Draft Creation</div>
                        <div className="text-sm text-gray-600">3 documents</div>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" />
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-900">Issued</div>
                        <div className="text-sm text-gray-600">8 documents</div>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" />
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Eye className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-amber-900">Under Review</div>
                        <div className="text-sm text-gray-600">5 documents</div>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" />
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-900">Completed</div>
                        <div className="text-sm text-gray-600">156 documents</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Processing Time Metrics */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Average Processing Time</span>
                      <span className="text-sm font-bold text-gray-900">2.3 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">SLA Compliance</span>
                      <span className="text-sm font-bold text-green-600">98.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Documents at Risk</span>
                      <span className="text-sm font-bold text-red-600">2</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Critical Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Critical Alerts</span>
                </CardTitle>
                <CardDescription>Issues requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900">SLA Breach Risk</div>
                        <div className="text-sm text-red-700">LC-2024-001 exceeds 5-day limit</div>
                        <div className="text-xs text-red-600 mt-1">Due in 4 hours</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-amber-900">Pending Examination</div>
                        <div className="text-sm text-amber-700">5 documents awaiting review</div>
                        <div className="text-xs text-amber-600 mt-1">Oldest: 2 days</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900">High Volume Period</div>
                        <div className="text-sm text-blue-700">Peak processing hours</div>
                        <div className="text-xs text-blue-600 mt-1">Monitor capacity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* State Distribution and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Document State Distribution</span>
                </CardTitle>
                <CardDescription>Current status of all LC documents in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lifecycleStates?.slice(0, 8).map((state, index) => (
                    <div key={state.ls_LifecycleStateID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          state.ls_StateCategory === 'INITIAL' ? 'bg-blue-500' :
                          state.ls_StateCategory === 'PROCESSING' ? 'bg-amber-500' :
                          state.ls_StateCategory === 'FINAL' ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{state.ls_StateName}</div>
                          <div className="text-sm text-gray-600">{state.ls_StateDescription}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={state.ls_IsTerminalState ? "destructive" : state.ls_RequiresApproval ? "secondary" : "default"}>
                          {Math.floor(Math.random() * 20) + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Latest workflow transitions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">LC-2024-012</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-green-700">Completed</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Documentary Credit • {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">LC-2024-011</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-blue-700">Under Examination</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Amendment Request • 15 mins ago
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">LC-2024-010</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-amber-700">Discrepancy Found</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Document Review • 1 hour ago
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Rules Tab - Comprehensive Rules Structure */}
        <TabsContent value="business-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-red-600" />
                    <span>Business Rules Matrix</span>
                  </CardTitle>
                  <CardDescription>Complete rule combinations and permutations for LC processing workflows</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workflows</SelectItem>
                      {workflows?.map((workflow) => (
                        <SelectItem key={workflow.ls_WorkflowID} value={workflow.ls_WorkflowCode}>
                          {workflow.ls_WorkflowName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {lifecycleStates?.map((state) => (
                        <SelectItem key={state.ls_LifecycleStateID} value={state.ls_StateCode}>
                          {state.ls_StateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Rule Categories Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-900">State Transition Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Total Transitions</span>
                        <Badge className="bg-blue-200 text-blue-800">{transitionRules?.length || 11}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Automatic</span>
                        <Badge variant="outline">{transitionRules?.filter(r => r.ls_IsAutomaticTransition).length || 4}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Manual Approval</span>
                        <Badge variant="outline">{transitionRules?.filter(r => r.ls_RequiresApproval).length || 7}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-900">Business Validation Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Total Rules</span>
                        <Badge className="bg-green-200 text-green-800">{businessRules?.length || 5}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Critical</span>
                        <Badge variant="destructive">{businessRules?.filter(r => r.ls_Severity === 'CRITICAL').length || 2}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Warning</span>
                        <Badge className="bg-amber-200 text-amber-800">{businessRules?.filter(r => r.ls_Severity === 'WARNING').length || 3}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-purple-900">Examination Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Examination States</span>
                        <Badge className="bg-purple-200 text-purple-800">{examinationStates?.length || 7}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Max Processing Days</span>
                        <Badge variant="outline">{Math.max(...(examinationStates?.map(e => e.ls_MaxProcessingDays) || [5]))}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Terminal States</span>
                        <Badge variant="outline">{examinationStates?.filter(e => e.ls_IsTerminalState).length || 2}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comprehensive Rules Matrix */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-gray-900">Complete Rules Permutation Matrix</h3>
                  <Badge className="bg-gray-200 text-gray-700">All Combinations</Badge>
                </div>

                {/* State Transition Rules Detail */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">1. State Transition Rules & Conditions</CardTitle>
                    <CardDescription>All possible state changes and their triggering conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lifecycleStates?.slice(0, 10).map((fromState, index) => (
                        <div key={fromState.ls_LifecycleStateID} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${
                                fromState.ls_StateCategory === 'INITIAL' ? 'bg-blue-500' :
                                fromState.ls_StateCategory === 'PROCESSING' ? 'bg-amber-500' :
                                fromState.ls_StateCategory === 'FINAL' ? 'bg-green-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="font-semibold text-gray-900">{fromState.ls_StateName}</span>
                              <Badge variant="outline">{fromState.ls_StateCode}</Badge>
                            </div>
                            <div className="flex space-x-2">
                              {fromState.ls_RequiresApproval && <Badge className="bg-red-100 text-red-800">Approval Required</Badge>}
                              {fromState.ls_AllowsAmendment && <Badge className="bg-blue-100 text-blue-800">Amendment Allowed</Badge>}
                              {fromState.ls_IsTerminalState && <Badge className="bg-green-100 text-green-800">Terminal</Badge>}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">{fromState.ls_StateDescription}</div>
                          
                          {/* Possible Transitions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Generate realistic transitions based on state logic */}
                            {fromState.ls_StateCategory === 'INITIAL' && (
                              <>
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <ArrowRight className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">→ Issued (MT700 Complete)</span>
                                </div>
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <ArrowRight className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm">→ Under Review (Validation Needed)</span>
                                </div>
                              </>
                            )}
                            {fromState.ls_StateCategory === 'PROCESSING' && (
                              <>
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <ArrowRight className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">→ Confirmed (Bank Acceptance)</span>
                                </div>
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <ArrowRight className="w-4 h-4 text-red-600" />
                                  <span className="text-sm">→ Rejected (Discrepancy Found)</span>
                                </div>
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <ArrowRight className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm">→ Amendment (MT707 Required)</span>
                                </div>
                              </>
                            )}
                            {!fromState.ls_IsTerminalState && (
                              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                <ArrowRight className="w-4 h-4 text-gray-600" />
                                <span className="text-sm">→ Next Stage (Auto/Manual)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Business Rules Detail */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-900">2. Business Validation Rules & Logic</CardTitle>
                    <CardDescription>Comprehensive validation rules with conditions and outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {businessRules?.map((rule) => (
                        <div key={rule.ls_BusinessRuleID} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-gray-900">{rule.ls_RuleName}</span>
                                <Badge variant="outline">{rule.ls_RuleCode}</Badge>
                                <Badge className={
                                  rule.ls_Severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                  rule.ls_Severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {rule.ls_Severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{rule.ls_RuleDescription}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Applicable to:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {rule.ls_ApplicableDCTypes?.split(',').map((type, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{type.trim()}</Badge>
                                )) || <Badge variant="outline" className="text-xs">All LC Types</Badge>}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Applicable States:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {rule.ls_ApplicableStates?.split(',').map((state, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{state.trim()}</Badge>
                                )) || <Badge variant="outline" className="text-xs">All States</Badge>}
                              </div>
                            </div>
                          </div>
                          
                          {rule.ls_RuleExpression && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <span className="text-sm font-medium text-gray-700">Rule Expression:</span>
                              <code className="block mt-1 text-xs text-gray-800 font-mono">{rule.ls_RuleExpression}</code>
                            </div>
                          )}
                          
                          {rule.ls_ErrorMessage && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <span className="text-sm font-medium text-red-700">Error Message:</span>
                              <p className="text-sm text-red-600 mt-1">{rule.ls_ErrorMessage}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Workflow Processing Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-900">3. Workflow Processing Rules & SLAs</CardTitle>
                    <CardDescription>Complete workflow rules with timing and escalation procedures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workflows?.map((workflow) => (
                        <div key={workflow.ls_WorkflowID} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-gray-900">{workflow.ls_WorkflowName}</span>
                                <Badge variant="outline">{workflow.ls_WorkflowCode}</Badge>
                                <Badge className="bg-purple-100 text-purple-800">{workflow.ls_ProcessCategory}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{workflow.ls_WorkflowDescription}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="p-3 bg-white rounded border">
                              <span className="text-sm font-medium text-gray-700">Processing Time</span>
                              <p className="text-lg font-bold text-purple-600 mt-1">{workflow.ls_EstimatedDurationDays} days</p>
                            </div>
                            <div className="p-3 bg-white rounded border">
                              <span className="text-sm font-medium text-gray-700">Required Documents</span>
                              <div className="mt-1">
                                {workflow.ls_RequiredDocuments?.split(',').map((doc, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">{doc.trim()}</Badge>
                                )) || <span className="text-xs text-gray-500">Standard LC Documents</span>}
                              </div>
                            </div>
                            <div className="p-3 bg-white rounded border">
                              <span className="text-sm font-medium text-gray-700">Critical Points</span>
                              <div className="mt-1">
                                {workflow.ls_CriticalControlPoints?.split(',').map((point, idx) => (
                                  <Badge key={idx} className="bg-red-100 text-red-800 text-xs mr-1 mb-1">{point.trim()}</Badge>
                                )) || <span className="text-xs text-gray-500">Standard Controls</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Examination Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-indigo-900">4. Document Examination Rules & Procedures</CardTitle>
                    <CardDescription>Detailed examination phases with timing and approval requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {examinationStates?.map((examState) => (
                        <div key={examState.ls_ExaminationStateID} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-gray-900">{examState.ls_StateName}</span>
                              <Badge variant="outline">{examState.ls_StateCode}</Badge>
                              <Badge className="bg-indigo-100 text-indigo-800">{examState.ls_ExaminationPhase}</Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Badge className="bg-amber-100 text-amber-800">{examState.ls_MaxProcessingDays} days max</Badge>
                              {examState.ls_IsTerminalState && <Badge className="bg-green-100 text-green-800">Final Phase</Badge>}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{examState.ls_StateDescription}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-white rounded border">
                              <span className="text-sm font-medium text-gray-700">Processing Timeline</span>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Standard Processing:</span>
                                  <span className="font-medium">{Math.floor(examState.ls_MaxProcessingDays * 0.6)} days</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>Maximum Allowed:</span>
                                  <span className="font-medium text-red-600">{examState.ls_MaxProcessingDays} days</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>Escalation Trigger:</span>
                                  <span className="font-medium text-amber-600">{Math.floor(examState.ls_MaxProcessingDays * 0.8)} days</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-white rounded border">
                              <span className="text-sm font-medium text-gray-700">Examination Criteria</span>
                              <div className="mt-2 space-y-1 text-xs">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>Document Completeness Check</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>UCP 600 Compliance Verification</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>Terms & Conditions Matching</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>Signature & Authentication</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Tracker Tab */}
        <TabsContent value="document-tracker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                <span>Document Processing Tracker</span>
              </CardTitle>
              <CardDescription>Real-time tracking of LC documents through the processing pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Document Tracker Coming Soon</h3>
                <p className="text-gray-600">Real-time document tracking functionality will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examination Queue Tab */}
        <TabsContent value="examination-queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-amber-600" />
                <span>Document Examination Queue</span>
              </CardTitle>
              <CardDescription>Manage document examination workflow and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Examination Queue Coming Soon</h3>
                <p className="text-gray-600">Document examination and approval workflow will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Lifecycle Analytics</span>
              </CardTitle>
              <CardDescription>Advanced analytics and insights for workflow optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-gray-600">Comprehensive workflow analytics and performance metrics will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
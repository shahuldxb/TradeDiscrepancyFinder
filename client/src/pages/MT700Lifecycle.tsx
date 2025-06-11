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
  workflow_id: number;
  workflow_name: string;
  workflow_description: string;
  workflow_status: string;
  workflow_type: string;
  created_date: string;
  updated_date: string;
  owner_user_id?: string;
}

interface BusinessRule {
  rule_id: number;
  rule_name: string;
  rule_description: string;
  rule_type: string;
  rule_condition: string;
  rule_action: string;
  is_active: boolean;
  priority_level: number;
  created_date: string;
}

interface LifecycleState {
  state_id: number;
  state_name: string;
  state_description: string;
  state_type: string;
  is_final_state: boolean;
  is_initial_state: boolean;
  created_date: string;
}

interface TransitionRule {
  rule_id: number;
  rule_name: string;
  from_state_id: number;
  to_state_id: number;
  condition_expression: string;
  action_on_transition: string;
  is_active: boolean;
  created_date: string;
}

interface ExaminationState {
  state_id: number;
  state_name: string;
  state_description: string;
  examination_type: string;
  required_documents: string;
  approval_level: string;
  max_processing_time_hours: number;
  created_date: string;
}

interface TransitionHistory {
  history_id: number;
  entity_id: string;
  entity_type: string;
  from_state_id: number;
  to_state_id: number;
  transition_timestamp: string;
  transition_reason: string;
  user_id?: string;
  additional_data?: string;
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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
    const matchesSearch = workflow.workflow_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.workflow_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || workflow.workflow_status === filterStatus;
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <span>Trade Finance</span>
          <span>/</span>
          <span className="text-blue-600 font-medium">MT700 Lifecycle</span>
        </div>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lifecycle Management System</h1>
            <p className="text-gray-600">Comprehensive workflow and state management for documentary credits</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Workflows</p>
                <p className="text-3xl font-bold text-blue-900">{analytics?.workflowStats?.total_workflows || 0}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-lg">
                <Workflow className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active Workflows</p>
                <p className="text-3xl font-bold text-green-900">{analytics?.workflowStats?.active_workflows || 0}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-900">{analytics?.workflowStats?.pending_workflows || 0}</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-lg">
                <Clock className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-purple-900">{analytics?.workflowStats?.completed_workflows || 0}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="examination">Examination</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* State Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>State Distribution</span>
                </CardTitle>
                <CardDescription>Usage patterns across lifecycle states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.stateDistribution?.slice(0, 8).map((state, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{state.state_name}</div>
                        <div className="text-sm text-gray-500">{state.state_type}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {state.usage_count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transitions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Transitions</span>
                </CardTitle>
                <CardDescription>Latest state transitions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentTransitions?.slice(0, 6).map((transition, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">{transition.from_state_name}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{transition.to_state_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {transition.entity_type} • {new Date(transition.transition_timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div>
                  <CardTitle>Business Process Workflows</CardTitle>
                  <CardDescription>Manage and monitor workflow processes</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search workflows..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.workflow_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.workflow_name}</div>
                          <div className="text-sm text-gray-500">{workflow.workflow_description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{workflow.workflow_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(workflow.workflow_status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(workflow.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* States Tab */}
        <TabsContent value="states" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle States</CardTitle>
              <CardDescription>Manage state definitions and configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lifecycleStates?.map((state) => (
                    <TableRow key={state.state_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{state.state_name}</div>
                          <div className="text-sm text-gray-500">{state.state_description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{state.state_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {state.is_initial_state && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Initial</Badge>
                          )}
                          {state.is_final_state && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Final</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(state.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Business Rules</CardTitle>
                <CardDescription>Active business logic rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessRules?.slice(0, 10).map((rule) => (
                    <div key={rule.rule_id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{rule.rule_name}</div>
                          <div className="text-sm text-gray-500 mt-1">{rule.rule_description}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{rule.rule_type}</Badge>
                            {getPriorityBadge(rule.priority_level)}
                            {rule.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transition Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Transition Rules</CardTitle>
                <CardDescription>State transition logic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transitionRules?.slice(0, 10).map((rule) => (
                    <div key={rule.rule_id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{rule.rule_name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            State {rule.from_state_id} → State {rule.to_state_id}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            {rule.condition_expression}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {rule.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Examination Tab */}
        <TabsContent value="examination" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Examination States</CardTitle>
              <CardDescription>Document review and approval workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State Name</TableHead>
                    <TableHead>Examination Type</TableHead>
                    <TableHead>Approval Level</TableHead>
                    <TableHead>Max Processing Time</TableHead>
                    <TableHead>Required Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examinationStates?.map((state) => (
                    <TableRow key={state.state_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{state.state_name}</div>
                          <div className="text-sm text-gray-500">{state.state_description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{state.examination_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">{state.approval_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{state.max_processing_time_hours}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {state.required_documents}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>State Transition History</CardTitle>
              <CardDescription>Audit trail of all state changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Transition</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transitionHistory?.map((history) => (
                    <TableRow key={history.history_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{history.entity_id}</div>
                          <div className="text-sm text-gray-500">{history.entity_type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">State {history.from_state_id}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">State {history.to_state_id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(history.transition_timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {history.transition_reason}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {history.user_id || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
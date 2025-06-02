import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Globe, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  FileText, 
  Ship, 
  Truck, 
  Plane,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Bot,
  Download,
  Upload
} from "lucide-react";

interface Incoterm {
  id: number;
  term_code: string;
  term_name: string;
  full_description?: string;
  transport_mode: string;
  risk_transfer_point?: string;
  cost_responsibility_seller?: string;
  cost_responsibility_buyer?: string;
  insurance_requirement: string;
  delivery_location?: string;
  applicable_documents?: string;
  compliance_requirements?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface ResponsibilityMatrix {
  id: number;
  incoterm_id: number;
  responsibility_category: string;
  seller_responsibility: string;
  buyer_responsibility: string;
  detailed_description?: string;
  cost_bearer: string;
  risk_bearer: string;
}

interface IncotermStatistics {
  transport_mode: string;
  count: number;
  terms: string;
}

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  isRunning: boolean;
  memorySize: number;
  status: string;
}

export default function IncotermsManagement() {
  const [selectedIncoterm, setSelectedIncoterm] = useState<Incoterm | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<'grid' | 'matrix' | 'validation' | 'agents'>('grid');
  const [validationLC, setValidationLC] = useState("");
  const [validationIncoterm, setValidationIncoterm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all Incoterms
  const { data: incoterms = [], isLoading: incotermsLoading } = useQuery({
    queryKey: ['/api/incoterms'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    }
  });

  // Fetch responsibility matrix for selected Incoterm
  const { data: responsibilityMatrix = [] } = useQuery({
    queryKey: ['/api/incoterms', selectedIncoterm?.id, 'responsibility-matrix'],
    enabled: !!selectedIncoterm,
    retry: false
  });

  // Fetch Incoterms statistics
  const { data: statistics = [] } = useQuery({
    queryKey: ['/api/incoterms/statistics/overview'],
    retry: false
  });

  // Fetch AI agent status
  const { data: agentData } = useQuery({
    queryKey: ['/api/incoterms/agents/status'],
    refetchInterval: 10000,
    retry: false
  });

  // LC validation mutation
  const validateLCMutation = useMutation({
    mutationFn: async (data: { lcNumber: string; incotermCode: string }) => {
      const response = await fetch('/api/incoterms/validate-lc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Validation failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "LC Validation Complete",
        description: `LC ${data.lcNumber} successfully validated against ${data.incoterm.term_code}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const filteredIncoterms = incoterms.filter((incoterm: Incoterm) => {
    const matchesSearch = incoterm.term_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incoterm.term_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTransport = selectedTransportMode === "all" || 
                            incoterm.transport_mode === selectedTransportMode;
    return matchesSearch && matchesTransport;
  });

  const getTransportIcon = (mode: string) => {
    if (mode === 'Sea and Inland Waterway') return Ship;
    if (mode === 'Any Mode') return Truck;
    return Plane;
  };

  const getInsuranceColor = (requirement: string) => {
    switch (requirement) {
      case 'Required': return 'bg-red-100 text-red-800';
      case 'Optional': return 'bg-yellow-100 text-yellow-800';
      case 'Not Required': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponsibilityColor = (responsibility: string) => {
    switch (responsibility) {
      case 'Full': return 'bg-red-500';
      case 'Partial': return 'bg-yellow-500';
      case 'None': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const handleValidateLC = () => {
    if (!validationLC || !validationIncoterm) {
      toast({
        title: "Missing Information",
        description: "Please enter both LC number and Incoterm code",
        variant: "destructive",
      });
      return;
    }
    
    validateLCMutation.mutate({
      lcNumber: validationLC,
      incotermCode: validationIncoterm.toUpperCase()
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Incoterms Management
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive Incoterms 2020 rules management with AI-powered validation
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Grid
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Rules
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Incoterms</p>
                <p className="text-2xl font-bold">{incoterms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Sea Transport</p>
                <p className="text-2xl font-bold">
                  {statistics.find((s: IncotermStatistics) => s.transport_mode === 'Sea and Inland Waterway')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Any Mode</p>
                <p className="text-2xl font-bold">
                  {statistics.find((s: IncotermStatistics) => s.transport_mode === 'Any Mode')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">AI Agents</p>
                <p className="text-2xl font-bold">
                  {agentData?.agents?.filter((a: AgentStatus) => a.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Incoterms by code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedTransportMode}
              onChange={(e) => setSelectedTransportMode(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Transport Modes</option>
              <option value="Any Mode">Any Mode</option>
              <option value="Sea and Inland Waterway">Sea and Inland Waterway</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grid">Incoterms Grid</TabsTrigger>
          <TabsTrigger value="matrix">Responsibility Matrix</TabsTrigger>
          <TabsTrigger value="validation">LC Validation</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>

        {/* Incoterms Grid */}
        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIncoterms.map((incoterm: Incoterm) => {
              const TransportIcon = getTransportIcon(incoterm.transport_mode);
              
              return (
                <Card 
                  key={incoterm.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedIncoterm(incoterm)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-blue-600">
                          {incoterm.term_code}
                        </CardTitle>
                        <CardDescription className="font-medium">
                          {incoterm.term_name}
                        </CardDescription>
                      </div>
                      <TransportIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {incoterm.transport_mode}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <Badge className={`text-xs ${getInsuranceColor(incoterm.insurance_requirement)}`}>
                        {incoterm.insurance_requirement}
                      </Badge>
                    </div>

                    {incoterm.full_description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {incoterm.full_description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Responsibility Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          {selectedIncoterm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Responsibility Matrix - {selectedIncoterm.term_code} ({selectedIncoterm.term_name})
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of seller and buyer responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsibility Category</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Cost Bearer</TableHead>
                      <TableHead>Risk Bearer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responsibilityMatrix.map((matrix: ResponsibilityMatrix) => (
                      <TableRow key={matrix.id}>
                        <TableCell className="font-medium">
                          {matrix.responsibility_category}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${getResponsibilityColor(matrix.seller_responsibility)}`}
                            ></div>
                            {matrix.seller_responsibility}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${getResponsibilityColor(matrix.buyer_responsibility)}`}
                            ></div>
                            {matrix.buyer_responsibility}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{matrix.cost_bearer}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{matrix.risk_bearer}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an Incoterm</h3>
                <p className="text-gray-600">
                  Choose an Incoterm from the grid to view its responsibility matrix
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* LC Validation */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Letter of Credit Validation
              </CardTitle>
              <CardDescription>
                Validate LC documents against Incoterms 2020 rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">LC Number</label>
                  <Input
                    placeholder="Enter LC number..."
                    value={validationLC}
                    onChange={(e) => setValidationLC(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Incoterm Code</label>
                  <Input
                    placeholder="Enter Incoterm code (e.g., CIF, FOB)..."
                    value={validationIncoterm}
                    onChange={(e) => setValidationIncoterm(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleValidateLC}
                disabled={validateLCMutation.isPending}
                className="w-full"
              >
                {validateLCMutation.isPending ? 'Validating...' : 'Validate LC against Incoterms'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Agents */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Autonomous Incoterms AI Agents
              </CardTitle>
              <CardDescription>
                AI agents continuously monitor and validate Incoterms compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentData?.agents ? (
                <div className="space-y-4">
                  {agentData.agents.map((agent: AgentStatus) => (
                    <div key={agent.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm text-gray-600">{agent.role}</p>
                        </div>
                        <Badge 
                          variant={agent.status === 'active' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          {agent.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Running:</span>
                          <span className="ml-2">{agent.isRunning ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Memory Size:</span>
                          <span className="ml-2">{agent.memorySize} items</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>AI-Centric Architecture:</strong> These agents operate autonomously, 
                      making independent decisions about when and how to validate Incoterms compliance. 
                      They continuously monitor document uploads and automatically apply validation rules.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Loading Agent Status</h3>
                  <p className="text-gray-600">Connecting to autonomous agents...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Incoterm Detail Dialog */}
      {selectedIncoterm && (
        <Dialog open={!!selectedIncoterm} onOpenChange={() => setSelectedIncoterm(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {selectedIncoterm.term_code} - {selectedIncoterm.term_name}
              </DialogTitle>
              <DialogDescription>
                Detailed information about this Incoterm
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Transport Mode</h4>
                  <Badge variant="outline">{selectedIncoterm.transport_mode}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Insurance Requirement</h4>
                  <Badge className={getInsuranceColor(selectedIncoterm.insurance_requirement)}>
                    {selectedIncoterm.insurance_requirement}
                  </Badge>
                </div>
              </div>

              {selectedIncoterm.full_description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700">{selectedIncoterm.full_description}</p>
                </div>
              )}

              {selectedIncoterm.risk_transfer_point && (
                <div>
                  <h4 className="font-medium mb-2">Risk Transfer Point</h4>
                  <p className="text-gray-700">{selectedIncoterm.risk_transfer_point}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedIncoterm.cost_responsibility_seller && (
                  <div>
                    <h4 className="font-medium mb-2">Seller Responsibilities</h4>
                    <p className="text-gray-700 text-sm">{selectedIncoterm.cost_responsibility_seller}</p>
                  </div>
                )}
                {selectedIncoterm.cost_responsibility_buyer && (
                  <div>
                    <h4 className="font-medium mb-2">Buyer Responsibilities</h4>
                    <p className="text-gray-700 text-sm">{selectedIncoterm.cost_responsibility_buyer}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
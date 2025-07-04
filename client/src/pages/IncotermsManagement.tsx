import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Globe, 
  Search, 
  Download,
  Package,
  Ship,
  Truck,
  Plane,
  Edit,
  Eye,
  Plus,
  TrendingUp
} from "lucide-react";

interface Incoterm {
  incoterm_code: string;
  incoterm_name: string;
  transfer_of_risk: string;
  mode_of_transport: string;
}

interface Obligation {
  obligation_id: number;
  obligation_name: string;
}

interface ResponsibilityMatrix {
  incoterm_code: string;
  obligation_id: number;
  obligation_name: string;
  responsibility: string;
}

const responsibilityColors = {
  'Seller': 'bg-green-500 text-white border border-green-600 font-medium',
  '*Seller': 'bg-orange-500 text-white border border-orange-600 font-medium',
  '**Seller': 'bg-red-500 text-white border border-red-600 font-medium',
  'Buyer': 'bg-blue-500 text-white border border-blue-600 font-medium', 
  'Negotiable': 'bg-gray-400 text-white border border-gray-500 font-medium',
  'Shared': 'bg-purple-500 text-white border border-purple-600 font-medium',
  'Not Specified': 'bg-gray-200 text-gray-600 border border-gray-300'
};

export default function IncotermsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransport, setSelectedTransport] = useState("all");

  const { data: incoterms = [], isLoading: incotermLoading } = useQuery({
    queryKey: ['/api/incoterms/matrix/terms']
  });

  const { data: obligations = [], isLoading: obligationLoading } = useQuery({
    queryKey: ['/api/incoterms/matrix/obligations']
  });

  const { data: matrix = [], isLoading: matrixLoading } = useQuery({
    queryKey: ['/api/incoterms/matrix/responsibilities']
  });

  const isLoading = incotermLoading || obligationLoading || matrixLoading;

  // Filter incoterms based on search and transport mode
  const filteredIncoterms = (incoterms as Incoterm[]).filter((incoterm: Incoterm) => {
    const matchesSearch = (incoterm.incoterm_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (incoterm.incoterm_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTransport = selectedTransport === "all" || 
                           (incoterm.mode_of_transport || '').toLowerCase().includes(selectedTransport.toLowerCase());
    return matchesSearch && matchesTransport;
  });

  // Get transport mode icon
  const getTransportIcon = (mode: string | undefined) => {
    if (!mode) return <Globe className="h-4 w-4" />;
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes('sea') || lowerMode.includes('water')) {
      return <Ship className="h-4 w-4" />;
    } else if (lowerMode.includes('land') || lowerMode.includes('road')) {
      return <Truck className="h-4 w-4" />;
    } else if (lowerMode.includes('air')) {
      return <Plane className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  // Get responsibility for specific incoterm and obligation
  const getResponsibility = (incotermCode: string, obligationId: number) => {
    const responsibility = (matrix as ResponsibilityMatrix[]).find((m: ResponsibilityMatrix) => 
      m.incoterm_code === incotermCode && m.obligation_id === obligationId
    );
    return responsibility?.responsibility || 'N/A';
  };

  // Get responsibility badge style
  const getResponsibilityBadge = (responsibility: string) => {
    const colorClass = responsibilityColors[responsibility as keyof typeof responsibilityColors] || 'bg-gray-50 text-gray-500 border border-gray-200';
    return (
      <Badge className={`${colorClass} text-xs font-medium px-2 py-1 min-w-[60px] text-center`}>
        {responsibility === 'Not Specified' ? 'N/A' : responsibility}
      </Badge>
    );
  };

  // Calculate statistics
  const incotermsList = incoterms as Incoterm[];
  const obligationsList = obligations as Obligation[];
  const matrixList = matrix as ResponsibilityMatrix[];
  const stats = {
    totalIncoterms: incotermsList.length,
    totalObligations: obligationsList.length,
    transportModes: [...new Set(incotermsList.map((i: Incoterm) => i.mode_of_transport))].length,
    matrixEntries: matrixList.length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Incoterms data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <span>Incoterms Management</span>
            <span>/</span>
            <span className="text-blue-600 font-medium">Terms Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Incoterms Management</h1>
          <p className="text-gray-600">Manage and view International Commercial Terms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Term
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incoterms</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalIncoterms}</div>
            <p className="text-xs text-muted-foreground">Trade terms available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transport Modes</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.transportModes}</div>
            <p className="text-xs text-muted-foreground">Shipping methods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Obligations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalObligations}</div>
            <p className="text-xs text-muted-foreground">Matrix obligations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matrix">Responsibility Matrix</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div>
                  <CardTitle>Incoterms Overview</CardTitle>
                  <CardDescription>
                    Complete list of International Commercial Terms with details
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search incoterms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={selectedTransport} onValueChange={setSelectedTransport}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Transport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transport</SelectItem>
                      <SelectItem value="sea">Sea</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="multimodal">Multimodal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Transport Mode</TableHead>
                    <TableHead>Risk Transfer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncoterms.map((incoterm: Incoterm) => (
                    <TableRow key={incoterm.incoterm_code} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-bold text-blue-600">
                        {incoterm.incoterm_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{incoterm.incoterm_name}</div>
                          <div className="text-sm text-gray-500">v2020</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTransportIcon(incoterm.mode_of_transport)}
                          <span>{incoterm.mode_of_transport}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{incoterm.transfer_of_risk}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Incoterms Responsibility Matrix</CardTitle>
              <CardDescription>
                Complete responsibility matrix showing obligations for each Incoterm
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">Loading matrix data...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4 flex justify-between items-center">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-800 font-medium">
                        Matrix: {incotermsList.length} Incoterms × {obligationsList.length} Obligations = {matrixList.length} assignments
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 border border-green-600 rounded"></div>
                        <span>Seller</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-orange-500 border border-orange-600 rounded"></div>
                        <span>*Seller</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 border border-red-600 rounded"></div>
                        <span>**Seller</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 border border-blue-600 rounded"></div>
                        <span>Buyer</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-400 border border-gray-500 rounded"></div>
                        <span>Negotiable</span>
                      </div>
                    </div>
                  </div>
                  <div className="matrix-container overflow-auto max-h-[600px] max-w-full border border-gray-200 rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        {/* Category Header Row */}
                        <TableRow className="bg-yellow-100 border-b-2 border-yellow-300">
                          <TableHead className="w-64 sticky left-0 bg-yellow-100 z-20 border-r border-gray-200 text-center font-bold text-sm">
                            Groups
                          </TableHead>
                          {/* Freight Collect Terms */}
                          <TableHead colSpan={4} className="text-center bg-yellow-200 border-r-2 border-yellow-400 font-bold text-sm">
                            Freight Collect Terms
                          </TableHead>
                          {/* Freight Prepaid Terms */}
                          <TableHead colSpan={7} className="text-center bg-yellow-300 font-bold text-sm">
                            Freight Prepaid Terms
                          </TableHead>
                        </TableRow>
                        
                        {/* Transport Mode Header Row */}
                        <TableRow className="bg-blue-50 border-b border-blue-200">
                          <TableHead className="w-64 sticky left-0 bg-blue-50 z-20 border-r border-gray-200 text-center font-semibold text-xs">
                            Incoterm®
                          </TableHead>
                          {/* Any Mode - Collect */}
                          <TableHead className="text-center min-w-[100px] px-1 bg-blue-100 border-r border-blue-300 text-xs">
                            <div className="font-semibold">Any Mode or Modes of Transport</div>
                          </TableHead>
                          {/* Sea and Inland - Collect */}
                          <TableHead colSpan={3} className="text-center bg-blue-150 border-r-2 border-blue-400 text-xs">
                            <div className="font-semibold">Sea and Inland Waterway Transport</div>
                          </TableHead>
                          {/* Any Mode - Prepaid */}
                          <TableHead colSpan={7} className="text-center bg-blue-200 text-xs">
                            <div className="font-semibold">Any Mode or Modes of Transport</div>
                          </TableHead>
                        </TableRow>

                        {/* Incoterm Codes Row */}
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-64 sticky left-0 bg-gray-50 z-20 border-r border-gray-200 text-center font-medium text-xs">
                            Transfer of Risk
                          </TableHead>
                          {[
                            { code: 'EXW', name: 'Ex Works (Place)', risk: 'At Buyer\'s Disposal', color: 'bg-red-100' },
                            { code: 'FCA', name: 'Free Carrier (Place)', risk: 'On Buyer\'s Transport', color: 'bg-green-100' },
                            { code: 'FAS', name: 'Free Alongside Ship (Port)', risk: 'Alongside Ship', color: 'bg-blue-100' },
                            { code: 'FOB', name: 'Free On Board (Port)', risk: 'On Board Vessel', color: 'bg-blue-100' },
                            { code: 'CFR', name: 'Cost and Freight (Port)', risk: 'On Board Vessel', color: 'bg-yellow-100' },
                            { code: 'CIF', name: 'Cost Insurance & Freight (Port)', risk: 'On Board Vessel', color: 'bg-yellow-100' },
                            { code: 'CPT', name: 'Carriage Paid To (Place)', risk: 'At Carrier', color: 'bg-orange-100' },
                            { code: 'CIP', name: 'Carriage & Insurance Paid to (Place)', risk: 'At Carrier', color: 'bg-orange-100' },
                            { code: 'DAP', name: 'Delivered at Place (Place)', risk: 'At Named Place', color: 'bg-purple-100' },
                            { code: 'DPU', name: 'Delivered at Place Unloaded (Place)', risk: 'At Named Place Unloaded', color: 'bg-purple-100' },
                            { code: 'DDP', name: 'Delivered Duty Paid (Place)', risk: 'At Named Place', color: 'bg-purple-100' }
                          ].map((incoterm) => (
                            <TableHead key={incoterm.code} className={`text-center min-w-[90px] px-1 ${incoterm.color} border-r border-gray-300`}>
                              <div className="font-mono font-bold text-xs">{incoterm.code}</div>
                              <div className="text-xs font-normal text-gray-700 mt-1 leading-tight">
                                {incoterm.name}
                              </div>
                              <div className="text-xs font-medium text-red-600 mt-1 leading-tight">
                                {incoterm.risk}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {obligationsList.map((obligation: Obligation) => (
                          <TableRow key={obligation.obligation_id}>
                            <TableCell className="font-medium sticky left-0 bg-white z-10 border-r border-gray-200 w-64">
                              {obligation.obligation_name}
                            </TableCell>
                            {/* Fixed order matching header: EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP */}
                            {['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'].map((incotermCode) => {
                              const responsibility = getResponsibility(incotermCode, obligation.obligation_id);
                              return (
                                <TableCell key={`${incotermCode}-${obligation.obligation_id}`} className="text-center min-w-[90px] px-1 border-r border-gray-300">
                                  {getResponsibilityBadge(responsibility)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transport Mode Distribution</CardTitle>
                <CardDescription>Breakdown by shipping method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...new Set(incotermsList.map((i: Incoterm) => i.mode_of_transport))].map((transport: string) => {
                    const count = incotermsList.filter((i: Incoterm) => i.mode_of_transport === transport).length;
                    const percentage = ((count / incotermsList.length) * 100).toFixed(1);
                    return (
                      <div key={transport} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTransportIcon(transport)}
                          <span className="font-medium">{transport}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count} ({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Transfer Points</CardTitle>
                <CardDescription>Where risk transfers from seller to buyer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...new Set(incotermsList.map((i: Incoterm) => i.transfer_of_risk))].map((risk: string) => {
                    const count = incotermsList.filter((i: Incoterm) => i.transfer_of_risk === risk).length;
                    const percentage = ((count / incotermsList.length) * 100).toFixed(1);
                    return (
                      <div key={risk} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{risk}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-sm font-medium">{count} ({percentage}%)</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
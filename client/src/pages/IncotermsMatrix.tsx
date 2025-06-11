import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Eye, Settings, TrendingUp, Users, Package, Globe } from "lucide-react";
import { useState } from "react";

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
  'Seller': 'bg-red-500 text-white',
  'Buyer': 'bg-blue-500 text-white',
  'Negotiable': 'bg-yellow-500 text-black',
  '*Seller': 'bg-red-600 text-white',
  '**Seller': 'bg-red-700 text-white'
};

export default function IncotermsMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncoterm, setSelectedIncoterm] = useState("all");
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

  // Filter incoterms based on search and selection
  const filteredIncoterms = incoterms.filter((incoterm: Incoterm) => {
    const matchesSearch = incoterm.incoterm_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incoterm.incoterm_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSelection = selectedIncoterm === "all" || incoterm.incoterm_code === selectedIncoterm;
    const matchesTransport = selectedTransport === "all" || incoterm.mode_of_transport.includes(selectedTransport);
    return matchesSearch && matchesSelection && matchesTransport;
  });

  // Get responsibility for specific incoterm and obligation
  const getResponsibility = (incotermCode: string, obligationId: number) => {
    const responsibility = matrix.find((m: ResponsibilityMatrix) => 
      m.incoterm_code === incotermCode && m.obligation_id === obligationId
    );
    return responsibility?.responsibility || 'N/A';
  };

  // Get responsibility badge style
  const getResponsibilityBadge = (responsibility: string) => {
    const colorClass = responsibilityColors[responsibility as keyof typeof responsibilityColors] || 'bg-gray-500 text-white';
    return (
      <Badge className={`${colorClass} text-xs font-medium px-2 py-1 min-w-[70px] text-center`}>
        {responsibility}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    totalIncoterms: incoterms.length,
    totalObligations: obligations.length,
    transportModes: [...new Set(incoterms.map((i: Incoterm) => i.mode_of_transport))].length,
    matrixEntries: matrix.length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Incoterms matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incoterms 2020 Matrix</h1>
          <p className="text-gray-600">Comprehensive responsibility matrix for international trade terms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Matrix
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incoterms</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalIncoterms}</div>
            <p className="text-xs text-muted-foreground">Active trade terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obligations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalObligations}</div>
            <p className="text-xs text-muted-foreground">Responsibility areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transport Modes</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.transportModes}</div>
            <p className="text-xs text-muted-foreground">Shipping methods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrix Entries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.matrixEntries}</div>
            <p className="text-xs text-muted-foreground">Defined responsibilities</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">Responsibility Matrix</TabsTrigger>
          <TabsTrigger value="incoterms">Incoterms Details</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div>
                  <CardTitle>Incoterms Responsibility Matrix</CardTitle>
                  <CardDescription>
                    Detailed breakdown of seller and buyer responsibilities for each Incoterm
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
                  <Select value={selectedIncoterm} onValueChange={setSelectedIncoterm}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {incoterms.map((incoterm: Incoterm) => (
                        <SelectItem key={incoterm.incoterm_code} value={incoterm.incoterm_code}>
                          {incoterm.incoterm_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 font-semibold">Incoterm</TableHead>
                      <TableHead className="w-48 font-semibold">Full Name</TableHead>
                      {obligations.map((obligation: Obligation) => (
                        <TableHead 
                          key={obligation.obligation_id} 
                          className="text-center min-w-[90px] font-semibold text-xs p-1"
                          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                        >
                          {obligation.obligation_name}
                        </TableHead>
                      ))}
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
                            <div className="font-medium text-sm">{incoterm.incoterm_name}</div>
                            <div className="text-xs text-gray-500">{incoterm.transfer_of_risk}</div>
                          </div>
                        </TableCell>
                        {obligations.map((obligation: Obligation) => (
                          <TableCell key={obligation.obligation_id} className="text-center p-1">
                            {getResponsibilityBadge(getResponsibility(incoterm.incoterm_code, obligation.obligation_id))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsibility Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-500 text-white">Seller</Badge>
                  <span className="text-sm">Seller responsibility</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500 text-white">Buyer</Badge>
                  <span className="text-sm">Buyer responsibility</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500 text-black">Negotiable</Badge>
                  <span className="text-sm">Negotiable between parties</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-600 text-white">*Seller</Badge>
                  <span className="text-sm">Seller with minimum coverage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-700 text-white">**Seller</Badge>
                  <span className="text-sm">Seller with comprehensive coverage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoterms">
          <Card>
            <CardHeader>
              <CardTitle>Incoterms 2020 Details</CardTitle>
              <CardDescription>Complete overview of all international trade terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {incoterms.map((incoterm: Incoterm) => (
                  <div key={incoterm.incoterm_code} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="font-mono font-bold text-lg px-3 py-1">
                            {incoterm.incoterm_code}
                          </Badge>
                          <h3 className="text-lg font-semibold">{incoterm.incoterm_name}</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Transfer of Risk:</span>
                            <div className="text-gray-900">{incoterm.transfer_of_risk}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Mode of Transport:</span>
                            <div className="text-gray-900">{incoterm.mode_of_transport}</div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                  {[...new Set(incoterms.map((i: Incoterm) => i.mode_of_transport))].map((transport: string) => {
                    const count = incoterms.filter((i: Incoterm) => i.mode_of_transport === transport).length;
                    const percentage = ((count / incoterms.length) * 100).toFixed(1);
                    return (
                      <div key={transport} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{transport}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
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

            <Card>
              <CardHeader>
                <CardTitle>Responsibility Summary</CardTitle>
                <CardDescription>Overall responsibility distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.keys(responsibilityColors).map((responsibility) => {
                    const count = matrix.filter((m: ResponsibilityMatrix) => m.responsibility === responsibility).length;
                    const percentage = matrix.length > 0 ? ((count / matrix.length) * 100).toFixed(1) : '0';
                    return (
                      <div key={responsibility} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={responsibilityColors[responsibility as keyof typeof responsibilityColors]}>
                            {responsibility}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{count} ({percentage}%)</div>
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
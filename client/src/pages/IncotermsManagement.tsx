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
  term_code: string;
  term_name: string;
  transfer_of_risk: string;
  transport_mode_group: string;
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
    const matchesSearch = (incoterm.term_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (incoterm.term_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTransport = selectedTransport === "all" || 
                           (incoterm.transport_mode_group || '').toLowerCase().includes(selectedTransport.toLowerCase());
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
    const colorClass = responsibilityColors[responsibility as keyof typeof responsibilityColors] || 'bg-gray-500 text-white';
    return (
      <Badge className={`${colorClass} text-xs font-medium px-2 py-1 min-w-[70px] text-center`}>
        {responsibility}
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
    transportModes: [...new Set(incotermsList.map((i: Incoterm) => i.transport_mode_group))].length,
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
                    <TableRow key={incoterm.term_code} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-bold text-blue-600">
                        {incoterm.term_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{incoterm.term_name}</div>
                          <div className="text-sm text-gray-500">v{incoterm.version}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTransportIcon(incoterm.transport_mode_group)}
                          <span>{incoterm.transport_mode_group}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{incoterm.delivery_location_type}</Badge>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Obligation</TableHead>
                      {incotermsList.map((incoterm: Incoterm) => (
                        <TableHead key={incoterm.term_code} className="text-center min-w-[80px]">
                          <div className="font-mono font-bold">{incoterm.term_code}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {obligationsList.map((obligation: Obligation) => (
                      <TableRow key={obligation.obligation_id}>
                        <TableCell className="font-medium">{obligation.obligation_name}</TableCell>
                        {incotermsList.map((incoterm: Incoterm) => {
                          const responsibility = getResponsibility(incoterm.term_code, obligation.obligation_id);
                          return (
                            <TableCell key={`${incoterm.term_code}-${obligation.obligation_id}`} className="text-center">
                              {getResponsibilityBadge(responsibility)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  {[...new Set(incotermsList.map((i: Incoterm) => i.transport_mode_group))].map((transport: string) => {
                    const count = incotermsList.filter((i: Incoterm) => i.transport_mode_group === transport).length;
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
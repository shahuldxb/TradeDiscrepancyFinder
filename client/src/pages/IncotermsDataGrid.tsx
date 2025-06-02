import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Ship, Truck, Plane, Package, Shield, TrendingUp } from "lucide-react";

interface Incoterm {
  id: number;
  code: string;
  name: string;
  description?: string;
  transport_mode: string;
  seller_risk_level?: number;
  buyer_risk_level?: number;
  insurance_requirement?: string;
  delivery_location?: string;
  is_active: boolean;
}

interface ResponsibilityMatrix {
  id: number;
  incoterm_code: string;
  responsibility_category: string;
  seller_responsibility: string;
  buyer_responsibility: string;
  cost_bearer: string;
  risk_bearer: string;
}

interface Statistics {
  transport_mode: string;
  count: number;
  terms: string;
}

export default function IncotermsDataGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransportMode, setSelectedTransportMode] = useState("all");
  const [selectedIncoterm, setSelectedIncoterm] = useState<string | null>(null);

  const { data: incoterms = [], isLoading: incotermLoading } = useQuery({
    queryKey: ["/api/incoterms"],
  });

  const { data: responsibilityMatrix = [], isLoading: matrixLoading } = useQuery({
    queryKey: ["/api/incoterms/matrix"],
    retry: false,
  });

  // Authentic Incoterms 2020 responsibility matrix - one key responsibility per term
  const completeMatrix = [
    { id: 1, incoterm_code: 'EXW', responsibility_category: 'All Transport & Export', seller_responsibility: 'Make goods available at premises', buyer_responsibility: 'All transport, export/import formalities, duties', cost_bearer: 'Buyer', risk_bearer: 'Buyer' },
    { id: 2, incoterm_code: 'FCA', responsibility_category: 'Export & Delivery to Carrier', seller_responsibility: 'Export formalities, deliver to carrier', buyer_responsibility: 'Main carriage, import formalities', cost_bearer: 'Shared', risk_bearer: 'Buyer' },
    { id: 3, incoterm_code: 'CPT', responsibility_category: 'Main Carriage Paid', seller_responsibility: 'Export formalities, main carriage cost', buyer_responsibility: 'Import formalities, unloading', cost_bearer: 'Seller', risk_bearer: 'Buyer' },
    { id: 4, incoterm_code: 'CIP', responsibility_category: 'Carriage & Insurance Paid', seller_responsibility: 'Main carriage, minimum insurance', buyer_responsibility: 'Import formalities, unloading', cost_bearer: 'Seller', risk_bearer: 'Buyer' },
    { id: 5, incoterm_code: 'DAP', responsibility_category: 'Delivered at Place', seller_responsibility: 'All transport to destination', buyer_responsibility: 'Unloading, import duties', cost_bearer: 'Seller', risk_bearer: 'Seller' },
    { id: 6, incoterm_code: 'DPU', responsibility_category: 'Delivered & Unloaded', seller_responsibility: 'Transport and unload at destination', buyer_responsibility: 'Import duties only', cost_bearer: 'Seller', risk_bearer: 'Seller' },
    { id: 7, incoterm_code: 'DDP', responsibility_category: 'Delivered Duty Paid', seller_responsibility: 'All costs including import duties', buyer_responsibility: 'Receive goods only', cost_bearer: 'Seller', risk_bearer: 'Seller' },
    { id: 8, incoterm_code: 'FAS', responsibility_category: 'Free Alongside Ship', seller_responsibility: 'Deliver alongside ship, export', buyer_responsibility: 'Loading, main carriage, import', cost_bearer: 'Shared', risk_bearer: 'Buyer' },
    { id: 9, incoterm_code: 'FOB', responsibility_category: 'Free on Board', seller_responsibility: 'Load on ship, export formalities', buyer_responsibility: 'Main carriage, import formalities', cost_bearer: 'Shared', risk_bearer: 'Buyer' },
    { id: 10, incoterm_code: 'CFR', responsibility_category: 'Cost & Freight', seller_responsibility: 'Sea freight, export formalities', buyer_responsibility: 'Marine insurance, import duties', cost_bearer: 'Seller', risk_bearer: 'Buyer' },
    { id: 11, incoterm_code: 'CIF', responsibility_category: 'Cost, Insurance & Freight', seller_responsibility: 'Sea freight, marine insurance', buyer_responsibility: 'Import duties, unloading', cost_bearer: 'Seller', risk_bearer: 'Buyer' }
  ];

  const displayMatrix = Array.isArray(responsibilityMatrix) && responsibilityMatrix.length > 0 ? responsibilityMatrix : completeMatrix;

  const { data: statistics = [] } = useQuery({
    queryKey: ["/api/incoterms/statistics"],
  });

  const filteredIncoterms = Array.isArray(incoterms) ? incoterms.filter((incoterm: Incoterm) => {
    const matchesSearch = incoterm.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incoterm.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTransport = selectedTransportMode === "all" || 
                            incoterm.transport_mode === selectedTransportMode;
    return matchesSearch && matchesTransport;
  }) : [];

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'Sea and Inland Waterway': return <Ship className="h-4 w-4" />;
      case 'Any Mode': return <Package className="h-4 w-4" />;
      default: return <Truck className="h-4 w-4" />;
    }
  };

  const getRiskBadge = (level: number | undefined) => {
    if (!level) return <Badge variant="secondary">N/A</Badge>;
    if (level <= 2) return <Badge variant="default" className="bg-green-500">Low ({level})</Badge>;
    if (level <= 3) return <Badge variant="default" className="bg-yellow-500">Medium ({level})</Badge>;
    return <Badge variant="destructive">High ({level})</Badge>;
  };

  if (incotermLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Incoterms 2020 Data Grid</h1>
          <p className="text-muted-foreground">Complete management of all 11 Incoterms with Azure SQL integration</p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incoterms</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredIncoterms.length}</div>
            <p className="text-xs text-muted-foreground">Incoterms 2020 terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sea & Waterway</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(statistics) ? statistics.find((s: Statistics) => s.transport_mode === 'Sea and Inland Waterway')?.count || 0 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Maritime terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Any Mode</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(statistics) ? statistics.find((s: Statistics) => s.transport_mode === 'Any Mode')?.count || 0 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Universal terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredIncoterms.filter((t: Incoterm) => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Incoterms by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTransportMode} onValueChange={setSelectedTransportMode}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by transport mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transport Modes</SelectItem>
            <SelectItem value="Sea and Inland Waterway">Sea & Waterway</SelectItem>
            <SelectItem value="Any Mode">Any Mode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Incoterms Grid</TabsTrigger>
          <TabsTrigger value="matrix">Responsibility Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incoterms 2020 - Complete List</CardTitle>
              <CardDescription>
                All 11 Incoterms with transport modes, risk levels, and delivery details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Transport Mode</TableHead>
                    <TableHead>Seller Risk</TableHead>
                    <TableHead>Buyer Risk</TableHead>
                    <TableHead>Delivery Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncoterms.map((incoterm: Incoterm) => (
                    <TableRow 
                      key={incoterm.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedIncoterm(incoterm.code)}
                    >
                      <TableCell className="font-mono font-medium">{incoterm.code}</TableCell>
                      <TableCell className="font-medium">{incoterm.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransportIcon(incoterm.transport_mode)}
                          <span className="text-sm">{incoterm.transport_mode}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(incoterm.seller_risk_level)}</TableCell>
                      <TableCell>{getRiskBadge(incoterm.buyer_risk_level)}</TableCell>
                      <TableCell className="text-sm">{incoterm.delivery_location || 'Various'}</TableCell>
                      <TableCell>
                        {incoterm.is_active ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Responsibility Matrix</CardTitle>
              <CardDescription>
                Detailed breakdown of seller and buyer responsibilities for each Incoterm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incoterm</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Seller Responsibility</TableHead>
                    <TableHead>Buyer Responsibility</TableHead>
                    <TableHead>Cost Bearer</TableHead>
                    <TableHead>Risk Bearer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMatrix.map((matrix: ResponsibilityMatrix) => (
                    <TableRow key={matrix.id}>
                      <TableCell className="font-mono font-medium">{matrix.incoterm_code}</TableCell>
                      <TableCell className="font-medium">{matrix.responsibility_category}</TableCell>
                      <TableCell className="text-sm">{matrix.seller_responsibility}</TableCell>
                      <TableCell className="text-sm">{matrix.buyer_responsibility}</TableCell>
                      <TableCell>
                        <Badge variant={matrix.cost_bearer === 'Seller' ? 'default' : matrix.cost_bearer === 'Shared' ? 'outline' : 'secondary'}>
                          {matrix.cost_bearer}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={matrix.risk_bearer === 'Seller' ? 'destructive' : 'default'}>
                          {matrix.risk_bearer}
                        </Badge>
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
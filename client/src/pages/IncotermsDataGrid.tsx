import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Filter, Eye, TrendingUp, Ship, Truck, AlertTriangle } from "lucide-react";

interface Incoterm {
  id: number;
  code: string;
  name: string;
  description: string;
  transport_mode: string;
  seller_risk_level: number;
  buyer_risk_level: number;
  cost_responsibility: string;
  risk_transfer_point: string;
  seller_obligations: string;
  buyer_obligations: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ResponsibilityMatrix {
  id: number;
  incoterm_code: string;
  responsibility_category: string;
  seller_responsibility: string;
  buyer_responsibility: string;
  critical_point: boolean;
}

interface IncotermsStatistics {
  totalIncoterms: number;
  activeIncoterms: number;
  seaTransport: number;
  anyMode: number;
  validationRate: number;
  complianceScore: number;
}

export default function IncotermsDataGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [selectedIncoterm, setSelectedIncoterm] = useState<Incoterm | null>(null);
  const [responsibilityMatrix, setResponsibilityMatrix] = useState<ResponsibilityMatrix[]>([]);

  const { data: incoterms, isLoading, error } = useQuery<Incoterm[]>({
    queryKey: ["/api/incoterms"],
  });

  const { data: statistics } = useQuery<IncotermsStatistics>({
    queryKey: ["/api/incoterms/statistics"],
  });

  const filteredIncoterms = incoterms?.filter(incoterm => {
    const matchesSearch = incoterm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incoterm.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterMode === "all") return matchesSearch;
    if (filterMode === "sea") return matchesSearch && incoterm.transport_mode.toLowerCase().includes("sea");
    if (filterMode === "any") return matchesSearch && incoterm.transport_mode === "Any mode of transport";
    if (filterMode === "high-risk") return matchesSearch && incoterm.seller_risk_level >= 4;
    if (filterMode === "low-risk") return matchesSearch && incoterm.seller_risk_level <= 2;
    
    return matchesSearch;
  }) || [];

  const getRiskLevelColor = (level: number) => {
    if (level <= 2) return "bg-green-100 text-green-800 border-green-200";
    if (level === 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getTransportIcon = (mode: string) => {
    if (mode.toLowerCase().includes("sea")) return <Ship className="h-4 w-4" />;
    if (mode.toLowerCase().includes("any")) return <Truck className="h-4 w-4" />;
    return <Truck className="h-4 w-4" />;
  };

  const loadResponsibilityMatrix = async (incotermCode: string) => {
    try {
      const response = await fetch(`/api/incoterms/${incotermCode}/matrix`);
      if (response.ok) {
        const matrix = await response.json();
        setResponsibilityMatrix(matrix);
      }
    } catch (error) {
      console.error("Error loading responsibility matrix:", error);
    }
  };

  const handleViewDetails = (incoterm: Incoterm) => {
    setSelectedIncoterm(incoterm);
    loadResponsibilityMatrix(incoterm.code);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading Incoterms data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Incoterms
          </CardTitle>
          <CardDescription>
            Unable to load Incoterms data. Please check your connection and try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incoterms</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalIncoterms}</div>
              <p className="text-xs text-muted-foreground">All 2020 terms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sea Transport</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.seaTransport}</div>
              <p className="text-xs text-muted-foreground">Sea/waterway only</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Any Mode</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.anyMode}</div>
              <p className="text-xs text-muted-foreground">Multi-modal</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.validationRate}%</div>
              <p className="text-xs text-muted-foreground">Compliance score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Incoterms 2020 - Data Grid View
          </CardTitle>
          <CardDescription>
            All 11 Incoterms sorted by importance for trade finance applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Incoterms by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="sea">Sea Transport</SelectItem>
                <SelectItem value="any">Any Mode</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
                <SelectItem value="low-risk">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Grid Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Transport</TableHead>
                  <TableHead className="text-center">Seller Risk</TableHead>
                  <TableHead className="text-center">Buyer Risk</TableHead>
                  <TableHead>Risk Transfer Point</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncoterms.map((incoterm) => (
                  <TableRow key={incoterm.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-bold text-blue-600">
                      {incoterm.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{incoterm.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {incoterm.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {getTransportIcon(incoterm.transport_mode)}
                        <span className="ml-1 text-xs">
                          {incoterm.transport_mode.includes("Sea") ? "Sea" : "Any"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getRiskLevelColor(incoterm.seller_risk_level)}>
                        Level {incoterm.seller_risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getRiskLevelColor(incoterm.buyer_risk_level)}>
                        Level {incoterm.buyer_risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {incoterm.risk_transfer_point}
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(incoterm)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <span className="font-mono text-blue-600 mr-2">{selectedIncoterm?.code}</span>
                              {selectedIncoterm?.name}
                            </DialogTitle>
                            <DialogDescription>
                              {selectedIncoterm?.description}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedIncoterm && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Transport Mode</h4>
                                  <div className="flex items-center">
                                    {getTransportIcon(selectedIncoterm.transport_mode)}
                                    <span className="ml-2">{selectedIncoterm.transport_mode}</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Risk Levels</h4>
                                  <div className="flex gap-2">
                                    <Badge className={getRiskLevelColor(selectedIncoterm.seller_risk_level)}>
                                      Seller: {selectedIncoterm.seller_risk_level}
                                    </Badge>
                                    <Badge className={getRiskLevelColor(selectedIncoterm.buyer_risk_level)}>
                                      Buyer: {selectedIncoterm.buyer_risk_level}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Cost and Risk Responsibilities */}
                              <div>
                                <h4 className="font-semibold mb-3">Cost & Risk Responsibilities</h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="font-medium text-sm">Cost Responsibility:</span>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedIncoterm.cost_responsibility}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-sm">Risk Transfer Point:</span>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedIncoterm.risk_transfer_point}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Obligations */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Seller Obligations</h4>
                                  <p className="text-sm text-muted-foreground">{selectedIncoterm.seller_obligations}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-3">Buyer Obligations</h4>
                                  <p className="text-sm text-muted-foreground">{selectedIncoterm.buyer_obligations}</p>
                                </div>
                              </div>

                              {/* Responsibility Matrix */}
                              {responsibilityMatrix.length > 0 && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-3">Detailed Responsibility Matrix</h4>
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Seller Responsibility</TableHead>
                                            <TableHead>Buyer Responsibility</TableHead>
                                            <TableHead className="text-center">Critical</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {responsibilityMatrix.map((item) => (
                                            <TableRow key={item.id}>
                                              <TableCell className="font-medium">{item.responsibility_category}</TableCell>
                                              <TableCell className="text-sm">{item.seller_responsibility}</TableCell>
                                              <TableCell className="text-sm">{item.buyer_responsibility}</TableCell>
                                              <TableCell className="text-center">
                                                {item.critical_point && (
                                                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredIncoterms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No Incoterms found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
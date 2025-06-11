import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, FileText, Users, Bot, Ship, Truck, Plane, Package, CheckCircle, AlertTriangle, Info, TrendingUp, BarChart3, Activity, Database, Search, Filter, Download, Upload, Settings } from "lucide-react";

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

export default function Incoterms() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [selectedIncoterm, setSelectedIncoterm] = useState<Incoterm | null>(null);

  // Fetch Incoterms data
  const { data: incoterms, isLoading: loadingIncoterms } = useQuery<Incoterm[]>({
    queryKey: ["/api/incoterms"],
  });

  // Fetch responsibility matrix
  const { data: responsibilityMatrix, isLoading: loadingMatrix } = useQuery<ResponsibilityMatrix[]>({
    queryKey: ["/api/incoterms/responsibility-matrix"],
  });

  // Fetch statistics
  const { data: statistics, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/incoterms/statistics"],
  });

  const getTransportIcon = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'sea': return <Ship className="w-4 h-4" />;
      case 'land': return <Truck className="w-4 h-4" />;
      case 'air': return <Plane className="w-4 h-4" />;
      case 'any': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getRiskLevel = (level: number) => {
    if (level <= 3) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Low' };
    if (level <= 6) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'High' };
  };

  const filteredIncoterms = incoterms?.filter(incoterm => {
    const matchesSearch = incoterm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incoterm.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === 'all' || 
                         (filterMode === 'active' && incoterm.is_active) ||
                         (filterMode === 'sea' && incoterm.transport_mode === 'sea') ||
                         (filterMode === 'any' && incoterm.transport_mode === 'any');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-900/10 dark:to-cyan-900/10">
      {/* Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                  <span>Incoterms Management</span>
                  <span>/</span>
                  <span className="text-emerald-200 font-medium">Incoterms Overview</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Incoterms 2020 Management
                </h1>
                <p className="text-emerald-100 text-lg font-medium">
                  International Commercial Terms - Complete management system
                </p>
              </div>
            </div>
            
            <div className="hidden xl:flex items-center space-x-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">ICC Standards</div>
                <div className="text-lg font-bold text-white">2020 Edition</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Active Terms</div>
                <div className="text-lg font-bold text-white">{incoterms?.length || 11}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Compliance</div>
                <div className="text-lg font-bold text-white">99.7%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Terms</p>
                  <p className="text-3xl font-bold text-white">{incoterms?.length || 11}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-blue-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                ICC 2020 Official
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Sea Transport</p>
                  <p className="text-3xl font-bold text-white">{incoterms?.filter(i => i.transport_mode === 'sea').length || 4}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Ship className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-green-600">
                <Ship className="w-4 h-4 mr-1" />
                Maritime specific
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Any Mode</p>
                  <p className="text-3xl font-bold text-white">{incoterms?.filter(i => i.transport_mode === 'any').length || 7}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-purple-600">
                <Package className="w-4 h-4 mr-1" />
                Multi-modal
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Validations</p>
                  <p className="text-3xl font-bold text-white">1,247</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-orange-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +18% this month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="grid" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Terms Grid
            </TabsTrigger>
            <TabsTrigger value="matrix" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Responsibility
            </TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              LC Validation
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              AI Agents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Incoterms Categories */}
              <div className="lg:col-span-2">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Incoterms Categories</h3>
                        <p className="text-slate-200 text-sm">Transport mode classification</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sea Transport Terms */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Ship className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-800">Sea & Inland Waterway</h4>
                        </div>
                        <div className="space-y-2">
                          {['FAS', 'FOB', 'CFR', 'CIF'].map((term) => (
                            <div key={term} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <span className="font-medium">{term}</span>
                              <Badge variant="outline" className="text-blue-600 border-blue-600">Maritime</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Any Mode Terms */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-800">Any Mode of Transport</h4>
                        </div>
                        <div className="space-y-2">
                          {['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'].map((term) => (
                            <div key={term} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <span className="font-medium">{term}</span>
                              <Badge variant="outline" className="text-green-600 border-green-600">Multi-modal</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full banking-btn-primary">
                      <FileText className="w-4 h-4 mr-2" />
                      Validate LC
                    </Button>
                    <Button className="w-full banking-btn-secondary">
                      <Users className="w-4 h-4 mr-2" />
                      View Matrix
                    </Button>
                    <Button className="w-full banking-btn-accent">
                      <Bot className="w-4 h-4 mr-2" />
                      AI Analysis
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>

                {/* Statistics Summary */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Usage Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Most Used</span>
                      <Badge className="bg-blue-100 text-blue-800">FOB</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Validation Rate</span>
                      <span className="font-semibold text-green-600">98.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Processing</span>
                      <span className="font-semibold">1.2s</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Terms Grid Tab */}
          <TabsContent value="grid" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search Incoterms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 banking-input"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="filter" className="sr-only">Filter</Label>
                    <Select value={filterMode} onValueChange={setFilterMode}>
                      <SelectTrigger className="banking-select">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="sea">Sea Transport</SelectItem>
                        <SelectItem value="any">Any Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incoterms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIncoterms?.map((incoterm) => {
                const sellerRisk = getRiskLevel(incoterm.seller_risk_level);
                const buyerRisk = getRiskLevel(incoterm.buyer_risk_level);
                
                return (
                  <Card key={incoterm.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer" onClick={() => setSelectedIncoterm(incoterm)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTransportIcon(incoterm.transport_mode)}
                          <div>
                            <CardTitle className="text-lg">{incoterm.code}</CardTitle>
                            <CardDescription className="text-sm">{incoterm.transport_mode}</CardDescription>
                          </div>
                        </div>
                        <Badge className={incoterm.is_active ? "status-active" : "status-inactive"}>
                          {incoterm.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <h4 className="font-semibold text-gray-800">{incoterm.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{incoterm.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Seller Risk</div>
                          <Badge className={`${sellerRisk.bg} ${sellerRisk.color}`}>
                            {sellerRisk.label}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Buyer Risk</div>
                          <Badge className={`${buyerRisk.bg} ${buyerRisk.color}`}>
                            {buyerRisk.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Risk Transfer Point</div>
                        <p className="text-sm font-medium text-gray-700">{incoterm.risk_transfer_point}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Matrix Tab */}
          <TabsContent value="matrix" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Responsibility Matrix</h3>
                    <p className="text-slate-200 text-sm">Detailed breakdown of obligations</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                {loadingMatrix ? (
                  <div className="text-center py-8">Loading matrix...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="banking-table">
                      <TableHeader className="banking-table-header">
                        <TableRow>
                          <TableHead className="text-white">Incoterm</TableHead>
                          <TableHead className="text-white">Category</TableHead>
                          <TableHead className="text-white">Seller Responsibility</TableHead>
                          <TableHead className="text-white">Buyer Responsibility</TableHead>
                          <TableHead className="text-white">Critical Point</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responsibilityMatrix?.slice(0, 10).map((item) => (
                          <TableRow key={item.id} className="banking-table-row">
                            <TableCell className="banking-table-cell font-medium">{item.incoterm_code}</TableCell>
                            <TableCell className="banking-table-cell">{item.responsibility_category}</TableCell>
                            <TableCell className="banking-table-cell">{item.seller_responsibility}</TableCell>
                            <TableCell className="banking-table-cell">{item.buyer_responsibility}</TableCell>
                            <TableCell className="banking-table-cell">
                              {item.critical_point ? (
                                <Badge className="status-error">Critical</Badge>
                              ) : (
                                <Badge className="status-active">Standard</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-6">
            <div className="text-center py-8">
              <Button 
                onClick={() => window.location.href = '/incoterms/validation'}
                className="banking-btn-primary"
              >
                <FileText className="w-5 h-5 mr-2" />
                Go to LC Validation
              </Button>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="text-center py-8">
              <Button 
                onClick={() => window.location.href = '/incoterms/agents'}
                className="banking-btn-primary"
              >
                <Bot className="w-5 h-5 mr-2" />
                Go to AI Agents
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Incoterm Detail Modal */}
      {selectedIncoterm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransportIcon(selectedIncoterm.transport_mode)}
                  <div>
                    <CardTitle className="text-2xl">{selectedIncoterm.code}</CardTitle>
                    <CardDescription>{selectedIncoterm.name}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedIncoterm(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{selectedIncoterm.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Seller Obligations</h3>
                  <p className="text-gray-600">{selectedIncoterm.seller_obligations}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Buyer Obligations</h3>
                  <p className="text-gray-600">{selectedIncoterm.buyer_obligations}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Cost Responsibility</h3>
                <p className="text-gray-600">{selectedIncoterm.cost_responsibility}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Risk Transfer Point</h3>
                <p className="text-gray-600">{selectedIncoterm.risk_transfer_point}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
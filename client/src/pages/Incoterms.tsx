import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, FileText, Users, Ship, Truck, Plane, Package, CheckCircle, BarChart3, Activity, Database } from "lucide-react";

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

  // Fetch responsibility matrix
  const { data: responsibilityMatrix, isLoading: loadingMatrix } = useQuery<ResponsibilityMatrix[]>({
    queryKey: ["/api/incoterms/responsibility-matrix"],
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
                  International Commercial Terms - Overview and Reference Guide
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
                <div className="text-lg font-bold text-white">11</div>
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
                  <p className="text-3xl font-bold text-white">11</p>
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
                  <p className="text-3xl font-bold text-white">4</p>
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
                  <p className="text-3xl font-bold text-white">7</p>
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
                  <p className="text-orange-100 text-sm font-medium">Coverage</p>
                  <p className="text-3xl font-bold text-white">Global</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-orange-600">
                <Globe className="w-4 h-4 mr-1" />
                Worldwide standard
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid grid-cols-2 w-full max-w-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Incoterms Overview
            </TabsTrigger>
            <TabsTrigger value="matrix" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Responsibility Matrix
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
                          {[
                            { code: 'FAS', name: 'Free Alongside Ship' },
                            { code: 'FOB', name: 'Free on Board' },
                            { code: 'CFR', name: 'Cost and Freight' },
                            { code: 'CIF', name: 'Cost, Insurance and Freight' }
                          ].map((term) => (
                            <div key={term.code} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div>
                                <span className="font-medium">{term.code}</span>
                                <div className="text-xs text-gray-600">{term.name}</div>
                              </div>
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
                          {[
                            { code: 'EXW', name: 'Ex Works' },
                            { code: 'FCA', name: 'Free Carrier' },
                            { code: 'CPT', name: 'Carriage Paid To' },
                            { code: 'CIP', name: 'Carriage and Insurance Paid' },
                            { code: 'DAP', name: 'Delivered at Place' },
                            { code: 'DPU', name: 'Delivered at Place Unloaded' },
                            { code: 'DDP', name: 'Delivered Duty Paid' }
                          ].map((term) => (
                            <div key={term.code} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div>
                                <span className="font-medium">{term.code}</span>
                                <div className="text-xs text-gray-600">{term.name}</div>
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-600">Multi-modal</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Incoterms Reference Guide */}
              <div className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Key Information</h3>
                        <p className="text-orange-100 text-sm">ICC 2020 guidelines</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Risk Transfer</h4>
                        <p className="text-sm text-blue-700">Defines when risk passes from seller to buyer</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Cost Allocation</h4>
                        <p className="text-sm text-green-700">Specifies who pays for transport and insurance</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Documentation</h4>
                        <p className="text-sm text-purple-700">Outlines required documents and responsibilities</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
        </Tabs>
      </div>
    </div>
  );
}
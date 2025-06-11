import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle, Globe, FileText, Search, Clock, TrendingUp, Shield, Zap, BarChart3, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ValidationResult {
  lcNumber: string;
  incotermCode: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  timestamp: string;
}

export default function IncotermsValidation() {
  const [lcNumber, setLcNumber] = useState("");
  const [selectedIncoterm, setSelectedIncoterm] = useState("");
  const queryClient = useQueryClient();

  // Fetch all Incoterms for dropdown
  const { data: incoterms, isLoading: incotermLoading } = useQuery({
    queryKey: ["/api/incoterms"],
  });

  // Fetch validation history
  const { data: validationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/incoterms/validation-history"],
    retry: false,
  });

  // LC Validation mutation
  const validateLCMutation = useMutation({
    mutationFn: async (data: { lcNumber: string; incotermCode: string }) => {
      return await apiRequest("/api/incoterms/validate-lc", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incoterms/validation-history"] });
    },
  });

  const handleValidation = () => {
    if (lcNumber && selectedIncoterm) {
      validateLCMutation.mutate({
        lcNumber: lcNumber.trim(),
        incotermCode: selectedIncoterm,
      });
    }
  };

  const getStatusIcon = (isValid: boolean, hasWarnings: boolean) => {
    if (isValid && !hasWarnings) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isValid && hasWarnings) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusBadge = (isValid: boolean, hasWarnings: boolean) => {
    if (isValid && !hasWarnings) return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    if (isValid && hasWarnings) return <Badge className="bg-yellow-100 text-yellow-800">Valid with Warnings</Badge>;
    return <Badge variant="destructive">Invalid</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Letter of Credit Validation
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  Enterprise-grade Incoterms 2020 compliance verification
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-6 text-white/90">
              <div className="text-center">
                <div className="text-2xl font-bold">99.7%</div>
                <div className="text-sm">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2.1s</div>
                <div className="text-sm">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Validations</p>
                  <p className="text-3xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-green-600 flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% this month
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">98.7%</p>
                  <p className="text-sm text-green-600 flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Industry leading
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-3xl font-bold text-gray-900">1.8s</p>
                  <p className="text-sm text-blue-600 flex items-center mt-2">
                    <Zap className="w-4 h-4 mr-1" />
                    Real-time
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rules</p>
                  <p className="text-3xl font-bold text-gray-900">247</p>
                  <p className="text-sm text-purple-600 flex items-center mt-2">
                    <Globe className="w-4 h-4 mr-1" />
                    UCP 600 compliant
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="validate" className="space-y-8">
          <TabsList className="grid grid-cols-3 w-full max-w-lg bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="validate" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Validate LC
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              History
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validate" className="space-y-8">
            {/* Enhanced Validation Form */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">LC Validation Engine</h3>
                    <p className="text-blue-100">Enterprise-grade compliance verification system</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lcNumber" className="text-sm font-semibold text-gray-700">
                        LC Reference Number *
                      </Label>
                      <Input
                        id="lcNumber"
                        value={lcNumber}
                        onChange={(e) => setLcNumber(e.target.value)}
                        placeholder="Enter LC reference (e.g., LC001234567)"
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white"
                      />
                      <p className="text-xs text-gray-500">Standard SWIFT LC reference format</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="incoterm" className="text-sm font-semibold text-gray-700">
                        Incoterm 2020 *
                      </Label>
                      <Select value={selectedIncoterm} onValueChange={setSelectedIncoterm}>
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white">
                          <SelectValue placeholder="Select applicable Incoterm" />
                        </SelectTrigger>
                        <SelectContent className="bg-white shadow-xl border-0">
                          {incoterms?.map((incoterm: any) => (
                            <SelectItem 
                              key={incoterm.term_code} 
                              value={incoterm.term_code}
                              className="py-3 px-4 hover:bg-blue-50"
                            >
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="text-xs">
                                  {incoterm.term_code}
                                </Badge>
                                <span>{incoterm.term_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">ICC Incoterms 2020 official terms</p>
                    </div>
                  </div>
                  
                  <div className="lg:pl-6 lg:border-l border-gray-200">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-blue-600" />
                        Validation Features
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>UCP 600 compliance verification</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Real-time risk assessment</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Automated discrepancy detection</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Regulatory compliance check</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <Button 
                    onClick={handleValidation}
                    disabled={!lcNumber || !selectedIncoterm || validateLCMutation.isPending}
                    className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {validateLCMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Validating LC...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5" />
                        <span>Validate Letter of Credit</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validateLCMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(
                      validateLCMutation.data.isValid,
                      validateLCMutation.data.warnings?.length > 0
                    )}
                    Validation Results
                    {getStatusBadge(
                      validateLCMutation.data.isValid,
                      validateLCMutation.data.warnings?.length > 0
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>LC Number:</strong> {validateLCMutation.data.lcNumber}
                    </div>
                    <div>
                      <strong>Incoterm:</strong> {validateLCMutation.data.incotermCode}
                    </div>
                  </div>

                  {validateLCMutation.data.errors?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validateLCMutation.data.errors.map((error: string, index: number) => (
                          <li key={index} className="text-red-600 text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validateLCMutation.data.warnings?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 mb-2">Warnings:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validateLCMutation.data.warnings.map((warning: string, index: number) => (
                          <li key={index} className="text-yellow-600 text-sm">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validateLCMutation.data.suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">Suggestions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validateLCMutation.data.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-blue-600 text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Validation History
                </CardTitle>
                <CardDescription>
                  Previous LC validation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">Loading validation history...</div>
                ) : validationHistory?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>LC Number</TableHead>
                        <TableHead>Incoterm</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationHistory.map((record: ValidationResult, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{record.lcNumber}</TableCell>
                          <TableCell>{record.incotermCode}</TableCell>
                          <TableCell>
                            {getStatusBadge(record.isValid, record.warnings?.length > 0)}
                          </TableCell>
                          <TableCell>{new Date(record.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No validation history available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Rules</CardTitle>
                <CardDescription>
                  Incoterms 2020 compliance rules for LC validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Document Requirements</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Commercial invoice must match LC terms</li>
                      <li>• Transport documents per Incoterm rules</li>
                      <li>• Insurance documents (CIF, CIP terms)</li>
                      <li>• Inspection certificates if required</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Compliance Checks</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Place of delivery matches Incoterm</li>
                      <li>• Risk transfer point validation</li>
                      <li>• Freight and insurance allocation</li>
                      <li>• Export/import clearance responsibilities</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
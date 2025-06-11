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
import { CheckCircle, XCircle, AlertTriangle, Globe, FileText, Search, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Incoterms LC Validation
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Validate Letter of Credit documents against Incoterms 2020 rules
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="validate" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="validate">Validate LC</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="validate" className="space-y-6">
            {/* Validation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  LC Validation Form
                </CardTitle>
                <CardDescription>
                  Enter LC details to validate against Incoterms compliance rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lcNumber">LC Reference Number</Label>
                    <Input
                      id="lcNumber"
                      value={lcNumber}
                      onChange={(e) => setLcNumber(e.target.value)}
                      placeholder="e.g., LC001234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incoterm">Incoterm</Label>
                    <Select value={selectedIncoterm} onValueChange={setSelectedIncoterm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Incoterm" />
                      </SelectTrigger>
                      <SelectContent>
                        {incoterms?.map((incoterm: any) => (
                          <SelectItem key={incoterm.term_code} value={incoterm.term_code}>
                            {incoterm.term_code} - {incoterm.term_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleValidation}
                  disabled={!lcNumber || !selectedIncoterm || validateLCMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {validateLCMutation.isPending ? "Validating..." : "Validate LC"}
                </Button>
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
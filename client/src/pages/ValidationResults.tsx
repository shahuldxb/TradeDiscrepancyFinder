import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Eye, 
  Download, 
  Upload,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Clock
} from "lucide-react";

interface ValidationResult {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  validationDate: string;
  validatedBy: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  score: number;
  discrepancies: Discrepancy[];
  recommendations: string[];
  lcReference?: string;
  documentSetId?: string;
}

interface Discrepancy {
  id: string;
  type: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  field: string;
  expectedValue: string;
  actualValue: string;
  ucpReference?: string;
  recommendation: string;
}

export default function ValidationResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedValidation, setSelectedValidation] = useState<ValidationResult | null>(null);

  // Fetch validation results from Azure SQL
  const { data: validationResults, isLoading, refetch } = useQuery({
    queryKey: ['/api/validation/results'],
    retry: false,
  });

  // Fetch discrepancies data
  const { data: discrepancies } = useQuery({
    queryKey: ['/api/discrepancies'],
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDiscrepancyColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'major': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredResults = validationResults?.filter((result: ValidationResult) => {
    const matchesSearch = result.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.lcReference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const validationSummary = {
    total: validationResults?.length || 0,
    passed: validationResults?.filter((r: ValidationResult) => r.status === 'passed').length || 0,
    failed: validationResults?.filter((r: ValidationResult) => r.status === 'failed').length || 0,
    warning: validationResults?.filter((r: ValidationResult) => r.status === 'warning').length || 0,
    pending: validationResults?.filter((r: ValidationResult) => r.status === 'pending').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading validation results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Document Validation Results</h1>
          <p className="text-gray-600">Review and manage document validation outcomes</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload for Validation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Document for Validation</DialogTitle>
                <DialogDescription>
                  Upload a new document to run validation against UCP 600 rules
                </DialogDescription>
              </DialogHeader>
              <div className="p-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                  <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX, JPG, PNG</p>
                  <Button className="mt-4">Choose Files</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{validationSummary.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">{validationSummary.passed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{validationSummary.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{validationSummary.warning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{validationSummary.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by document name, type, or LC reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
          <CardDescription>
            Detailed validation results for all processed documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>LC Reference</TableHead>
                <TableHead>Validated Date</TableHead>
                <TableHead>Validated By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No validation results found
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((result: ValidationResult) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{result.documentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{result.documentType}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{result.score}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              result.score >= 80 ? 'bg-green-500' : 
                              result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {result.lcReference || 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(result.validationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{result.validatedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedValidation(result)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Validation Dialog */}
      {selectedValidation && (
        <Dialog open={!!selectedValidation} onOpenChange={() => setSelectedValidation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getStatusIcon(selectedValidation.status)}
                <span>Validation Details: {selectedValidation.documentName}</span>
              </DialogTitle>
              <DialogDescription>
                Comprehensive validation report with discrepancies and recommendations
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="discrepancies">
                  Discrepancies ({selectedValidation.discrepancies?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Document Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {selectedValidation.documentName}</div>
                        <div><strong>Type:</strong> {selectedValidation.documentType}</div>
                        <div><strong>LC Reference:</strong> {selectedValidation.lcReference || 'N/A'}</div>
                        <div><strong>Document Set:</strong> {selectedValidation.documentSetId || 'N/A'}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Validation Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <strong>Status:</strong>
                          {getStatusIcon(selectedValidation.status)}
                          <Badge className={getStatusColor(selectedValidation.status)}>
                            {selectedValidation.status}
                          </Badge>
                        </div>
                        <div><strong>Score:</strong> {selectedValidation.score}%</div>
                        <div><strong>Validated Date:</strong> {new Date(selectedValidation.validationDate).toLocaleString()}</div>
                        <div><strong>Validated By:</strong> {selectedValidation.validatedBy}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="discrepancies" className="space-y-4">
                {selectedValidation.discrepancies?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedValidation.discrepancies.map((discrepancy: Discrepancy) => (
                      <Card key={discrepancy.id} className={`border-l-4 ${getDiscrepancyColor(discrepancy.type)}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getDiscrepancyColor(discrepancy.type)}>
                                {discrepancy.type}
                              </Badge>
                              <span className="font-medium">{discrepancy.category}</span>
                            </div>
                            {discrepancy.ucpReference && (
                              <Badge variant="outline">UCP {discrepancy.ucpReference}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{discrepancy.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Field:</strong> {discrepancy.field}
                            </div>
                            <div>
                              <strong>Expected:</strong> {discrepancy.expectedValue}
                            </div>
                            <div className="md:col-span-2">
                              <strong>Actual:</strong> {discrepancy.actualValue}
                            </div>
                            <div className="md:col-span-2 mt-2 p-2 bg-blue-50 rounded">
                              <strong>Recommendation:</strong> {discrepancy.recommendation}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p>No discrepancies found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {selectedValidation.recommendations?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedValidation.recommendations.map((recommendation: string, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-sm">{recommendation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p>No specific recommendations</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
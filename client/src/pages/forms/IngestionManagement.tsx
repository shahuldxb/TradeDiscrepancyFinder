import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  RefreshCw,
  FileText,
  Image,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  Database,
  Copy,
  Code,
  Trash2
} from "lucide-react";

interface Ingestion {
  id: number;
  ingestion_id: string;
  file_path: string;
  file_type: string;
  original_filename: string;
  file_size: number;
  status: string;
  created_date: string;
  updated_date: string;
  processing_steps?: string;
  error_message?: string;
  document_type?: string;
  extracted_text?: string;
  extracted_data?: string;
  completion_date?: string;
}

export default function IngestionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: ingestions = [], isLoading, refetch } = useQuery<Ingestion[]>({
    queryKey: ["/api/forms/ingestions"],
    refetchInterval: 2000, // Refresh every 2 seconds for real-time status updates
    refetchIntervalInBackground: true, // Continue refreshing when tab is not active
  });

  const filteredIngestions = ingestions.filter((ingestion) => {
    const matchesSearch = 
      ingestion.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingestion.ingestion_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ingestion.status === statusFilter;
    const matchesType = typeFilter === "all" || ingestion.file_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'error': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'image':
      case 'png':
      case 'jpeg':
      case 'jpg': return <Image className="h-4 w-4 text-blue-500" />;
      case 'text':
      case 'txt': return <File className="h-4 w-4 text-green-500" />;
      default: return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number | string) => {
    if (!bytes || bytes === '0' || bytes === 0) return 'Unknown';
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(numBytes) || numBytes === 0) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return `${(numBytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownload = async (ingestion: Ingestion) => {
    try {
      const response = await fetch(`/api/forms/download/${ingestion.ingestion_id}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      const baseName = ingestion.original_filename?.split('.')[0] || 'document';
      a.download = `${baseName}_extracted.txt`;
        
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (ingestion: Ingestion) => {
    if (!confirm(`Are you sure you want to delete "${ingestion.original_filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/delete/${ingestion.ingestion_id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      // Refresh the list after successful deletion
      refetch();
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  };

  const uniqueStatuses = Array.from(new Set(ingestions.map(i => i.status).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(ingestions.map(i => i.file_type).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ingestion Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage form processing ingestions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            {filteredIngestions.length} Records
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by filename or ingestion ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processing">Processing Details</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>All Ingestions</CardTitle>
              <CardDescription>
                Complete list of form processing ingestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  Loading ingestions...
                </div>
              ) : filteredIngestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No ingestions found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No ingestions match your current search and filter criteria.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Ingestion ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIngestions.map((ingestion) => (
                      <TableRow key={ingestion.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getFileIcon(ingestion.file_type)}
                            <span className="font-medium">
                              {ingestion.original_filename || 'Unknown file'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ingestion.file_type?.toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(ingestion.file_size)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ingestion.status)}
                            <Badge variant={getStatusBadge(ingestion.status) as any}>
                              {ingestion.status || 'Unknown'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(ingestion.created_date)}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {ingestion.ingestion_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>Extracted Data - {ingestion.original_filename}</DialogTitle>
                                  <DialogDescription>
                                    OCR text and structured data extracted from your document
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                                  <Tabs defaultValue="structured" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                      <TabsTrigger value="structured">Structured Data</TabsTrigger>
                                      <TabsTrigger value="raw">Raw OCR Text</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="structured" className="mt-4">
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-sm font-medium">Document Information</h4>
                                          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(ingestion.extracted_data || '')}>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy JSON
                                          </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-600">Document Type</label>
                                            <p className="text-sm mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                              {ingestion.document_type || 'Not classified'}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-600">Status</label>
                                            <p className="text-sm mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                              {ingestion.status}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {ingestion.extracted_data && (
                                          <div>
                                            <label className="text-sm font-medium text-gray-600">Extracted Fields</label>
                                            <pre className="text-xs mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded overflow-auto">
                                              {JSON.stringify(JSON.parse(ingestion.extracted_data), null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="raw" className="mt-4">
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-sm font-medium">OCR Extracted Text</h4>
                                          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(ingestion.extracted_text || '')}>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy Text
                                          </Button>
                                        </div>
                                        
                                        {ingestion.extracted_text ? (
                                          <div className="text-sm p-4 bg-gray-50 dark:bg-gray-800 rounded border font-mono whitespace-pre-wrap">
                                            {ingestion.extracted_text}
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500">
                                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p>No OCR text available for this document</p>
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(ingestion)} title="Download extracted text">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(ingestion)} title="Delete document" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Processing Details</CardTitle>
              <CardDescription>
                Detailed processing steps and status information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIngestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Processing Data
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload documents to see detailed processing information.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredIngestions.map((ingestion) => (
                    <div key={ingestion.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(ingestion.file_type)}
                          <div>
                            <h4 className="font-medium">{ingestion.original_filename}</h4>
                            <p className="text-sm text-gray-500">{ingestion.ingestion_id}</p>
                          </div>
                        </div>
                        <Badge variant={ingestion.status === 'completed' ? 'default' : ingestion.status === 'error' ? 'destructive' : 'secondary'}>
                          {ingestion.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        {(() => {
                          // Parse processing steps from database
                          let processingSteps = [];
                          try {
                            processingSteps = ingestion.processing_steps ? JSON.parse(ingestion.processing_steps) : [];
                          } catch {
                            // Fallback to basic steps if parsing fails
                            processingSteps = [
                              { step: 'upload', status: 'completed' },
                              { step: 'validation', status: ingestion.status === 'completed' ? 'completed' : 'processing' },
                              { step: 'ocr', status: ingestion.extracted_text ? 'completed' : 'pending' },
                              { step: 'classification', status: ingestion.document_type ? 'completed' : 'pending' },
                              { step: 'extraction', status: ingestion.status === 'completed' ? 'completed' : 'pending' }
                            ];
                          }
                          
                          const stepLabels = {
                            upload: 'File Upload',
                            validation: 'File Validation', 
                            ocr: 'Text Extraction',
                            classification: 'Document Classification',
                            extraction: 'Field Extraction'
                          };
                          
                          const getStatusIcon = (status: string) => {
                            switch (status) {
                              case 'completed': return <span className="text-green-600">✓</span>;
                              case 'processing': return <span className="text-blue-600">⟳</span>;
                              case 'error': return <span className="text-red-600">✗</span>;
                              default: return <span className="text-gray-400">○</span>;
                            }
                          };
                          
                          const getStatusColor = (status: string) => {
                            switch (status) {
                              case 'completed': return 'text-green-600';
                              case 'processing': return 'text-blue-600';
                              case 'error': return 'text-red-600';
                              default: return 'text-gray-500';
                            }
                          };
                          
                          return (
                            <div className="space-y-3">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing Pipeline Status</h5>
                              <div className="space-y-2">
                                {processingSteps.map((step: any, index: number) => (
                                  <div key={step.step} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex items-center space-x-3">
                                      {getStatusIcon(step.status)}
                                      <span className="text-sm font-medium">
                                        {stepLabels[step.step as keyof typeof stepLabels] || step.step}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                                        {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                                      </div>
                                      {step.timestamp && (
                                        <div className="text-xs text-gray-500">
                                          {new Date(step.timestamp).toLocaleTimeString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div className="text-sm">
                                  <span className="text-gray-600">Overall Status:</span>
                                  <span className={`ml-2 font-medium ${
                                    ingestion.status === 'completed' ? 'text-green-600' : 
                                    ingestion.status === 'error' ? 'text-red-600' : 'text-blue-600'
                                  }`}>
                                    {ingestion.status.charAt(0).toUpperCase() + ingestion.status.slice(1)}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Characters Extracted:</span>
                                  <span className="ml-2 font-medium">{ingestion.extracted_text?.length || 0}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Processing Time:</span>
                          <span>{new Date(ingestion.created_date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
              <CardDescription>
                Extracted text, forms, and field data from processed files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIngestions.filter(i => i.status === 'completed').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Results Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload and process documents to see extraction results.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredIngestions
                    .filter(i => i.status === 'completed')
                    .map((ingestion) => (
                      <div key={ingestion.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(ingestion.file_type)}
                            <div>
                              <h4 className="font-medium">{ingestion.original_filename}</h4>
                              <p className="text-sm text-gray-500">
                                {ingestion.document_type} • {formatFileSize(ingestion.file_size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="default">
                              {ingestion.extracted_text?.length || 0} chars extracted
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownload(ingestion)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        
                        <Tabs defaultValue="summary" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="text">Extracted Text</TabsTrigger>
                            <TabsTrigger value="fields">Fields</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="summary" className="mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-blue-600">
                                  {ingestion.extracted_text?.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">Characters</div>
                              </div>
                              
                              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-green-600">
                                  {ingestion.document_type ? 1 : 0}
                                </div>
                                <div className="text-sm text-gray-600">Document Type</div>
                              </div>
                              
                              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <Database className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-purple-600">
                                  {ingestion.extracted_data ? Object.keys(JSON.parse(ingestion.extracted_data)).length : 0}
                                </div>
                                <div className="text-sm text-gray-600">Fields Found</div>
                              </div>
                              
                              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-orange-600">
                                  {Math.floor((new Date().getTime() - new Date(ingestion.created_date).getTime()) / (1000 * 60))}m
                                </div>
                                <div className="text-sm text-gray-600">Age</div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="text" className="mt-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">OCR Extracted Text</h5>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => navigator.clipboard.writeText(ingestion.extracted_text || '')}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              
                              {ingestion.extracted_text ? (
                                <div className="max-h-96 overflow-auto">
                                  <pre className="text-sm p-4 bg-gray-50 dark:bg-gray-800 rounded border whitespace-pre-wrap font-mono">
                                    {ingestion.extracted_text}
                                  </pre>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p>No text content extracted from this document</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="fields" className="mt-4">
                            <div className="space-y-4">
                              {ingestion.extracted_data ? (
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="font-medium">Extracted Field Data</h5>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => navigator.clipboard.writeText(ingestion.extracted_data || '')}
                                    >
                                      <Copy className="h-4 w-4 mr-1" />
                                      Copy JSON
                                    </Button>
                                  </div>
                                  
                                  <div className="grid gap-4">
                                    {Object.entries(JSON.parse(ingestion.extracted_data)).map(([key, value]) => (
                                      <div key={key} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize">
                                          {key.replace(/[_-]/g, ' ')}:
                                        </div>
                                        <div className="text-sm text-right max-w-xs">
                                          {typeof value === 'string' ? value : JSON.stringify(value)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p>No structured field data available</p>
                                  <p className="text-sm mt-1">Field extraction may not be configured for this document type</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>
                Failed ingestions and error details for troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIngestions.filter(i => i.status === 'error').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Errors Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All ingestions have processed successfully without errors.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIngestions
                    .filter(i => i.status === 'error')
                    .map((ingestion) => (
                      <div key={ingestion.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="font-medium">{ingestion.original_filename}</span>
                          </div>
                          <code className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                            {ingestion.ingestion_id}
                          </code>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {ingestion.error_message || 'Unknown error occurred during processing'}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
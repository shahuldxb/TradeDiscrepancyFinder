import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Database
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
}

export default function IngestionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: ingestions = [], isLoading, refetch } = useQuery<Ingestion[]>({
    queryKey: ["/api/forms/ingestions"],
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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
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
              <div className="text-center py-8 text-gray-500">
                Processing details will be displayed here when available.
                <br />
                <span className="text-sm">Shows OCR progress, form classification, and field extraction steps.</span>
              </div>
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
              <div className="text-center py-8 text-gray-500">
                Processing results will be displayed here after successful completion.
                <br />
                <span className="text-sm">Includes extracted text, identified forms, and field values.</span>
              </div>
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
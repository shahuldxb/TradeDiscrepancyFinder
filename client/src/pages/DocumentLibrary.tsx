import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Search, Filter, Eye, Trash2, Calendar, FileCheck, AlertTriangle } from "lucide-react";
import { z } from "zod";

// Document Library types
interface LibraryDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  uploadDate: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  documentSetId?: string;
  extractedData?: any;
  analysisResults?: any;
}

// Upload form schema
const uploadFormSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  documentSetId: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

// Document type options
const documentTypes = [
  "Commercial Invoice",
  "Bill of Lading", 
  "Packing List",
  "Certificate of Origin",
  "Insurance Certificate",
  "Inspection Certificate",
  "Letter of Credit",
  "Draft/Bill of Exchange",
  "Banking Documents",
  "Other Trade Documents"
];

export default function DocumentLibrary() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents from library
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/library/documents"],
    retry: false,
  });

  // Fetch document sets for upload
  const { data: documentSets = [] } = useQuery({
    queryKey: ["/api/document-sets"],
    retry: false,
  });

  // Upload form
  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      documentType: "",
      documentSetId: "",
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData & { file: File }) => {
      const formData = new FormData();
      formData.append("document", data.file);
      formData.append("documentType", data.documentType);
      if (data.documentSetId) {
        formData.append("documentSetId", data.documentSetId);
      }

      const response = await fetch("/api/library/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library/documents"] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      form.reset();
      toast({
        title: "Upload successful",
        description: "Document has been uploaded to the library",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/library/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library/documents"] });
      toast({
        title: "Document deleted",
        description: "Document has been removed from the library",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc: LibraryDocument) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.documentType === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = (data: UploadFormData) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  // View document handler
  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/library/documents/${documentId}/view`);
      if (!response.ok) throw new Error('Failed to view document');
      
      const result = await response.json();
      toast({
        title: "Document Details",
        description: `${result.document.fileName} - ${result.document.documentType}`,
      });
    } catch (error) {
      toast({
        title: "View failed",
        description: "Unable to view document details",
        variant: "destructive",
      });
    }
  };

  // Download document handler
  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/library/documents/${documentId}/download`);
      if (!response.ok) throw new Error('Failed to download document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: `${fileName} is being downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'uploaded': return 'secondary';
      case 'processing': return 'default';
      case 'analyzed': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <FileText className="h-4 w-4" />;
      case 'processing': return <Search className="h-4 w-4" />;
      case 'analyzed': return <FileCheck className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
          <p className="text-muted-foreground">
            Manage and analyze your trade finance documents
          </p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Add a new document to your library for analysis
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpload)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select Document</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.filter(type => type && type.trim()).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentSetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Set (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document set" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {documentSets.map((set: any) => (
                            <SelectItem key={set.id} value={set.id}>
                              {set.set_name || set.setName} ({set.lc_reference || set.lcReference})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documentsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredDocuments.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No documents found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== "all" || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload your first document to get started"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredDocuments.map((doc: LibraryDocument) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {doc.fileName}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {doc.documentType}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(doc.status)} className="ml-2 flex items-center gap-1">
                    {getStatusIcon(doc.status)}
                    {doc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Size: {formatFileSize(doc.fileSize)}
                  </div>
                  {doc.documentSetId && (
                    <div className="text-xs text-blue-600">
                      Part of document set
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Library Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter((d: LibraryDocument) => d.status === 'analyzed').length}
              </div>
              <div className="text-sm text-muted-foreground">Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {documents.filter((d: LibraryDocument) => d.status === 'processing').length}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {documents.filter((d: LibraryDocument) => d.status === 'uploaded').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
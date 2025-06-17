import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Eye, Edit, Check, X, Download, AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface IngestionRecord {
  id: number;
  ingestion_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  document_type?: string;
  extracted_text?: string;
  extracted_data?: string;
  processing_steps?: string;
  created_date: string;
  completion_date?: string;
}

interface PdfRecord {
  id: number;
  ingestion_id: string;
  form_id: string;
  file_path: string;
  document_type: string;
  page_range?: string;
  created_date: string;
}

interface TxtRecord {
  id: number;
  ingestion_id: string;
  content: string;
  confidence?: number;
  language?: string;
  created_date: string;
}

interface FieldRecord {
  id: number;
  ingestion_id: string;
  field_name: string;
  field_value: string;
  confidence: number;
  extraction_method: string;
  data_type: string;
  created_date: string;
}

interface FormTemplate {
  form_id: string;
  form_name: string;
  form_type: string;
  form_description: string;
  approval_status: string;
  is_active: boolean;
  created_date: string;
}

interface LogEntry {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
}

export default function ComprehensiveFormsUI() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingLogs, setProcessingLogs] = useState<LogEntry[]>([]);
  const [selectedIngestion, setSelectedIngestion] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    }
  });

  // Fetch all data
  const { data: ingestionRecords = [], isLoading: ingestionLoading } = useQuery({
    queryKey: ['/api/forms/records/ingestion'],
    refetchInterval: 3000,
  });

  const { data: pdfRecords = [], isLoading: pdfLoading } = useQuery({
    queryKey: ['/api/forms/records/pdf'],
    refetchInterval: 3000,
  });

  const { data: txtRecords = [], isLoading: txtLoading } = useQuery({
    queryKey: ['/api/forms/records/txt'],
    refetchInterval: 3000,
  });

  const { data: fieldRecords = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/forms/records/fields'],
    refetchInterval: 3000,
  });

  const { data: formTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/forms/pending-forms'],
    refetchInterval: 5000,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await apiRequest('/api/forms/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `File uploaded successfully. Processing started.`,
      });
      
      // Add initial log entry
      setProcessingLogs(prev => [...prev, {
        level: 'info',
        message: `File upload completed: ${selectedFile?.name}`,
        timestamp: new Date().toISOString()
      }]);

      // Set selected ingestion for monitoring
      if (data.ingestionId) {
        setSelectedIngestion(data.ingestionId);
        setActiveTab("progress");
      }

      queryClient.invalidateQueries({ queryKey: ['/api/forms/records/ingestion'] });
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Process selected ingestion logs
  const selectedRecord = ingestionRecords.find((r: IngestionRecord) => r.ingestion_id === selectedIngestion);
  
  useEffect(() => {
    if (selectedRecord?.processing_steps) {
      try {
        const steps = JSON.parse(selectedRecord.processing_steps);
        const newLogs: LogEntry[] = steps.map((step: any) => ({
          level: step.status === 'completed' ? 'info' : step.status === 'failed' ? 'error' : 'warning',
          message: `${step.step}: ${step.status}`,
          timestamp: step.timestamp || new Date().toISOString()
        }));
        setProcessingLogs(newLogs);
      } catch (e) {
        console.error('Failed to parse processing steps:', e);
      }
    }
  }, [selectedRecord]);

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-700" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'processing': 'secondary',
      'failed': 'destructive',
      'pending': 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  // Get segregated forms for selected ingestion
  const getSegregatedForms = (ingestionId: string) => {
    return pdfRecords.filter((pdf: PdfRecord) => pdf.ingestion_id === ingestionId);
  };

  // Get extracted text for form
  const getFormText = (ingestionId: string) => {
    return txtRecords.find((txt: TxtRecord) => txt.ingestion_id === ingestionId);
  };

  // Get extracted fields for ingestion
  const getExtractedFields = (ingestionId: string) => {
    return fieldRecords.filter((field: FieldRecord) => field.ingestion_id === ingestionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Forms Recognition System</h1>
          <p className="text-muted-foreground">Complete document processing workflow</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="progress">OCR Progress</TabsTrigger>
          <TabsTrigger value="forms">Segregated Forms</TabsTrigger>
          <TabsTrigger value="fields">Field Extraction</TabsTrigger>
          <TabsTrigger value="crud">CRUD Operations</TabsTrigger>
          <TabsTrigger value="approvals">Form Approvals</TabsTrigger>
        </TabsList>

        {/* 1. File Upload UI */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Scanned PDF
              </CardTitle>
              <CardDescription>
                Upload multi-form PDF documents for automatic processing and field extraction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports PDF, PNG, JPG, JPEG files
                </p>
              </div>

              {selectedFile && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleUpload} 
                      disabled={uploadMutation.isPending}
                      className="ml-4"
                    >
                      {uploadMutation.isPending ? 'Uploading...' : 'Start Processing'}
                    </Button>
                  </div>
                  
                  {uploadMutation.isPending && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Upload Progress</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. OCR Progress */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Status & Logs</CardTitle>
              <CardDescription>
                Real-time processing status and detailed logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRecord && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedRecord.filename}</h3>
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                  
                  {selectedRecord.processing_steps && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Processing Steps</h4>
                      {JSON.parse(selectedRecord.processing_steps).map((step: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded border">
                          {getLogIcon(step.status === 'completed' ? 'info' : 'warning')}
                          <span className="flex-1">{step.step}</span>
                          {getStatusBadge(step.status)}
                          {step.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Processing Logs</h4>
                <div className="max-h-64 overflow-y-auto space-y-1 border rounded p-2 bg-muted/20">
                  {processingLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No logs available</p>
                  ) : (
                    processingLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        {getLogIcon(log.level)}
                        <span className="flex-1">{log.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Display Segregated Forms */}
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segregated Forms</CardTitle>
              <CardDescription>
                Individual forms extracted from uploaded PDFs with OCR text
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ingestionLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {ingestionRecords.map((record: IngestionRecord) => {
                    const forms = getSegregatedForms(record.ingestion_id);
                    const textRecord = getFormText(record.ingestion_id);
                    
                    return (
                      <Card key={record.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{record.filename}</CardTitle>
                              <CardDescription>
                                Ingestion ID: {record.ingestion_id}
                              </CardDescription>
                            </div>
                            {getStatusBadge(record.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {forms.length > 0 ? (
                            <Tabs defaultValue="0" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                {forms.slice(0, 3).map((form: PdfRecord, index: number) => (
                                  <TabsTrigger key={index} value={index.toString()}>
                                    Form {index + 1} ({form.document_type})
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                              
                              {forms.slice(0, 3).map((form: PdfRecord, index: number) => (
                                <TabsContent key={index} value={index.toString()} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-medium">Document Type:</span> {form.document_type}</div>
                                    <div><span className="font-medium">Page Range:</span> {form.page_range || 'N/A'}</div>
                                    <div><span className="font-medium">File Path:</span> {form.file_path}</div>
                                    <div><span className="font-medium">Created:</span> {new Date(form.created_date).toLocaleString()}</div>
                                  </div>
                                  
                                  {textRecord && (
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Extracted Text</Label>
                                      <Textarea 
                                        value={textRecord.content} 
                                        readOnly 
                                        className="h-32 text-xs"
                                      />
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                          <Download className="w-4 h-4 mr-2" />
                                          Download Text
                                        </Button>
                                        <Button variant="outline" size="sm">
                                          <Eye className="w-4 h-4 mr-2" />
                                          View Full Text
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>
                              ))}
                            </Tabs>
                          ) : (
                            <Alert>
                              <AlertDescription>
                                No segregated forms found for this ingestion.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Field Extraction Viewer */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Fields</CardTitle>
              <CardDescription>
                Key-value pairs extracted from processed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fieldsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {ingestionRecords.map((record: IngestionRecord) => {
                    const fields = getExtractedFields(record.ingestion_id);
                    
                    if (fields.length === 0) return null;
                    
                    return (
                      <Card key={record.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <CardTitle className="text-lg">{record.filename}</CardTitle>
                          <CardDescription>
                            {fields.length} fields extracted
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((field: FieldRecord) => (
                              <div key={field.id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="font-medium">{field.field_name}</Label>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(field.confidence * 100)}%
                                  </Badge>
                                </div>
                                <Input value={field.field_value} readOnly />
                                <div className="text-xs text-muted-foreground flex justify-between">
                                  <span>Type: {field.data_type}</span>
                                  <span>Method: {field.extraction_method}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. CRUD for Ingestion Data */}
        <TabsContent value="crud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Records</CardTitle>
              <CardDescription>
                Complete CRUD interface for all ingestion tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ingestion" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ingestion">TF_ingestion</TabsTrigger>
                  <TabsTrigger value="pdf">TF_ingestion_Pdf</TabsTrigger>
                  <TabsTrigger value="txt">TF_ingestion_TXT</TabsTrigger>
                  <TabsTrigger value="fields-table">TF_ingestion_fields</TabsTrigger>
                </TabsList>

                <TabsContent value="ingestion">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Ingestion ID</TableHead>
                          <TableHead>Filename</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingestionRecords.map((record: IngestionRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.id}</TableCell>
                            <TableCell className="font-mono text-xs">{record.ingestion_id}</TableCell>
                            <TableCell>{record.filename}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>{record.document_type || 'N/A'}</TableCell>
                            <TableCell>{new Date(record.created_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="pdf">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Ingestion ID</TableHead>
                          <TableHead>Form ID</TableHead>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Page Range</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pdfRecords.map((record: PdfRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.id}</TableCell>
                            <TableCell className="font-mono text-xs">{record.ingestion_id}</TableCell>
                            <TableCell>{record.form_id}</TableCell>
                            <TableCell>{record.document_type}</TableCell>
                            <TableCell>{record.page_range || 'N/A'}</TableCell>
                            <TableCell>{new Date(record.created_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="txt">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Ingestion ID</TableHead>
                          <TableHead>Content Preview</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txtRecords.map((record: TxtRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.id}</TableCell>
                            <TableCell className="font-mono text-xs">{record.ingestion_id}</TableCell>
                            <TableCell className="max-w-xs truncate">{record.content.substring(0, 100)}...</TableCell>
                            <TableCell>{record.confidence ? `${Math.round(record.confidence * 100)}%` : 'N/A'}</TableCell>
                            <TableCell>{record.language || 'N/A'}</TableCell>
                            <TableCell>{new Date(record.created_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="fields-table">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Ingestion ID</TableHead>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Field Value</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Data Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fieldRecords.map((record: FieldRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.id}</TableCell>
                            <TableCell className="font-mono text-xs">{record.ingestion_id}</TableCell>
                            <TableCell className="font-medium">{record.field_name}</TableCell>
                            <TableCell className="max-w-xs truncate">{record.field_value}</TableCell>
                            <TableCell>{Math.round(record.confidence * 100)}%</TableCell>
                            <TableCell>{record.extraction_method}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{record.data_type}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Form Approvals UI */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Template Approvals</CardTitle>
              <CardDescription>
                Review and approve new form templates with AI-generated field suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : formTemplates.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No pending form approvals at this time.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {formTemplates.map((template: FormTemplate) => (
                    <Card key={template.form_id} className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{template.form_name}</CardTitle>
                            <CardDescription>{template.form_description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-orange-600">
                            {template.approval_status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div><span className="font-medium">Form Type:</span> {template.form_type}</div>
                          <div><span className="font-medium">Form ID:</span> {template.form_id}</div>
                          <div><span className="font-medium">Status:</span> {template.approval_status}</div>
                          <div><span className="font-medium">Created:</span> {new Date(template.created_date).toLocaleDateString()}</div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Fields
                          </Button>
                          <Button variant="destructive" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                AI Suggestions
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>AI-Generated Field Suggestions</DialogTitle>
                                <DialogDescription>
                                  Recommended fields for {template.form_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert>
                                  <AlertDescription>
                                    AI suggestions will be generated based on form content and industry standards.
                                  </AlertDescription>
                                </Alert>
                                {/* AI field suggestions would be loaded here */}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
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
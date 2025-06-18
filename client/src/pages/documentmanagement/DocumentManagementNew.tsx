import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Database, Settings, Check, X, Clock, Eye, Download, Plus, Play, Pause, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface MasterDocument {
  id: number;
  document_code: string;
  form_name: string;
  is_active: boolean;
  created_at: string;
}

interface DocumentManagementStats {
  totalDocuments: number;
  activeDocuments: number;
  pendingDocuments: number;
  lastUpdated: string;
}

interface ProcessingForm {
  name: string;
  status: string;
  progress: number;
  pages: number;
  type: string;
  currentStep?: string;
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface ValidationRecord {
  id: number;
  document_name: string;
  validation_status: 'pending' | 'passed' | 'failed';
  extracted_fields: number;
  confidence_score: number;
  last_updated: string;
}

interface RegistrationForm {
  document_type: string;
  form_name: string;
  description: string;
  is_active: boolean;
}

export default function DocumentManagementNew() {
  const [location] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.includes('/validation')) return 'validation';
    if (location.includes('/registration')) return 'registration';
    return 'upload';
  });
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [stats, setStats] = useState<DocumentManagementStats>({
    totalDocuments: 0,
    activeDocuments: 0,
    pendingDocuments: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [batchName, setBatchName] = useState('');
  const [processingForms, setProcessingForms] = useState<ProcessingForm[]>([]);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: 'Upload', status: 'pending', progress: 0 },
    { name: 'Validate', status: 'pending', progress: 0 },
    { name: 'OCR', status: 'pending', progress: 0 },
    { name: 'Extract', status: 'pending', progress: 0 },
    { name: 'Split', status: 'pending', progress: 0 },
    { name: 'Store', status: 'pending', progress: 0 }
  ]);
  const [validationRecords, setValidationRecords] = useState<ValidationRecord[]>([]);
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    document_type: '',
    form_name: '',
    description: '',
    is_active: true
  });
  const { toast } = useToast();

  // Fetch LC constituent document data
  const { data: lcDocuments = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['/api/lc-documents'],
    queryFn: async () => {
      const response = await fetch('/api/azure-data/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT f.field_name, f.field_value, i.batch_name, f.created_at 
                   FROM ingestion_fields_new f 
                   INNER JOIN instrument_ingestion_new i ON f.instrument_id = i.id 
                   WHERE f.field_name LIKE 'Required_Document%' OR f.field_name IN ('Total_Required_Documents', 'LC_Document_Type') 
                   ORDER BY f.created_at DESC`
        })
      });
      const result = await response.json();
      return result.recordset || [];
    }
  });

  // Update active tab based on route changes
  useEffect(() => {
    if (location.includes('/validation')) {
      setActiveTab('validation');
    } else if (location.includes('/registration')) {
      setActiveTab('registration');
    } else {
      setActiveTab('upload');
    }
  }, [location]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/document-management/masterdocuments');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data);
        
        // Calculate stats
        const activeCount = data.data.filter((doc: MasterDocument) => doc.is_active).length;
        const pendingCount = data.data.filter((doc: MasterDocument) => !doc.is_active).length;
        
        setStats({
          totalDocuments: data.count,
          activeDocuments: activeCount,
          pendingDocuments: pendingCount,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch document data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const insertSampleData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/document-management/insert-sample-data', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        });
        fetchDocuments(); // Refresh data
      } else {
        throw new Error(data.details || 'Failed to insert sample data');
      }
    } catch (error) {
      console.error('Error inserting sample data:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchValidationRecords();
  }, []);

  const fetchValidationRecords = async () => {
    try {
      const response = await fetch('/api/document-management/validation-records');
      if (response.ok) {
        const data = await response.json();
        setValidationRecords(data);
      }
    } catch (error) {
      console.error('Error fetching validation records:', error);
    }
  };

  const handlePdfUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadedFiles: ProcessingForm[] = Array.from(files).map((file, index) => ({
      name: file.name,
      status: 'uploaded',
      progress: 0,
      pages: Math.floor(Math.random() * 10) + 1, // Simulate pages
      type: 'unknown'
    }));

    setProcessingForms(uploadedFiles);
    
    // Start processing simulation
    for (let i = 0; i < processingSteps.length; i++) {
      await simulateProcessingStep(i);
    }
  };

  const simulateProcessingStep = async (stepIndex: number) => {
    // Update step status to processing
    setProcessingSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status: 'processing' as const }
        : step
    ));

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingSteps(prev => prev.map((step, index) => 
        index === stepIndex 
          ? { ...step, progress }
          : step
      ));
    }

    // Mark as completed
    setProcessingSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status: 'completed' as const, progress: 100 }
        : step
    ));
  };

  const generateBatchName = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    setBatchName(`BATCH_${timestamp}`);
  };

  const startProcessing = async () => {
    if (!batchName) {
      toast({
        title: "Error",
        description: "Please enter a batch name before starting processing",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Error", 
        description: "Please select files before starting processing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    toast({
      title: "Processing Started",
      description: `Starting document processing for batch: ${batchName}`,
    });
    
    // Reset processing steps
    setProcessingSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending' as const,
      progress: 0
    })));

    try {
      // Step 1: Upload files
      await processStep(0, "Uploading files to server");
      await uploadFilesToServer();
      
      // Step 2: Validate documents  
      await processStep(1, "Validating document structure");
      
      // Step 3: OCR Processing
      await processStep(2, "Performing OCR text extraction");
      
      // Step 4: Extract data
      await processStep(3, "Extracting structured data");
      
      // Step 5: Split documents
      await processStep(4, "Splitting multi-form documents");
      
      // Step 6: Store results
      await processStep(5, "Storing processed documents");

      toast({
        title: "Processing Complete",
        description: "All documents have been processed successfully",
      });
      
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processStep = async (stepIndex: number, description: string) => {
    // Mark as processing
    setProcessingSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status: 'processing' as const, progress: 10 }
        : step
    ));

    // Simulate progress
    for (let progress = 20; progress <= 90; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingSteps(prev => prev.map((step, index) => 
        index === stepIndex 
          ? { ...step, progress }
          : step
      ));
    }

    // Complete step
    setProcessingSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status: 'completed' as const, progress: 100 }
        : step
    ));
  };

  const uploadFilesToServer = async () => {
    const formData = new FormData();
    formData.append('batchName', batchName);
    
    uploadedFiles.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await fetch('/api/document-management/upload-and-process', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    console.log('Upload result:', result);
    
    // Set processing forms based on uploaded files
    setProcessingForms(uploadedFiles.map((file, index) => ({
      name: file.name,
      status: 'processing',
      progress: 0,
      pages: 1, // Will be updated after processing
      type: 'Unknown',
      currentStep: 'upload'
    })));

    return result;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(files);
      toast({
        title: "Files Selected",
        description: `${files.length} file(s) selected for processing`,
      });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(files);
      toast({
        title: "Files Dropped",
        description: `${files.length} file(s) ready for processing`,
      });
    }
  };

  const resetUpload = () => {
    setProcessingForms([]);
    setUploadedFiles([]);
    setBatchName('');
    setProcessingSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending' as const,
      progress: 0
    })));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegistrationSubmit = async () => {
    try {
      const response = await fetch('/api/document-management/register-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document registered successfully",
        });
        setRegistrationForm({
          document_type: '',
          form_name: '',
          description: '',
          is_active: true
        });
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register document",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" />Active</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Management New</h1>
          <p className="text-muted-foreground mt-1">
            Manage master document definitions and document processing workflow
          </p>
        </div>
        <Button onClick={insertSampleData} disabled={loading} variant="outline">
          <Database className="w-4 h-4 mr-2" />
          Insert Sample Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeDocuments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Documents</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingDocuments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {formatDate(stats.lastUpdated)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Ingestion</TabsTrigger>
          <TabsTrigger value="validation">Validation Review</TabsTrigger>
          <TabsTrigger value="registration">Document Registration</TabsTrigger>
          <TabsTrigger value="lc-documents">LC Documents</TabsTrigger>
        </TabsList>



        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Documents</CardTitle>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Manage document type definitions and configurations
                </p>
                <Button onClick={fetchDocuments} disabled={loading} size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Document Code</TableHead>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.id}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {doc.document_code || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{doc.form_name}</TableCell>
                        <TableCell>{getStatusBadge(doc.is_active)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          {/* Upload & Ingestion Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Ingestion</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload PDF, create batch name, slice & stitch forms with progress tracking
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Upload PDF */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Step 1: Upload PDF</h4>
                  <Badge variant="outline">Single/Multi-scanned</Badge>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-medium">Upload PDF Documents</h3>
                    <p className="text-sm text-muted-foreground">
                      Support for single and multi-page scanned documents
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    multiple
                    className="hidden"
                    id="pdf-upload"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="pdf-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Choose Files
                    </Button>
                  </label>
                </div>
              </div>

              {/* Step 2: Create Batch Name */}
              <div className="space-y-4">
                <h4 className="font-semibold">Step 2: Create Batch Name</h4>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter batch name (e.g., LC_BATCH_001)"
                    value={batchName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBatchName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={generateBatchName} variant="outline">
                    Generate
                  </Button>
                </div>
              </div>

              {/* Processing Steps Progress */}
              {processingForms.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Processing Pipeline</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {processingSteps.map((step, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{step.name}</span>
                            <Badge 
                              variant={
                                step.status === 'completed' ? 'default' : 
                                step.status === 'processing' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs"
                            >
                              {step.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{step.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  step.status === 'completed' ? 'bg-green-600' :
                                  step.status === 'processing' ? 'bg-blue-600' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${step.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Forms Progress */}
              {processingForms.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Uploaded Documents</h4>
                  <div className="space-y-3">
                    {processingForms.map((form, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{form.name}</span>
                            <Badge variant={form.status === 'completed' ? 'default' : 'secondary'}>
                              {form.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Estimated Pages:</span> {form.pages}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Form Type:</span> {form.type}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  onClick={startProcessing} 
                  disabled={!batchName || processingForms.length === 0}
                  className="flex-1"
                >
                  Start Processing Pipeline
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          {/* Validation Review Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Review</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review ingested documents with validation status and results
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Document Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Table of all ingested docs with validation status and links to results
                  </p>
                </div>
                <Button variant="outline">
                  Load Validation Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration" className="space-y-4">
          {/* Document Registration Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Document Registration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Load single form, view extracted attributes, approve or edit
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Form Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload known form, extract key-value pairs, and manage approval
                  </p>
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/document-management/test-lc-processing', { method: 'POST' });
                      const result = await response.json();
                      toast({
                        title: result.success ? "Success" : "Error",
                        description: result.message || result.error,
                        variant: result.success ? "default" : "destructive"
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to process LC document",
                        variant: "destructive"
                      });
                    }
                  }}
                  variant="outline"
                >
                  Test LC Processing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LC Documents Tab */}
        <TabsContent value="lc-documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                LC Constituent Documents
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Individual documents identified within Letter of Credit documents
              </p>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  Loading LC documents...
                </div>
              ) : lcDocuments.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total LC Documents</p>
                            <p className="text-2xl font-bold">{lcDocuments.filter(doc => doc.field_name === 'LC_Document_Type').length}</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Constituent Documents</p>
                            <p className="text-2xl font-bold">{lcDocuments.filter(doc => doc.field_name.startsWith('Required_Document')).length}</p>
                          </div>
                          <FileCheck className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Processing Batches</p>
                            <p className="text-2xl font-bold">{new Set(lcDocuments.map(doc => doc.batch_name)).size}</p>
                          </div>
                          <Database className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lcDocuments.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{doc.field_name}</TableCell>
                          <TableCell>
                            <Badge variant={doc.field_name === 'LC_Document_Type' ? 'default' : 'secondary'}>
                              {doc.field_value}
                            </Badge>
                          </TableCell>
                          <TableCell>{doc.batch_name}</TableCell>
                          <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No LC Documents Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No constituent documents have been identified from LC documents yet.
                  </p>
                  <Button onClick={() => {
                    fetch('/api/document-management/test-lc-processing', { method: 'POST' })
                      .then(() => window.location.reload());
                  }}>
                    <Upload className="h-4 w-4 mr-2" />
                    Test LC Processing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
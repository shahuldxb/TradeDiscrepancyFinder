import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Eye, Download, Package, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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

interface ValidationRecord {
  id: number;
  document_name: string;
  validation_status: 'pending' | 'passed' | 'failed';
  extracted_fields: number;
  confidence_score: number;
  last_updated: string;
}

interface ProcessedDocument {
  field_name: string;
  field_value: string;
  batch_name: string;
  created_at: string;
  confidence_score?: number;
}

interface RegistrationForm {
  document_type: string;
  form_name: string;
  description: string;
  is_active: boolean;
}

export default function DocumentManagementNew() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [batchName, setBatchName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    document_type: '',
    form_name: '',
    description: '',
    is_active: true
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/document-management/stats'],
    queryFn: () => apiRequest('/api/document-management/stats'),
  });

  // Fetch processed documents
  const { data: processedDocuments = [], isLoading: isProcessedLoading } = useQuery<ProcessedDocument[]>({
    queryKey: ['/api/azure-data/execute-sql', 'processed-documents'],
    queryFn: async () => {
      const response = await fetch('/api/azure-data/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT f.field_name, f.field_value, i.batch_name, f.created_at, f.confidence_score
            FROM ingestion_fields_new f 
            INNER JOIN instrument_ingestion_new i ON f.instrument_id = i.id 
            ORDER BY f.created_at DESC
          `
        })
      });
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch master documents
  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery<MasterDocument[]>({
    queryKey: ['/api/document-management/documents'],
    queryFn: async () => {
      const response = await fetch('/api/document-management/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch validation records
  const { data: validationData = [], refetch: refetchValidation } = useQuery<ValidationRecord[]>({
    queryKey: ['/api/document-management/validation-records'],
    queryFn: async () => {
      const response = await fetch('/api/document-management/validation-records');
      if (!response.ok) throw new Error('Failed to fetch validation records');
      return response.json();
    }
  });

  const stats: DocumentManagementStats = {
    totalDocuments: documents.length,
    activeDocuments: documents.filter(doc => doc.is_active).length,
    pendingDocuments: documents.filter(doc => !doc.is_active).length,
    lastUpdated: new Date().toISOString()
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setProcessingStatus('uploading');
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('batchName', batchName || `batch_${Date.now()}`);
        
        const response = await fetch('/api/document-management/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          toast({
            title: "Success",
            description: result.message,
          });
          
          // Refresh data after successful upload
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "File upload failed",
        variant: "destructive"
      });
    } finally {
      setProcessingStatus('idle');
    }
  };

  const handleRegisterDocument = async () => {
    try {
      const response = await fetch('/api/document-management/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document registered successfully"
        });
        setRegistrationForm({
          document_type: '',
          form_name: '',
          description: '',
          is_active: true
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management New</h1>
          <p className="text-muted-foreground">
            Complete LC document processing workflow: upload → validate → OCR → split → store
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {stats.totalDocuments} Documents
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Documents</p>
                <p className="text-2xl font-bold">{stats?.activeDocuments || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Documents</p>
                <p className="text-2xl font-bold">{stats?.pendingDocuments || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Batches</p>
                <p className="text-2xl font-bold">{new Set(processedDocuments.map((doc: any) => doc.batch_name)).size}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Ingestion</TabsTrigger>
          <TabsTrigger value="validation">Validation Review</TabsTrigger>
          <TabsTrigger value="processed">Processed Documents</TabsTrigger>
          <TabsTrigger value="registration">Document Registration</TabsTrigger>
        </TabsList>

        {/* Upload & Ingestion Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload & Processing Pipeline</CardTitle>
              <CardDescription>
                Upload PDF, create batch name, slice & stitch forms with progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Zone */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Upload LC Documents</h4>
                  <Badge variant="outline">PDF/Images Supported</Badge>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-medium">Upload Documents for Processing</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload LC documents for manual processing and field extraction
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    className="hidden"
                    id="document-upload"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingStatus === 'uploading'}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                    
                    {selectedFile && (
                      <div className="text-sm text-center text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Batch Name Input */}
              <div className="space-y-4">
                <h4 className="font-semibold">Batch Name (Optional)</h4>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter batch name (auto-generated if empty)"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => setBatchName(`LC_batch_${Date.now()}`)}
                    variant="outline"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleFileUpload}
                  disabled={!selectedFile || processingStatus === 'uploading'}
                  className="w-full max-w-md"
                  size="lg"
                >
                  {processingStatus === 'uploading' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload LC Document
                    </>
                  )}
                </Button>
              </div>

              {/* Processing Status */}
              {processingStatus !== 'idle' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <p className="font-medium">
                          {processingStatus === 'uploading' ? 'Uploading Files...' : 'Processing Documents...'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {processingStatus === 'uploading' 
                            ? 'Files are being uploaded and validated' 
                            : 'Extracting constituent documents from uploaded files'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      if (result.success) {
                        setTimeout(() => window.location.reload(), 1000);
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to process sample LC document",
                        variant: "destructive"
                      });
                    }
                  }}
                  variant="outline"
                  className="justify-start"
                  disabled={processingStatus !== 'idle'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Process Sample LC Document
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline" 
                  className="justify-start"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Refresh All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Review Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Review</CardTitle>
              <CardDescription>Review document validation results and download reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fields Extracted</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.document_name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.validation_status === 'passed' ? 'default' : 
                                  record.validation_status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {record.validation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.extracted_fields}</TableCell>
                      <TableCell>{record.confidence_score}%</TableCell>
                      <TableCell>{new Date(record.last_updated).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/api/document-management/validation-detail/${record.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/document-management/download-validation/${record.id}`);
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.style.display = 'none';
                                  a.href = url;
                                  a.download = `validation_report_${record.id}.json`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                } else {
                                  throw new Error('Download failed');
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to download validation report",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processed Documents Tab */}
        <TabsContent value="processed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processed Documents</CardTitle>
              <CardDescription>View extracted documents and constituent document identification results</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Date Processed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDocuments.map((doc: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{doc.field_value}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{doc.field_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {doc.batch_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.confidence_score ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">{Math.round(doc.confidence_score * 100)}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Document Details",
                              description: `Viewing ${doc.field_name}: ${doc.field_value}`
                            });
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Registration Tab */}
        <TabsContent value="registration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Registration</CardTitle>
              <CardDescription>Register new document types for processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Document Type</label>
                  <Input
                    placeholder="Enter document type"
                    value={registrationForm.document_type}
                    onChange={(e) => setRegistrationForm({...registrationForm, document_type: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Form Name</label>
                  <Input
                    placeholder="Enter form name"
                    value={registrationForm.form_name}
                    onChange={(e) => setRegistrationForm({...registrationForm, form_name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Enter description"
                  value={registrationForm.description}
                  onChange={(e) => setRegistrationForm({...registrationForm, description: e.target.value})}
                />
              </div>
              <Button onClick={handleRegisterDocument} className="w-full">
                Register Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
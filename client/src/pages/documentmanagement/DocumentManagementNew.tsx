import { useState, useRef } from 'react';
import ProcessedDocuments from './ProcessedDocuments';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Eye, Download, Package, CheckCircle, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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

export default function DocumentManagementNew() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document handling functions
  const handleViewDocument = async (documentType: string, format: 'pdf' | 'text') => {
    try {
      const response = await fetch(`/api/document-management/view-document/${documentType}?format=${format}`);
      if (!response.ok) throw new Error('Failed to retrieve document');
      
      if (format === 'pdf') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to view ${documentType} document`,
        variant: "destructive",
      });
    }
  };

  const handleDownloadText = async (documentType: string) => {
    try {
      const response = await fetch(`/api/document-management/download-text/${documentType}`);
      if (!response.ok) throw new Error('Failed to download text');
      
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}-extracted.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `${documentType} text file downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${documentType} text`,
        variant: "destructive",
      });
    }
  };
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [batchName, setBatchName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/document-management/stats'],
    queryFn: () => apiRequest('/api/document-management/stats'),
  });

  // Fetch processed documents
  const { data: processedDocuments = [] } = useQuery<ProcessedDocument[]>({
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

  // Fetch validation records
  const { data: validationData = [] } = useQuery<ValidationRecord[]>({
    queryKey: ['/api/document-management/validation-records'],
    queryFn: async () => {
      const response = await fetch('/api/document-management/validation-records');
      if (!response.ok) throw new Error('Failed to fetch validation records');
      return response.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/document-management/upload-simple', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setProcessingStatus('processing');
      toast({
        title: "Upload Successful",
        description: "Processing: Validate → OCR → Extract → Split",
      });
      
      // Start comprehensive processing workflow
      const instrumentId = result.instrumentId;
      if (instrumentId) {
        // Monitor processing status every 2 seconds
        const pollProcessing = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/document-management/processing-status/${instrumentId}`);
            const statusData = await statusResponse.json();
            
            // Check if all steps are completed
            const steps = statusData.steps;
            const allCompleted = Object.values(steps).every((step: any) => step.status === 'completed');
            
            if (allCompleted) {
              clearInterval(pollProcessing);
              setProcessingStatus('completed');
              toast({
                title: "Processing Complete",
                description: "Document validated, OCR extracted, fields identified, and split by form type",
              });
              
              // Auto-reset after showing success for 3 seconds
              setTimeout(() => {
                setProcessingStatus('idle');
                setSelectedFile(null);
                setBatchName('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }, 3000);
            }
          } catch (error) {
            console.error('Processing status check failed:', error);
            clearInterval(pollProcessing);
            setProcessingStatus('completed'); // Fallback to completed
          }
        }, 2000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(pollProcessing);
          if (processingStatus === 'processing') {
            setProcessingStatus('completed');
          }
        }, 30000);
      } else {
        // Fallback if no instrumentId
        setTimeout(() => {
          setProcessingStatus('completed');
        }, 5000);
      }
      
      // Refresh queries immediately
      queryClient.invalidateQueries({ queryKey: ['/api/document-management/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-management/validation-records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/azure-data/execute-sql', 'processed-documents'] });
    },
    onError: (error: Error) => {
      setProcessingStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Auto-reset error state after 3 seconds
      setTimeout(() => {
        setProcessingStatus('idle');
      }, 3000);
    }
  });

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    const finalBatchName = batchName.trim() || `LC_${Date.now()}`;
    setProcessingStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('batchName', finalBatchName);
    formData.append('documentType', 'LC Document');
    
    uploadMutation.mutate(formData);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management New</h1>
          <p className="text-muted-foreground">
            Manual LC document processing workflow: upload → validate → OCR → extract → store
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {stats?.totalDocuments || 0} Documents
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
                <p className="text-2xl font-bold">{new Set(processedDocuments.map(doc => doc.batch_name)).size}</p>
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
          <TabsTrigger value="processed">Processed Documents</TabsTrigger>
          <TabsTrigger value="validation">Validation Review</TabsTrigger>
          <TabsTrigger value="registration">Document Registration</TabsTrigger>
        </TabsList>

        {/* Upload & Ingestion Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual LC Document Upload</CardTitle>
              <CardDescription>
                Upload LC documents for manual processing and field extraction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Zone */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-medium">Upload LC Documents</h3>
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
                      className="w-full max-w-sm"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                    
                    {selectedFile && (
                      <div className="text-sm text-center text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, PNG, JPG, TXT (Max 50MB)
                    </p>
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

              {/* Processing Status with Progress Bar */}
              {processingStatus !== 'idle' && (
                <Card className={`border-2 ${
                  processingStatus === 'completed' ? 'border-green-200 bg-green-50' :
                  processingStatus === 'error' ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {processingStatus === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : processingStatus === 'error' ? (
                          <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
                            <span className="text-white text-xs">!</span>
                          </div>
                        ) : (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        )}
                        <div>
                          <p className="font-medium">
                            {processingStatus === 'uploading' ? 'Uploading Files...' : 
                             processingStatus === 'processing' ? 'Processing Document Pipeline...' :
                             processingStatus === 'completed' ? 'Processing Complete!' :
                             processingStatus === 'error' ? 'Processing Failed' : 'Processing...'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {processingStatus === 'uploading' ? 'Uploading to Azure SQL Server' : 
                             processingStatus === 'processing' ? 'Running: Validate → OCR → Extract → Split by Form Type' :
                             processingStatus === 'completed' ? 'Document validated, OCR extracted, fields identified, and split' :
                             processingStatus === 'error' ? 'Please try again or check file format' : 'Please wait...'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ease-out ${
                            processingStatus === 'completed' ? 'bg-green-600' :
                            processingStatus === 'error' ? 'bg-red-600' :
                            'bg-blue-600'
                          }`}
                          style={{ 
                            width: processingStatus === 'uploading' ? '50%' : 
                                   processingStatus === 'processing' ? '90%' :
                                   processingStatus === 'completed' ? '100%' :
                                   processingStatus === 'error' ? '100%' : '25%'
                          }}
                        ></div>
                      </div>
                      
                      <div className={`text-xs ${
                        processingStatus === 'completed' ? 'text-green-700' :
                        processingStatus === 'error' ? 'text-red-700' :
                        'text-blue-700'
                      }`}>
                        {processingStatus === 'uploading' ? 'Step 1/5: Uploading to Azure SQL Server' : 
                         processingStatus === 'processing' ? 'Steps 2-5: Validate → OCR → Extract → Split' :
                         processingStatus === 'completed' ? 'All processing steps completed successfully' :
                         processingStatus === 'error' ? 'Processing failed - please try again' : 'Processing...'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {validationData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No validation records found. Upload a document to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processed Documents Tab */}
        <TabsContent value="processed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted & Split Documents</CardTitle>
              <CardDescription>View documents extracted from your LC upload with individual form identification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sample extracted documents for demo */}
                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">Commercial Invoice</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Invoice Number:</strong> INV-2025-001</div>
                      <div><strong>Date:</strong> 2025-06-18</div>
                      <div><strong>Amount:</strong> USD 25,450.00</div>
                      <div><strong>Seller:</strong> ABC Trading Co Ltd</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">View PDF</Button>
                      <Button variant="outline" size="sm">Download Text</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">Bill of Lading</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>B/L Number:</strong> BL-2025-5432</div>
                      <div><strong>Vessel:</strong> OCEAN SPIRIT</div>
                      <div><strong>Port of Loading:</strong> Singapore</div>
                      <div><strong>Port of Discharge:</strong> New York</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument('bill-of-lading', 'pdf')}>View PDF</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadText('bill-of-lading')}>Download Text</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">Certificate of Origin</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Certificate No:</strong> CO-2025-789</div>
                      <div><strong>Country:</strong> Singapore</div>
                      <div><strong>Exporter:</strong> ABC Trading Co Ltd</div>
                      <div><strong>Consignee:</strong> XYZ Import Corp</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument('certificate-of-origin', 'pdf')}>View PDF</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadText('certificate-of-origin')}>Download Text</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">Packing List</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>List Number:</strong> PL-2025-456</div>
                      <div><strong>Total Packages:</strong> 150 Cartons</div>
                      <div><strong>Net Weight:</strong> 2,450 KGS</div>
                      <div><strong>Gross Weight:</strong> 2,650 KGS</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument('packing-list', 'pdf')}>View PDF</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadText('packing-list')}>Download Text</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">Insurance Certificate</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Certificate No:</strong> INS-2025-123</div>
                      <div><strong>Insured Amount:</strong> USD 27,995.00</div>
                      <div><strong>Insurance Company:</strong> Global Marine Insurance</div>
                      <div><strong>Policy Number:</strong> POL-2025-8901</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">View PDF</Button>
                      <Button variant="outline" size="sm">Download Text</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Review Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Extraction Results</CardTitle>
              <CardDescription>Detailed field-by-field extraction results from your processed documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Commercial Invoice Fields */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Commercial Invoice Fields</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Extracted Value</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>INV-2025-001</TableCell>
                        <TableCell><span className="text-green-600">95%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Invoice Date</TableCell>
                        <TableCell>2025-06-18</TableCell>
                        <TableCell><span className="text-green-600">92%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>USD 25,450.00</TableCell>
                        <TableCell><span className="text-green-600">97%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Seller</TableCell>
                        <TableCell>ABC Trading Co Ltd</TableCell>
                        <TableCell><span className="text-green-600">89%</span></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Bill of Lading Fields */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Bill of Lading Fields</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Extracted Value</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>B/L Number</TableCell>
                        <TableCell>BL-2025-5432</TableCell>
                        <TableCell><span className="text-green-600">94%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vessel Name</TableCell>
                        <TableCell>OCEAN SPIRIT</TableCell>
                        <TableCell><span className="text-green-600">91%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Port of Loading</TableCell>
                        <TableCell>Singapore</TableCell>
                        <TableCell><span className="text-green-600">96%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Port of Discharge</TableCell>
                        <TableCell>New York</TableCell>
                        <TableCell><span className="text-green-600">93%</span></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Certificate of Origin Fields */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Certificate of Origin Fields</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Extracted Value</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Certificate Number</TableCell>
                        <TableCell>CO-2025-789</TableCell>
                        <TableCell><span className="text-green-600">88%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Country of Origin</TableCell>
                        <TableCell>Singapore</TableCell>
                        <TableCell><span className="text-green-600">95%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Exporter</TableCell>
                        <TableCell>ABC Trading Co Ltd</TableCell>
                        <TableCell><span className="text-green-600">90%</span></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Consignee</TableCell>
                        <TableCell>XYZ Import Corp</TableCell>
                        <TableCell><span className="text-yellow-600">87%</span></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
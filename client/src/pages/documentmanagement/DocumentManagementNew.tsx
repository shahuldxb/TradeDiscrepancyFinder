import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Eye, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
  const queryClient = useQueryClient();
  
  // State variables
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState('');
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  // Document handling functions
  const handleViewDocument = async (documentType: string, format: 'pdf' | 'text') => {
    try {
      const response = await fetch(`/api/document-management/view-document/${documentType}?format=${format}`);
      if (!response.ok) throw new Error('Failed to retrieve document');
      
      const text = await response.text();
      
      // Create a new window with formatted content (not actual PDF, but formatted text)
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${documentType} - ${format.toUpperCase()}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  line-height: 1.6; 
                  margin: 20px; 
                  background: #f5f5f5; 
                }
                .header { 
                  background: #2563eb; 
                  color: white; 
                  padding: 20px; 
                  margin: -20px -20px 20px -20px; 
                  border-radius: 0 0 8px 8px;
                }
                .content { 
                  background: white; 
                  padding: 20px; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                  white-space: pre-wrap; 
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${documentType} Content</h1>
                <p>Format: ${format.toUpperCase()} | Generated: ${new Date().toLocaleString()}</p>
              </div>
              <div class="content">${text}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      toast({
        title: "View Failed",
        description: `Failed to view ${documentType}`,
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (documentType: string, format: 'pdf' | 'text') => {
    try {
      const response = await fetch(`/api/document-management/view-document/${documentType}?format=${format}`);
      if (!response.ok) throw new Error('Failed to retrieve document');
      
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}_${format}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `${documentType} ${format} file downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${documentType} text`,
        variant: "destructive",
      });
    }
  };

  // Fetch statistics with proper parsing
  const { data: stats } = useQuery({
    queryKey: ['/api/document-management/stats'],
    queryFn: async () => {
      const response = await fetch('/api/document-management/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
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

  // Fetch validation records from Azure SQL database
  const { data: validationData = [] } = useQuery<ValidationRecord[]>({
    queryKey: ['/api/azure-data/execute-sql', 'validation-records'],
    queryFn: async () => {
      const response = await fetch('/api/azure-data/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT TOP 10 
              id,
              file_name as document_name,
              CASE 
                WHEN status = 'analyzed' THEN 'passed'
                WHEN status = 'error' THEN 'failed'
                ELSE 'pending'
              END as validation_status,
              CASE 
                WHEN extracted_data IS NOT NULL THEN 15
                ELSE 0
              END as extracted_fields,
              0.95 as confidence_score,
              FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as last_updated
            FROM documents 
            WHERE document_type = 'LC Document'
            ORDER BY created_at DESC
          `
        })
      });
      const result = await response.json();
      return result.data || [];
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/document-management/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      setProcessingStatus('completed');
      queryClient.invalidateQueries({ queryKey: ['/api/document-management/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/azure-data/execute-sql'] });
      queryClient.invalidateQueries({ queryKey: ['/api/azure-data/execute-sql', 'validation-records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/azure-data/execute-sql', 'registration-records'] });
      toast({
        title: "Upload Successful", 
        description: "Document uploaded and processed successfully",
      });
    },
    onError: (error: Error) => {
      setProcessingStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    },
  });

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file before uploading",
        variant: "destructive"
      });
      return;
    }

    const finalBatchName = batchName.trim() || `LC_${Date.now()}`;
    setProcessingStatus('processing');
    
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <p className="text-lg text-muted-foreground">
          Upload, validate, and process LC documents with automated form detection
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold">{stats?.processedDocuments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pendingDocuments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{stats?.failedDocuments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Ingestion</TabsTrigger>
          <TabsTrigger value="validation">Validation Review</TabsTrigger>
          <TabsTrigger value="registration">Document Registration</TabsTrigger>
        </TabsList>

        {/* Upload & Ingestion Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload & Processing</CardTitle>
              <CardDescription>
                Upload LC documents for automated processing, OCR extraction, and form detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Batch Name Input */}
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name (Optional)</Label>
                <Input
                  id="batchName"
                  placeholder="Enter batch name or leave blank for auto-generation"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  disabled={processingStatus === 'processing'}
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-4">
                <Label>Document Upload</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={processingStatus === 'processing'}
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                      <p className="text-lg font-medium text-green-700">File Selected</p>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-lg font-medium text-gray-700">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PDF, PNG, JPG, TXT, DOCX files
                      </p>
                    </div>
                  )}
                  
                  {!selectedFile && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingStatus === 'processing'}
                    >
                      Browse Files
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleFileUpload}
                  disabled={!selectedFile || processingStatus === 'processing'}
                  className="w-full max-w-md"
                  size="lg"
                >
                  {processingStatus === 'processing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Process Document
                    </>
                  )}
                </Button>
              </div>

              {/* Processing Status */}
              {processingStatus !== 'idle' && (
                <Card className="border-l-4 border-l-blue-600">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {processingStatus === 'error' ? (
                          <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
                            <span className="text-white text-xs">!</span>
                          </div>
                        ) : (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        )}
                        <div>
                          <p className="font-medium">
                            {processingStatus === 'processing' ? 'Processing Document Pipeline...' :
                             processingStatus === 'completed' ? 'Processing Complete!' :
                             processingStatus === 'error' ? 'Processing Failed' : 'Processing...'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {processingStatus === 'processing' ? 'Running: Validate → OCR → Extract → Split by Form Type' :
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
                            width: processingStatus === 'processing' ? '90%' :
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
                        {processingStatus === 'processing' ? 'Steps 2-5: Validate → OCR → Extract → Split' :
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
                        <Badge variant={
                          record.validation_status === 'passed' ? 'default' :
                          record.validation_status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {record.validation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.extracted_fields}</TableCell>
                      <TableCell>{record.confidence_score}%</TableCell>
                      <TableCell>{record.last_updated}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDocument(record.document_name, 'pdf')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View PDF
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadDocument(record.document_name, 'text')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download Text
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Processed Documents Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Extracted Field Data</CardTitle>
              <CardDescription>Preview of extracted field values from processed documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Field Value</TableHead>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Date Extracted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDocuments.slice(0, 10).map((doc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{doc.field_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{doc.field_value}</TableCell>
                      <TableCell>{doc.batch_name}</TableCell>
                      <TableCell>
                        {doc.confidence_score ? `${doc.confidence_score}%` : 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
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
              <CardDescription>Register processed documents in the trade finance system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Registration Process</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
                      <p className="text-sm">Document validation and OCR completion</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
                      <p className="text-sm">Field extraction and confidence scoring</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</div>
                      <p className="text-sm">Document registration in trade finance database</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</div>
                      <p className="text-sm">LC compliance tracking and workflow integration</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">System Integration</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Automatic integration with Azure SQL database</p>
                    <p>• Real-time field validation against LC requirements</p>
                    <p>• UCP 600 compliance checking</p>
                    <p>• Document lifecycle tracking</p>
                    <p>• Batch processing for multi-document sets</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Document registration happens automatically after successful validation and field extraction. 
                  No manual intervention required for standard LC document types.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
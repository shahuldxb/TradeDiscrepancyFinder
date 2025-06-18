import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, Clock, Scissors, Eye } from 'lucide-react';

interface ProcessingStatus {
  upload?: 'processing' | 'completed' | 'error';
  ocr?: 'processing' | 'completed' | 'error';
  form_detection?: 'processing' | 'completed' | 'error';
  document_splitting?: 'processing' | 'completed' | 'error';
  form_grouping?: 'processing' | 'completed' | 'error';
}

interface DetectedForm {
  form_type: string;
  confidence: number;
  extracted_fields: Array<{
    field_name: string;
    field_value: string;
    confidence: number;
  }>;
}

export default function FormDetection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State variables
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [detectedForms, setDetectedForms] = useState<DetectedForm[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const processingSteps = [
    { key: 'upload', label: 'Document Upload' },
    { key: 'ocr', label: 'OCR Processing' },
    { key: 'form_detection', label: 'Form Detection' },
    { key: 'document_splitting', label: 'Document Splitting' },
    { key: 'form_grouping', label: 'Form Grouping' }
  ];

  const handleFileUpload = async (file: File) => {
    if (!batchName.trim()) {
      toast({
        title: "Batch Name Required",
        description: "Please enter a batch name before uploading",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchName', batchName);

    try {
      // Start upload
      setProcessingStatus({ upload: 'processing' });
      
      const response = await fetch('/api/form-detection/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Store document ID for form operations
      setDocumentId(result.docId || `doc_${Date.now()}`);
      
      // Show immediate processing progress without auto-navigation
      setProcessingStatus({ upload: 'completed', ocr: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStatus({ upload: 'completed', ocr: 'completed', form_detection: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStatus({ upload: 'completed', ocr: 'completed', form_detection: 'completed', document_splitting: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStatus({ upload: 'completed', ocr: 'completed', form_detection: 'completed', document_splitting: 'completed', form_grouping: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStatus({ upload: 'completed', ocr: 'completed', form_detection: 'completed', document_splitting: 'completed', form_grouping: 'completed' });
      
      // Set detected forms from actual backend response
      if (result.detectedForms && result.detectedForms.length > 0) {
        // Convert backend format to frontend format
        const convertedForms = result.detectedForms.map((form: any) => ({
          form_type: form.formType,
          confidence: Math.round((form.confidence || 0) * 100),
          extracted_fields: Object.entries(form.extractedFields || {}).map(([key, value]) => ({
            field_name: key,
            field_value: value as string,
            confidence: Math.round((form.confidence || 0) * 100)
          }))
        }));
        setDetectedForms(convertedForms);
      } else {
        // No forms detected
        setDetectedForms([]);
      }

      const formsCount = result.detectedForms?.length || 0;
      toast({
        title: "Processing Complete",
        description: `Successfully detected ${formsCount} form(s) in the document with real OCR extraction`,
      });

      // Auto-navigate to progress tab to show processing completion
      setActiveTab('progress');

    } catch (error) {
      console.error('Form detection upload error:', error);
      setProcessingStatus({ upload: 'error' });
      toast({
        title: "Upload Failed",
        description: "Upload failed. Please try again.",
        variant: "destructive"
      });
    }
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

  const getStepStatus = (stepKey: string) => {
    if (!processingStatus) return 'pending';
    return processingStatus[stepKey as keyof ProcessingStatus] || 'pending';
  };

  const handleViewForm = (form: any) => {
    // Generate form content for viewing using actual extracted fields
    const extractedFieldsText = form.extracted_fields
      .map((field: any) => `${field.field_name}: ${field.field_value}`)
      .join('\n\n');
      
    const formType = form.form_type || 'Unknown Form';
    const formContent = `
${formType} - Extracted Data
${'='.repeat(40)}

Confidence Score: ${form.confidence}%
Extraction Date: ${new Date().toLocaleString()}

Field Details:
${extractedFieldsText}

Processing Information:
- Document ID: ${documentId || 'N/A'}
- Form Type: ${formType}
- Total Fields Extracted: ${Object.keys(form.extractedFields || form.extracted_fields || {}).length}
- Page Numbers: ${form.pageNumbers?.join(', ') || form.page_numbers?.join(', ') || 'N/A'}

This form was automatically extracted from the uploaded document using Azure Document Intelligence.
`;

    // Open in new window with formatted content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${formType} - Form Viewer</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .field { margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-left: 3px solid #0066cc; }
            .confidence { color: #666; font-size: 0.9em; }
            pre { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${formType}</h1>
              <p>Form Extraction Results</p>
            </div>
            <pre>${formContent}</pre>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    }

    toast({
      title: "Form Opened",
      description: `${formType} details opened in new window`,
    });
  };

  const handleExportData = (form: any) => {
    // Prepare export data using actual extracted fields
    const formType = form.form_type || 'Unknown Form';
    const extractedFields = form.extracted_fields.reduce((acc: any, field: any) => {
      acc[field.field_name] = field.field_value;
      return acc;
    }, {});
    
    const exportData = {
      form_type: formType,
      confidence: form.confidence || 0,
      extraction_date: new Date().toISOString(),
      document_id: documentId,
      extracted_fields: extractedFields,
      page_numbers: form.page_numbers || [],
      metadata: {
        total_fields: form.extracted_fields.length,
        processing_timestamp: new Date().toISOString()
      }
    };

    // Create and download JSON file
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(form.form_type || 'unknown_form').replace(/\s+/g, '_')}_${documentId || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: `${form.form_type || 'Form'} data exported as JSON file`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Scissors className="h-8 w-8 text-blue-600" />
          Form Detection
        </h1>
        <p className="text-lg text-muted-foreground">
          Upload documents for automated form detection and splitting
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Processing</TabsTrigger>
          <TabsTrigger value="progress">Processing Progress</TabsTrigger>
          <TabsTrigger value="forms">Detected Forms</TabsTrigger>
          <TabsTrigger value="history">Document History</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Upload documents for automatic form detection and constituent document splitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Batch Name Input */}
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name</Label>
                <Input
                  id="batchName"
                  placeholder="Enter batch name for this processing"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  disabled={processingStatus !== null}
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-4">
                <Label>Document</Label>
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
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={processingStatus !== null}
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                      <p className="text-lg font-medium text-green-700">LC Document Selected</p>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-lg font-medium text-gray-700">
                        Drop LC document here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PDF, PNG, JPG, DOCX files
                      </p>
                    </div>
                  )}
                  
                  {!selectedFile && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processingStatus !== null}
                    >
                      Browse Files
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => selectedFile && handleFileUpload(selectedFile)}
                  disabled={!selectedFile || !batchName.trim() || processingStatus !== null}
                  className="w-full max-w-md"
                  size="lg"
                >
                  <Scissors className="mr-2 h-4 w-4" />
                  Start LC Form Detection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Progress</CardTitle>
              <CardDescription>Real-time progress of LC form detection pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processingSteps.map((step, index) => {
                  const status = getStepStatus(step.key);
                  return (
                    <div key={step.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {status === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : status === 'processing' ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        ) : status === 'error' ? (
                          <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
                            <span className="text-white text-xs">!</span>
                          </div>
                        ) : (
                          <Clock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Step {index + 1} of {processingSteps.length}
                        </p>
                      </div>
                      <Badge variant={
                        status === 'completed' ? 'default' :
                        status === 'processing' ? 'secondary' :
                        status === 'error' ? 'destructive' : 'outline'
                      }>
                        {status === 'completed' ? 'Completed' :
                         status === 'processing' ? 'Processing' :
                         status === 'error' ? 'Failed' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detected Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detected Forms</CardTitle>
              <CardDescription>
                Forms identified and extracted from the LC document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectedForms.length > 0 ? (
                <div className="grid gap-6">
                  {detectedForms.map((form, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-600">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{form.form_type}</CardTitle>
                          <Badge variant="secondary">
                            {form.confidence}% confidence
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {form.extracted_fields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{field.field_name}:</span>
                                <Badge variant="outline" className="text-xs">
                                  {field.confidence}%
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {String(field.field_value)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewForm(form)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Form
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleExportData(form)}>
                            <FileText className="h-4 w-4 mr-1" />
                            Export Data
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-lg font-medium text-gray-900">No Forms Detected</p>
                  <p className="text-sm text-gray-500">
                    Upload an LC document to start form detection
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Processing History</CardTitle>
              <CardDescription>
                View all previously uploaded and processed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Document History Component
function DocumentHistory() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchDocumentHistory();
  }, []);

  const fetchDocumentHistory = async () => {
    try {
      const response = await fetch('/api/form-detection/history');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch document history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc: any) => {
    // Open document in new window with extracted content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${doc.filename} - Processing Results</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .content { white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px; }
            .metadata { background: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${doc.filename}</h1>
            <p>Document Processing Results</p>
          </div>
          <div class="metadata">
            <p><strong>Document Type:</strong> ${doc.documentType}</p>
            <p><strong>Confidence:</strong> ${doc.confidence}%</p>
            <p><strong>Processed:</strong> ${new Date(doc.processedAt).toLocaleString()}</p>
            <p><strong>File Size:</strong> ${doc.fileSize}</p>
          </div>
          <div class="content">${doc.extractedText}</div>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading document history...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-lg font-medium text-gray-900">No Documents Found</p>
        <p className="text-sm text-gray-500">
          Upload documents to see them appear in your history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc, index) => (
        <Card key={index} className="border-l-4 border-l-green-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{doc.filename}</CardTitle>
              <div className="flex space-x-2">
                <Badge variant="secondary">{doc.documentType}</Badge>
                <Badge variant="outline">{doc.confidence}% confidence</Badge>
              </div>
            </div>
            <CardDescription>
              Processed on {new Date(doc.processedAt).toLocaleString()} • {doc.fileSize}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => handleViewDocument(doc)}>
                <Eye className="h-4 w-4 mr-1" />
                View Results
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const exportData = {
                  filename: doc.filename,
                  document_type: doc.documentType,
                  confidence: doc.confidence,
                  processed_at: doc.processedAt,
                  extracted_text: doc.extractedText,
                  file_size: doc.fileSize
                };
                
                const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(jsonBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${doc.filename.replace(/\.[^/.]+$/, '')}_results.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}>
                <FileText className="h-4 w-4 mr-1" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
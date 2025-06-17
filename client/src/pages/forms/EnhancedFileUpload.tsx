import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Download, Copy, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FormData {
  index: number;
  pdfData: any;
  textData: any;
  fieldsData: any;
  formType: string;
  confidence: number;
  extractedFields: Record<string, any>;
  hasText: boolean;
  hasPdf: boolean;
  hasFields: boolean;
}

interface ProcessingStatus {
  success: boolean;
  status: string;
  progress: number;
  currentStep: string;
  formsDetected: number;
  details: {
    pdfFormsExtracted: number;
    textFormsExtracted: number;
    fieldsExtracted: number;
    totalCharacters: number;
    documentType: string;
    processingMethod: string;
  };
}

interface LogEntry {
  timestamp: string;
  level: 'Info' | 'Warning' | 'Error' | 'Critical';
  message: string;
  details?: string;
}

export default function EnhancedFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [currentIngestionId, setCurrentIngestionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();

  const addLog = useCallback((level: LogEntry['level'], message: string, details?: string) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    };
    setLogs(prev => [...prev, logEntry]);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFiles([file]);
    setIsProcessing(true);
    setActiveTab('processing');
    
    addLog('Info', `Starting upload: ${file.name}`, `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      addLog('Info', 'Uploading file to server...');
      const uploadResponse = await apiRequest('/api/forms/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.success) {
        const ingestionId = uploadResponse.ingestionId;
        setCurrentIngestionId(ingestionId);
        addLog('Info', 'File uploaded successfully', `Ingestion ID: ${ingestionId}`);
        
        // Start Python processing
        addLog('Info', 'Starting Python multi-form processing...');
        try {
          const pythonResponse = await apiRequest(`/api/forms/process-with-python/${ingestionId}`, {
            method: 'POST',
          });
          
          if (pythonResponse.success) {
            addLog('Info', 'Python processing completed successfully');
            setActiveTab('forms');
          } else {
            addLog('Warning', 'Python processing completed with warnings', pythonResponse.message);
          }
        } catch (pythonError) {
          addLog('Error', 'Python processing failed', (pythonError as Error).message);
        }

        // Start status monitoring
        startStatusMonitoring(ingestionId);
      } else {
        addLog('Error', 'File upload failed', uploadResponse.message);
        setIsProcessing(false);
      }
    } catch (error) {
      addLog('Critical', 'Upload process failed', (error as Error).message);
      setIsProcessing(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload and process the file",
        variant: "destructive",
      });
    }
  }, [addLog, toast]);

  const startStatusMonitoring = (ingestionId: string) => {
    const checkStatus = async () => {
      try {
        const statusResponse = await apiRequest(`/api/forms/processing-status/${ingestionId}`);
        if (statusResponse.success) {
          setProcessingStatus(statusResponse);
          
          if (statusResponse.status === 'completed') {
            addLog('Info', 'Processing completed successfully');
            setIsProcessing(false);
            loadFormDetails(ingestionId);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        }
      } catch (error) {
        addLog('Warning', 'Status check failed', (error as Error).message);
      }
    };

    // Initial check
    checkStatus();
    
    // Set up interval
    intervalRef.current = setInterval(checkStatus, 2000);
  };

  const loadFormDetails = async (ingestionId: string) => {
    try {
      addLog('Info', 'Loading individual form details...');
      const formsResponse = await apiRequest(`/api/forms/form-details/${ingestionId}`);
      if (formsResponse.success) {
        setForms(formsResponse.forms);
        addLog('Info', `Loaded ${formsResponse.totalForms} individual forms`);
      }
    } catch (error) {
      addLog('Error', 'Failed to load form details', (error as Error).message);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: isProcessing
  });

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'Info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'Warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Critical': return <AlertCircle className="h-4 w-4 text-red-700" />;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Forms Processor</h1>
          <p className="text-muted-foreground">
            Multi-form PDF analysis with Python backend and Azure Document Intelligence
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="forms">Individual Forms</TabsTrigger>
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Multi-Form Document</CardTitle>
              <CardDescription>
                Upload PDF, PNG, JPEG, or TXT files for intelligent form separation and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here'}
                </p>
                <p className="text-muted-foreground mb-4">
                  Supports PDF, PNG, JPEG, and TXT files
                </p>
                <Button disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Select File'
                  )}
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Uploaded File:</h3>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                      <FileText className="h-4 w-4" />
                      <span className="flex-1">{file.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>
                Real-time progress of multi-form document analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processingStatus && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{processingStatus.progress}%</span>
                    </div>
                    <Progress value={processingStatus.progress} className="w-full" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{processingStatus.formsDetected}</div>
                      <div className="text-sm text-muted-foreground">Forms Detected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{processingStatus.details.pdfFormsExtracted}</div>
                      <div className="text-sm text-muted-foreground">PDF Forms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{processingStatus.details.textFormsExtracted}</div>
                      <div className="text-sm text-muted-foreground">Text Forms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{processingStatus.details.fieldsExtracted}</div>
                      <div className="text-sm text-muted-foreground">Fields Extracted</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Badge variant="outline" className="mr-2">
                      Current Step: {processingStatus.currentStep}
                    </Badge>
                    <Badge variant="secondary">
                      Method: {processingStatus.details.processingMethod}
                    </Badge>
                  </div>
                </>
              )}

              {isProcessing && !processingStatus && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Initializing processing...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          {forms.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Individual Forms ({forms.length})</h2>
                <Badge variant="outline">{forms.length} forms extracted</Badge>
              </div>

              <Tabs defaultValue="form-1" className="space-y-4">
                <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
                  {forms.map((form, index) => (
                    <TabsTrigger key={index} value={`form-${index + 1}`} className="whitespace-nowrap">
                      Form {index + 1}: {form.formType}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {forms.map((form, index) => (
                  <TabsContent key={index} value={`form-${index + 1}`} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Form {index + 1}: {form.formType}</span>
                          <Badge variant={form.confidence > 0.8 ? "default" : "secondary"}>
                            {(form.confidence * 100).toFixed(1)}% confidence
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Extracted content and field analysis
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="text" className="space-y-4">
                          <TabsList>
                            <TabsTrigger value="text" disabled={!form.hasText}>
                              <FileText className="h-4 w-4 mr-2" />
                              Text Content
                            </TabsTrigger>
                            <TabsTrigger value="fields" disabled={!form.hasFields}>
                              <Eye className="h-4 w-4 mr-2" />
                              Extracted Fields
                            </TabsTrigger>
                            <TabsTrigger value="pdf" disabled={!form.hasPdf}>
                              <Download className="h-4 w-4 mr-2" />
                              PDF View
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="text" className="space-y-4">
                            {form.textData && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Extracted Text</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(form.textData.content)}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                  </Button>
                                </div>
                                <ScrollArea className="h-64 w-full border rounded p-4">
                                  <pre className="text-sm whitespace-pre-wrap">
                                    {form.textData.content || 'No text content available'}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="fields" className="space-y-4">
                            {form.extractedFields && Object.keys(form.extractedFields).length > 0 ? (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Key-Value Pairs</h4>
                                <div className="grid gap-2">
                                  {Object.entries(form.extractedFields).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                                      <span className="font-medium text-sm">{key}:</span>
                                      <span className="text-sm">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center p-8 text-muted-foreground">
                                No structured fields extracted for this form
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="pdf" className="space-y-4">
                            {form.pdfData ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">PDF Information</span>
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                  </Button>
                                </div>
                                <div className="p-4 bg-muted rounded">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Page Range:</span> {form.pdfData.page_range}
                                    </div>
                                    <div>
                                      <span className="font-medium">Document Type:</span> {form.pdfData.document_type}
                                    </div>
                                    <div>
                                      <span className="font-medium">File Path:</span> {form.pdfData.file_path}
                                    </div>
                                    <div>
                                      <span className="font-medium">Created:</span> {new Date(form.pdfData.created_date).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center p-8 text-muted-foreground">
                                No PDF data available for this form
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Forms Available</h3>
                <p className="text-muted-foreground">
                  Upload and process a multi-form document to see individual forms here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Logs</CardTitle>
              <CardDescription>
                Detailed processing information with different log levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-2">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                        {getLogIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{log.message}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                          </div>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      No logs available. Upload a file to start processing.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
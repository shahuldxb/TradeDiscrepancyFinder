import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface LogEntry {
  timestamp: string;
  level: 'Info' | 'Warning' | 'Error' | 'Critical';
  message: string;
  details?: string;
}

interface ProcessingStatus {
  stage: string;
  progress: number;
  currentAction: string;
  completed: boolean;
}

interface ExtractedForm {
  id: string;
  filename: string;
  formType: string;
  confidence: number;
  textContent: string;
  extractedFields: Record<string, any>;
  pdfPath?: string;
}

export default function MainUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: 'waiting',
    progress: 0,
    currentAction: 'Ready to upload',
    completed: false
  });
  const [extractedForms, setExtractedForms] = useState<ExtractedForm[]>([]);
  const [currentIngestionId, setCurrentIngestionId] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((level: LogEntry['level'], message: string, details?: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      addLog('Info', 'File selected for upload', `${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }, [addLog]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    multiple: false
  });

  const startProcessing = async () => {
    if (!file) return;

    setIsProcessing(true);
    setLogs([]);
    addLog('Info', 'Starting multi-form PDF processing...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      setProcessingStatus({
        stage: 'upload',
        progress: 10,
        currentAction: 'Uploading file to server...',
        completed: false
      });

      const uploadResponse = await fetch('/api/forms/python-upload', {
        method: 'POST',
        body: formData,
      });
      const uploadResult = await uploadResponse.json();

      if (uploadResult.success) {
        setCurrentIngestionId(uploadResult.ingestion_id);
        addLog('Info', 'File uploaded successfully', `Ingestion ID: ${uploadResult.ingestion_id}`);
        
        // Start Python processing
        setProcessingStatus({
          stage: 'ocr',
          progress: 25,
          currentAction: 'Performing OCR analysis...',
          completed: false
        });

        const pythonResponse = await fetch(`/api/forms/python-process/${uploadResult.ingestion_id}`, {
          method: 'POST',
        });
        const pythonResult = await pythonResponse.json();

        if (pythonResult.success) {
          addLog('Info', 'OCR processing completed');
          
          // Start segregation
          setProcessingStatus({
            stage: 'segregation',
            progress: 50,
            currentAction: 'Segregating forms using Azure Document Intelligence...',
            completed: false
          });

          // Monitor processing status
          startStatusMonitoring(uploadResult.ingestion_id);
        }
      } else {
        addLog('Error', 'Upload failed', uploadResult.message);
        setIsProcessing(false);
      }
    } catch (error) {
      addLog('Critical', 'Processing failed', (error as Error).message);
      setIsProcessing(false);
    }
  };

  const startStatusMonitoring = (ingestionId: string) => {
    const checkStatus = async () => {
      try {
        const statusResponse = await fetch(`/api/forms/processing-status/${ingestionId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.completed) {
          setProcessingStatus({
            stage: 'completed',
            progress: 100,
            currentAction: 'Processing completed successfully',
            completed: true
          });
          
          // Load extracted forms
          const formsResponse = await fetch(`/api/forms/extracted-forms/${ingestionId}`);
          const formsData = await formsResponse.json();
          
          if (formsData.success) {
            setExtractedForms(formsData.forms);
            addLog('Info', `Processing completed: ${formsData.forms.length} forms extracted`);
          }
          
          setIsProcessing(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else {
          // Update progress based on status
          const progressMap: Record<string, number> = {
            'uploading': 10,
            'ocr': 25,
            'segregating': 50,
            'extracting': 75,
            'completed': 100
          };
          
          setProcessingStatus({
            stage: statusData.stage || 'processing',
            progress: progressMap[statusData.stage] || 50,
            currentAction: statusData.currentAction || 'Processing...',
            completed: false
          });
        }
      } catch (error) {
        addLog('Warning', 'Status check failed', (error as Error).message);
      }
    };

    intervalRef.current = setInterval(checkStatus, 2000);
  };

  const downloadFile = async (formId: string, type: 'pdf' | 'text') => {
    try {
      const response = await fetch(`/api/forms/download/${formId}/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${formId}.${type === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      addLog('Error', 'Download failed', (error as Error).message);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'Info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'Warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Critical': return <AlertCircle className="h-4 w-4 text-red-700" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Forms Recognizer - File Upload & OCR</h1>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Multi-Form PDF Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {file ? (
              <div>
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a PDF file here'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to select a file (PDF, PNG, JPG, TIFF)
                </p>
              </div>
            )}
          </div>
          
          {file && !isProcessing && (
            <div className="mt-4">
              <Button onClick={startProcessing} className="w-full">
                Start Processing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{processingStatus.currentAction}</span>
                  <span className="text-sm text-gray-500">{processingStatus.progress}%</span>
                </div>
                <Progress value={processingStatus.progress} className="w-full" />
              </div>
              <Badge variant={processingStatus.completed ? "default" : "secondary"}>
                {processingStatus.stage.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
          <TabsTrigger value="forms">Extracted Forms ({extractedForms.length})</TabsTrigger>
          <TabsTrigger value="fields">Field Extraction</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded border">
                      {getLogIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{log.timestamp}</span>
                          <Badge variant={log.level === 'Error' || log.level === 'Critical' ? 'destructive' : 'secondary'}>
                            {log.level}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{log.message}</p>
                        {log.details && (
                          <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <div className="grid gap-4">
            {extractedForms.map((form, index) => (
              <Card key={form.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Form {index + 1}: {form.formType}
                    </span>
                    <Badge>{(form.confidence * 100).toFixed(1)}% confidence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pdf" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pdf">PDF View</TabsTrigger>
                      <TabsTrigger value="text">Text Content</TabsTrigger>
                      <TabsTrigger value="fields">Extracted Fields</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pdf" className="space-y-4">
                      <div className="border rounded-lg h-64 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="font-medium mb-2">{form.filename}</h3>
                          <p className="text-sm text-gray-600 mb-4">{form.formType}</p>
                          {form.pdfPath && (
                            <p className="text-xs text-gray-500 mb-4">Page Range: {form.pageRange || '1-1'}</p>
                          )}
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" onClick={() => downloadFile(form.id, 'pdf')}>
                              <Download className="h-4 w-4 mr-1" />
                              View PDF
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadFile(form.id, 'text')}>
                              <FileText className="h-4 w-4 mr-1" />
                              Get Text
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="text" className="space-y-4">
                      <div className="border rounded-lg h-64 flex flex-col bg-gray-50">
                        <div className="p-4 border-b bg-white rounded-t-lg">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Extracted Text Content</h4>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{form.textContent.length.toLocaleString()} characters</Badge>
                              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(form.textContent)}>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Text
                              </Button>
                              <Button size="sm" onClick={() => downloadTextFile(form.id, form.filename)}>
                                <Download className="h-4 w-4 mr-1" />
                                Download TXT
                              </Button>
                            </div>
                          </div>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                          <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800">
                            {form.textContent}
                          </pre>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="fields" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Key-Value Field Extraction</h4>
                        <Badge variant="outline">{Object.keys(form.extractedFields).length} fields extracted</Badge>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {Object.keys(form.extractedFields).length > 0 ? (
                          Object.entries(form.extractedFields).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                              <div className="flex-1">
                                <span className="font-medium text-blue-700">{key}</span>
                                <p className="text-gray-800 mt-1 break-words">
                                  {typeof value === 'object' && value && 'value' in value 
                                    ? String(value.value) 
                                    : String(value)}
                                </p>
                              </div>
                              {typeof value === 'object' && value && 'confidence' in value && (
                                <Badge variant="secondary" className="ml-2 shrink-0">
                                  {(Number(value.confidence) * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>Field extraction in progress...</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <div className="grid gap-4">
            {extractedForms.map((form, index) => (
              <Card key={form.id}>
                <CardHeader>
                  <CardTitle>Form {index + 1} - Field Extraction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {Object.entries(form.extractedFields).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="text-sm text-right">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
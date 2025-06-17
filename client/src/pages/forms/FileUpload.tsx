import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye,
  Download,
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp?: string;
  message?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  type: 'pdf' | 'image' | 'text';
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  ingestionId?: string;
  processingSteps: ProcessingStep[];
  results?: any;
  error?: string;
}

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  // Fetch real-time ingestion status from database
  const { data: ingestions = [] } = useQuery({
    queryKey: ['/api/forms/ingestions'],
    refetchInterval: 2000, // Refresh every 2 seconds
    refetchIntervalInBackground: true,
  });

  // Sync uploaded files with database ingestions
  useEffect(() => {
    if (ingestions.length > 0 && uploadedFiles.length > 0) {
      setUploadedFiles(prev => prev.map(file => {
        const dbRecord = ingestions.find(ing => ing.ingestion_id === file.ingestionId);
        if (dbRecord) {
          let processingSteps = [];
          try {
            processingSteps = dbRecord.processing_steps ? JSON.parse(dbRecord.processing_steps) : [];
          } catch (e) {
            console.warn('Failed to parse processing steps:', e);
            processingSteps = [
              { step: 'upload', status: 'completed' },
              { step: 'validation', status: 'completed' },
              { step: 'ocr', status: dbRecord.status === 'completed' ? 'completed' : 'processing' },
              { step: 'classification', status: dbRecord.status === 'completed' ? 'completed' : 'pending' },
              { step: 'extraction', status: dbRecord.status === 'completed' ? 'completed' : 'pending' }
            ];
          }
          
          return {
            ...file,
            status: dbRecord.status === 'completed' ? 'completed' : dbRecord.status === 'error' ? 'error' : 'processing',
            processingSteps: processingSteps,
            results: dbRecord.extracted_text ? { extractedText: dbRecord.extracted_text } : file.results
          };
        }
        return file;
      }));
    }
  }, [ingestions]);

  // Setup database tables on component mount
  const { mutate: setupDatabase } = useMutation({
    mutationFn: () => apiRequest('/api/forms/setup-database', { method: 'POST' }),
    onSuccess: () => {
      console.log('Database tables ready');
    },
    onError: (error) => {
      console.warn('Database setup issue:', error);
    }
  });

  // Initialize database on load
  useState(() => {
    setupDatabase();
  });

  const processFile = useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/forms/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      setUploadedFiles(prev => prev.map(file => 
        file.file.name === variables.file.name 
          ? { 
              ...file, 
              status: 'processing', 
              ingestionId: data.ingestion_id,
              processingSteps: data.processing_steps || []
            }
          : file
      ));
      
      toast({
        title: "File Processing Started",
        description: `Processing ${variables.file.name} with ID: ${data.ingestion_id}`,
      });
    },
    onError: (error, variables) => {
      setUploadedFiles(prev => prev.map(file => 
        file.file.name === variables.file.name 
          ? { ...file, status: 'error', error: error.message }
          : file
      ));
      
      toast({
        title: "Processing Failed",
        description: `Failed to process ${variables.file.name}`,
        variant: "destructive",
      });
    }
  });

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not supported. Please upload PDF, PNG, JPEG, or TXT files.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 50MB limit.`,
          variant: "destructive",
        });
        return;
      }

      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileType = getFileType(file);
      
      const newFile: UploadedFile = {
        id: fileId,
        file,
        type: fileType,
        status: 'uploading',
        progress: 0,
        processingSteps: [
          { step: 'upload', status: 'processing' }
        ]
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Simulate upload progress
      let progress = 0;
      const uploadInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(uploadInterval);
          
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  progress: 100, 
                  processingSteps: [
                    { step: 'upload', status: 'completed' },
                    { step: 'validation', status: 'processing' }
                  ]
                }
              : f
          ));

          // Start server-side processing
          processFile.mutate({
            file: file,
            fileType: fileType
          });
        } else {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ));
        }
      }, 500);
    });
  };

  const getFileType = (file: File): 'pdf' | 'image' | 'text' => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'text/plain') return 'text';
    return 'pdf'; // default
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-6 w-6 text-red-500" />;
      case 'image': return <Image className="h-6 w-6 text-blue-500" />;
      case 'text': return <File className="h-6 w-6 text-green-500" />;
      default: return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">I am tired - Forms Recognition</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload and process forms using Azure Document Intelligence
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Supports: PDF, PNG, JPEG, TXT
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="processing">Processing Status</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Files</span>
              </CardTitle>
              <CardDescription>
                Drag and drop files or click to browse. Supports PDF, PNG, JPEG, and TXT files up to 50MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 dark:text-blue-400">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop files here, or click to select files
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF for forms, PNG/JPEG for scanned documents, TXT for text analysis
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  {uploadedFiles.length} file(s) uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFiles.map((uploadedFile) => (
                    <div key={uploadedFile.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {getFileIcon(uploadedFile.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{uploadedFile.file.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              uploadedFile.status === 'completed' ? 'default' :
                              uploadedFile.status === 'error' ? 'destructive' :
                              'secondary'
                            }>
                              {uploadedFile.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uploadedFile.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type.toUpperCase()}
                        </p>
                        {uploadedFile.status === 'uploading' && (
                          <Progress value={uploadedFile.progress} className="mt-2" />
                        )}
                        {uploadedFile.ingestionId && (
                          <p className="text-xs text-gray-400 mt-1">ID: {uploadedFile.ingestionId}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Pipeline</CardTitle>
              <CardDescription>
                Real-time status of document processing steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedFiles.filter(f => f.processingSteps.length > 0).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files being processed. Upload files to see processing status.
                </div>
              ) : (
                <div className="space-y-6">
                  {uploadedFiles
                    .filter(f => f.processingSteps.length > 0)
                    .map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          {getFileIcon(file.type)}
                          <h4 className="font-medium">{file.file.name}</h4>
                          {file.ingestionId && (
                            <Badge variant="outline" className="text-xs">
                              {file.ingestionId}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          {file.processingSteps.map((step, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              {getStepIcon(step.status)}
                              <span className="flex-1 capitalize">{step.step.replace('_', ' ')}</span>
                              <Badge variant="outline" className="text-xs">
                                {step.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {file.error && (
                          <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{file.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
              <CardDescription>
                Extracted text, forms, and field data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Processing results will appear here after Azure Document Intelligence completes analysis.
                <br />
                <span className="text-sm">Features: OCR text extraction, form classification, field detection</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Eye, Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface OCRResult {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  processingTime: number;
  created_at: string;
  error?: string;
}

export default function OCRAgent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<OCRResult | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch OCR results
  const { data: ocrResults, isLoading } = useQuery<OCRResult[]>({
    queryKey: ["/api/ocr-results"],
    retry: false,
  });

  // Upload and process file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/ocr/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ocr-results"] });
      setSelectedFile(null);
      setSelectedResult(result);
      toast({
        title: "Upload Successful",
        description: "Document uploaded and OCR processing started",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload and process document",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF or image file (JPEG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">OCR Agent Test Drive</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upload documents and extract text using advanced OCR technology
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPEG, PNG, GIF up to 10MB
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadMutation.isPending ? "Processing..." : "Process"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Extracted Text Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedResult.originalName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedResult.processingStatus)}
                      <Badge variant={selectedResult.processingStatus === 'completed' ? 'default' : 'secondary'}>
                        {selectedResult.processingStatus}
                      </Badge>
                      {selectedResult.confidence > 0 && (
                        <Badge variant="outline">
                          {Math.round(selectedResult.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Textarea
                  value={selectedResult.extractedText || "Processing..."}
                  readOnly
                  className="min-h-[200px] resize-none"
                  placeholder={selectedResult.processingStatus === 'processing' ? "OCR processing in progress..." : "No text extracted"}
                />
                
                {selectedResult.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-700 dark:text-red-400 text-sm">{selectedResult.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload a document to see extracted text here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : ocrResults && ocrResults.length > 0 ? (
            <div className="space-y-4">
              {ocrResults.map((result) => (
                <div
                  key={result.id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{result.originalName}</p>
                        {getStatusIcon(result.processingStatus)}
                        <Badge variant={result.processingStatus === 'completed' ? 'default' : 'secondary'}>
                          {result.processingStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(result.fileSize)}</span>
                        <span>{new Date(result.created_at).toLocaleString()}</span>
                        {result.processingTime > 0 && (
                          <span>{result.processingTime}ms</span>
                        )}
                        {result.confidence > 0 && (
                          <span>{Math.round(result.confidence * 100)}% confidence</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {result.extractedText && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <p className="line-clamp-2">
                        {result.extractedText.substring(0, 150)}
                        {result.extractedText.length > 150 && "..."}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents processed yet</p>
              <p className="text-sm mt-1">Upload your first document to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
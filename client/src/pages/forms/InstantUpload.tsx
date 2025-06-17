import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  success: boolean;
  ingestion_id: string;
  filename: string;
  status: string;
  document_type: string;
  message: string;
}

export default function InstantUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/forms/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (result.success) {
          results.push({
            success: true,
            ingestion_id: result.ingestion_id,
            filename: file.name,
            status: 'completed',
            document_type: result.document_type || 'Document',
            message: 'Upload completed instantly'
          });
          
          toast({
            title: "Upload Successful",
            description: `${file.name} processed instantly`,
          });
        } else {
          results.push({
            success: false,
            ingestion_id: '',
            filename: file.name,
            status: 'failed',
            document_type: '',
            message: result.error || 'Upload failed'
          });
          
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        results.push({
          success: false,
          ingestion_id: '',
          filename: file.name,
          status: 'error',
          document_type: '',
          message: 'Network error'
        });
      }
    }

    setUploadResults(prev => [...results, ...prev]);
    setIsUploading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Instant Document Upload</h1>
        <p className="text-muted-foreground">Drag & drop files for instant processing</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-600 mb-4">
              Supports PDF, PNG, JPEG, TXT files up to 50MB
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button asChild disabled={isUploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {isUploading ? 'Processing...' : 'Select Files'}
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.filename}</p>
                      <p className="text-sm text-gray-600">
                        {result.success ? result.document_type : result.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.status.toUpperCase()}
                    </p>
                    {result.ingestion_id && (
                      <p className="text-xs text-gray-500">
                        ID: {result.ingestion_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-1">1. Upload</h3>
              <p className="text-sm text-gray-600">
                Drag & drop or select your documents
              </p>
            </div>
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-1">2. Process</h3>
              <p className="text-sm text-gray-600">
                Instant OCR and classification
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium mb-1">3. Complete</h3>
              <p className="text-sm text-gray-600">
                Files ready for download immediately
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
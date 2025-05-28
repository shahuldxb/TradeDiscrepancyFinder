import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Image, AlertCircle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadFormProps {
  onFileUpload: (file: File, documentType: string) => void;
  isUploading: boolean;
}

interface UploadingFile {
  file: File;
  documentType: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  id: string;
}

const documentTypes = [
  { value: "mt700", label: "MT700 - Issue of Documentary Credit", required: true },
  { value: "commercial_invoice", label: "Commercial Invoice", required: true },
  { value: "bill_of_lading", label: "Bill of Lading", required: false },
  { value: "insurance_certificate", label: "Insurance Certificate", required: false },
  { value: "certificate_of_origin", label: "Certificate of Origin", required: false },
  { value: "packing_list", label: "Packing List", required: false },
];

export default function DocumentUploadForm({ onFileUpload, isUploading }: DocumentUploadFormProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    if (!selectedDocumentType) {
      toast({
        title: "Document type required",
        description: "Please select a document type before uploading files.",
        variant: "destructive",
      });
      return;
    }

    files.forEach((file) => {
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "text/plain"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB size limit.`,
          variant: "destructive",
        });
        return;
      }

      // Add to uploading files
      const uploadingFile: UploadingFile = {
        file,
        documentType: selectedDocumentType,
        progress: 0,
        status: 'uploading',
        id: Math.random().toString(36).substr(2, 9),
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);

      // Simulate upload progress and call the upload function
      simulateUpload(uploadingFile);
      onFileUpload(file, selectedDocumentType);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const simulateUpload = (uploadingFile: UploadingFile) => {
    const interval = setInterval(() => {
      setUploadingFiles(prev => prev.map(f => {
        if (f.id === uploadingFile.id) {
          const newProgress = Math.min(f.progress + 20, 100);
          return {
            ...f,
            progress: newProgress,
            status: newProgress === 100 ? 'success' : 'uploading'
          };
        }
        return f;
      }));
    }, 500);

    // Clear interval after upload completes
    setTimeout(() => {
      clearInterval(interval);
    }, 3000);
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Document Type
        </label>
        <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select document type..." />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{type.label}</span>
                  {type.required && (
                    <span className="ml-2 text-xs text-red-600">Required</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragActive ? "drag-over" : ""} ${
          !selectedDocumentType ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => selectedDocumentType && fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {dragActive ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-muted-foreground">or click to browse</p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports PDF, JPEG, PNG, TXT (Max 10MB per file)
            </p>
          </div>
          {selectedDocumentType && (
            <Button 
              type="button"
              className="banking-button-primary"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.txt"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Upload Progress</h4>
          {uploadingFiles.map((uploadingFile) => (
            <Card key={uploadingFile.id} className="banking-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(uploadingFile.file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {documentTypes.find(t => t.value === uploadingFile.documentType)?.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-24">
                      <Progress value={uploadingFile.progress} className="h-2" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(uploadingFile.status)}
                      <span className="text-xs text-muted-foreground">
                        {uploadingFile.progress}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">Upload Guidelines</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Ensure documents are clearly legible and properly oriented</li>
          <li>• MT messages should be uploaded as plain text files (.txt)</li>
          <li>• Use descriptive file names for easier identification</li>
          <li>• Required documents: MT700 and Commercial Invoice</li>
          <li>• Maximum file size: 10MB per document</li>
        </ul>
      </div>
    </div>
  );
}

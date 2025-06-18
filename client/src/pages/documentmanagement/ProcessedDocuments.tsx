import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, Calendar, Hash, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProcessedDocument {
  id: number;
  batchName: string;
  fileName: string;
  processingStatus: string;
  characterCount: string;
  extractedTextPreview: string;
  createdAt: string;
}

interface ExtractedTextResponse {
  extractedText: string;
  characterCount: number;
  fileName: string;
}

export default function ProcessedDocuments() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  const { data: documents = [], isLoading } = useQuery<ProcessedDocument[]>({
    queryKey: ['/api/document-management/processed-documents'],
    refetchInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  const { data: extractedTextData, isLoading: isLoadingText } = useQuery({
    queryKey: ['/api/document-management/extracted-text', selectedDocumentId],
    enabled: !!selectedDocumentId,
    queryFn: async () => {
      const response = await fetch(`/api/document-management/extracted-text/${selectedDocumentId}`);
      if (!response.ok) throw new Error('Failed to fetch extracted text');
      return response.json() as Promise<ExtractedTextResponse>;
    }
  });

  const handleDownloadText = async (instrumentId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/document-management/download-text/${instrumentId}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, '')}_extracted.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'ocr processing': return 'secondary';
      case 'starting ocr': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Processed Documents</h2>
          <p className="text-muted-foreground">
            View and download extracted text from uploaded documents
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No documents processed yet</h3>
            <p className="text-muted-foreground text-center mt-2">
              Upload documents through the "Upload & Ingestion" tab to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc: ProcessedDocument) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{doc.fileName}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {doc.characterCount} characters
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(doc.processingStatus)}>
                    <Clock className="h-3 w-3 mr-1" />
                    {doc.processingStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm text-muted-foreground mb-1">Extracted Text Preview:</p>
                    <p className="text-sm font-mono leading-relaxed">
                      {doc.extractedTextPreview}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDocumentId(doc.id)}
                          disabled={doc.processingStatus !== 'Completed'}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Text
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Extracted Text - {doc.fileName}</DialogTitle>
                          <DialogDescription>
                            Full text content extracted from the document
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] mt-4">
                          {isLoadingText ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-md p-4">
                              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                                {extractedTextData?.extractedText || 'No text data available'}
                              </pre>
                            </div>
                          )}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadText(doc.id, doc.fileName)}
                      disabled={doc.processingStatus !== 'Completed'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download TXT
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
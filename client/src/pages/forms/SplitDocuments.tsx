import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, FileText, Calendar, Hash, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SplitDocument {
  ingestion_id: string;
  original_filename: string;
  document_type: string;
  status: string;
  created_date: string;
  file_size: string;
  extracted_text: string;
  extracted_data: {
    confidence: number;
    pages: string;
    form_type: string;
    parent_document: string;
    split_from_multipage: boolean;
  };
  pages: string;
  confidence: number;
  parent_document: string;
}

interface SplitDocumentsResponse {
  success: boolean;
  split_documents: SplitDocument[];
  parent_document: {
    ingestion_id: string;
    filename: string;
    size: string;
  };
  total_split: number;
}

export default function SplitDocuments() {
  const { data: splitData, isLoading, error } = useQuery<SplitDocumentsResponse>({
    queryKey: ["/api/forms/split-documents"],
    refetchInterval: 5000,
  });

  const handleDownload = async (document: SplitDocument, type: 'pdf' | 'txt') => {
    try {
      const response = await fetch(`/api/forms/download-split/${document.ingestion_id}?type=${type}`, {
        headers: {
          'Accept': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${type.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${document.original_filename.replace('.pdf', '')}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `${type.toUpperCase()} file download initiated`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${type.toUpperCase()} file`,
        variant: "destructive",
      });
    }
  };

  const handleViewText = (document: SplitDocument) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${document.original_filename} - Extracted Text</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${document.original_filename}</h1>
              <p><strong>Document Type:</strong> ${document.document_type}</p>
              <p><strong>Pages:</strong> ${document.pages}</p>
              <p><strong>Confidence:</strong> ${(document.confidence * 100).toFixed(1)}%</p>
            </div>
            <div class="content">${document.extracted_text}</div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (confidence >= 0.8) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'processing':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 'error':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Split PDF & Text</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Split PDF & Text</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading split documents: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!splitData?.split_documents?.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Split PDF & Text</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No split documents found. Upload a multi-page PDF to see individual forms here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Split PDF & Text</h1>
          <p className="text-muted-foreground">Individual forms from multi-page documents</p>
        </div>
        {splitData.parent_document && (
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Parent Document</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 text-sm">
                <p><strong>File:</strong> {splitData.parent_document.filename}</p>
                <p><strong>Size:</strong> {splitData.parent_document.size}</p>
                <p><strong>Split into:</strong> {splitData.total_split} forms</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6">
        {splitData.split_documents.map((document) => (
          <Card key={document.ingestion_id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{document.original_filename}</CardTitle>
                  <CardDescription>{document.document_type}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(document.status)}>
                    {document.status}
                  </Badge>
                  <Badge className={getConfidenceColor(document.confidence)}>
                    {(document.confidence * 100).toFixed(1)}% confidence
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Pages: {document.pages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {new Date(document.created_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span>Size: {(parseInt(document.file_size) / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Text Preview</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {document.extracted_text.substring(0, 200)}...
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleViewText(document)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Full Text
                </Button>
                <Button
                  onClick={() => handleDownload(document, 'pdf')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleDownload(document, 'txt')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download TXT
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Eye, 
  Scissors,
  ChevronRight,
  Calendar,
  FileImage,
  BarChart3
} from "lucide-react";

interface SplitDocument {
  ingestion_id: string;
  original_filename: string;
  document_type: string;
  status: string;
  created_date: string;
  file_size: number;
  extracted_text: string;
  extracted_data: any;
  parent_document?: string;
  pages?: string;
  confidence?: number;
}

export default function SplitDocuments() {
  const { data: splitDocs, isLoading } = useQuery({
    queryKey: ['/api/forms/split-documents'],
    refetchInterval: 5000,
  });

  const executeMultiPageProcessing = async () => {
    try {
      const response = await fetch('/api/forms/execute-multipage-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        // Refresh the data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error executing processing:', error);
    }
  };

  const downloadFile = async (ingestionId: string, type: 'pdf' | 'txt') => {
    try {
      const response = await fetch(`/api/forms/download/${ingestionId}/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ingestionId}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const viewText = async (ingestionId: string) => {
    try {
      const response = await fetch(`/api/forms/view-text/${ingestionId}`);
      const data = await response.json();
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Extracted Text - ${ingestionId}</title></head>
            <body style="font-family: monospace; padding: 20px; white-space: pre-wrap;">
              <h2>Extracted Text</h2>
              <hr>
              ${data.extracted_text || 'No text extracted'}
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('View error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const splitDocuments = splitDocs?.split_documents || [];
  const parentDocument = splitDocs?.parent_document;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="h-8 w-8 text-blue-600" />
            Split PDF & Text Documents
          </h1>
          <p className="text-gray-600 mt-2">
            Individual form types extracted from multi-page documents
          </p>
        </div>
        
        {splitDocuments.length === 0 && (
          <Button onClick={executeMultiPageProcessing} className="bg-blue-600 hover:bg-blue-700">
            <Scissors className="h-4 w-4 mr-2" />
            Process Multi-Page LC Document
          </Button>
        )}
      </div>

      {/* Parent Document Info */}
      {parentDocument && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Original Multi-Page Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Filename</p>
                <p className="font-medium">{parentDocument.filename}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Size</p>
                <p className="font-medium">{parentDocument.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Split Into</p>
                <p className="font-medium">{splitDocuments.length} forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Split Documents */}
      {splitDocuments.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Split Form Documents</h2>
            <Badge variant="outline">{splitDocuments.length} documents</Badge>
          </div>
          
          <div className="grid gap-4">
            {splitDocuments.map((doc: SplitDocument, index: number) => (
              <Card key={doc.ingestion_id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        {doc.document_type}
                        {doc.pages && (
                          <Badge variant="outline" className="text-xs">
                            Pages {doc.pages}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        ID: {doc.ingestion_id}
                        {doc.confidence && (
                          <span className="ml-2">• Confidence: {(doc.confidence * 100).toFixed(1)}%</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {doc.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="text">Extracted Text</TabsTrigger>
                      <TabsTrigger value="actions">Download</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">File Size</p>
                          <p className="font-medium">{(doc.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-medium">
                            {new Date(doc.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Text Length</p>
                          <p className="font-medium">{doc.extracted_text?.length || 0} chars</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Form Type</p>
                          <p className="font-medium">{doc.document_type}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="text" className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Extracted Text Preview</h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => viewText(doc.ingestion_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Full View
                          </Button>
                        </div>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {doc.extracted_text?.substring(0, 300)}
                          {doc.extracted_text?.length > 300 && '...'}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="actions" className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          onClick={() => downloadFile(doc.ingestion_id, 'pdf')}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => downloadFile(doc.ingestion_id, 'txt')}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Text
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => viewText(doc.ingestion_id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Text
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Split Documents</h3>
            <p className="text-gray-600 mb-4">
              Process your multi-page LC document to split it into individual form types
            </p>
            <Button onClick={executeMultiPageProcessing} className="bg-blue-600 hover:bg-blue-700">
              <Scissors className="h-4 w-4 mr-2" />
              Start Processing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
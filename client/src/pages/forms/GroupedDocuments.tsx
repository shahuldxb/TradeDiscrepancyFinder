import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  BarChart3
} from "lucide-react";

interface DocumentGroup {
  formInfo: {
    form_id: string;
    form_name: string;
    form_category: string;
    approval_status: string;
    is_active: boolean;
  };
  documents: Array<{
    ingestion_id: string;
    original_filename: string;
    document_type: string;
    status: string;
    created_date: string;
    file_size: number;
    text_length: number;
    has_extracted_text: boolean;
  }>;
  count: number;
  totalTextLength: number;
  statusBreakdown: {
    completed: number;
    processing: number;
    error: number;
  };
}

interface GroupedDocumentsResponse {
  success: boolean;
  totalDocuments: number;
  totalGroups: number;
  groupedDocuments: Record<string, DocumentGroup>;
  summary: {
    approvedForms: number;
    documentsGrouped: number;
    formsWithDocuments: number;
  };
}

export default function GroupedDocuments() {
  const { data: groupedData, isLoading, error } = useQuery<GroupedDocumentsResponse>({
    queryKey: ['/api/forms/grouped-documents'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !groupedData?.success) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Grouped Documents
            </CardTitle>
            <CardDescription>
              Failed to load document groups. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { groupedDocuments, summary, totalDocuments, totalGroups } = groupedData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents by Form Type</h1>
          <p className="text-gray-600 mt-2">
            Documents organized by their classified form types based on content analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {totalDocuments} Total Documents
          </Badge>
          <Badge variant="outline" className="text-sm">
            {totalGroups} Form Types
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.documentsGrouped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approvedForms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Forms with Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.formsWithDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Text Extracted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(groupedDocuments).reduce((sum, group) => sum + group.totalTextLength, 0).toLocaleString()} chars
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Groups */}
      <div className="space-y-6">
        {Object.entries(groupedDocuments).map(([formId, group]) => (
          <Card key={formId} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    {group.formInfo.form_name}
                    <Badge variant="outline">{group.count} documents</Badge>
                  </CardTitle>
                  <CardDescription>
                    {group.formInfo.form_category} • {group.formInfo.approval_status}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={group.formInfo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {group.formInfo.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pdf" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf">PDF Files ({group.count})</TabsTrigger>
                  <TabsTrigger value="txt">Text Content ({group.count})</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>
                
                {/* PDF Files Tab */}
                <TabsContent value="pdf" className="space-y-3 mt-4">
                  {group.documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No PDF documents found for this form type
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {group.documents.map((doc) => (
                        <Card key={doc.ingestion_id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-red-600" />
                                  <span className="font-medium">{doc.original_filename}</span>
                                  <Badge className={getStatusColor(doc.status)}>
                                    {doc.status}
                                  </Badge>
                                  <Badge variant="outline" className="bg-red-50 text-red-700">
                                    PDF
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Type: {doc.document_type || 'Not classified'}</div>
                                  <div>Created: {formatDate(doc.created_date)}</div>
                                  <div className="flex gap-4">
                                    <span>Size: {formatFileSize(doc.file_size)}</span>
                                    <span>Pages: {doc.original_filename.includes('multi') ? 'Multiple' : '1'}</span>
                                    <span className="text-blue-600">Original Document</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(doc.status)}
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(`/api/forms/download/pdf/${doc.ingestion_id}`, '_blank')}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `/api/forms/download/pdf/${doc.ingestion_id}`;
                                      link.download = doc.original_filename;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Text Content Tab */}
                <TabsContent value="txt" className="space-y-3 mt-4">
                  {group.documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No text content found for this form type
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {group.documents.map((doc) => (
                        <Card key={`txt-${doc.ingestion_id}`} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">{doc.original_filename.replace('.pdf', '.txt')}</span>
                                  <Badge className={getStatusColor(doc.status)}>
                                    {doc.status}
                                  </Badge>
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    TXT
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Extracted from: {doc.document_type || 'Not classified'}</div>
                                  <div>Processed: {formatDate(doc.created_date)}</div>
                                  <div className="flex gap-4">
                                    <span>Text Length: {doc.text_length.toLocaleString()} characters</span>
                                    <span className={doc.has_extracted_text ? 'text-green-600' : 'text-red-600'}>
                                      {doc.has_extracted_text ? 'OCR Completed' : 'No OCR data'}
                                    </span>
                                  </div>
                                  {doc.text_length > 0 && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono max-h-20 overflow-y-auto">
                                      Preview: {doc.has_extracted_text ? 
                                        'Text extraction completed successfully...' : 
                                        'No text preview available'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(doc.status)}
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(`/api/forms/download/txt/${doc.ingestion_id}`, '_blank')}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `/api/forms/download/txt/${doc.ingestion_id}`;
                                      link.download = doc.original_filename.replace('.pdf', '.txt');
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="stats" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Completed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">{group.statusBreakdown.completed}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Processing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">{group.statusBreakdown.processing}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Errors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">{group.statusBreakdown.error || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                          Total Text
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">{group.totalTextLength.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
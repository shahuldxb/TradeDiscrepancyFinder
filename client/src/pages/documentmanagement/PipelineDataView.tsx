import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Database, Settings } from 'lucide-react';

interface PipelinePdf {
  id: number;
  fileName: string;
  blobStoragePath: string;
  pageRange: string;
  classification: string;
  confidenceScore: number;
  metadata: string;
  createdDate: string;
}

interface PipelineText {
  id: number;
  textContent: string;
  fileName: string;
  classification: string;
  confidenceScore: number;
  textLength: number;
  pageRange: string;
  createdDate: string;
}

interface PipelineField {
  id: number;
  fieldName: string;
  fieldValue: string;
  confidenceScore: number;
  positionCoordinates: string;
  dataType: string;
  classification: string;
  pageRange: string;
  createdDate: string;
}

interface PipelineDataViewProps {
  ingestionId: string;
}

export default function PipelineDataView({ ingestionId }: PipelineDataViewProps) {
  const [activeTab, setActiveTab] = useState('pdfs');
  const [selectedId, setSelectedId] = useState('');

  // Fetch document history for dropdown
  const { data: historyData } = useQuery({
    queryKey: ['/api/form-detection/history'],
  });

  const documents = historyData?.documents || [];

  // Auto-select the latest document if no ID provided
  useEffect(() => {
    if (!ingestionId || ingestionId === '') {
      if (documents.length > 0) {
        setSelectedId(documents[0].id);
      }
    } else {
      setSelectedId(ingestionId);
    }
  }, [ingestionId, documents]);

  const { data: pdfData, isLoading: pdfsLoading } = useQuery({
    queryKey: [`/api/pipeline/pdfs/${selectedId}`],
    enabled: !!selectedId
  });

  const { data: textData, isLoading: textsLoading } = useQuery({
    queryKey: [`/api/pipeline/texts/${selectedId}`],
    enabled: !!selectedId
  });

  const { data: fieldData, isLoading: fieldsLoading } = useQuery({
    queryKey: [`/api/pipeline/fields/${selectedId}`],
    enabled: !!selectedId
  });

  const pdfs = pdfData?.pdfs || [];
  const texts = textData?.texts || [];
  const fields = fieldData?.fields || [];

  if (!selectedId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            3-Step Pipeline Data
          </CardTitle>
          <CardDescription>
            Loading pipeline data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading latest document pipeline data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          3-Step Pipeline Data
        </CardTitle>
        <CardDescription>
          Document processing results for selected document
        </CardDescription>
        
        {/* Document Selector */}
        <div className="pt-4">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a document to view pipeline data" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((doc: any) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.filename} - {doc.documentType} ({new Date(doc.uploadDate).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pdfs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Split PDFs ({pdfs.length})
            </TabsTrigger>
            <TabsTrigger value="texts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              OCR Texts ({texts.length})
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Extracted Fields ({fields.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdfs" className="mt-4">
            <ScrollArea className="h-96">
              {pdfsLoading ? (
                <div className="text-center py-8">Loading PDF data...</div>
              ) : pdfs.length > 0 ? (
                <div className="space-y-4">
                  {pdfs.map((pdf: PipelinePdf, index: number) => (
                    <Card key={pdf.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{pdf.fileName}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{pdf.classification}</Badge>
                            <Badge variant="outline">{pdf.confidenceScore}% confidence</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Page Range:</span>
                              <div className="text-gray-600">{pdf.pageRange}</div>
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>
                              <div className="text-gray-600">{new Date(pdf.createdDate).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded border">
                            <span className="font-medium text-sm">Storage Path:</span>
                            <div className="mt-1 text-sm font-mono text-gray-600">{pdf.blobStoragePath}</div>
                          </div>
                          {pdf.metadata && (
                            <div className="bg-blue-50 p-3 rounded border">
                              <span className="font-medium text-sm">Metadata:</span>
                              <div className="mt-1 text-sm">{pdf.metadata}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No PDF records found for this document
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="texts" className="mt-4">
            <ScrollArea className="h-96">
              {textsLoading ? (
                <div className="text-center py-8">Loading text data...</div>
              ) : texts.length > 0 ? (
                <div className="space-y-4">
                  {texts.map((text: PipelineText, index: number) => (
                    <Card key={text.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{text.fileName}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{text.classification}</Badge>
                            <Badge variant="outline">{text.confidenceScore}% confidence</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Text Length:</span>
                              <div className="text-gray-600">{text.textLength} chars</div>
                            </div>
                            <div>
                              <span className="font-medium">Page Range:</span>
                              <div className="text-gray-600">{text.pageRange}</div>
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>
                              <div className="text-gray-600">{new Date(text.createdDate).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded border">
                            <span className="font-medium text-sm">Extracted Text Content:</span>
                            <div className="mt-1 text-sm max-h-32 overflow-y-auto">
                              {text.textContent ? text.textContent.substring(0, 500) : 'No content available'}
                              {text.textContent && text.textContent.length > 500 && '...'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No text records found for this document
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="fields" className="mt-4">
            <ScrollArea className="h-96">
              {fieldsLoading ? (
                <div className="text-center py-8">Loading fields...</div>
              ) : fields.length > 0 ? (
                <div className="space-y-4">
                  {fields.map((field: PipelineField, index: number) => (
                    <Card key={field.id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{field.fieldName}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{field.dataType}</Badge>
                            <Badge variant="outline">{field.classification}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="bg-blue-50 p-3 rounded border">
                            <span className="font-medium text-sm">Field Value:</span>
                            <div className="mt-1 text-sm">{field.fieldValue}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Confidence:</span>
                              <div className="text-gray-600">{field.confidenceScore}%</div>
                            </div>
                            <div>
                              <span className="font-medium">Page Range:</span>
                              <div className="text-gray-600">{field.pageRange}</div>
                            </div>
                          </div>
                          {field.positionCoordinates && (
                            <div className="bg-gray-50 p-3 rounded border">
                              <span className="font-medium text-sm">Position:</span>
                              <div className="mt-1 text-sm font-mono">{field.positionCoordinates}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No extracted fields found for this document
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
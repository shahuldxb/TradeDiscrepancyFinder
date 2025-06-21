import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

  const { data: pdfData, isLoading: pdfsLoading } = useQuery({
    queryKey: [`/api/pipeline/pdfs/${ingestionId}`],
    enabled: !!ingestionId
  });

  const { data: textData, isLoading: textsLoading } = useQuery({
    queryKey: [`/api/pipeline/texts/${ingestionId}`],
    enabled: !!ingestionId
  });

  const { data: fieldData, isLoading: fieldsLoading } = useQuery({
    queryKey: [`/api/pipeline/fields/${ingestionId}`],
    enabled: !!ingestionId
  });

  const pdfs = pdfData?.pdfs || [];
  const texts = textData?.texts || [];
  const fields = fieldData?.fields || [];

  if (!ingestionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            3-Step Pipeline Data
          </CardTitle>
          <CardDescription>
            Select a document from the history to view pipeline processing results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No document selected
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
          Document processing results for ingestion ID: {ingestionId}
        </CardDescription>
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
                <div className="text-center py-8">Loading PDFs...</div>
              ) : pdfs.length > 0 ? (
                <div className="space-y-4">
                  {pdfs.map((pdf: PipelinePdf, index: number) => (
                    <Card key={pdf.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{pdf.fileName}</CardTitle>
                          <Badge variant="outline">{pdf.classification}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Page Range:</span> {pdf.pageRange}
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span> {(pdf.confidenceScore * 100).toFixed(1)}%
                          </div>
                          <div>
                            <span className="font-medium">Storage Path:</span> {pdf.blobStoragePath}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(pdf.createdDate).toLocaleString()}
                          </div>
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
                <div className="text-center py-8">Loading texts...</div>
              ) : texts.length > 0 ? (
                <div className="space-y-4">
                  {texts.map((text: PipelineText, index: number) => (
                    <Card key={text.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{text.fileName}</CardTitle>
                          <Badge variant="outline">{text.classification}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Text Length:</span> {text.textLength} characters
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span> {(text.confidenceScore * 100).toFixed(1)}%
                          </div>
                          <div>
                            <span className="font-medium">Page Range:</span> {text.pageRange}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(text.createdDate).toLocaleString()}
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div>
                          <span className="font-medium text-sm">Extracted Text:</span>
                          <ScrollArea className="h-24 mt-1">
                            <div className="text-xs bg-gray-50 p-2 rounded border font-mono whitespace-pre-wrap">
                              {text.textContent}
                            </div>
                          </ScrollArea>
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
                              <span className="font-medium">Confidence:</span> {(field.confidenceScore * 100).toFixed(1)}%
                            </div>
                            <div>
                              <span className="font-medium">Page Range:</span> {field.pageRange}
                            </div>
                            <div>
                              <span className="font-medium">Position:</span> {field.positionCoordinates || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(field.createdDate).toLocaleString()}
                            </div>
                          </div>
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
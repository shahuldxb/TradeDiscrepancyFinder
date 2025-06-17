import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Database, FileText, Image, Hash, Trash2, Download, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

export default function IngestionRecords() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch TF_ingestion records
  const { data: ingestionRecords, refetch: refetchIngestion } = useQuery({
    queryKey: ['/api/forms/records/ingestion'],
  });

  // Fetch TF_ingestion_Pdf records
  const { data: pdfRecords, refetch: refetchPdf } = useQuery({
    queryKey: ['/api/forms/records/pdf'],
  });

  // Fetch TF_ingestion_TXT records
  const { data: txtRecords, refetch: refetchTxt } = useQuery({
    queryKey: ['/api/forms/records/txt'],
  });

  // Fetch TF_ingestion_fields records
  const { data: fieldsRecords, refetch: refetchFields } = useQuery({
    queryKey: ['/api/forms/records/fields'],
  });

  const handleDownload = async (ingestionId: string, type: 'text' | 'pdf' | 'json') => {
    try {
      const response = await fetch(`/api/forms/download/${ingestionId}/${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ingestionId}_${type}.${type === 'json' ? 'json' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: `${type.toUpperCase()} file download initiated`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download file",
        variant: "destructive",
      });
    }
  };

  const handleView = async (ingestionId: string, type: 'text' | 'data') => {
    try {
      const endpoint = type === 'text' 
        ? `/api/forms/extracted-forms/${ingestionId}`
        : `/api/forms/processing-status/${ingestionId}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        // Create a modal or alert to show the content
        const content = type === 'text' 
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data, null, 2);
          
        // Open in new window for better viewing
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>View ${type.toUpperCase()} - ${ingestionId}</title></head>
              <body style="font-family: monospace; padding: 20px; background: #f5f5f5;">
                <h2>View ${type.toUpperCase()} - ${ingestionId}</h2>
                <pre style="background: white; padding: 15px; border-radius: 5px; overflow: auto;">${content}</pre>
              </body>
            </html>
          `);
        }
      }
    } catch (error) {
      toast({
        title: "View failed",
        description: "Unable to view data",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (table: string, id: string) => {
    try {
      const response = await fetch(`/api/forms/records/${table}/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Record deleted",
          description: "Record has been deleted successfully",
        });
        
        // Refetch the appropriate data
        switch (table) {
          case 'ingestion':
            refetchIngestion();
            break;
          case 'pdf':
            refetchPdf();
            break;
          case 'txt':
            refetchTxt();
            break;
          case 'fields':
            refetchFields();
            break;
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const filterRecords = (records: any[], searchTerm: string) => {
    if (!records || !searchTerm) return records || [];
    
    return records.filter(record =>
      Object.values(record).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      case 'uploaded': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ingestion Records</h1>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Tabs defaultValue="ingestion" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ingestion" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            TF_ingestion ({ingestionRecords?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            TF_ingestion_Pdf ({pdfRecords?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="txt" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            TF_ingestion_TXT ({txtRecords?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            TF_ingestion_fields ({fieldsRecords?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingestion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TF_ingestion - Main Ingestion Records</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Ingestion ID</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Forms Detected</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterRecords(ingestionRecords, searchTerm).map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.ingestion_id}</TableCell>
                        <TableCell>{record.original_filename}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.document_type || 'N/A'}</TableCell>
                        <TableCell>{record.file_size ? `${Math.round(record.file_size / 1024)} KB` : 'N/A'}</TableCell>
                        <TableCell>{record.total_forms_detected || 0}</TableCell>
                        <TableCell>{new Date(record.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(record.ingestion_id, 'data')}
                              title="View Processing Data"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(record.ingestion_id, 'text')}
                              title="Download Extracted Text"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete('ingestion', record.id)}
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TF_ingestion_Pdf - Individual PDF Records</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Ingestion ID</TableHead>
                      <TableHead>Form ID</TableHead>
                      <TableHead>Page Number</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterRecords(pdfRecords, searchTerm).map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.ingestion_id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.form_id}</TableCell>
                        <TableCell>{record.page_number}</TableCell>
                        <TableCell>{record.document_type || 'N/A'}</TableCell>
                        <TableCell>{record.form_classification || 'N/A'}</TableCell>
                        <TableCell>
                          {record.confidence_score ? `${record.confidence_score}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{new Date(record.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(record.ingestion_id, 'data')}
                              title="View PDF Processing Data"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(record.ingestion_id, 'pdf')}
                              title="Download PDF File"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete('pdf', record.id)}
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="txt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TF_ingestion_TXT - Text Content Records</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Ingestion ID</TableHead>
                      <TableHead>Form ID</TableHead>
                      <TableHead>Character Count</TableHead>
                      <TableHead>Word Count</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterRecords(txtRecords, searchTerm).map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.ingestion_id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.form_id}</TableCell>
                        <TableCell>{record.character_count || 0}</TableCell>
                        <TableCell>{record.word_count || 0}</TableCell>
                        <TableCell>{record.language || 'en'}</TableCell>
                        <TableCell>
                          {record.confidence ? `${record.confidence}%` : 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {record.content ? record.content.substring(0, 50) + '...' : 'No content'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(record.ingestion_id, 'text')}
                              title="View Extracted Text"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(record.ingestion_id, 'text')}
                              title="Download Text File"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete('txt', record.id)}
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TF_ingestion_fields - Extracted Field Records</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Ingestion ID</TableHead>
                      <TableHead>Form ID</TableHead>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Field Value</TableHead>
                      <TableHead>Field Type</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Extraction Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterRecords(fieldsRecords, searchTerm).map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.ingestion_id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.form_id}</TableCell>
                        <TableCell className="font-medium">{record.field_name}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {record.field_value || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{record.field_type || 'string'}</TableCell>
                        <TableCell>
                          {record.confidence ? `${record.confidence}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{record.extraction_method || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete('fields', record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
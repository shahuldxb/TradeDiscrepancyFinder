import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Eye,
  FileText,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface IngestionRecord {
  id?: number;
  ingestion_id: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: string;
  processing_steps: string;
  document_type?: string;
  extracted_text?: string;
  extracted_data?: string;
  created_date: string;
  updated_date: string;
  completion_date?: string;
}

interface PdfRecord {
  id?: number;
  ingestion_id: string;
  form_id: string;
  file_path: string;
  document_type: string;
  page_range: string;
  created_date: string;
}

interface TxtRecord {
  id?: number;
  ingestion_id: string;
  content: string;
  confidence?: number;
  language?: string;
  created_date: string;
}

interface FieldRecord {
  id?: number;
  ingestion_id: string;
  field_name: string;
  field_value: string;
  confidence_score: number;
  created_date: string;
}

export default function ComprehensiveCRUD() {
  const [activeTable, setActiveTable] = useState('ingestion');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch data for all tables
  const { data: ingestionData, isLoading: ingestionLoading } = useQuery({
    queryKey: ['/api/forms/records/ingestion'],
    refetchInterval: 5000,
  });

  const { data: pdfData, isLoading: pdfLoading } = useQuery({
    queryKey: ['/api/forms/records/pdf'],
    refetchInterval: 5000,
  });

  const { data: txtData, isLoading: txtLoading } = useQuery({
    queryKey: ['/api/forms/records/txt'],
    refetchInterval: 5000,
  });

  const { data: fieldsData, isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/forms/records/fields'],
    refetchInterval: 5000,
  });

  // Create mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: async (data: { table: string; record: any }) => {
      const response = await fetch(`/api/forms/crud/${data.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.record)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/records'] });
      toast({ title: 'Success', description: 'Record created successfully' });
      setIsDialogOpen(false);
      setEditingRecord(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { table: string; id: number; record: any }) => {
      const response = await fetch(`/api/forms/crud/${data.table}/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.record)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/records'] });
      toast({ title: 'Success', description: 'Record updated successfully' });
      setIsDialogOpen(false);
      setEditingRecord(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: { table: string; id: number }) => {
      const response = await fetch(`/api/forms/crud/${data.table}/${data.id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/records'] });
      toast({ title: 'Success', description: 'Record deleted successfully' });
    }
  });

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate({ table: activeTable, id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const record = Object.fromEntries(formData.entries());

    if (editingRecord?.id) {
      updateMutation.mutate({ 
        table: activeTable, 
        id: editingRecord.id, 
        record 
      });
    } else {
      createMutation.mutate({ 
        table: activeTable, 
        record 
      });
    }
  };

  const getTableData = () => {
    switch (activeTable) {
      case 'ingestion': return ingestionData || [];
      case 'pdf': return pdfData || [];
      case 'txt': return txtData || [];
      case 'fields': return fieldsData || [];
      default: return [];
    }
  };

  const getTableColumns = () => {
    switch (activeTable) {
      case 'ingestion':
        return ['ingestion_id', 'original_filename', 'file_type', 'status', 'document_type', 'created_date'];
      case 'pdf':
        return ['ingestion_id', 'form_id', 'document_type', 'page_range', 'created_date'];
      case 'txt':
        return ['ingestion_id', 'content', 'confidence', 'language', 'created_date'];
      case 'fields':
        return ['ingestion_id', 'field_name', 'field_value', 'confidence_score', 'created_date'];
      default:
        return [];
    }
  };

  const filteredData = getTableData().filter((record: any) =>
    Object.values(record).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderFormFields = () => {
    const fields = getTableColumns();
    return fields.map(field => (
      <div key={field} className="space-y-2">
        <Label htmlFor={field}>{field.replace(/_/g, ' ').toUpperCase()}</Label>
        <Input
          id={field}
          name={field}
          defaultValue={editingRecord?.[field] || ''}
          placeholder={`Enter ${field.replace(/_/g, ' ')}`}
          required={field === 'ingestion_id'}
        />
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          TF_Ingestion Database Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Database Tables CRUD Interface</span>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTable} onValueChange={setActiveTable} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ingestion">TF_ingestion ({ingestionData?.length || 0})</TabsTrigger>
              <TabsTrigger value="pdf">TF_ingestion_Pdf ({pdfData?.length || 0})</TabsTrigger>
              <TabsTrigger value="txt">TF_ingestion_TXT ({txtData?.length || 0})</TabsTrigger>
              <TabsTrigger value="fields">TF_ingestion_fields ({fieldsData?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="ingestion" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Main Ingestion Records</h3>
                <Badge variant="outline">{filteredData.length} records</Badge>
              </div>
              <ScrollArea className="h-96 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getTableColumns().map(col => (
                        <TableHead key={col}>{col.replace(/_/g, ' ').toUpperCase()}</TableHead>
                      ))}
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((record: any, index: number) => (
                      <TableRow key={record.id || index}>
                        {getTableColumns().map(col => (
                          <TableCell key={col}>
                            {col.includes('date') ? 
                              new Date(record[col]).toLocaleDateString() : 
                              col === 'status' ? 
                                <Badge variant={record[col] === 'completed' ? 'default' : 'secondary'}>
                                  {record[col]}
                                </Badge> :
                                String(record[col] || '').substring(0, 50)
                            }
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(record)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pdf" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">PDF Processing Records</h3>
                <Badge variant="outline">{filteredData.length} records</Badge>
              </div>
              <ScrollArea className="h-96 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getTableColumns().map(col => (
                        <TableHead key={col}>{col.replace(/_/g, ' ').toUpperCase()}</TableHead>
                      ))}
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((record: any, index: number) => (
                      <TableRow key={record.id || index}>
                        {getTableColumns().map(col => (
                          <TableCell key={col}>
                            {col.includes('date') ? 
                              new Date(record[col]).toLocaleDateString() : 
                              String(record[col] || '').substring(0, 30)
                            }
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(record)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="txt" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Text Processing Records</h3>
                <Badge variant="outline">{filteredData.length} records</Badge>
              </div>
              <ScrollArea className="h-96 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getTableColumns().map(col => (
                        <TableHead key={col}>{col.replace(/_/g, ' ').toUpperCase()}</TableHead>
                      ))}
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((record: any, index: number) => (
                      <TableRow key={record.id || index}>
                        {getTableColumns().map(col => (
                          <TableCell key={col}>
                            {col.includes('date') ? 
                              new Date(record[col]).toLocaleDateString() : 
                              col === 'content' ?
                                String(record[col] || '').substring(0, 100) + '...' :
                                String(record[col] || '')
                            }
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(record)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Field Extraction Records</h3>
                <Badge variant="outline">{filteredData.length} records</Badge>
              </div>
              <ScrollArea className="h-96 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getTableColumns().map(col => (
                        <TableHead key={col}>{col.replace(/_/g, ' ').toUpperCase()}</TableHead>
                      ))}
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((record: any, index: number) => (
                      <TableRow key={record.id || index}>
                        {getTableColumns().map(col => (
                          <TableCell key={col}>
                            {col.includes('date') ? 
                              new Date(record[col]).toLocaleDateString() : 
                              col === 'confidence_score' ?
                                <Badge variant="secondary">
                                  {(parseFloat(record[col] || 0) * 100).toFixed(1)}%
                                </Badge> :
                                String(record[col] || '').substring(0, 50)
                            }
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(record)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit' : 'Create'} {activeTable.toUpperCase()} Record
            </DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update the record details below.' : 'Fill in the details to create a new record.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderFormFields()}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRecord ? 'Update' : 'Create'} Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
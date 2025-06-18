import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Search, FileText, Calendar, Package } from "lucide-react";

interface LCDocument {
  field_name: string;
  field_value: string;
  batch_name: string;
  created_at: string;
}

interface LCStats {
  totalDocuments: number;
  totalBatches: number;
  documentTypes: number;
  latestProcessing: string;
}

export default function LCDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  // Fetch LC constituent documents
  const { data: lcDocuments = [], isLoading } = useQuery<LCDocument[]>({
    queryKey: ['/api/azure-data/execute-sql'],
    queryFn: async () => {
      const response = await fetch('/api/azure-data/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT f.field_name, f.field_value, i.batch_name, f.created_at 
            FROM ingestion_fields_new f 
            INNER JOIN instrument_ingestion_new i ON f.instrument_id = i.id 
            WHERE f.field_name LIKE 'Required_Document%' OR f.field_name IN ('Total_Required_Documents', 'LC_Document_Type') 
            ORDER BY f.created_at DESC
          `
        })
      });
      const result = await response.json();
      return result.data || [];
    }
  });

  // Calculate statistics
  const stats: LCStats = {
    totalDocuments: lcDocuments.filter(doc => doc.field_name.startsWith('Required_Document_')).length,
    totalBatches: new Set(lcDocuments.map(doc => doc.batch_name)).size,
    documentTypes: new Set(lcDocuments.filter(doc => doc.field_name.startsWith('Required_Document_')).map(doc => doc.field_value)).size,
    latestProcessing: lcDocuments.length > 0 ? new Date(lcDocuments[0].created_at).toLocaleDateString() : 'No data'
  };

  // Filter documents based on search and batch selection
  const filteredDocuments = lcDocuments.filter(doc => {
    const matchesSearch = doc.field_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.batch_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = !selectedBatch || doc.batch_name === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  // Get unique batches for filter dropdown
  const uniqueBatches = Array.from(new Set(lcDocuments.map(doc => doc.batch_name)));

  // Group documents by batch
  const documentsByBatch = lcDocuments.reduce((acc, doc) => {
    if (!acc[doc.batch_name]) {
      acc[doc.batch_name] = [];
    }
    acc[doc.batch_name].push(doc);
    return acc;
  }, {} as Record<string, LCDocument[]>);

  const processNewLC = async () => {
    try {
      const response = await fetch('/api/document-management/test-lc-processing', { 
        method: 'POST' 
      });
      const result = await response.json();
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error processing LC:', error);
    }
  };

  const downloadCSV = () => {
    window.open('/api/document-management/download-lc-documents', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading LC documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LC Constituent Documents
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View and manage individual documents identified within Letter of Credit (LC) documents. 
            Each LC contains multiple constituent documents required for trade finance compliance.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing Batches</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalBatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Search className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Document Types</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.documentTypes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latest Processing</p>
                  <p className="text-lg font-bold text-orange-600">{stats.latestProcessing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={processNewLC} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-5 w-5 mr-2" />
            Process New LC Document
          </Button>
          <Button onClick={downloadCSV} variant="outline" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Download All Data
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents View</TabsTrigger>
            <TabsTrigger value="batches">Batches View</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Individual Documents</CardTitle>
                <CardDescription>
                  All constituent documents extracted from LC processing
                </CardDescription>
                
                {/* Search and Filter Controls */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Documents</Label>
                    <Input
                      id="search"
                      placeholder="Search by document type, field name, or batch..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-filter">Filter by Batch</Label>
                    <select
                      id="batch-filter"
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">All Batches</option>
                      {uniqueBatches.map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredDocuments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Processing Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{doc.field_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{doc.field_value}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{doc.batch_name}</TableCell>
                          <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" onClick={downloadCSV}>
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedBatch ? 'No documents match your search criteria.' : 'No LC constituent documents have been processed yet.'}
                    </p>
                    {!searchTerm && !selectedBatch && (
                      <Button onClick={processNewLC}>
                        <Upload className="h-4 w-4 mr-2" />
                        Process First LC Document
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batches" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(documentsByBatch).map(([batchName, documents]) => (
                <Card key={batchName}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="font-mono text-lg">{batchName}</span>
                      <Badge variant="outline">
                        {documents.filter(doc => doc.field_name.startsWith('Required_Document_')).length} Documents
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Processed on {new Date(documents[0]?.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {documents
                        .filter(doc => doc.field_name.startsWith('Required_Document_'))
                        .map((doc, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-slate-50">
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                              {doc.field_name}
                            </div>
                            <div className="font-medium">{doc.field_value}</div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        View Batch Details
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Batch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
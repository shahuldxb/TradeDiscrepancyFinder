import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Database, Settings, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MasterDocument {
  id: number;
  document_code: string;
  form_name: string;
  is_active: boolean;
  created_at: string;
}

interface DocumentManagementStats {
  totalDocuments: number;
  activeDocuments: number;
  pendingDocuments: number;
  lastUpdated: string;
}

export default function DocumentManagementNew() {
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [stats, setStats] = useState<DocumentManagementStats>({
    totalDocuments: 0,
    activeDocuments: 0,
    pendingDocuments: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/document-management/masterdocuments');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data);
        
        // Calculate stats
        const activeCount = data.data.filter((doc: MasterDocument) => doc.is_active).length;
        const pendingCount = data.data.filter((doc: MasterDocument) => !doc.is_active).length;
        
        setStats({
          totalDocuments: data.count,
          activeDocuments: activeCount,
          pendingDocuments: pendingCount,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch document data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const insertSampleData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/document-management/insert-sample-data', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        });
        fetchDocuments(); // Refresh data
      } else {
        throw new Error(data.details || 'Failed to insert sample data');
      }
    } catch (error) {
      console.error('Error inserting sample data:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" />Active</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Management New</h1>
          <p className="text-muted-foreground mt-1">
            Manage master document definitions and document processing workflow
          </p>
        </div>
        <Button onClick={insertSampleData} disabled={loading} variant="outline">
          <Database className="w-4 h-4 mr-2" />
          Insert Sample Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeDocuments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Documents</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingDocuments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {formatDate(stats.lastUpdated)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Master Documents</TabsTrigger>
          <TabsTrigger value="upload">Instant Upload</TabsTrigger>
          <TabsTrigger value="split">Split Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Management Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    {documents.length > 0 
                      ? `Last document added: ${formatDate(documents[documents.length - 1]?.created_at)}`
                      : 'No recent activity'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">System Status</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Documents</CardTitle>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Manage document type definitions and configurations
                </p>
                <Button onClick={fetchDocuments} disabled={loading} size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Document Code</TableHead>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.id}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {doc.document_code || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{doc.form_name}</TableCell>
                        <TableCell>{getStatusBadge(doc.is_active)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Upload & Processing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ready for Step 2: Upload PDF (Single/Multi-scanned) via UI - awaiting UI specifications
              </p>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload Interface</h3>
                  <p className="text-sm text-muted-foreground">
                    UI implementation pending specifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Split Documents</CardTitle>
              <p className="text-sm text-muted-foreground">
                Split multi-page documents into individual forms
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Document Splitting</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload multi-page PDFs to automatically split into individual forms
                  </p>
                </div>
                <Button variant="outline">
                  Upload PDF to Split
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
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

interface ProcessingForm {
  name: string;
  status: string;
  progress: number;
  pages: number;
  type: string;
  currentStep?: string;
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
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
  const [batchName, setBatchName] = useState('');
  const [processingForms, setProcessingForms] = useState<ProcessingForm[]>([]);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: 'Upload', status: 'pending', progress: 0 },
    { name: 'Validate', status: 'pending', progress: 0 },
    { name: 'OCR', status: 'pending', progress: 0 },
    { name: 'Extract', status: 'pending', progress: 0 },
    { name: 'Split', status: 'pending', progress: 0 },
    { name: 'Store', status: 'pending', progress: 0 }
  ]);
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
          {/* Upload & Ingestion Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Ingestion</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload PDF, create batch name, slice & stitch forms with progress tracking
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Upload PDF */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Step 1: Upload PDF</h4>
                  <Badge variant="outline">Single/Multi-scanned</Badge>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-medium">Upload PDF Documents</h3>
                    <p className="text-sm text-muted-foreground">
                      Support for single and multi-page scanned documents
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    id="pdf-upload"
                    onChange={(e) => handlePdfUpload(e.target.files)}
                  />
                  <label htmlFor="pdf-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Choose PDF Files
                    </Button>
                  </label>
                </div>
              </div>

              {/* Step 2: Create Batch Name */}
              <div className="space-y-4">
                <h4 className="font-semibold">Step 2: Create Batch Name</h4>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter batch name (e.g., LC_BATCH_001)"
                    value={batchName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBatchName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={generateBatchName} variant="outline">
                    Generate
                  </Button>
                </div>
              </div>

              {/* Processing Steps Progress */}
              {processingForms.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Processing Pipeline</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {processingSteps.map((step, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{step.name}</span>
                            <Badge 
                              variant={
                                step.status === 'completed' ? 'default' : 
                                step.status === 'processing' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs"
                            >
                              {step.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{step.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  step.status === 'completed' ? 'bg-green-600' :
                                  step.status === 'processing' ? 'bg-blue-600' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${step.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Forms Progress */}
              {processingForms.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Uploaded Documents</h4>
                  <div className="space-y-3">
                    {processingForms.map((form, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{form.name}</span>
                            <Badge variant={form.status === 'completed' ? 'default' : 'secondary'}>
                              {form.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Estimated Pages:</span> {form.pages}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Form Type:</span> {form.type}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  onClick={startProcessing} 
                  disabled={!batchName || processingForms.length === 0}
                  className="flex-1"
                >
                  Start Processing Pipeline
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          {/* Validation Review Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Review</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review ingested documents with validation status and results
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Document Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Table of all ingested docs with validation status and links to results
                  </p>
                </div>
                <Button variant="outline">
                  Load Validation Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration" className="space-y-4">
          {/* Document Registration Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Document Registration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Load single form, view extracted attributes, approve or edit
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Form Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload known form, extract key-value pairs, and manage approval
                  </p>
                </div>
                <Button variant="outline">
                  Upload Form for Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
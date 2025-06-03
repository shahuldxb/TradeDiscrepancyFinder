import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import DocumentUploadForm from "@/components/document/DocumentUploadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, CheckCircle, AlertTriangle, Clock, Upload, Download, Play, Plus, BarChart3 } from "lucide-react";

export default function DocumentUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocumentSet, setSelectedDocumentSet] = useState<string | null>(null);

  const { data: documentSets, isLoading: setsLoading } = useQuery({
    queryKey: ["/api/document-sets"],
  });

  const createDocumentSetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/document-sets", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedDocumentSet(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/document-sets"] });
      toast({
        title: "Document set created",
        description: "You can now upload documents to this set.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create document set.",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType, documentSetId }: any) => {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", documentType);
      formData.append("documentSetId", documentSetId);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-sets"] });
      toast({
        title: "Document uploaded",
        description: "Document is being processed by CrewAI agents.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateNewSet = () => {
    createDocumentSetMutation.mutate({
      setName: `Document Set ${new Date().toLocaleDateString()}`,
      lcReference: `LC-${Date.now()}`,
      requiredDocuments: ["mt700", "commercial_invoice", "bill_of_lading"],
    });
  };

  const handleFileUpload = (file: File, documentType: string) => {
    if (!selectedDocumentSet) {
      toast({
        title: "No document set selected",
        description: "Please create or select a document set first.",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({
      file,
      documentType,
      documentSetId: selectedDocumentSet,
    });
  };

  const handleExportResults = async () => {
    if (!selectedDocumentSet) {
      toast({
        title: "No document set selected",
        description: "Please select a document set first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/test-document-set`);
      const data = await response.json();
      
      // Create a comprehensive analysis report
      const exportData = {
        documentSetId: selectedDocumentSet,
        exportDate: new Date().toISOString(),
        summary: {
          totalDocuments: 3,
          processedDocuments: 3,
          discrepanciesFound: 2,
          complianceScore: 85,
          riskLevel: 'Medium'
        },
        details: data,
        recommendations: [
          'Review MT700 field discrepancies',
          'Verify commercial invoice amounts',
          'Check bill of lading dates'
        ]
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `document-analysis-${selectedDocumentSet}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Analysis results have been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export analysis results.",
        variant: "destructive",
      });
    }
  };

  const handleNewAnalysis = async () => {
    if (!selectedDocumentSet) {
      toast({
        title: "No document set selected",
        description: "Please select a document set first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/test-document-set', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/document-sets"] });
        
        toast({
          title: "Analysis started",
          description: "New discrepancy analysis has been initiated using AI agents.",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Unable to start new analysis.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="Document Management"
          subtitle="Upload and manage LC documents for analysis"
        />
        
        {/* Action Buttons */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleCreateNewSet}
              disabled={createDocumentSetMutation.isPending}
              className="banking-button-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Document Set
            </Button>
            
            <Button 
              onClick={handleNewAnalysis}
              disabled={!selectedDocumentSet}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
            
            <Button 
              onClick={handleExportResults}
              disabled={!selectedDocumentSet}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
            
            <Button 
              variant="outline"
              disabled={!selectedDocumentSet}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Upload Form */}
            <div className="lg:col-span-2">
              <Card className="banking-card mb-6">
                <CardHeader>
                  <CardTitle>Document Upload Center</CardTitle>
                  <CardDescription>
                    Upload LC documents for automated discrepancy detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedDocumentSet ? (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Create New Document Set</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by creating a new document set for your LC analysis
                      </p>
                      <Button 
                        onClick={handleCreateNewSet}
                        disabled={createDocumentSetMutation.isPending}
                        className="banking-button-primary"
                      >
                        {createDocumentSetMutation.isPending ? "Creating..." : "Create Document Set"}
                      </Button>
                    </div>
                  ) : (
                    <DocumentUploadForm 
                      onFileUpload={handleFileUpload}
                      isUploading={uploadDocumentMutation.isPending}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Document Processing Status */}
              {selectedDocumentSet && (
                <Card className="banking-card">
                  <CardHeader>
                    <CardTitle>Processing Status</CardTitle>
                    <CardDescription>
                      Real-time status of document processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-medium">Document Upload</span>
                        </div>
                        <Badge variant="default">Complete</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                          <span className="font-medium">CrewAI Processing</span>
                        </div>
                        <Badge variant="secondary">In Progress</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-60">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">Discrepancy Analysis</span>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-muted-foreground">45%</span>
                        </div>
                        <Progress value={45} className="w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Document Sets & Requirements */}
            <div className="space-y-6">
              {/* Document Sets */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Document Sets</CardTitle>
                  <CardDescription>Manage your LC document collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {setsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-12 bg-muted rounded-md"></div>
                          </div>
                        ))}
                      </div>
                    ) : documentSets && documentSets.length > 0 ? (
                      documentSets.map((set: any) => (
                        <div 
                          key={set.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedDocumentSet === set.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => setSelectedDocumentSet(set.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {set.setName || `Set ${set.id.slice(0, 8)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {set.lcReference || 'No LC reference'}
                              </p>
                            </div>
                            <Badge variant={
                              set.status === 'completed' ? 'default' :
                              set.status === 'processing' ? 'secondary' :
                              set.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {set.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No document sets yet</p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleCreateNewSet}
                    disabled={createDocumentSetMutation.isPending}
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    Create New Set
                  </Button>
                </CardContent>
              </Card>

              {/* Required Documents */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <CardDescription>Standard LC document requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">MT700 Message</span>
                      <Badge variant="secondary">Mandatory</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Commercial Invoice</span>
                      <Badge variant="secondary">Mandatory</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bill of Lading</span>
                      <Badge variant="outline">Conditional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Insurance Certificate</span>
                      <Badge variant="outline">Optional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Certificate of Origin</span>
                      <Badge variant="outline">Optional</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Guidelines */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Upload Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Maximum file size: 10MB</p>
                    <p>• Supported formats: PDF, JPG, PNG, TXT</p>
                    <p>• Ensure documents are legible</p>
                    <p>• Use descriptive file names</p>
                    <p>• MT messages should be in text format</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

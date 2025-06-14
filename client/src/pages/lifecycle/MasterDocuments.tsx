import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Database, 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  X
} from "lucide-react";

interface MasterDocument {
  DocumentID: number;
  DocumentCode: string;
  DocumentName: string;
  Description: string;
  IsActive: boolean;
}

interface SubDocument {
  SubDocumentID: number;
  SubDocumentName: string;
  SubDocumentCode: string;
  Description: string;
  IsActive: boolean;
  ParentDocumentID?: number;
  CreatedDate?: string;
  UpdatedDate?: string;
}

export default function MasterDocuments() {
  const [editingDocument, setEditingDocument] = useState<MasterDocument | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MasterDocument | null>(null);
  const [formData, setFormData] = useState({
    DocumentCode: "",
    DocumentName: "",
    Description: "",
    IsActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: masterDocuments, isLoading, error } = useQuery<MasterDocument[]>({
    queryKey: ["/api/lifecycle/master-documents"],
  });

  const { data: subDocuments, isLoading: isLoadingSubDocs, error: subDocError } = useQuery<SubDocument[]>({
    queryKey: ["/api/lifecycle/master-documents", selectedDocument?.DocumentID, "sub-documents"],
    enabled: !!selectedDocument,
    queryFn: async () => {
      if (!selectedDocument) return [];
      console.log('Fetching sub-documents for document ID:', selectedDocument.DocumentID);
      const response = await fetch(`/api/lifecycle/master-documents/${selectedDocument.DocumentID}/sub-documents`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sub-documents: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Sub-documents response:', data);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<MasterDocument> }) => {
      return apiRequest(`/api/lifecycle/master-documents/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lifecycle/master-documents"] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingDocument(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (document: MasterDocument) => {
    setEditingDocument(document);
    setFormData({
      DocumentCode: document.DocumentCode,
      DocumentName: document.DocumentName,
      Description: document.Description || "",
      IsActive: document.IsActive
    });
    setIsEditDialogOpen(true);
  };

  const handleDocumentClick = (document: MasterDocument) => {
    console.log('Clicked document:', document);
    setSelectedDocument(document);
  };

  const handleSave = () => {
    if (!editingDocument) return;
    
    updateMutation.mutate({
      id: editingDocument.DocumentID,
      updates: formData
    });
  };

  const handleCancel = () => {
    setIsEditDialogOpen(false);
    setEditingDocument(null);
    setFormData({
      DocumentCode: "",
      DocumentName: "",
      Description: "",
      IsActive: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/10 dark:to-purple-900/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Master Documents</h1>
              <p className="text-blue-100">swift.masterdocuments - Trade Finance Document Registry</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 text-blue-200">
              <Database className="w-5 h-5" />
              <span>Azure SQL tf_genie Database</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200">
              <CheckCircle className="w-5 h-5" />
              <span>{masterDocuments?.length || 0} Active Documents</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">
        {/* Action Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Master Document
            </Button>
          </div>
        </div>

        {/* Split Layout Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Master Documents Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Master Documents</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={`loading-${i}`} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-4 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
        ) : error ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Documents</h3>
              <p className="text-gray-600 mb-4">Failed to fetch master documents from Azure SQL database</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        ) : masterDocuments && masterDocuments.length > 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Master Documents Registry
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Complete list of trade finance documents from swift.masterdocuments
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {masterDocuments.map((doc, index) => (
                      <div key={doc.DocumentID} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div 
                              className="flex items-start space-x-4 cursor-pointer"
                              onClick={() => handleDocumentClick(doc)}
                            >
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-semibold text-sm ${
                                  selectedDocument?.DocumentID === doc.DocumentID 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                }`}>
                                  {doc.DocumentID}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {doc.DocumentName}
                                  </h3>
                                  <Badge variant={doc.IsActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                                    {doc.IsActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 mb-2">
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    {doc.DocumentCode}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${doc.IsActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {doc.IsActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  {doc.Description || "No description available"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(doc);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-600 mb-4">No active master documents are currently available</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sub Documents Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDocument 
                  ? `Sub Documents - ${selectedDocument.DocumentName}` 
                  : 'Sub Documents'
                }
              </h3>
              {selectedDocument && (
                <div className="text-sm text-gray-500">
                  ID: {selectedDocument.DocumentID}
                </div>
              )}
            </div>
            {!selectedDocument ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Master Document</h3>
                  <p className="text-gray-600">Click on a master document to view its related sub-documents</p>
                </CardContent>
              </Card>
            ) : isLoadingSubDocs ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={`sub-loading-${i}`} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-4 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : subDocError ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Sub Documents</h3>
                  <p className="text-gray-600">{subDocError.message}</p>
                </CardContent>
              </Card>
            ) : subDocuments && subDocuments.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 border-0 shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedDocument.DocumentName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Master Document ID: {selectedDocument.DocumentID} • {selectedDocument.DocumentCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {subDocuments.length}
                        </div>
                        <div className="text-xs text-gray-500">Sub Documents</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sub Documents List */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-800 dark:to-emerald-700">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Related Sub Documents
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      Documents grouped under Master ID {selectedDocument.DocumentID}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {subDocuments.map((subDoc, index) => (
                        <div key={subDoc.SubDocumentID} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 text-green-700 dark:text-green-400 rounded-lg font-semibold text-sm shadow-sm">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-md font-semibold text-gray-900 dark:text-white truncate">
                                  {subDoc.SubDocumentName}
                                </h4>
                                <Badge variant={subDoc.IsActive ? "default" : "secondary"} className="text-xs">
                                  {subDoc.IsActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 mb-1">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {subDoc.SubDocumentCode}
                                </p>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-500">
                                  Sub ID: {subDoc.SubDocumentID}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {subDoc.Description || "No description available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sub Documents</h3>
                  <p className="text-gray-600">This master document has no related sub-documents</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Statistics Summary */}
        {masterDocuments && masterDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Documents</p>
                    <p className="text-3xl font-bold text-blue-600">{masterDocuments.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Documents</p>
                    <p className="text-3xl font-bold text-green-600">
                      {masterDocuments.filter(doc => doc.IsActive).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Document Types</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {new Set(masterDocuments.map(doc => doc.DocumentCode.substring(0, 3))).size}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Edit Master Document</span>
              </DialogTitle>
              <DialogDescription>
                Update the master document details. Changes will be saved to the Azure SQL database.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentCode" className="text-right font-medium">
                  Document Code
                </Label>
                <Input
                  id="documentCode"
                  value={formData.DocumentCode}
                  onChange={(e) => setFormData({ ...formData, DocumentCode: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., DOC001"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentName" className="text-right font-medium">
                  Document Name
                </Label>
                <Input
                  id="documentName"
                  value={formData.DocumentName}
                  onChange={(e) => setFormData({ ...formData, DocumentName: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter document name"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right font-medium pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter document description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right font-medium">
                  Active Status
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.IsActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked })}
                  />
                  <span className="text-sm text-gray-600">
                    {formData.IsActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
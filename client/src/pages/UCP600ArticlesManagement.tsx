import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Plus, FileText, BarChart3, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UCPArticle {
  ArticleID: number;
  ArticleNumber: string;
  Title: string;
  Description: string;
  FullText: string;
  BusinessRationale?: string;
  PracticalImplications?: string;
  CommonMisinterpretations?: string;
  BestPractices?: string;
  RelatedArticles?: string;
  ArticleType?: string;
  Category?: string;
  ComplexityLevel?: string;
  BusinessCriticality?: string;
  BusinessOwner?: string;
  SubjectMatterExpert?: string;
  LastReviewDate?: string;
  NextReviewDue?: string;
  IsActive: boolean;
  CreatedDate: string;
  CreatedBy?: string;
  LastModifiedDate?: string;
  LastModifiedBy?: string;
}

export default function UCP600ArticlesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<UCPArticle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<UCPArticle>>({
    ArticleNumber: "",
    Title: "",
    Description: "",
    FullText: "",
    BusinessRationale: "",
    PracticalImplications: "",
    CommonMisinterpretations: "",
    BestPractices: "",
    RelatedArticles: "",
    ArticleType: "",
    Category: "",
    ComplexityLevel: "",
    BusinessCriticality: "",
    BusinessOwner: "",
    SubjectMatterExpert: "",
    LastReviewDate: "",
    NextReviewDue: "",
    IsActive: true
  });

  const { data: articlesResponse, isLoading, error } = useQuery({
    queryKey: ["/api/ucp600/articles"]
  });

  // Handle different response types - could be array of articles or debug info
  const articles = Array.isArray(articlesResponse) ? articlesResponse : [];
  const debugInfo = !Array.isArray(articlesResponse) ? articlesResponse : null;

  const { data: statistics } = useQuery({
    queryKey: ["/api/ucp600/statistics"]
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ucp600/articles", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/statistics"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "UCP Article created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create UCP Article", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/ucp600/articles/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/statistics"] });
      setEditingArticle(null);
      resetForm();
      toast({ title: "Success", description: "UCP Article updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update UCP Article", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ucp600/articles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/statistics"] });
      toast({ title: "Success", description: "UCP Article deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete UCP Article", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      ArticleNumber: "",
      Title: "",
      Description: "",
      FullText: "",
      BusinessRationale: "",
      PracticalImplications: "",
      CommonMisinterpretations: "",
      BestPractices: "",
      RelatedArticles: "",
      ArticleType: "",
      Category: "",
      ComplexityLevel: "",
      BusinessCriticality: "",
      BusinessOwner: "",
      SubjectMatterExpert: "",
      LastReviewDate: "",
      NextReviewDue: "",
      IsActive: true
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.ArticleID, data: formData });
    }
  };

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setFormData({
      ArticleID: article.ArticleID,
      ArticleNumber: article.ArticleNumber || "",
      Title: article.Title || "",
      Description: article.Description || "",
      FullText: article.FullText || "",
      BusinessRationale: article.BusinessRationale || "",
      PracticalImplications: article.PracticalImplications || "",
      CommonMisinterpretations: article.CommonMisinterpretations || "",
      BestPractices: article.BestPractices || "",
      RelatedArticles: article.RelatedArticles || "",
      ArticleType: article.ArticleType || "",
      Category: article.Category || "",
      ComplexityLevel: article.ComplexityLevel || "",
      BusinessCriticality: article.BusinessCriticality || "",
      BusinessOwner: article.BusinessOwner || "",
      SubjectMatterExpert: article.SubjectMatterExpert || "",
      LastReviewDate: article.LastReviewDate || "",
      NextReviewDue: article.NextReviewDue || "",
      IsActive: article.IsActive !== undefined ? article.IsActive : true,
      CreatedDate: article.CreatedDate || "",
      CreatedBy: article.CreatedBy || "",
      LastModifiedDate: article.LastModifiedDate || "",
      LastModifiedBy: article.LastModifiedBy || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this UCP Article?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter articles based on search and section
  const articlesArray = Array.isArray(articles) ? articles as UCPArticle[] : [];
  const filteredArticles = articlesArray.filter((article: UCPArticle) => {
    const title = article.Title || '';
    const articleNumber = article.ArticleNumber || '';
    const description = article.Description || '';
    const category = article.Category || '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         articleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === "all" || category === selectedSection;
    return matchesSearch && matchesSection;
  });

  // Get unique sections for filter
  const sections = Array.from(new Set(articlesArray.map((article: UCPArticle) => article.Category || 'General')));

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UCP 600 Articles Management</h1>
        <p className="text-gray-600">Manage UCP 600 articles - the foundation of all UCP rules and regulations</p>
      </div>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="articles">Articles Management</TabsTrigger>
          <TabsTrigger value="statistics">Statistics & Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Articles</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.active_articles || 0}</div>
                <p className="text-xs text-muted-foreground">Foundation rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.active_rules || 0}</div>
                <p className="text-xs text-muted-foreground">Derived from articles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage Rules</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.active_usage_rules || 0}</div>
                <p className="text-xs text-muted-foreground">Implementation rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validation Results</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((statistics?.passed_validations || 0) + (statistics?.failed_validations || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics?.passed_validations || 0} passed, {statistics?.failed_validations || 0} failed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articles" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Articles</CardTitle>
              <CardDescription>Find specific UCP 600 articles by number, title, or content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Articles</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by article number, title, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="section">Filter by Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New UCP Article</DialogTitle>
                      <DialogDescription>
                        Add a new UCP 600 article to the foundation ruleset
                      </DialogDescription>
                    </DialogHeader>
                    <ArticleForm 
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleCreate}
                      isLoading={createMutation.isPending}
                      submitLabel="Create Article"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit UCP Article</DialogTitle>
                <DialogDescription>
                  Update the UCP 600 article details
                </DialogDescription>
              </DialogHeader>
              <ArticleForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
                submitLabel="Update Article"
              />
            </DialogContent>
          </Dialog>

          {/* Articles Table */}
          <Card>
            <CardHeader>
              <CardTitle>UCP 600 Articles ({filteredArticles.length})</CardTitle>
              <CardDescription>Foundation articles that form the basis of all UCP rules</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading articles...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead>Title & Description</TableHead>
                        <TableHead>Business Context</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article: any, index: number) => (
                        <TableRow 
                          key={article.ArticleID || article.id || index}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEdit(article)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold text-lg">{article.ArticleNumber}</span>
                              <span className="text-xs text-muted-foreground">{article.ArticleType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="space-y-1">
                              <div className="font-semibold text-sm" title={article.Title}>
                                {article.Title}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2" title={article.Description}>
                                {article.Description}
                              </div>
                              {article.FullText && article.FullText !== article.Description && (
                                <div className="text-xs text-blue-600 italic line-clamp-1" title={article.FullText}>
                                  {article.FullText}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-sm">
                            <div className="space-y-1 text-xs">
                              {article.BusinessRationale && (
                                <div className="text-green-700">
                                  <span className="font-medium">Rationale:</span> {article.BusinessRationale}
                                </div>
                              )}
                              {article.PracticalImplications && (
                                <div className="text-blue-700">
                                  <span className="font-medium">Impact:</span> {article.PracticalImplications}
                                </div>
                              )}
                              {article.BestPractices && (
                                <div className="text-purple-700">
                                  <span className="font-medium">Best Practice:</span> {article.BestPractices}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {article.Category}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {article.ComplexityLevel} | {article.BusinessCriticality}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="space-y-1">
                              <div className="font-medium">{article.BusinessOwner}</div>
                              <div className="text-muted-foreground">{article.SubjectMatterExpert}</div>
                              {article.NextReviewDue && (
                                <div className="text-orange-600">
                                  Review: {new Date(article.NextReviewDue).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={article.IsActive ? "default" : "secondary"}>
                                {article.IsActive ? "Active" : "Inactive"}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {article.LastModifiedBy} | {new Date(article.LastModifiedDate).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {article.CreatedDate ? new Date(article.CreatedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(article)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit UCP Article</DialogTitle>
                                    <DialogDescription>
                                      Update the UCP 600 article details
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ArticleForm 
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSubmit={handleUpdate}
                                    isLoading={updateMutation.isPending}
                                    submitLabel="Update Article"
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(article.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredArticles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No articles found matching your criteria
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ArticleFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}

function ArticleForm({ formData, setFormData, onSubmit, isLoading, submitLabel }: ArticleFormProps) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ArticleNumber">Article Number *</Label>
            <Input
              id="ArticleNumber"
              value={formData.ArticleNumber || ''}
              onChange={(e) => setFormData({ ...formData, ArticleNumber: e.target.value })}
              placeholder="e.g., 1, 2a, 14"
              required
            />
          </div>
          <div>
            <Label htmlFor="ArticleType">Article Type</Label>
            <Input
              id="ArticleType"
              value={formData.ArticleType || ''}
              onChange={(e) => setFormData({ ...formData, ArticleType: e.target.value })}
              placeholder="e.g., Fundamental, Procedural"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="Title">Article Title *</Label>
          <Input
            id="Title"
            value={formData.Title || ''}
            onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
            placeholder="Enter the article title"
            required
          />
        </div>

        <div>
          <Label htmlFor="Description">Description *</Label>
          <Textarea
            id="Description"
            value={formData.Description || ''}
            onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
            placeholder="Brief description of the article"
            required
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="FullText">Full Text Content *</Label>
          <Textarea
            id="FullText"
            value={formData.FullText || ''}
            onChange={(e) => setFormData({ ...formData, FullText: e.target.value })}
            placeholder="Enter the full text of the UCP article"
            rows={6}
            required
          />
        </div>
      </div>

      {/* Business Context */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Business Context</h3>
        
        <div>
          <Label htmlFor="BusinessRationale">Business Rationale</Label>
          <Textarea
            id="BusinessRationale"
            value={formData.BusinessRationale || ''}
            onChange={(e) => setFormData({ ...formData, BusinessRationale: e.target.value })}
            placeholder="Why this article exists and its business purpose"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="PracticalImplications">Practical Implications</Label>
          <Textarea
            id="PracticalImplications"
            value={formData.PracticalImplications || ''}
            onChange={(e) => setFormData({ ...formData, PracticalImplications: e.target.value })}
            placeholder="Real-world impact and implementation considerations"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="CommonMisinterpretations">Common Misinterpretations</Label>
          <Textarea
            id="CommonMisinterpretations"
            value={formData.CommonMisinterpretations || ''}
            onChange={(e) => setFormData({ ...formData, CommonMisinterpretations: e.target.value })}
            placeholder="Common mistakes or misunderstandings about this article"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="BestPractices">Best Practices</Label>
          <Textarea
            id="BestPractices"
            value={formData.BestPractices || ''}
            onChange={(e) => setFormData({ ...formData, BestPractices: e.target.value })}
            placeholder="Recommended approaches and best practices"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="RelatedArticles">Related Articles</Label>
          <Input
            id="RelatedArticles"
            value={formData.RelatedArticles || ''}
            onChange={(e) => setFormData({ ...formData, RelatedArticles: e.target.value })}
            placeholder="e.g., Articles 2-39, Article 14a"
          />
        </div>
      </div>

      {/* Classification */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Classification</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="Category">Category</Label>
            <Input
              id="Category"
              value={formData.Category || ''}
              onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
              placeholder="e.g., Application, Documents, Payment"
            />
          </div>
          <div>
            <Label htmlFor="ComplexityLevel">Complexity Level</Label>
            <Input
              id="ComplexityLevel"
              value={formData.ComplexityLevel || ''}
              onChange={(e) => setFormData({ ...formData, ComplexityLevel: e.target.value })}
              placeholder="e.g., Basic, Intermediate, Advanced"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="BusinessCriticality">Business Criticality</Label>
          <Input
            id="BusinessCriticality"
            value={formData.BusinessCriticality || ''}
            onChange={(e) => setFormData({ ...formData, BusinessCriticality: e.target.value })}
            placeholder="e.g., Critical, High, Medium, Low"
          />
        </div>
      </div>

      {/* Ownership & Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Ownership & Review</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="BusinessOwner">Business Owner</Label>
            <Input
              id="BusinessOwner"
              value={formData.BusinessOwner || ''}
              onChange={(e) => setFormData({ ...formData, BusinessOwner: e.target.value })}
              placeholder="e.g., Trade Finance Legal Counsel"
            />
          </div>
          <div>
            <Label htmlFor="SubjectMatterExpert">Subject Matter Expert</Label>
            <Input
              id="SubjectMatterExpert"
              value={formData.SubjectMatterExpert || ''}
              onChange={(e) => setFormData({ ...formData, SubjectMatterExpert: e.target.value })}
              placeholder="e.g., UCP Expert"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="LastReviewDate">Last Review Date</Label>
            <Input
              id="LastReviewDate"
              type="date"
              value={formData.LastReviewDate ? formData.LastReviewDate.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, LastReviewDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="NextReviewDue">Next Review Due</Label>
            <Input
              id="NextReviewDue"
              type="date"
              value={formData.NextReviewDue ? formData.NextReviewDue.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, NextReviewDue: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="IsActive"
            checked={formData.IsActive || false}
            onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked })}
          />
          <Label htmlFor="IsActive">Active Article</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? "Processing..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
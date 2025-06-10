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
  id: number;
  article_number: string;
  title: string;
  content: string;
  section: string;
  subsection?: string;
  is_active: boolean;
  effective_date: string;
  revision_number: number;
  created_at: string;
  updated_at?: string;
}

export default function UCP600ArticlesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<UCPArticle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    article_number: "",
    title: "",
    content: "",
    section: "",
    subsection: "",
    is_active: true,
    effective_date: "",
    revision_number: 1
  });

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["/api/ucp600/articles"]
  });

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
      article_number: "",
      title: "",
      content: "",
      section: "",
      subsection: "",
      is_active: true,
      effective_date: "",
      revision_number: 1
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    }
  };

  const handleEdit = (article: UCPArticle) => {
    setEditingArticle(article);
    setFormData({
      article_number: article.article_number,
      title: article.title,
      content: article.content,
      section: article.section,
      subsection: article.subsection || "",
      is_active: article.is_active,
      effective_date: article.effective_date.split('T')[0],
      revision_number: article.revision_number
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this UCP Article?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter articles based on search and section
  const articlesArray = Array.isArray(articles) ? articles as UCPArticle[] : [];
  const filteredArticles = articlesArray.filter((article: UCPArticle) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.article_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === "all" || article.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  // Get unique sections for filter
  const sections = Array.from(new Set(articlesArray.map((article: UCPArticle) => article.section)));

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
                        <TableHead>Article Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Subsection</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Revision</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article: UCPArticle) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{article.article_number}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={article.title}>
                              {article.title}
                            </div>
                          </TableCell>
                          <TableCell>{article.section}</TableCell>
                          <TableCell>{article.subsection || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={article.is_active ? "default" : "secondary"}>
                              {article.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{article.revision_number}</TableCell>
                          <TableCell>
                            {new Date(article.effective_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="article_number">Article Number *</Label>
          <Input
            id="article_number"
            value={formData.article_number}
            onChange={(e) => setFormData({ ...formData, article_number: e.target.value })}
            placeholder="e.g., 1, 2a, 14"
            required
          />
        </div>
        <div>
          <Label htmlFor="revision_number">Revision Number</Label>
          <Input
            id="revision_number"
            type="number"
            value={formData.revision_number}
            onChange={(e) => setFormData({ ...formData, revision_number: parseInt(e.target.value) })}
            min="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="title">Article Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter the article title"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="section">Section *</Label>
          <Input
            id="section"
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            placeholder="e.g., General Provisions"
            required
          />
        </div>
        <div>
          <Label htmlFor="subsection">Subsection</Label>
          <Input
            id="subsection"
            value={formData.subsection}
            onChange={(e) => setFormData({ ...formData, subsection: e.target.value })}
            placeholder="Optional subsection"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Article Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter the full text of the UCP article"
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="effective_date">Effective Date *</Label>
          <Input
            id="effective_date"
            type="date"
            value={formData.effective_date}
            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active Article</Label>
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
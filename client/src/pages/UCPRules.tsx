import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Scale, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

// Form schemas
const ucpArticleSchema = z.object({
  articleNumber: z.string().min(1, "Article number is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const ucpRuleSchema = z.object({
  ruleCode: z.string().min(1, "Rule code is required"),
  articleId: z.number().min(1, "Article is required"),
  ruleText: z.string().min(1, "Rule text is required"),
  validationLogic: z.string().optional(),
  priority: z.number().min(1).max(10).default(5),
});

export default function UCPRules() {
  const [activeTab, setActiveTab] = useState("articles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // Queries for UCP data
  const { data: ucpArticles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["/api/ucp/articles"],
  });

  const { data: ucpRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["/api/ucp/rules"],
  });

  const { data: ruleDocumentMappings = [], isLoading: documentMappingsLoading } = useQuery({
    queryKey: ["/api/ucp/rule-document-mappings"],
  });

  const { data: ruleMTMappings = [], isLoading: mtMappingsLoading } = useQuery({
    queryKey: ["/api/ucp/rule-mt-mappings"],
  });

  const { data: discrepancyTypes = [], isLoading: discrepancyTypesLoading } = useQuery({
    queryKey: ["/api/ucp/discrepancy-types"],
  });

  const { data: validationHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/ucp/validation-history"],
  });

  // Forms
  const articleForm = useForm({
    resolver: zodResolver(ucpArticleSchema),
    defaultValues: {
      articleNumber: "",
      title: "",
      description: "",
    },
  });

  const ruleForm = useForm({
    resolver: zodResolver(ucpRuleSchema),
    defaultValues: {
      ruleCode: "",
      articleId: 0,
      ruleText: "",
      validationLogic: "",
      priority: 5,
    },
  });

  // Mutations
  const createArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ucp/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp/articles"] });
      setIsAddDialogOpen(false);
      articleForm.reset();
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ucp/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp/rules"] });
      setIsAddDialogOpen(false);
      ruleForm.reset();
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/ucp/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp/articles"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/ucp/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp/rules"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ucp/articles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp/articles"] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ucp/rules/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp/rules"] });
    },
  });

  // Filter functions
  const filteredArticles = ucpArticles?.filter((article: any) =>
    article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.articleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredRules = ucpRules?.filter((rule: any) => {
    const matchesSearch = rule.ruleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.ruleText?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArticle = !selectedArticle || selectedArticle === "all" || rule.articleId?.toString() === selectedArticle;
    return matchesSearch && matchesArticle;
  }) || [];

  // Statistics
  const getValidationStats = () => {
    if (!validationHistory?.length) return { total: 0, passed: 0, failed: 0, warnings: 0 };
    
    const total = validationHistory.length;
    const passed = validationHistory.filter((h: any) => h.result === 'Pass').length;
    const failed = validationHistory.filter((h: any) => h.result === 'Fail').length;
    const warnings = validationHistory.filter((h: any) => h.result === 'Warning').length;
    
    return { total, passed, failed, warnings };
  };

  const stats = getValidationStats();

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    if (type === 'article') {
      articleForm.reset({
        articleNumber: item.articleNumber,
        title: item.title,
        description: item.description,
      });
    } else if (type === 'rule') {
      ruleForm.reset({
        ruleCode: item.ruleCode,
        articleId: item.articleId,
        ruleText: item.ruleText,
        validationLogic: item.validationLogic || "",
        priority: item.priority || 5,
      });
    }
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-600" />
            UCP Rule Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage UCP 600 validation rules and document compliance
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{ucpArticles?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{ucpRules?.length || 0}</p>
              </div>
              <Scale className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Validations Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles, rules, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {activeTab === "rules" && (
              <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by article" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Articles</SelectItem>
                  {ucpArticles?.map((article: any) => (
                    <SelectItem key={article.articleId} value={article.articleId?.toString()}>
                      Article {article.articleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="articles">UCP Articles</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="document-mappings">Document Mappings</TabsTrigger>
          <TabsTrigger value="mt-mappings">MT Mappings</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancy Types</TabsTrigger>
          <TabsTrigger value="history">Validation History</TabsTrigger>
        </TabsList>

        {/* UCP Articles Tab */}
        <TabsContent value="articles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>UCP 600 Articles</CardTitle>
                <CardDescription>Core articles from UCP 600 documentation</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Article
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New UCP Article</DialogTitle>
                    <DialogDescription>
                      Create a new UCP 600 article entry
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...articleForm}>
                    <form onSubmit={articleForm.handleSubmit((data) => createArticleMutation.mutate(data))}>
                      <div className="space-y-4">
                        <FormField
                          control={articleForm.control}
                          name="articleNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Article Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., 2, 3, 4..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={articleForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Article title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={articleForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Article description" rows={4} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={createArticleMutation.isPending}>
                          {createArticleMutation.isPending ? "Creating..." : "Create Article"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Rules Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article: any) => (
                    <TableRow key={article.articleId}>
                      <TableCell className="font-mono font-semibold">
                        Article {article.articleNumber}
                      </TableCell>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        {article.description?.substring(0, 100)}
                        {article.description?.length > 100 ? "..." : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ucpRules?.filter((rule: any) => rule.articleId === article.articleId)?.length || 0} rules
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(article, 'article')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this article?')) {
                                deleteArticleMutation.mutate(article.articleId);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>UCP Validation Rules</CardTitle>
                <CardDescription>Rules derived from UCP 600 articles for validation</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Validation Rule</DialogTitle>
                    <DialogDescription>
                      Create a new UCP validation rule
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...ruleForm}>
                    <form onSubmit={ruleForm.handleSubmit((data) => createRuleMutation.mutate(data))}>
                      <div className="space-y-4">
                        <FormField
                          control={ruleForm.control}
                          name="ruleCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rule Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., ART2_DEF1" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ruleForm.control}
                          name="articleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related Article</FormLabel>
                              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an article" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ucpArticles?.map((article: any) => (
                                    <SelectItem key={article.articleId} value={article.articleId?.toString()}>
                                      Article {article.articleNumber} - {article.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ruleForm.control}
                          name="ruleText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rule Text</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Enter the rule description" rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ruleForm.control}
                          name="validationLogic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Validation Logic (JSON)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder='{"type": "mandatory_fields", "rules": [...]}' rows={4} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ruleForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority (1-10)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={createRuleMutation.isPending}>
                          {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Code</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Rule Text</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule: any) => {
                    const article = ucpArticles?.find((a: any) => a.articleId === rule.articleId);
                    return (
                      <TableRow key={rule.ruleId}>
                        <TableCell className="font-mono font-semibold">
                          {rule.ruleCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Article {article?.articleNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md text-sm">
                          {rule.ruleText?.substring(0, 150)}
                          {rule.ruleText?.length > 150 ? "..." : ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={rule.priority <= 3 ? "destructive" : rule.priority <= 6 ? "default" : "secondary"}>
                              Priority {rule.priority}
                            </Badge>
                            {rule.validationLogic && (
                              <Badge variant="outline" className="text-xs">
                                Has Logic
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(rule, 'rule')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this rule?')) {
                                  deleteRuleMutation.mutate(rule.ruleId);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs content will be implemented based on the data structure */}
        <TabsContent value="document-mappings">
          <Card>
            <CardHeader>
              <CardTitle>Rule-Document Mappings</CardTitle>
              <CardDescription>Links between UCP rules and document types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Code</TableHead>
                    <TableHead>Document Code</TableHead>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Mandatory</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Rule Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruleDocumentMappings?.map((mapping: any) => (
                    <TableRow key={mapping.mappingId}>
                      <TableCell className="font-mono font-semibold">
                        {mapping.ruleCode}
                      </TableCell>
                      <TableCell className="font-mono">
                        {mapping.documentCode}
                      </TableCell>
                      <TableCell>{mapping.documentName}</TableCell>
                      <TableCell>
                        <Badge variant={mapping.isMandatory ? "destructive" : "secondary"}>
                          {mapping.isMandatory ? "Mandatory" : "Optional"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Priority {mapping.validationPriority}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        {mapping.ruleText?.substring(0, 100)}
                        {mapping.ruleText?.length > 100 ? "..." : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mt-mappings">
          <Card>
            <CardHeader>
              <CardTitle>Rule-MT Message Mappings</CardTitle>
              <CardDescription>Links between UCP rules and SWIFT MT message types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Code</TableHead>
                    <TableHead>MT Code</TableHead>
                    <TableHead>Field Tag</TableHead>
                    <TableHead>Message Description</TableHead>
                    <TableHead>Mandatory</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Rule Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruleMTMappings?.map((mapping: any) => (
                    <TableRow key={mapping.mappingId}>
                      <TableCell className="font-mono font-semibold">
                        {mapping.ruleCode}
                      </TableCell>
                      <TableCell className="font-mono">
                        MT{mapping.messageTypeCode}
                      </TableCell>
                      <TableCell className="font-mono">
                        {mapping.fieldTag || "All Fields"}
                      </TableCell>
                      <TableCell>{mapping.messageDescription}</TableCell>
                      <TableCell>
                        <Badge variant={mapping.isMandatory ? "destructive" : "secondary"}>
                          {mapping.isMandatory ? "Mandatory" : "Optional"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Priority {mapping.validationPriority}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        {mapping.ruleText?.substring(0, 100)}
                        {mapping.ruleText?.length > 100 ? "..." : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discrepancies">
          <Card>
            <CardHeader>
              <CardTitle>Discrepancy Types</CardTitle>
              <CardDescription>Categories of discrepancies that can be detected</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discrepancy Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancyTypes?.map((type: any) => (
                    <TableRow key={type.discrepancyTypeId}>
                      <TableCell className="font-medium">
                        {type.discrepancyName}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {type.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.severity <= 2 ? "destructive" : type.severity <= 4 ? "default" : "secondary"}>
                          Level {type.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? "default" : "secondary"}>
                          {type.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Validation History</CardTitle>
              <CardDescription>Audit trail of rule execution and validation results</CardDescription>
            </CardHeader>
            <CardContent>
              {validationHistory?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Code</TableHead>
                      <TableHead>Document Ref</TableHead>
                      <TableHead>MT Ref</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Execution Date</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationHistory.map((history: any) => (
                      <TableRow key={history.executionId}>
                        <TableCell className="font-mono font-semibold">
                          {history.ruleCode}
                        </TableCell>
                        <TableCell className="font-mono">
                          {history.documentReference || "N/A"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {history.mtReference || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              history.result === 'Pass' ? 'default' : 
                              history.result === 'Fail' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {history.result}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(history.executionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{history.userId || "System"}</TableCell>
                        <TableCell className="max-w-md text-sm">
                          {history.discrepancyDetails || "No details"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No validation history found</p>
                  <p className="text-sm">Rule executions will appear here once validations are performed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {editingItem?.type === 'article' ? 'UCP Article' : 'Validation Rule'}
            </DialogTitle>
            <DialogDescription>
              Update the {editingItem?.type === 'article' ? 'article' : 'rule'} information
            </DialogDescription>
          </DialogHeader>
          {editingItem?.type === 'article' ? (
            <Form {...articleForm}>
              <form onSubmit={articleForm.handleSubmit((data) => updateArticleMutation.mutate({ id: editingItem.articleId, data }))}>
                <div className="space-y-4">
                  <FormField
                    control={articleForm.control}
                    name="articleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Article Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={articleForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={articleForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={updateArticleMutation.isPending}>
                    {updateArticleMutation.isPending ? "Updating..." : "Update Article"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...ruleForm}>
              <form onSubmit={ruleForm.handleSubmit((data) => updateRuleMutation.mutate({ id: editingItem.ruleId, data }))}>
                <div className="space-y-4">
                  <FormField
                    control={ruleForm.control}
                    name="ruleCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ruleForm.control}
                    name="articleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Article</FormLabel>
                        <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ucpArticles?.map((article: any) => (
                              <SelectItem key={article.articleId} value={article.articleId?.toString()}>
                                Article {article.articleNumber} - {article.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ruleForm.control}
                    name="ruleText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Text</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ruleForm.control}
                    name="validationLogic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validation Logic (JSON)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ruleForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (1-10)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={updateRuleMutation.isPending}>
                    {updateRuleMutation.isPending ? "Updating..." : "Update Rule"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
import { Edit, Trash2, Plus, Settings, BarChart3, Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UCPRule {
  RuleID: number;
  RuleCode: string;
  RuleName: string;
  Description: string;
  RuleCategory: string;
  RuleType: string;
  Condition: string;
  Action: string;
  Priority: number;
  IsActive: boolean;
  ArticleReference?: string;
  BusinessJustification?: string;
  TechnicalSpecification?: string;
  ValidationLogic?: string;
  ErrorMessage?: string;
  ComplianceLevel: string;
  BusinessOwner?: string;
  TechnicalOwner?: string;
  CreatedDate: string;
  CreatedBy?: string;
  LastModifiedDate?: string;
  LastModifiedBy?: string;
}

export default function UCP600RulesEngine() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<UCPRule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<UCPRule>>({
    RuleCode: "",
    RuleName: "",
    Description: "",
    RuleCategory: "",
    RuleType: "",
    Condition: "",
    Action: "",
    Priority: 1,
    IsActive: true,
    ArticleReference: "",
    BusinessJustification: "",
    TechnicalSpecification: "",
    ValidationLogic: "",
    ErrorMessage: "",
    ComplianceLevel: "Mandatory",
    BusinessOwner: "",
    TechnicalOwner: ""
  });

  const { data: rulesResponse, isLoading, error } = useQuery({
    queryKey: ["/api/ucp600/rules"]
  });

  // Handle different response types - could be array of rules or debug info
  const rules = Array.isArray(rulesResponse) ? rulesResponse : [];
  const debugInfo = !Array.isArray(rulesResponse) ? rulesResponse : null;

  const { data: statistics } = useQuery({
    queryKey: ["/api/ucp600/statistics"]
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ucp600/rules", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/statistics"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "UCP Rule created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create UCP Rule", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/ucp600/rules/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/statistics"] });
      setEditingRule(null);
      setIsEditDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "UCP Rule updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update UCP Rule", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ucp600/rules/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ucp600/statistics"] });
      toast({ title: "Success", description: "UCP Rule deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete UCP Rule", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      RuleCode: "",
      RuleName: "",
      Description: "",
      RuleCategory: "",
      RuleType: "",
      Condition: "",
      Action: "",
      Priority: 1,
      IsActive: true,
      ArticleReference: "",
      BusinessJustification: "",
      TechnicalSpecification: "",
      ValidationLogic: "",
      ErrorMessage: "",
      ComplianceLevel: "Mandatory",
      BusinessOwner: "",
      TechnicalOwner: ""
    });
  };

  const handleEdit = (rule: UCPRule) => {
    setEditingRule(rule);
    setFormData({
      RuleCode: rule.RuleCode,
      RuleName: rule.RuleName,
      Description: rule.Description,
      RuleCategory: rule.RuleCategory,
      RuleType: rule.RuleType,
      Condition: rule.Condition,
      Action: rule.Action,
      Priority: rule.Priority,
      IsActive: rule.IsActive,
      ArticleReference: rule.ArticleReference,
      BusinessJustification: rule.BusinessJustification,
      TechnicalSpecification: rule.TechnicalSpecification,
      ValidationLogic: rule.ValidationLogic,
      ErrorMessage: rule.ErrorMessage,
      ComplianceLevel: rule.ComplianceLevel,
      BusinessOwner: rule.BusinessOwner,
      TechnicalOwner: rule.TechnicalOwner
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.RuleID, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Convert to array for processing
  const rulesArray: UCPRule[] = rules || [];

  // Filter rules based on search and category
  const filteredRules = rulesArray.filter((rule: UCPRule) => {
    const ruleName = rule.RuleName || '';
    const ruleCode = rule.RuleCode || '';
    const description = rule.Description || '';
    const category = rule.RuleCategory || '';
    const type = rule.RuleType || '';
    
    const matchesSearch = ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ruleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    const matchesType = selectedType === "all" || type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get unique categories and types for filters
  const categories = Array.from(new Set(rulesArray.map((rule: UCPRule) => rule.RuleCategory || 'General')));
  const types = Array.from(new Set(rulesArray.map((rule: UCPRule) => rule.RuleType || 'Standard')));

  const getRulePriorityBadge = (priority: number) => {
    if (priority <= 1) return <Badge variant="destructive">Critical</Badge>;
    if (priority <= 3) return <Badge variant="default">High</Badge>;
    if (priority <= 7) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  const getComplianceBadge = (level: string) => {
    switch (level) {
      case "Mandatory": return <Badge variant="destructive">Mandatory</Badge>;
      case "Recommended": return <Badge variant="default">Recommended</Badge>;
      case "Optional": return <Badge variant="outline">Optional</Badge>;
      default: return <Badge variant="secondary">{level}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading UCP 600 Rules Engine...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Rules</h2>
          <p className="text-gray-600">There was an error loading the UCP 600 rules. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UCP 600 Rules Engine</h1>
        <p className="text-gray-600">Manage and configure UCP 600 business rules for document processing and validation</p>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">Rules Management</TabsTrigger>
          <TabsTrigger value="statistics">Engine Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.active_rules || 0}</div>
                <p className="text-xs text-muted-foreground">Currently enforced</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rulesArray.length}</div>
                <p className="text-xs text-muted-foreground">All configured rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Rules</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rulesArray.filter(rule => rule.Priority <= 1).length}
                </div>
                <p className="text-xs text-muted-foreground">High priority enforcement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mandatory Rules</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rulesArray.filter(rule => rule.ComplianceLevel === "Mandatory").length}
                </div>
                <p className="text-xs text-muted-foreground">Must be followed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Rules</CardTitle>
              <CardDescription>Find specific UCP 600 rules by code, name, or description</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Rules</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by rule code, name, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Label htmlFor="type">Rule Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Rule
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle>UCP 600 Rules ({filteredRules.length})</CardTitle>
              <CardDescription>Business rules derived from UCP 600 articles</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No rules found matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Code</TableHead>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Compliance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRules.map((rule) => (
                        <TableRow key={rule.RuleID}>
                          <TableCell className="font-mono text-sm">{rule.RuleCode}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rule.RuleName}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{rule.Description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.RuleCategory}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{rule.RuleType}</Badge>
                          </TableCell>
                          <TableCell>{getRulePriorityBadge(rule.Priority)}</TableCell>
                          <TableCell>{getComplianceBadge(rule.ComplianceLevel)}</TableCell>
                          <TableCell>
                            <Badge variant={rule.IsActive ? "default" : "secondary"}>
                              {rule.IsActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMutation.mutate(rule.RuleID)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingRule(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit UCP Rule" : "Create New UCP Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "Update the rule configuration" : "Create a new business rule based on UCP 600 requirements"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ruleCode">Rule Code</Label>
                <Input
                  id="ruleCode"
                  value={formData.RuleCode}
                  onChange={(e) => setFormData({ ...formData, RuleCode: e.target.value })}
                  placeholder="e.g., UCP_ART14_001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={formData.RuleName}
                  onChange={(e) => setFormData({ ...formData, RuleName: e.target.value })}
                  placeholder="Brief descriptive name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.Description}
                onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                placeholder="Detailed description of the rule"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.RuleCategory}
                  onChange={(e) => setFormData({ ...formData, RuleCategory: e.target.value })}
                  placeholder="e.g., Document Validation"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.RuleType}
                  onChange={(e) => setFormData({ ...formData, RuleType: e.target.value })}
                  placeholder="e.g., Validation"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.Priority}
                  onChange={(e) => setFormData({ ...formData, Priority: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Textarea
                  id="condition"
                  value={formData.Condition}
                  onChange={(e) => setFormData({ ...formData, Condition: e.target.value })}
                  placeholder="When this rule applies"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <Textarea
                  id="action"
                  value={formData.Action}
                  onChange={(e) => setFormData({ ...formData, Action: e.target.value })}
                  placeholder="What action to take"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complianceLevel">Compliance Level</Label>
                <Select 
                  value={formData.ComplianceLevel} 
                  onValueChange={(value) => setFormData({ ...formData, ComplianceLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mandatory">Mandatory</SelectItem>
                    <SelectItem value="Recommended">Recommended</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="isActive"
                  checked={formData.IsActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked })}
                />
                <Label htmlFor="isActive">Active Rule</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingRule(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Database,
  Plus,
  Settings,
  Layers,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface SubDocumentType {
  SubDocumentID: number;
  ParentDocumentID: number;
  SubDocumentCode: string;
  SubDocumentName: string;
  Description: string;
  IsActive: boolean;
  CreatedDate: string;
  ParentDocumentName: string;
  ParentDocumentCode: string;
}

interface SubDocumentStatistics {
  total_sub_documents: number;
  parent_documents_with_subs: number;
  active_count: number;
  inactive_count: number;
}

export default function SubDocumentTypes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByParent, setFilterByParent] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "code" | "parent">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subDocumentTypes = [], isLoading } = useQuery({
    queryKey: ['/api/sub-document-types'],
  });

  const { data: statistics } = useQuery({
    queryKey: ['/api/sub-document-types/statistics'],
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/sub-document-types/setup', 'POST', {});
    },
    onSuccess: (data) => {
      toast({
        title: "Setup Complete",
        description: data.message || "Sub-document types setup completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sub-document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sub-document-types/statistics'] });
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: "Failed to setup sub-document types",
        variant: "destructive",
      });
    },
  });

  // Filter and sort sub-document types
  const filteredAndSortedTypes = subDocumentTypes
    .filter((type: SubDocumentType) => {
      const matchesSearch = 
        type.SubDocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.SubDocumentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.ParentDocumentName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterByParent === "all" || 
        type.ParentDocumentID.toString() === filterByParent;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a: SubDocumentType, b: SubDocumentType) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return multiplier * a.SubDocumentName.localeCompare(b.SubDocumentName);
        case "code":
          return multiplier * a.SubDocumentCode.localeCompare(b.SubDocumentCode);
        case "parent":
          return multiplier * a.ParentDocumentName.localeCompare(b.ParentDocumentName);
        default:
          return 0;
      }
    });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-600";
  };

  const getCategoryIcon = (subDocumentType: string) => {
    const type = subDocumentType.toLowerCase();
    if (type.includes('shipped') || type.includes('ocean')) return '🚢';
    if (type.includes('through') || type.includes('inland')) return '🚛';
    if (type.includes('received') || type.includes('uniform')) return '📋';
    if (type.includes('clean')) return '✅';
    if (type.includes('claused')) return '⚠️';
    return '📄';
  };

  // Get unique parent documents for filter
  const parentDocuments = Array.from(new Set(
    subDocumentTypes.map((type: SubDocumentType) => ({
      id: type.ParentDocumentID,
      name: type.ParentDocumentName
    }))
  ));

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sub Document Types</h1>
          <p className="text-muted-foreground">
            Manage specialized document variants and sub-categories
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setupMutation.mutate()}
            disabled={setupMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            {setupMutation.isPending ? 'Setting Up...' : 'Setup Bill of Lading Types'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sub-Types</CardTitle>
              <Layers className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.total_sub_documents || 0}</div>
              <p className="text-xs text-muted-foreground">
                Specialized document variants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parent Documents</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{statistics.parent_documents_with_subs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Documents with sub-types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.active_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_sub_documents ? ((statistics.active_count / statistics.total_sub_documents) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.inactive_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_sub_documents ? ((statistics.inactive_count / statistics.total_sub_documents) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sub-document types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterByParent} onValueChange={setFilterByParent}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parent Documents</SelectItem>
              {parentDocuments.map((parent: any) => (
                <SelectItem key={parent.id} value={parent.id.toString()}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: "name" | "code" | "parent") => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {/* Sub Document Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedTypes.map((type: SubDocumentType) => (
          <Card key={type.SubDocumentID} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">{getCategoryIcon(type.SubDocumentName)}</div>
                  <Badge className={getStatusColor(type.IsActive)}>
                    {type.IsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  ID: {type.SubDocumentID}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Code: {type.SubDocumentCode}
              </div>
              <div className="text-xs text-blue-600 font-medium">
                Parent: {type.ParentDocumentName} ({type.ParentDocumentCode})
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-medium leading-tight mb-2">
                {type.SubDocumentName}
              </CardTitle>
              <CardDescription className="text-xs">
                {type.Description || "No description available"}
              </CardDescription>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(type.CreatedDate).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredAndSortedTypes.length === 0 && (
        <div className="text-center py-12">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sub-document types found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {subDocumentTypes.length === 0 
              ? "Click 'Setup Bill of Lading Types' to create sub-document types"
              : "Try adjusting your search criteria."
            }
          </p>
        </div>
      )}

      {/* Summary */}
      {filteredAndSortedTypes.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Summary</h3>
          <p className="text-blue-700">
            Displaying {filteredAndSortedTypes.length} of {subDocumentTypes.length} sub-document types 
            from your Azure SubDocumentTypes table. Total active sub-types: {statistics?.active_count || 0}.
          </p>
        </div>
      )}
    </div>
  );
}
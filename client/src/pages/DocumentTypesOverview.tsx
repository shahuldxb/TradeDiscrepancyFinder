import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Filter, BarChart3, TrendingUp, Database } from "lucide-react";

interface DocumentType {
  DocumentID: number;
  DocumentCode: string;
  document_type: string;
  Description: string;
  IsActive: boolean;
}

interface DocumentStatistics {
  total_documents: number;
  total_types: number;
  active_count: number;
  inactive_count: number;
}

export default function DocumentTypesOverview() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch document types from Azure MasterDocuments table
  const { data: documentTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['/api/document-types'],
  });

  // Fetch document statistics from Azure
  const { data: statistics } = useQuery({
    queryKey: ['/api/document-statistics'],
  });

  // Filter and sort document types
  const filteredAndSortedTypes = documentTypes
    .filter((type: DocumentType) => 
      type.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.DocumentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.Description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: DocumentType, b: DocumentType) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") {
        return multiplier * a.document_type.localeCompare(b.document_type);
      } else {
        return multiplier * (a.DocumentID - b.DocumentID);
      }
    });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-600";
  };

  const getCategoryIcon = (documentType: string) => {
    const type = documentType.toLowerCase();
    if (type.includes('invoice') || type.includes('commercial')) return '💰';
    if (type.includes('certificate') || type.includes('cert')) return '📜';
    if (type.includes('lading') || type.includes('transport')) return '🚢';
    if (type.includes('insurance')) return '🛡️';
    if (type.includes('letter') || type.includes('lc')) return '📧';
    if (type.includes('swift') || type.includes('mt')) return '💼';
    return '📄';
  };

  if (typesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Types Overview</h1>
          <p className="text-gray-600 mt-2">
            Complete catalog of {documentTypes.length} document types from Azure MasterDocuments table
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Azure SQL Connected</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_documents}</div>
              <p className="text-xs text-muted-foreground">
                Across {statistics.total_types} types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_types}</div>
              <p className="text-xs text-muted-foreground">
                Available categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics?.active_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.total_documents ? ((statistics.active_count / statistics.total_documents) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics?.inactive_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.total_documents ? ((statistics.inactive_count / statistics.total_documents) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search document types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: "name" | "count") => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="count">Sort by Count</SelectItem>
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

      {/* Document Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedTypes.map((type: DocumentType) => (
          <Card key={type.document_type} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{getCategoryIcon(type.document_type)}</div>
                <Badge className={getStatusColor(type.count)}>
                  {type.count} docs
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-medium leading-tight mb-2">
                {type.document_type}
              </CardTitle>
              <CardDescription className="text-xs">
                {type.count === 0 && "No documents available"}
                {type.count === 1 && "1 document in system"}
                {type.count > 1 && `${type.count} documents in system`}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredAndSortedTypes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No document types found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Summary</h3>
        <p className="text-blue-700">
          Displaying {filteredAndSortedTypes.length} of {documentTypes.length} document types 
          from your Azure MasterDocuments table. Total documents in system: {statistics?.total_documents || 0}.
        </p>
      </div>
    </div>
  );
}
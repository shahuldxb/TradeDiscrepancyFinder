import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Search, 
  Filter, 
  Grid, 
  List,
  ChevronRight,
  Database,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

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

interface GroupedSubDocuments {
  [masterDocId: number]: {
    masterDocument: MasterDocument;
    subDocuments: SubDocument[];
  };
}

export default function SubDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeOnly, setActiveOnly] = useState(true);

  // Fetch master documents
  const { data: masterDocuments, isLoading: isLoadingMasters } = useQuery<MasterDocument[]>({
    queryKey: ["/api/lifecycle/master-documents"],
  });

  // Fetch all sub-documents
  const { data: allSubDocuments, isLoading: isLoadingSubs } = useQuery<SubDocument[]>({
    queryKey: ["/api/lifecycle/sub-document-types"],
  });

  const isLoading = isLoadingMasters || isLoadingSubs;

  // Group sub-documents by master document
  const groupedSubDocuments: GroupedSubDocuments = React.useMemo(() => {
    if (!masterDocuments || !allSubDocuments) return {};

    const grouped: GroupedSubDocuments = {};

    masterDocuments.forEach(master => {
      const relatedSubs = allSubDocuments.filter(sub => 
        sub.ParentDocumentID === master.DocumentID
      );

      if (relatedSubs.length > 0) {
        grouped[master.DocumentID] = {
          masterDocument: master,
          subDocuments: relatedSubs
        };
      }
    });

    return grouped;
  }, [masterDocuments, allSubDocuments]);

  // Filter grouped data based on search and active filter
  const filteredGroupedData = React.useMemo(() => {
    if (!groupedSubDocuments) return {};

    const filtered: GroupedSubDocuments = {};

    Object.entries(groupedSubDocuments).forEach(([masterId, data]) => {
      const { masterDocument, subDocuments } = data;

      // Filter by search term
      const matchesSearch = !searchTerm || 
        masterDocument.DocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        masterDocument.DocumentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subDocuments.some(sub => 
          sub.SubDocumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.SubDocumentCode.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filter by active status
      const filteredSubs = activeOnly 
        ? subDocuments.filter(sub => sub.IsActive)
        : subDocuments;

      if (matchesSearch && filteredSubs.length > 0) {
        filtered[parseInt(masterId)] = {
          masterDocument,
          subDocuments: filteredSubs
        };
      }
    });

    return filtered;
  }, [groupedSubDocuments, searchTerm, activeOnly]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalMasters = Object.keys(filteredGroupedData).length;
    const totalSubs = Object.values(filteredGroupedData).reduce(
      (acc, group) => acc + group.subDocuments.length, 0
    );
    const activeSubs = Object.values(filteredGroupedData).reduce(
      (acc, group) => acc + group.subDocuments.filter(sub => sub.IsActive).length, 0
    );

    return { totalMasters, totalSubs, activeSubs };
  }, [filteredGroupedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sub Documents Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Browse and manage sub-documents organized by their master document relationships
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Master Documents</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalMasters}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sub Documents</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalSubs}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Documents</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.activeSubs}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={activeOnly ? "default" : "outline"}
                  onClick={() => setActiveOnly(!activeOnly)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Active Only</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? "default" : "outline"}
                  onClick={() => setViewMode('grid')}
                  size="sm"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "outline"}
                  onClick={() => setViewMode('list')}
                  size="sm"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(filteredGroupedData).length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sub Documents Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No sub documents are available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredGroupedData).map(([masterId, data]) => (
              <Card key={masterId} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-800 dark:to-indigo-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        {data.masterDocument.DocumentName}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300">
                        {data.masterDocument.DocumentCode} • Master ID: {data.masterDocument.DocumentID}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {data.subDocuments.length}
                      </div>
                      <div className="text-xs text-gray-500">Sub Documents</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "space-y-3"
                  }>
                    {data.subDocuments.map((subDoc) => (
                      <div
                        key={subDoc.SubDocumentID}
                        className={viewMode === 'grid'
                          ? "border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          : "flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        }
                      >
                        {viewMode === 'grid' ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-semibold text-sm">
                                {subDoc.SubDocumentID}
                              </span>
                              <Badge variant={subDoc.IsActive ? "default" : "secondary"} className="text-xs">
                                {subDoc.IsActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {subDoc.SubDocumentName}
                              </h4>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                {subDoc.SubDocumentCode}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {subDoc.Description}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4 flex-1">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-semibold text-sm">
                              {subDoc.SubDocumentID}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {subDoc.SubDocumentName}
                                </h4>
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                  {subDoc.SubDocumentCode}
                                </span>
                                <Badge variant={subDoc.IsActive ? "default" : "secondary"} className="text-xs">
                                  {subDoc.IsActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {subDoc.Description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
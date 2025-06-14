import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Database, 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface MasterDocument {
  DocumentID: number;
  DocumentCode: string;
  DocumentName: string;
  Description: string;
  IsActive: boolean;
}

export default function MasterDocuments() {
  const { data: masterDocuments, isLoading, error } = useQuery<MasterDocument[]>({
    queryKey: ["/api/lifecycle/master-documents"],
  });

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

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterDocuments.map((doc) => (
              <Card key={doc.DocumentID} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {doc.DocumentName}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {doc.DocumentCode}
                        </span>
                        <Badge variant={doc.IsActive ? "default" : "secondary"} className="text-xs">
                          {doc.IsActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        ID: {doc.DocumentID}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                    {doc.Description || "No description available"}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${doc.IsActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
      </div>
    </div>
  );
}
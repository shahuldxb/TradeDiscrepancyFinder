import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Database, 
  FileText, 
  GitBranch, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Zap
} from "lucide-react";

interface DashboardMetrics {
  masterDocuments: number;
  subDocumentTypes: number;
  lifecycleStates: number;
  mt7Dependencies: number;
  documentRequirements: number;
  totalRecords: number;
}

interface ActivityItem {
  action: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function LifecycleDashboard() {
  // Fetch dashboard metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/lifecycle/dashboard/metrics"],
  });

  const { data: recentActivity, isLoading: loadingActivity } = useQuery<ActivityItem[]>({
    queryKey: ["/api/lifecycle/dashboard/recent-activity"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/10 dark:to-purple-900/10">
      {/* Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20"></div>
        
        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <GitBranch className="w-5 h-5 text-white" />
              <span className="text-white font-medium">tf_genie Database Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Lifecycle <span className="text-blue-200">Management</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              Comprehensive dashboard for managing swift database tables, lifecycle states, and document workflows
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span>CRUD Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Master Documents</p>
                  <p className="text-3xl font-bold text-white">
                    {loadingMetrics ? "..." : metrics?.masterDocuments || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                swift.Masterdocuments
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Sub Document Types</p>
                  <p className="text-3xl font-bold text-white">
                    {loadingMetrics ? "..." : metrics?.subDocumentTypes || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-green-600">
                <BarChart3 className="w-4 h-4 mr-1" />
                swift.subdocumentypes
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Lifecycle States</p>
                  <p className="text-3xl font-bold text-white">
                    {loadingMetrics ? "..." : metrics?.lifecycleStates || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-purple-600">
                <Activity className="w-4 h-4 mr-1" />
                swift.Lifecyclestates
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">MT7 Dependencies</p>
                  <p className="text-3xl font-bold text-white">
                    {loadingMetrics ? "..." : metrics?.mt7Dependencies || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-orange-600">
                <Clock className="w-4 h-4 mr-1" />
                swift.ls_MT7SeriesDependencies
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription className="text-slate-200">
                  Common database operations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Add Master Document
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Create Sub Document Type
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Add Lifecycle State
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription className="text-indigo-200">
                  Latest database operations and changes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingActivity ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                        </div>
                        <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity found</p>
                    <p className="text-sm text-gray-500">Database operations will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span>Database Connection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Azure SQL Server Connected</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">tf_genie.database.windows.net</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <Database className="w-5 h-5" />
                <span>Schema Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700">swift schema active</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">5 core tables available</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-700">
                <BarChart3 className="w-5 h-5" />
                <span>Analytics View</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-purple-700">vw_ls_lifecycle ready</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">Grouped analytics available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
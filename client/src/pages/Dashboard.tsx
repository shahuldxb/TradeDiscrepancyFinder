import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import StatsGrid from "@/components/dashboard/StatsGrid";
import AgentStatusCard from "@/components/agent/AgentStatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, Shield, Zap, Activity, Globe, BarChart3, Users, Database } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: agentStatus, isLoading: agentLoading } = useQuery({
    queryKey: ["/api/agents/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: documentSets, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/document-sets"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10 flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Enhanced Executive Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Trade Finance Command Center
                  </h1>
                  <p className="text-blue-100 text-lg font-medium">
                    Real-time monitoring and intelligence dashboard
                  </p>
                </div>
              </div>
              
              <div className="hidden xl:flex items-center space-x-8">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm text-white/90">System Status</div>
                  <div className="text-lg font-bold text-white">Operational</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm text-white/90">Global Reach</div>
                  <div className="text-lg font-bold text-white">24/7</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm text-white/90">Security</div>
                  <div className="text-lg font-bold text-white">Enterprise</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8 -mt-6 relative z-10">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Documents Processed</p>
                    <p className="text-3xl font-bold text-white">{metrics?.documentsProcessed || 2847}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +24% increase this quarter
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Active Agents</p>
                    <p className="text-3xl font-bold text-white">{agentStatus?.activeAgents || 12}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center text-sm text-blue-600">
                  <Activity className="w-4 h-4 mr-1" />
                  Real-time monitoring active
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Compliance Rate</p>
                    <p className="text-3xl font-bold text-white">99.4%</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center text-sm text-purple-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  UCP 600 compliant
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Processing Speed</p>
                    <p className="text-3xl font-bold text-white">1.2s</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center text-sm text-orange-600">
                  <Clock className="w-4 h-4 mr-1" />
                  Average response time
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Processing Pipeline */}
            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Active Document Processing</h3>
                      <p className="text-slate-200 text-sm">Real-time analysis pipeline status</p>
                    </div>
                  </div>
                </div>
                <CardContent>
                  <div className="space-y-4">
                    {documentsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-muted rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : documentSets && documentSets.length > 0 ? (
                      documentSets.slice(0, 5).map((docSet: any) => (
                        <div key={docSet.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <FileText className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{docSet.setName || `Document Set ${docSet.id.slice(0, 8)}`}</h4>
                              <p className="text-sm text-muted-foreground">
                                {docSet.lcReference ? `LC: ${docSet.lcReference}` : 'Processing documents'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              docSet.status === 'completed' ? 'default' :
                              docSet.status === 'processing' ? 'secondary' :
                              docSet.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {docSet.status}
                            </Badge>
                            {docSet.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {docSet.status === 'processing' && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
                            {docSet.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No documents uploaded</h3>
                        <p className="text-muted-foreground mb-4">Start by uploading your first LC document set</p>
                        <Button className="banking-button-primary">
                          Upload Documents
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Agent Status & Alerts */}
            <div className="space-y-6">
              {/* CrewAI Agent Status */}
              <AgentStatusCard agents={agentStatus} isLoading={agentLoading} />

              {/* Recent Activity */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system events and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Analysis Completed</p>
                        <p className="text-xs text-muted-foreground">LC-2024-001 - No discrepancies found</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Document Uploaded</p>
                        <p className="text-xs text-muted-foreground">Commercial_Invoice.pdf</p>
                        <p className="text-xs text-muted-foreground">5 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Discrepancy Detected</p>
                        <p className="text-xs text-muted-foreground">Amount mismatch in LC-2024-002</p>
                        <p className="text-xs text-muted-foreground">12 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Review Discrepancies
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create ILC
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

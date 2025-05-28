import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import StatsGrid from "@/components/dashboard/StatsGrid";
import AgentStatusCard from "@/components/agent/AgentStatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";

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
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="Dashboard Overview"
          subtitle="Monitor LC document validation and discrepancy detection"
        />
        
        <div className="p-6">
          {/* Stats Grid */}
          <StatsGrid metrics={metrics} isLoading={metricsLoading} />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Document Processing Pipeline */}
            <div className="lg:col-span-2">
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Active Document Processing</CardTitle>
                  <CardDescription>Real-time status of document analysis pipeline</CardDescription>
                </CardHeader>
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

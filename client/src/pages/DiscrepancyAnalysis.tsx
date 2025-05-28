import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import DiscrepancyTable from "@/components/discrepancy/DiscrepancyTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, FileText, Filter } from "lucide-react";

export default function DiscrepancyAnalysis() {
  const { user } = useAuth();
  const [selectedDocumentSet, setSelectedDocumentSet] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: documentSets, isLoading: setsLoading } = useQuery({
    queryKey: ["/api/document-sets"],
  });

  const { data: discrepancies, isLoading: discrepanciesLoading } = useQuery({
    queryKey: ["/api/document-sets", selectedDocumentSet, "discrepancies"],
    enabled: !!selectedDocumentSet,
  });

  const filteredDiscrepancies = discrepancies?.filter((disc: any) => 
    severityFilter === "all" || disc.severity === severityFilter
  ) || [];

  const discrepancyStats = {
    total: filteredDiscrepancies.length,
    critical: filteredDiscrepancies.filter((d: any) => d.severity === "critical").length,
    high: filteredDiscrepancies.filter((d: any) => d.severity === "high").length,
    medium: filteredDiscrepancies.filter((d: any) => d.severity === "medium").length,
    low: filteredDiscrepancies.filter((d: any) => d.severity === "low").length,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="Discrepancy Analysis"
          subtitle="Review and manage document discrepancies detected by CrewAI agents"
        />
        
        <div className="p-6">
          {/* Document Set Selection */}
          <Card className="banking-card mb-6">
            <CardHeader>
              <CardTitle>Select Document Set</CardTitle>
              <CardDescription>Choose a document set to view its discrepancy analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select value={selectedDocumentSet} onValueChange={setSelectedDocumentSet}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select document set..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documentSets?.map((set: any) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.setName || `Set ${set.id.slice(0, 8)}`} - {set.lcReference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by severity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedDocumentSet ? (
            <>
              {/* Discrepancy Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card className="banking-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-foreground">{discrepancyStats.total}</p>
                      </div>
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Critical</p>
                        <p className="text-2xl font-bold text-red-600">{discrepancyStats.critical}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">High</p>
                        <p className="text-2xl font-bold text-orange-600">{discrepancyStats.high}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Medium</p>
                        <p className="text-2xl font-bold text-yellow-600">{discrepancyStats.medium}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Low</p>
                        <p className="text-2xl font-bold text-blue-600">{discrepancyStats.low}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Discrepancy Table */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  <DiscrepancyTable 
                    discrepancies={filteredDiscrepancies}
                    isLoading={discrepanciesLoading}
                  />
                </div>

                {/* Right Panel: Actions & Info */}
                <div className="space-y-6">
                  {/* Analysis Status */}
                  <Card className="banking-card">
                    <CardHeader>
                      <CardTitle>Analysis Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Document Intake Complete</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">MT Message Validation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Cross-Document Comparison</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">UCP 600 Rules Applied</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card className="banking-card">
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={discrepancyStats.critical > 0}
                        >
                          {discrepancyStats.critical > 0 ? 'Resolve Critical Issues' : 'Create ILC'}
                        </Button>
                        <Button variant="outline" className="w-full">
                          Export Report
                        </Button>
                        <Button variant="outline" className="w-full">
                          Request Waiver
                        </Button>
                        <Button variant="outline" className="w-full">
                          Re-run Analysis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* UCP References */}
                  <Card className="banking-card">
                    <CardHeader>
                      <CardTitle>UCP 600 References</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Article 14:</span> Standard for examination
                        </div>
                        <div>
                          <span className="font-medium">Article 18:</span> Commercial invoice
                        </div>
                        <div>
                          <span className="font-medium">Article 20:</span> Bill of lading
                        </div>
                        <div>
                          <span className="font-medium">Article 28:</span> Insurance documents
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendation */}
                  {discrepancyStats.critical > 0 && (
                    <Card className="banking-card border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-800">Recommendation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-red-700">
                          {discrepancyStats.critical} critical discrepancies found. 
                          Cannot proceed with ILC creation until all critical issues are resolved.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {discrepancyStats.critical === 0 && discrepancyStats.high > 0 && (
                    <Card className="banking-card border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="text-orange-800">Recommendation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-orange-700">
                          {discrepancyStats.high} high priority discrepancies found. 
                          Review recommended before proceeding with ILC creation.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {discrepancyStats.critical === 0 && discrepancyStats.high === 0 && (
                    <Card className="banking-card border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">Recommendation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-green-700">
                          No critical or high priority discrepancies found. 
                          Ready to proceed with ILC creation.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Card className="banking-card">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Document Set Selected</h3>
                  <p className="text-muted-foreground">
                    Please select a document set from the dropdown above to view its discrepancy analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

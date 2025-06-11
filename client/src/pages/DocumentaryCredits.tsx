import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Database, FileText, Settings, History, Workflow, Users, Loader2, Building2, Shield, TrendingUp, BarChart3, Activity, Globe } from "lucide-react";

interface DemoTable {
  schema: string;
  columns: any[];
  fullName: string;
}

interface DemoTables {
  [key: string]: DemoTable;
}

export default function DocumentaryCredits() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedCredit, setSelectedCredit] = useState<any>(null);

  // Discover demo tables structure
  const { data: demoTables, isLoading: isLoadingTables } = useQuery<DemoTables>({
    queryKey: ["/api/documentary-credits/discover"],
  });

  // Fetch all related data
  const { data: lifecycleStates, isLoading: isLoadingStates } = useQuery({
    queryKey: ["/api/documentary-credits/lifecycle-states"],
  });

  const { data: transitionRules, isLoading: isLoadingRules } = useQuery({
    queryKey: ["/api/documentary-credits/transition-rules"],
  });

  const { data: examinationStates, isLoading: isLoadingExamination } = useQuery({
    queryKey: ["/api/documentary-credits/examination-states"],
  });

  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ["/api/documentary-credits/workflows"],
  });

  const { data: businessRules, isLoading: isLoadingBusinessRules } = useQuery({
    queryKey: ["/api/documentary-credits/business-rules"],
  });

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/documentary-credits/history"],
  });

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const renderDataTable = (data: any[] | undefined, title: string, icon: any) => {
    if (!data || data.length === 0) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            {title}
            <Badge variant="secondary">{data.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.slice(0, 4).map((column) => (
                    <TableHead key={column} className="text-xs">
                      {column}
                    </TableHead>
                  ))}
                  {columns.length > 4 && <TableHead className="text-xs">...</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {columns.slice(0, 4).map((column) => (
                      <TableCell key={column} className="text-xs">
                        {String(row[column] || '').substring(0, 50)}
                        {String(row[column] || '').length > 50 && '...'}
                      </TableCell>
                    ))}
                    {columns.length > 4 && (
                      <TableCell className="text-xs text-muted-foreground">
                        +{columns.length - 4} more
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {data.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={Math.min(columns.length, 5)} className="text-center text-xs text-muted-foreground">
                      +{data.length - 5} more records
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingTables) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-900/10 dark:to-cyan-900/10">
      {/* Executive Banking Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Documentary Credits Management
                </h1>
                <p className="text-emerald-100 text-lg font-medium">
                  Enterprise LC processing with Azure SQL intelligence
                </p>
              </div>
            </div>
            
            <div className="hidden xl:flex items-center space-x-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Data Source</div>
                <div className="text-lg font-bold text-white">Azure SQL</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Compliance</div>
                <div className="text-lg font-bold text-white">UCP 600</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-2">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-white/90">Network</div>
                <div className="text-lg font-bold text-white">SWIFT</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-10">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active LCs</p>
                  <p className="text-3xl font-bold text-white">{demoTables ? Object.keys(demoTables).length : 847}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15% this month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Workflows</p>
                  <p className="text-3xl font-bold text-white">{workflows?.length || 24}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Workflow className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-green-600">
                <Activity className="w-4 h-4 mr-1" />
                Automated processes
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Business Rules</p>
                  <p className="text-3xl font-bold text-white">{businessRules?.length || 156}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-purple-600">
                <BarChart3 className="w-4 h-4 mr-1" />
                Compliance engine
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Processing States</p>
                  <p className="text-3xl font-bold text-white">{lifecycleStates?.length || 12}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <History className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center text-sm text-orange-600">
                <Users className="w-4 h-4 mr-1" />
                Lifecycle management
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tables Discovery */}
        {demoTables && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Azure SQL Demo Tables Discovery
              </CardTitle>
              <CardDescription>
                Found {Object.keys(demoTables).length} demo tables in Azure SQL database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(demoTables).map(([tableName, tableInfo]) => (
                  <Card key={tableName} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {tableInfo.fullName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tableInfo.columns.length} columns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        Schema: {tableInfo.schema}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="lifecycle" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="lifecycle" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="examination" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Examination
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lifecycle" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderDataTable(
                lifecycleStates as any[],
                "Lifecycle States",
                <Settings className="w-4 h-4" />
              )}
              {renderDataTable(
                transitionRules as any[],
                "Transition Rules",
                <Workflow className="w-4 h-4" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="examination" className="space-y-6">
            {renderDataTable(
              examinationStates as any[],
              "Document Examination States",
              <FileText className="w-4 h-4" />
            )}
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            {renderDataTable(
              workflows as any[],
              "Business Process Workflows",
              <Workflow className="w-4 h-4" />
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            {renderDataTable(
              businessRules as any[],
              "Business Rules",
              <Users className="w-4 h-4" />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {renderDataTable(
              history as any[],
              "State Transition History",
              <History className="w-4 h-4" />
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">System Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lifecycle States</span>
                    <Badge variant="outline">
                      {(lifecycleStates as any[])?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transition Rules</span>
                    <Badge variant="outline">
                      {(transitionRules as any[])?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Examination States</span>
                    <Badge variant="outline">
                      {(examinationStates as any[])?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflows</span>
                    <Badge variant="outline">
                      {(workflows as any[])?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Business Rules</span>
                    <Badge variant="outline">
                      {(businessRules as any[])?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">History Records</span>
                    <Badge variant="outline">
                      {(history as any[])?.length || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Data Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Azure SQL Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">SWIFT Demo Schema</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Production Environment</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Refresh Tables
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
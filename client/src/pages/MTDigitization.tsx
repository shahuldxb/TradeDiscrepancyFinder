import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Plus, 
  Edit, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  FileText,
  Settings,
  Activity,
  Code,
  Search,
  Filter,
  Save,
  Copy,
  ExternalLink,
  Network,
  Zap
} from "lucide-react";

export default function MTDigitization() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMessageType, setSelectedMessageType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMandatory, setFilterMandatory] = useState("all");

  // Fetch MT7xx message types from database
  const { data: messageTypes = {}, isLoading: isLoadingMessageTypes } = useQuery({
    queryKey: ["/api/swift/message-types"],
    enabled: isAuthenticated
  });

  // Fetch all MT7xx fields for the grid display
  const { data: allFields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ["/api/swift/all-fields"],
    enabled: isAuthenticated
  });

  // Get message type data for display
  const getMessageTypeData = () => {
    if (!messageTypes || typeof messageTypes !== 'object') return [];
    
    return Object.entries(messageTypes).map(([code, data]: [string, any]) => ({
      code,
      name: data.name || "Unknown",
      description: data.description || "",
      category: "Documentary Credits",
      fieldCount: data.fields?.length || 0,
      mandatoryFields: data.fields?.filter((f: any) => f.mandatory)?.length || 0
    }));
  };

  // Filter fields based on search and mandatory filter
  const getFilteredFields = () => {
    if (!Array.isArray(allFields)) return [];
    
    return allFields.filter((field: any) => {
      const matchesSearch = !searchTerm || 
        field.fieldCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMandatory = filterMandatory === "all" || 
        (filterMandatory === "mandatory" && field.mandatory) ||
        (filterMandatory === "optional" && !field.mandatory);
      
      return matchesSearch && matchesMandatory;
    });
  };

  const messageTypeData = getMessageTypeData();
  const filteredFields = getFilteredFields();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Database className="h-6 w-6" />
              MT xxx Digitization
            </CardTitle>
            <CardDescription>
              Please log in to access the MT7xx digitization module
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/api/login'}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopHeader title="MT xxx Digitization" />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      MT xxx Digitization
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      SWIFT MT7xx Message Field Reference & Validation System
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="validator" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Validator
                  </TabsTrigger>
                  <TabsTrigger value="constructor" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Constructor
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Templates
                  </TabsTrigger>
                  <TabsTrigger value="dependencies" className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Dependencies
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Projects
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Message Types</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{messageTypeData.length}</div>
                        <p className="text-xs text-muted-foreground">
                          MT7xx Types Available
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{filteredFields.length}</div>
                        <p className="text-xs text-muted-foreground">
                          SWIFT Field Definitions
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mandatory Fields</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filteredFields.filter((f: any) => f.mandatory).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for Processing
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Message Types Grid */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        MT7xx Message Types
                      </CardTitle>
                      <CardDescription>
                        All supported SWIFT MT7xx message types from database
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMessageTypes ? (
                        <div className="flex items-center justify-center p-8">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading message types...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {messageTypeData.map((type, index) => (
                            <div
                              key={type.code}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedMessageType === type.code
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : index % 2 === 0 
                                    ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'
                                    : 'border-gray-200 bg-white dark:bg-gray-700 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedMessageType(type.code)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="font-mono">
                                  {type.code}
                                </Badge>
                                <Badge variant="secondary">
                                  {type.fieldCount} fields
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-sm mb-1">{type.name}</h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {type.description}
                              </p>
                              <div className="mt-2 flex justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400">
                                  {type.mandatoryFields} mandatory
                                </span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  {type.fieldCount - type.mandatoryFields} optional
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Selected Message Type Fields */}
                  {selectedMessageType && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {selectedMessageType} Message Fields
                        </CardTitle>
                        <CardDescription>
                          Field specifications for {selectedMessageType} message type
                        </CardDescription>
                      
                      {/* Search and Filter Controls */}
                      <div className="flex gap-4 pt-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search fields by code, name, or description..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Select value={filterMandatory} onValueChange={setFilterMandatory}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Fields</SelectItem>
                            <SelectItem value="mandatory">Mandatory Only</SelectItem>
                            <SelectItem value="optional">Optional Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingFields ? (
                        <div className="flex items-center justify-center p-8">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading field definitions...</span>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-24">Field Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Format</TableHead>
                                <TableHead className="w-24">Required</TableHead>
                                <TableHead className="w-32">Max Length</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredFields.map((field: any, index: number) => (
                                <TableRow 
                                  key={`${field.fieldCode}-${index}`}
                                  className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'}
                                >
                                  <TableCell className="font-mono font-semibold">
                                    {field.fieldCode}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {field.name}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {field.format}
                                  </TableCell>
                                  <TableCell>
                                    {field.mandatory ? (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        Optional
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {field.maxLength || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                    {field.description}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          {filteredFields.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              No fields found matching your criteria
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Other tabs content - placeholder for now */}
                <TabsContent value="validator">
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Validator</CardTitle>
                      <CardDescription>Validate SWIFT MT7xx messages against field rules</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">Message validation functionality coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="constructor">
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Constructor</CardTitle>
                      <CardDescription>Build SWIFT MT7xx messages interactively</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">Message construction functionality coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="templates">
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Templates</CardTitle>
                      <CardDescription>Pre-built templates for common MT7xx scenarios</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">Template library coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dependencies">
                  <Card>
                    <CardHeader>
                      <CardTitle>Field Dependencies</CardTitle>
                      <CardDescription>View field relationships and dependencies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">Dependency analysis coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects">
                  <Card>
                    <CardHeader>
                      <CardTitle>MT7xx Projects</CardTitle>
                      <CardDescription>Manage your digitization projects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">Project management coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
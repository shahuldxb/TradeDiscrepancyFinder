import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import MessageTypeDetails from "@/components/swift/MessageTypeDetails";
import MT7FieldsGrid from "@/components/swift/MT7FieldsGrid";
import MessageFieldsGrid from "@/components/swift/MessageFieldsGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
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
import { apiRequest } from "@/lib/queryClient";

const MT7XX_MESSAGE_TYPES = [
  { code: "MT700", name: "Issue of a Documentary Credit", category: "Documentary Credits" },
  { code: "MT701", name: "Issue of a Documentary Credit (Extended)", category: "Documentary Credits" },
  { code: "MT705", name: "Pre-Advice of a Documentary Credit", category: "Documentary Credits" },
  { code: "MT707", name: "Amendment to a Documentary Credit", category: "Documentary Credits" },
  { code: "MT708", name: "Amendment to a Documentary Credit (Extended)", category: "Documentary Credits" },
  { code: "MT710", name: "Advice of a Third Bank's Documentary Credit", category: "Documentary Credits" },
  { code: "MT711", name: "Advice of a Non-Bank's Documentary Credit", category: "Documentary Credits" },
  { code: "MT720", name: "Transfer of a Documentary Credit", category: "Documentary Credits" },
  { code: "MT721", name: "Transfer of a Documentary Credit (Extended)", category: "Documentary Credits" },
  { code: "MT730", name: "Acknowledgement", category: "Documentary Credits" },
  { code: "MT732", name: "Advice of Discharge", category: "Documentary Credits" },
  { code: "MT734", name: "Advice of Refusal", category: "Documentary Credits" },
  { code: "MT740", name: "Authorization to Reimburse", category: "Reimbursements" },
  { code: "MT742", name: "Reimbursement Claim", category: "Reimbursements" },
  { code: "MT747", name: "Amendment to an Authorization to Reimburse", category: "Reimbursements" },
  { code: "MT750", name: "Advice of Discrepancy", category: "Documentary Credits" },
  { code: "MT752", name: "Authorization to Pay, Accept or Negotiate", category: "Documentary Credits" },
  { code: "MT754", name: "Advice of Payment/Acceptance/Negotiation", category: "Documentary Credits" },
  { code: "MT756", name: "Advice of Reimbursement or Payment", category: "Documentary Credits" },
  { code: "MT760", name: "Guarantee", category: "Guarantees" },
  { code: "MT767", name: "Amendment to a Guarantee", category: "Guarantees" },
  { code: "MT768", name: "Acknowledgement of a Guarantee Message", category: "Guarantees" },
  { code: "MT769", name: "Advice of Reduction or Release", category: "Guarantees" },
  { code: "MT775", name: "Amendment of a Documentary Credit", category: "Documentary Credits" },
  { code: "MT785", name: "Notification of Charges", category: "Charges" },
  { code: "MT786", name: "Request for Payment of Charges", category: "Charges" },
  { code: "MT787", name: "Advice of Charges", category: "Charges" },
];

export default function MTDigitization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState(false);
  const [validationText, setValidationText] = useState("");
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<string | null>(null);

  // Queries
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/digitization/projects"],
  });

  const { data: messageTypes, isLoading: messageTypesLoading } = useQuery({
    queryKey: ["/api/digitization/message-types"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/digitization/templates"],
  });

  const { data: validationResults, isLoading: validationLoading } = useQuery({
    queryKey: ["/api/digitization/validation-results"],
  });

  const { data: projectStats } = useQuery({
    queryKey: ["/api/digitization/stats"],
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: (projectData: any) => apiRequest("/api/digitization/projects", "POST", projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/digitization/projects"] });
      setIsCreateProjectOpen(false);
    },
  });

  const validateMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/digitization/validate", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/digitization/validation-results"] });
    },
  });

  const constructMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/digitization/construct", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/digitization/messages"] });
    },
  });

  const handleValidateMessage = () => {
    if (!validationText.trim()) return;
    
    validateMessageMutation.mutate({
      content: validationText,
      messageType: selectedMessageType,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
      case "info":
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="MT xxx Digitization"
          subtitle="SWIFT MT7xx Message Automation System - Comprehensive digitization and validation platform"
        />
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="validator">Message Validator</TabsTrigger>
              <TabsTrigger value="constructor">Message Constructor</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="messagefields">Message Fields</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* System Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="banking-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                        <p className="text-3xl font-bold text-foreground">{projectStats?.activeProjects || 0}</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Message Types</p>
                        <p className="text-3xl font-bold text-foreground">{MT7XX_MESSAGE_TYPES.length}</p>
                      </div>
                      <FileText className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Validated Messages</p>
                        <p className="text-3xl font-bold text-foreground">{projectStats?.validatedMessages || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="banking-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">System Status</p>
                        <p className="text-sm font-medium text-green-600">Online</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common SWIFT MT7xx digitization tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      onClick={() => setActiveTab("validator")} 
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                    >
                      <CheckCircle className="h-6 w-6" />
                      <span>Validate Message</span>
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab("constructor")} 
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                    >
                      <Plus className="h-6 w-6" />
                      <span>Construct Message</span>
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab("templates")} 
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                    >
                      <FileText className="h-6 w-6" />
                      <span>Browse Templates</span>
                    </Button>
                    
                    <Button 
                      onClick={() => setIsCreateProjectOpen(true)} 
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                    >
                      <Database className="h-6 w-6" />
                      <span>New Project</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Supported Message Types */}
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>Supported MT7xx Message Types</CardTitle>
                  <CardDescription>Complete SWIFT Category 7 implementation (2019 standards)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(
                      MT7XX_MESSAGE_TYPES.reduce((acc, msg) => {
                        if (!acc[msg.category]) acc[msg.category] = [];
                        acc[msg.category].push(msg);
                        return acc;
                      }, {} as Record<string, typeof MT7XX_MESSAGE_TYPES>)
                    ).map(([category, messages]) => (
                      <Card key={category} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">{category}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {messages.map((msg) => (
                              <div 
                                key={msg.code} 
                                className="flex items-center justify-between p-2 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedMessageForDetails(msg.code)}
                              >
                                <span className="text-sm font-mono font-medium">{msg.code}</span>
                                <Badge variant="outline" className="text-xs">{msg.name.substring(0, 20)}...</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Message Validator Tab */}
            <TabsContent value="validator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Validation Input */}
                <div className="lg:col-span-2">
                  <Card className="banking-card">
                    <CardHeader>
                      <CardTitle>SWIFT Message Validator</CardTitle>
                      <CardDescription>
                        Validate SWIFT MT7xx messages against 2019 Category 7 standards
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="messageType">Message Type</Label>
                        <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select MT7xx message type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {MT7XX_MESSAGE_TYPES.map((type) => (
                              <SelectItem key={type.code} value={type.code}>
                                {type.code} - {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="messageContent">SWIFT Message Content</Label>
                        <Textarea
                          id="messageContent"
                          placeholder="Paste your SWIFT MT7xx message here..."
                          value={validationText}
                          onChange={(e) => setValidationText(e.target.value)}
                          className="h-64 font-mono text-sm"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleValidateMessage}
                          disabled={!selectedMessageType || !validationText.trim() || validateMessageMutation.isPending}
                        >
                          {validateMessageMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validate Message
                            </>
                          )}
                        </Button>
                        
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </Button>
                        
                        <Button variant="outline">
                          <Copy className="h-4 w-4 mr-2" />
                          Sample Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Validation Rules & Help */}
                <div className="space-y-6">
                  <Card className="banking-card">
                    <CardHeader>
                      <CardTitle>Validation Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Field presence validation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Format validation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Cross-field dependencies</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Sequence validation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Network validated rules</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="banking-card">
                    <CardHeader>
                      <CardTitle>SWIFT Standards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span className="font-medium">7 (Documentary Credits)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Version:</span>
                          <span className="font-medium">November 2019</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Standards:</span>
                          <span className="font-medium">MT November 2019</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Validation Results */}
              {validationResults && validationResults.length > 0 && (
                <Card className="banking-card">
                  <CardHeader>
                    <CardTitle>Validation Results</CardTitle>
                    <CardDescription>Recent validation history and detailed error reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Message Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Errors</TableHead>
                          <TableHead>Warnings</TableHead>
                          <TableHead>Validated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResults.map((result: any) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-mono">{result.messageType}</TableCell>
                            <TableCell>
                              {result.isValid ? (
                                <Badge className="bg-green-100 text-green-800">Valid</Badge>
                              ) : (
                                <Badge variant="destructive">Invalid</Badge>
                              )}
                            </TableCell>
                            <TableCell>{result.totalErrors}</TableCell>
                            <TableCell>{result.totalWarnings}</TableCell>
                            <TableCell>{new Date(result.validatedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Message Constructor Tab */}
            <TabsContent value="constructor" className="space-y-6">
              <Card className="banking-card">
                <CardHeader>
                  <CardTitle>SWIFT Message Constructor</CardTitle>
                  <CardDescription>
                    Build valid MT7xx messages with guided field input and real-time validation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Message Constructor</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a message type to begin constructing a SWIFT MT7xx message
                    </p>
                    <div className="space-y-4 max-w-md mx-auto">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose message type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {MT7XX_MESSAGE_TYPES.map((type) => (
                            <SelectItem key={type.code} value={type.code}>
                              {type.code} - {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button>Start Construction</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card className="banking-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Message Templates</CardTitle>
                      <CardDescription>Pre-configured MT7xx message templates for quick construction</CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Standard MT700 Documentary Credit", type: "MT700", usage: 45 },
                      { name: "MT707 Amendment Template", type: "MT707", usage: 23 },
                      { name: "MT750 Discrepancy Advice", type: "MT750", usage: 12 },
                      { name: "MT760 Bank Guarantee", type: "MT760", usage: 8 },
                    ].map((template, index) => (
                      <Card key={index} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{template.type}</Badge>
                            <span className="text-xs text-muted-foreground">{template.usage} uses</span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <h4 className="font-medium mb-2">{template.name}</h4>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-3 w-3 mr-1" />
                              Use
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Message Fields Tab */}
            <TabsContent value="messagefields" className="space-y-6">
              <MessageFieldsGrid />
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card className="banking-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Digitization Projects</CardTitle>
                      <CardDescription>Manage your SWIFT MT7xx digitization projects</CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateProjectOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {projects?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Message Types</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project: any) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {project.messageTypes?.slice(0, 3).map((type: string) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                                {project.messageTypes?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{project.messageTypes.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-full">
                                <Progress 
                                  value={(project.completedMessages / project.totalMessages) * 100} 
                                  className="w-full"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {project.completedMessages}/{project.totalMessages}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(project.status)}</TableCell>
                            <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Projects Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first digitization project to get started
                      </p>
                      <Button onClick={() => setIsCreateProjectOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Digitization Project</DialogTitle>
            <DialogDescription>
              Set up a new SWIFT MT7xx message digitization project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" placeholder="Enter project name..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea id="projectDescription" placeholder="Project description..." />
            </div>
            
            <div className="space-y-2">
              <Label>Message Types</Label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {MT7XX_MESSAGE_TYPES.map((type) => (
                  <label key={type.code} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>{type.code}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
                Cancel
              </Button>
              <Button>Create Project</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Type Details Modal */}
      {selectedMessageForDetails && (
        <MessageTypeDetails
          messageType={selectedMessageForDetails}
          isOpen={!!selectedMessageForDetails}
          onClose={() => setSelectedMessageForDetails(null)}
        />
      )}
    </div>
  );
}
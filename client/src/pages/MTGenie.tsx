import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Badge,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui";
import {
  Building2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  Save,
  Play,
  Eye,
  MessageSquare,
  Workflow,
  Template,
  History,
  Settings,
  Zap,
  Database,
  Users,
  BookOpen,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  GitBranch,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MTGenieMessageType {
  id: string;
  messageTypeCode: string;
  name: string;
  fullName: string;
  purpose: string;
  signed: boolean;
  maxLength: number;
  mug: boolean;
  category: string;
  scope?: string;
  formatSpecifications?: string;
  networkValidatedRules?: any;
  usageRules?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MTGenieField {
  id: string;
  messageTypeId: string;
  tag: string;
  fieldName: string;
  isMandatory: boolean;
  contentOptions?: string;
  sequence: number;
  formatDescription?: string;
  presenceDescription?: string;
  definitionDescription?: string;
  validationRules?: any;
  formatOptions?: any;
  fieldCodes?: any;
  examples?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function MTGenie() {
  const [selectedMessageType, setSelectedMessageType] = useState<MTGenieMessageType | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<any>(null);
  const [constructedMessage, setConstructedMessage] = useState<any>(null);
  const [showFieldDetails, setShowFieldDetails] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch MT Genie message types
  const { data: messageTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ["/api/mt-genie/message-types"],
  });

  // Fetch fields for selected message type
  const { data: messageFields, isLoading: loadingFields } = useQuery({
    queryKey: ["/api/mt-genie/message-types", selectedMessageType?.id, "fields"],
    enabled: !!selectedMessageType?.id,
  });

  // Fetch dependencies for selected message type
  const { data: dependencies } = useQuery({
    queryKey: ["/api/mt-genie/message-types", selectedMessageType?.id, "dependencies"],
    enabled: !!selectedMessageType?.id,
  });

  // Fetch user instances
  const { data: instances } = useQuery({
    queryKey: ["/api/mt-genie/instances"],
  });

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["/api/mt-genie/templates", selectedMessageType?.id],
    enabled: !!selectedMessageType?.id,
  });

  // Fetch workflows
  const { data: workflows } = useQuery({
    queryKey: ["/api/mt-genie/workflows"],
  });

  // Seed MT Genie data mutation
  const seedDataMutation = useMutation({
    mutationFn: () => apiRequest("/api/mt-genie/seed", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mt-genie/message-types"] });
    },
  });

  // Validate message mutation
  const validateMutation = useMutation({
    mutationFn: (data: { messageTypeId: string; fieldValues: Record<string, string> }) =>
      apiRequest("/api/mt-genie/validate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      setValidationResults(result);
    },
  });

  // Construct message mutation
  const constructMutation = useMutation({
    mutationFn: (data: { messageTypeId: string; fieldValues: Record<string, string> }) =>
      apiRequest("/api/mt-genie/construct", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      setConstructedMessage(result);
    },
  });

  // Filter message types
  const filteredMessageTypes = Array.isArray(messageTypes) ? messageTypes.filter((mt: MTGenieMessageType) => {
    const matchesSearch = mt.messageTypeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mt.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "all" || mt.category === filterCategory;
    return matchesSearch && matchesFilter;
  }) : [];

  const handleFieldChange = (tag: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [tag]: value }));
  };

  const handleValidate = () => {
    if (selectedMessageType) {
      validateMutation.mutate({
        messageTypeId: selectedMessageType.id,
        fieldValues,
      });
    }
  };

  const handleConstruct = () => {
    if (selectedMessageType) {
      constructMutation.mutate({
        messageTypeId: selectedMessageType.id,
        fieldValues,
      });
    }
  };

  const handleSeedData = () => {
    seedDataMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            MT Genie
          </h1>
          <p className="text-muted-foreground">
            Comprehensive Trade Finance MT Message Management System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSeedData}
            disabled={seedDataMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {seedDataMutation.isPending ? "Seeding..." : "Seed Data"}
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message Types</p>
                <p className="text-2xl font-bold">{Array.isArray(messageTypes) ? messageTypes.length : 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Instances</p>
                <p className="text-2xl font-bold">{Array.isArray(instances) ? instances.length : 0}</p>
              </div>
              <History className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{Array.isArray(templates) ? templates.length : 0}</p>
              </div>
              <Template className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflows</p>
                <p className="text-2xl font-bold">{Array.isArray(workflows) ? workflows.length : 0}</p>
              </div>
              <Workflow className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Types Browser */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                SWIFT MT7xx Messages
              </CardTitle>
              <CardDescription>
                Browse and select message types to work with
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search message types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="7">Category 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Types List */}
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {loadingTypes ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading message types...
                    </div>
                  ) : filteredMessageTypes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No message types found
                    </div>
                  ) : (
                    filteredMessageTypes.map((mt: MTGenieMessageType) => (
                      <Card
                        key={mt.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedMessageType?.id === mt.id
                            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
                            : ""
                        }`}
                        onClick={() => setSelectedMessageType(mt)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  MT{mt.messageTypeCode}
                                </span>
                                {mt.signed && (
                                  <Badge variant="secondary" className="text-xs">
                                    Signed
                                  </Badge>
                                )}
                                {mt.mug && (
                                  <Badge variant="outline" className="text-xs">
                                    MUG
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-sm leading-tight">
                                {mt.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {mt.purpose}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Message Details and Builder */}
        <div className="lg:col-span-2">
          {!selectedMessageType ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Message Type</h3>
                <p className="text-muted-foreground">
                  Choose a SWIFT MT message type from the list to view details and build messages
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
                        MT{selectedMessageType.messageTypeCode}
                      </span>
                      {selectedMessageType.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {selectedMessageType.fullName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Documentation
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      SWIFT Spec
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                    <TabsTrigger value="builder">Builder</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Message Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Message Type:</span>
                            <span className="text-sm font-mono">MT{selectedMessageType.messageTypeCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Category:</span>
                            <span className="text-sm">Category {selectedMessageType.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Max Length:</span>
                            <span className="text-sm">{selectedMessageType.maxLength} chars</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Signed:</span>
                            <Badge variant={selectedMessageType.signed ? "default" : "secondary"}>
                              {selectedMessageType.signed ? "Yes" : "No"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">MUG:</span>
                            <Badge variant={selectedMessageType.mug ? "default" : "secondary"}>
                              {selectedMessageType.mug ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Usage Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Total Fields:</span>
                            <span className="text-sm">{Array.isArray(messageFields) ? messageFields.length : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Mandatory Fields:</span>
                            <span className="text-sm text-red-600">
                              {Array.isArray(messageFields) ? messageFields.filter((f: MTGenieField) => f.isMandatory).length : 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Optional Fields:</span>
                            <span className="text-sm text-blue-600">
                              {Array.isArray(messageFields) ? messageFields.filter((f: MTGenieField) => !f.isMandatory).length : 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Dependencies:</span>
                            <span className="text-sm">{Array.isArray(dependencies) ? dependencies.length : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">My Instances:</span>
                            <span className="text-sm">{Array.isArray(instances) ? instances.filter((i: any) => i.instance.messageTypeId === selectedMessageType.id).length : 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Purpose & Scope</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedMessageType.purpose}
                        </p>
                        {selectedMessageType.scope && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Scope:</h4>
                            <p className="text-sm text-muted-foreground">{selectedMessageType.scope}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Network Validated Rules */}
                    {selectedMessageType.networkValidatedRules && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Network Validated Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(selectedMessageType.networkValidatedRules).map(([key, value]) => (
                              <div key={key} className="border-l-4 border-red-500 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="destructive">{key}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{value as string}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Usage Rules */}
                    {selectedMessageType.usageRules && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Usage Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(selectedMessageType.usageRules).map(([key, value]) => (
                              <div key={key} className="border-l-4 border-blue-500 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary">{key}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{value as string}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Fields Tab */}
                  <TabsContent value="fields" className="space-y-4">
                    {loadingFields ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading field details...
                      </div>
                    ) : !Array.isArray(messageFields) || messageFields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No fields found for this message type
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Total Fields: {messageFields.length} | 
                            Mandatory: {messageFields.filter((f: MTGenieField) => f.isMandatory).length} | 
                            Optional: {messageFields.filter((f: MTGenieField) => !f.isMandatory).length}
                          </div>
                        </div>

                        {/* Mandatory Fields */}
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Mandatory Fields
                          </h4>
                          <div className="space-y-2">
                            {messageFields
                              .filter((field: MTGenieField) => field.isMandatory)
                              .sort((a: MTGenieField, b: MTGenieField) => a.sequence - b.sequence)
                              .map((field: MTGenieField) => (
                                <Card key={field.id} className="border-l-4 border-l-red-500">
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-semibold text-sm">
                                            {field.tag}
                                          </span>
                                          <Badge variant="destructive" className="text-xs">
                                            Required
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            #{field.sequence}
                                          </span>
                                        </div>
                                        <div className="text-sm font-medium mt-1">
                                          {field.fieldName}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {field.definitionDescription}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Format: {field.formatDescription || 'Not specified'}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowFieldDetails(field.id)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>

                        {/* Optional Fields */}
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Optional Fields
                          </h4>
                          <div className="space-y-2">
                            {messageFields
                              .filter((field: MTGenieField) => !field.isMandatory)
                              .sort((a: MTGenieField, b: MTGenieField) => a.sequence - b.sequence)
                              .map((field: MTGenieField) => (
                                <Card key={field.id} className="border-l-4 border-l-blue-500">
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-semibold text-sm">
                                            {field.tag}
                                          </span>
                                          <Badge variant="secondary" className="text-xs">
                                            Optional
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            #{field.sequence}
                                          </span>
                                        </div>
                                        <div className="text-sm font-medium mt-1">
                                          {field.fieldName}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {field.definitionDescription}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Format: {field.formatDescription || 'Not specified'}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowFieldDetails(field.id)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Builder Tab */}
                  <TabsContent value="builder" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Message Builder</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleValidate}
                          disabled={validateMutation.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {validateMutation.isPending ? "Validating..." : "Validate"}
                        </Button>
                        <Button
                          onClick={handleConstruct}
                          disabled={constructMutation.isPending}
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {constructMutation.isPending ? "Building..." : "Build Message"}
                        </Button>
                      </div>
                    </div>

                    {/* Validation Results */}
                    {validationResults && (
                      <Alert className={validationResults.isValid ? "border-green-500" : "border-red-500"}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>
                          {validationResults.isValid ? "Validation Passed" : "Validation Failed"}
                        </AlertTitle>
                        <AlertDescription>
                          {validationResults.summary}
                          {!validationResults.isValid && validationResults.validationResults && (
                            <ul className="mt-2 space-y-1">
                              {validationResults.validationResults.map((error: any, index: number) => (
                                <li key={index} className="text-sm">• {error.message}</li>
                              ))}
                            </ul>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Constructed Message */}
                    {constructedMessage && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Constructed Message</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                            {constructedMessage.messageContent}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Fields used: {constructedMessage.fieldCount} / {constructedMessage.totalFields}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Field Input Form */}
                    <div className="space-y-4">
                      {Array.isArray(messageFields) && messageFields
                        .sort((a: MTGenieField, b: MTGenieField) => a.sequence - b.sequence)
                        .map((field: MTGenieField) => (
                          <Card key={field.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="min-w-0 flex-1">
                                  <Label htmlFor={field.tag} className="text-sm font-medium">
                                    <span className="font-mono">{field.tag}</span> - {field.fieldName}
                                    {field.isMandatory && (
                                      <Badge variant="destructive" className="ml-2 text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </Label>
                                  {field.definitionDescription && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {field.definitionDescription}
                                    </p>
                                  )}
                                  <div className="mt-2">
                                    {field.tag === "45A" || field.tag === "46A" || field.tag === "47A" || field.tag === "78" ? (
                                      <Textarea
                                        id={field.tag}
                                        placeholder={`Enter ${field.fieldName}...`}
                                        value={fieldValues[field.tag] || ""}
                                        onChange={(e) => handleFieldChange(field.tag, e.target.value)}
                                        className="min-h-20"
                                      />
                                    ) : (
                                      <Input
                                        id={field.tag}
                                        placeholder={`Enter ${field.fieldName}...`}
                                        value={fieldValues[field.tag] || ""}
                                        onChange={(e) => handleFieldChange(field.tag, e.target.value)}
                                      />
                                    )}
                                  </div>
                                  {field.examples && Array.isArray(field.examples) && field.examples.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-muted-foreground">Examples:</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {field.examples.slice(0, 3).map((example: string, index: number) => (
                                          <Button
                                            key={index}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => handleFieldChange(field.tag, example)}
                                          >
                                            {example}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>

                  {/* Templates Tab */}
                  <TabsContent value="templates">
                    <div className="text-center py-8 text-muted-foreground">
                      <Template className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Message Templates</h3>
                      <p>Template management coming soon</p>
                    </div>
                  </TabsContent>

                  {/* Dependencies Tab */}
                  <TabsContent value="dependencies">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Message Dependencies
                      </h3>
                      {!Array.isArray(dependencies) || dependencies.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <GitBranch className="h-12 w-12 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Dependencies</h3>
                          <p>This message type has no documented dependencies</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dependencies.map((dep: any, index: number) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">{dep.dependency.dependencyType}</Badge>
                                      <span className="font-mono text-sm">
                                        MT{dep.targetMessageType?.messageTypeCode}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {dep.dependency.description}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
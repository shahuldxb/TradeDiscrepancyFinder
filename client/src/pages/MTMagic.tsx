import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { 
  Wand2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Download,
  Eye,
  GitBranch,
  Shield,
  BarChart3,
  Users,
  Settings,
  Zap
} from "lucide-react";

interface MTMessage {
  id: string;
  messageType: string;
  content: string;
  status: 'draft' | 'validated' | 'sent' | 'failed';
  createdAt: string;
  validationErrors?: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface MessageTemplate {
  messageType: string;
  name: string;
  description: string;
  fields: TemplateField[];
}

interface TemplateField {
  tag: string;
  name: string;
  format: string;
  mandatory: boolean;
  description: string;
  validationRules?: string[];
  dependencies?: string[];
}

export default function MTMagic() {
  const [activeTab, setActiveTab] = useState("composer");
  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch available message templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/mt-magic/templates"],
  });

  // Fetch user messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/mt-magic/messages"],
  });

  // Validate message mutation
  const validateMutation = useMutation({
    mutationFn: (data: { messageType: string; content: string }) =>
      apiRequest("/api/mt-magic/validate", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mt-magic/messages"] });
    },
  });

  // Construct message mutation
  const constructMutation = useMutation({
    mutationFn: (data: { messageType: string; fields: Record<string, string> }) =>
      apiRequest("/api/mt-magic/construct", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mt-magic/messages"] });
    },
  });

  // Save message mutation
  const saveMutation = useMutation({
    mutationFn: (data: { messageType: string; content: string; fields?: Record<string, string> }) =>
      apiRequest("/api/mt-magic/messages", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mt-magic/messages"] });
    },
  });

  const handleValidateMessage = () => {
    if (!selectedMessageType || !messageContent) return;
    
    validateMutation.mutate({
      messageType: selectedMessageType,
      content: messageContent,
    });
  };

  const handleConstructMessage = () => {
    if (!selectedMessageType) return;
    
    constructMutation.mutate({
      messageType: selectedMessageType,
      fields: fieldValues,
    });
  };

  const handleFieldChange = (tag: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [tag]: value,
    }));
  };

  const selectedTemplate = templates?.find((t: MessageTemplate) => t.messageType === selectedMessageType);

  const renderValidationResults = (errors: ValidationError[]) => {
    return (
      <div className="space-y-2">
        {errors.map((error, index) => (
          <Alert key={index} className={
            error.severity === 'error' ? 'border-red-200 bg-red-50' :
            error.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">{error.field}:</span> {error.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-purple-600" />
            MT Magic
          </h1>
          <p className="text-muted-foreground mt-2">
            SWIFT MT7xx Message Automation System - Validate, construct, and manage documentary credit messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="composer" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Message Composer
          </TabsTrigger>
          <TabsTrigger value="validator" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Message Validator
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Field Dependencies
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Management
          </TabsTrigger>
        </TabsList>

        {/* Message Composer Tab */}
        <TabsContent value="composer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Message Construction
                  </CardTitle>
                  <CardDescription>
                    Build SWIFT MT7xx messages using guided field entry
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="messageType">Message Type</Label>
                    <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select MT7xx message type" />
                      </SelectTrigger>
                      <SelectContent>
                        {templatesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          templates?.map((template: MessageTemplate) => (
                            <SelectItem key={template.messageType} value={template.messageType}>
                              {template.messageType} - {template.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium">Message Fields</h4>
                        <ScrollArea className="h-96 border rounded-md p-4">
                          <div className="space-y-4">
                            {selectedTemplate.fields.map((field) => (
                              <div key={field.tag} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={field.tag} className="flex items-center gap-2">
                                    {field.tag} - {field.name}
                                    {field.mandatory && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </Label>
                                  <Badge variant="outline" className="text-xs">
                                    {field.format}
                                  </Badge>
                                </div>
                                <Input
                                  id={field.tag}
                                  placeholder={field.description}
                                  value={fieldValues[field.tag] || ""}
                                  onChange={(e) => handleFieldChange(field.tag, e.target.value)}
                                />
                                {field.dependencies && field.dependencies.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Dependencies: {field.dependencies.join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleConstructMessage}
                          disabled={constructMutation.isPending}
                          className="flex-1"
                        >
                          {constructMutation.isPending ? "Constructing..." : "Construct Message"}
                        </Button>
                        <Button variant="outline" onClick={() => setFieldValues({})}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Message Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {constructMutation.data ? (
                    <div className="space-y-4">
                      <Textarea
                        value={constructMutation.data.content || ""}
                        readOnly
                        className="min-h-32 font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => saveMutation.mutate({
                            messageType: selectedMessageType,
                            content: constructMutation.data.content,
                            fields: fieldValues
                          })}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Message preview will appear here after construction
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Messages:</span>
                    <span className="font-medium">{messages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Validated:</span>
                    <span className="font-medium">
                      {messages?.filter((m: MTMessage) => m.status === 'validated')?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sent:</span>
                    <span className="font-medium">
                      {messages?.filter((m: MTMessage) => m.status === 'sent')?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Message Validator Tab */}
        <TabsContent value="validator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Message Validation
              </CardTitle>
              <CardDescription>
                Validate existing SWIFT MT7xx messages against 2019 standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="validationMessageType">Message Type</Label>
                <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type for validation" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: MessageTemplate) => (
                      <SelectItem key={template.messageType} value={template.messageType}>
                        {template.messageType} - {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="messageContent">Message Content</Label>
                <Textarea
                  id="messageContent"
                  placeholder="Paste your SWIFT MT7xx message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="min-h-32 font-mono"
                />
              </div>

              <Button 
                onClick={handleValidateMessage}
                disabled={validateMutation.isPending || !selectedMessageType || !messageContent}
                className="w-full"
              >
                {validateMutation.isPending ? "Validating..." : "Validate Message"}
              </Button>

              {validateMutation.data && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center gap-2">
                    {validateMutation.data.isValid ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-600">Message is valid</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-600">Validation failed</span>
                      </>
                    )}
                  </div>
                  
                  {validateMutation.data.errors?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Validation Issues</h4>
                      {renderValidationResults(validateMutation.data.errors)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Field Dependencies
              </CardTitle>
              <CardDescription>
                Visualize and manage field interdependencies within MT7xx messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Field dependency visualization will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Analytics dashboard coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Trends visualization coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Error analysis coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User & System Management
              </CardTitle>
              <CardDescription>
                Manage users, permissions, and system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  User management interface will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
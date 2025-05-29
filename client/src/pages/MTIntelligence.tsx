import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, CheckCircle, XCircle, AlertTriangle, Send, FileText, Search, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MTIntelligence() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("validate");
  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Fetch available message types
  const { data: messageTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["/api/mt-intelligence/message-types"],
    enabled: isAuthenticated
  });

  // Fetch fields for selected message type
  const { data: messageTypeFields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ["/api/mt-intelligence/message-types", selectedMessageType, "fields"],
    enabled: !!selectedMessageType
  });

  // Fetch validation history
  const { data: validationHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/mt-intelligence/validation-history"],
    enabled: isAuthenticated
  });

  // Message validation mutation
  const validateMutation = useMutation({
    mutationFn: async (data: { messageTypeCode: string; messageContent: string }) => {
      return apiRequest("/api/mt-intelligence/validate", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.isValid ? "Validation Successful" : "Validation Failed",
        description: `Found ${data.summary.totalErrors} errors and ${data.summary.totalWarnings} warnings`,
        variant: data.isValid ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mt-intelligence/validation-history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate message",
        variant: "destructive"
      });
    }
  });

  // Message construction mutation
  const constructMutation = useMutation({
    mutationFn: async (data: { messageTypeCode: string; fieldValues: Record<string, string> }) => {
      return apiRequest("/api/mt-intelligence/construct", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setMessageContent(data.content);
      toast({
        title: "Message Constructed",
        description: `${data.messageTypeCode} message created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Construction Error",
        description: error.message || "Failed to construct message",
        variant: "destructive"
      });
    }
  });

  const handleValidateMessage = () => {
    if (!selectedMessageType || !messageContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a message type and provide message content",
        variant: "destructive"
      });
      return;
    }

    validateMutation.mutate({
      messageTypeCode: selectedMessageType,
      messageContent: messageContent.trim()
    });
  };

  const handleConstructMessage = () => {
    if (!selectedMessageType) {
      toast({
        title: "Construction Error",
        description: "Please select a message type",
        variant: "destructive"
      });
      return;
    }

    constructMutation.mutate({
      messageTypeCode: selectedMessageType,
      fieldValues
    });
  };

  const handleFieldValueChange = (fieldCode: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldCode]: value
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Database className="h-6 w-6" />
              MT Intelligence
            </CardTitle>
            <CardDescription>
              Please log in to access the MT Intelligence system
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
          <TopHeader title="MT Intelligence" />
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
                      MT Intelligence
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      SWIFT Message Validation & Construction System
                    </p>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="validate" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Validate Message
                  </TabsTrigger>
                  <TabsTrigger value="construct" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Construct Message
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Validation History
                  </TabsTrigger>
                </TabsList>

                {/* Message Validation Tab */}
                <TabsContent value="validate" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Validation</CardTitle>
                      <CardDescription>
                        Validate SWIFT MT7xx messages against official standards and business rules
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="validate-message-type">Message Type</Label>
                          <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select message type" />
                            </SelectTrigger>
                            <SelectContent>
                              {messageTypes.map((type: any) => (
                                <SelectItem key={type.id} value={type.messageTypeCode}>
                                  {type.messageTypeCode} - {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message-content">Message Content</Label>
                        <Textarea
                          id="message-content"
                          placeholder="Paste your SWIFT message content here..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleValidateMessage} 
                          disabled={validateMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {validateMutation.isPending ? "Validating..." : "Validate Message"}
                        </Button>
                      </div>

                      {/* Validation Results */}
                      {validateMutation.data && (
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center gap-2">
                            {validateMutation.data.isValid ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <h3 className="text-lg font-semibold">
                              Validation {validateMutation.data.isValid ? "Passed" : "Failed"}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-red-600">
                                  {validateMutation.data.summary.totalErrors}
                                </div>
                                <p className="text-sm text-gray-600">Errors</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-yellow-600">
                                  {validateMutation.data.summary.totalWarnings}
                                </div>
                                <p className="text-sm text-gray-600">Warnings</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-blue-600">
                                  {validateMutation.data.summary.fieldsValidated}
                                </div>
                                <p className="text-sm text-gray-600">Fields Validated</p>
                              </CardContent>
                            </Card>
                          </div>

                          {validateMutation.data.validationErrors.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold">Validation Issues</h4>
                              <ScrollArea className="h-64 w-full border rounded-md p-4">
                                {validateMutation.data.validationErrors.map((error: any, index: number) => (
                                  <Alert key={index} className="mb-2" variant={error.severity === "error" ? "destructive" : "default"}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={error.severity === "error" ? "destructive" : "secondary"}>
                                          {error.severity.toUpperCase()}
                                        </Badge>
                                        <span className="font-mono text-sm">{error.fieldCode}</span>
                                      </div>
                                      {error.errorMessage}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Message Construction Tab */}
                <TabsContent value="construct" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Construction</CardTitle>
                      <CardDescription>
                        Build valid SWIFT MT7xx messages using guided field input
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="construct-message-type">Message Type</Label>
                        <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select message type" />
                          </SelectTrigger>
                          <SelectContent>
                            {messageTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.messageTypeCode}>
                                {type.messageTypeCode} - {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {messageTypeFields.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Message Fields</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {messageTypeFields.map((item: any) => {
                              const field = item.field;
                              const fieldInfo = item.messageTypeField;
                              return (
                                <div key={field.id} className="space-y-2">
                                  <Label htmlFor={field.fieldCode}>
                                    {field.fieldCode} - {field.name}
                                    {fieldInfo.isMandatory && (
                                      <Badge variant="destructive" className="ml-2">Required</Badge>
                                    )}
                                  </Label>
                                  <Input
                                    id={field.fieldCode}
                                    placeholder={`Format: ${field.format}`}
                                    value={fieldValues[field.fieldCode] || ""}
                                    onChange={(e) => handleFieldValueChange(field.fieldCode, e.target.value)}
                                    maxLength={field.maxLength}
                                  />
                                  <p className="text-xs text-gray-600">{field.description}</p>
                                </div>
                              );
                            })}
                          </div>

                          <Button 
                            onClick={handleConstructMessage} 
                            disabled={constructMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            {constructMutation.isPending ? "Constructing..." : "Construct Message"}
                          </Button>
                        </div>
                      )}

                      {/* Constructed Message Output */}
                      {constructMutation.data && (
                        <div className="space-y-2">
                          <Label>Constructed Message</Label>
                          <Textarea
                            value={constructMutation.data.content}
                            readOnly
                            rows={12}
                            className="font-mono text-sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Validation History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation History</CardTitle>
                      <CardDescription>
                        Recent message validation results and analytics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96 w-full">
                        {isLoadingHistory ? (
                          <div className="text-center py-8 text-gray-600">Loading history...</div>
                        ) : validationHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-600">No validation history found</div>
                        ) : (
                          <div className="space-y-4">
                            {validationHistory.map((result: any) => (
                              <Card key={result.id} className="border-l-4 border-l-blue-500">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {result.isValid ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      )}
                                      <span className="font-semibold">
                                        {result.isValid ? "Valid" : "Invalid"}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {new Date(result.validationDate).toLocaleString()}
                                    </span>
                                  </div>
                                  {result.validationSummary && (
                                    <div className="text-sm text-gray-600">
                                      Message Type: {result.validationSummary.messageTypeCode} | 
                                      Errors: {result.validationSummary.totalErrors} | 
                                      Warnings: {result.validationSummary.totalWarnings}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
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
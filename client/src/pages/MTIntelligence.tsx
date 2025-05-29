import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Upload, 
  Database,
  Search,
  Filter,
  Download,
  Settings,
  Eye,
  RefreshCw
} from "lucide-react";

export default function MTIntelligence() {
  const [selectedTab, setSelectedTab] = useState("messages");
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedMessageType, setSelectedMessageType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch SWIFT message types from Azure SQL
  const { data: messageTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
  });

  // Fetch validation statistics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/swift/statistics"],
  });

  // Fetch table data for database browser
  const { data: tableData, isLoading: loadingTable } = useQuery({
    queryKey: ["/api/swift/table-data", selectedTable],
    enabled: !!selectedTable,
  });

  // Fetch comprehensive message data when a message type is selected
  const { data: comprehensiveData, isLoading: loadingComprehensiveData } = useQuery({
    queryKey: ["/api/swift/comprehensive-data", selectedMessageType?.message_type_code],
    enabled: !!selectedMessageType,
  });

  const handleMessageValidation = async () => {
    if (!messageText || !messageType) return;
    
    try {
      const response = await fetch("/api/swift/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText, messageType })
      });
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  const swiftTables = [
    { name: "message_types", description: "SWIFT message type definitions" },
    { name: "message_fields", description: "Field definitions for each message type" },
    { name: "field_specifications", description: "Detailed field specifications" },
    { name: "field_validation_rules", description: "Validation rules for fields" },
    { name: "message_dependencies", description: "Message dependencies and flows" },
    { name: "network_validated_rules", description: "Network validation rules" },
    { name: "usage_rules", description: "Usage rules for message types" },
    { name: "field_codes", description: "Standardized field codes" },
    { name: "field_format_options", description: "Format options for fields" },
    { name: "message_instances", description: "Stored message instances" },
    { name: "message_field_values", description: "Field values for instances" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            MT Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            SWIFT Message Validation & Document Parsing Platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            Azure SQL
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Message Types</p>
                <p className="text-2xl font-bold">{stats?.messageTypes || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validated Messages</p>
                <p className="text-2xl font-bold">{stats?.validatedMessages || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid Messages</p>
                <p className="text-2xl font-bold">{stats?.validMessages || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues Found</p>
                <p className="text-2xl font-bold">{stats?.issuesFound || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Application Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="messages">SWIFT Messages</TabsTrigger>
          <TabsTrigger value="validator">Message Validator</TabsTrigger>
          <TabsTrigger value="parser">Document Parser</TabsTrigger>
          <TabsTrigger value="database">Database Browser</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        {/* SWIFT Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SWIFT Message Types</CardTitle>
              <CardDescription>
                Browse all SWIFT MT7xx message types with detailed field specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {messageTypes?.filter((msg: any) => 
                  msg.message_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  msg.message_type_code.includes(searchTerm)
                ).map((message: any) => (
                  <Card 
                    key={message.message_type_code}
                    className="cursor-pointer hover:bg-blue-50 border-l-4 border-l-blue-500 transition-colors"
                    onClick={() => setSelectedMessageType(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-blue-100 rounded-lg p-2 min-w-fit">
                            <span className="font-mono font-bold text-blue-800">MT{message.message_type_code}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{message.message_type_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{message.purpose}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">Category {message.category}</Badge>
                              <Badge variant={message.signed ? 'default' : 'secondary'}>
                                {message.signed ? 'Signed' : 'Unsigned'}
                              </Badge>
                              <span className="text-xs text-gray-500">Max: {message.max_length} chars</span>
                            </div>
                          </div>
                        </div>
                        <Eye className="w-5 h-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {loadingTypes && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading SWIFT messages...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Details Modal/Panel */}
          {selectedMessageType && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>MT{selectedMessageType.message_type_code} - {selectedMessageType.message_type_name}</CardTitle>
                    <CardDescription>Field specifications, rules, and dependencies</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedMessageType(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fields" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                    <TabsTrigger value="rules">Validation Rules</TabsTrigger>
                    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                    <TabsTrigger value="codes">Field Codes</TabsTrigger>
                    <TabsTrigger value="instances">Message Instances</TabsTrigger>
                  </TabsList>

                  <TabsContent value="fields" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Message Fields</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Field Tag</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Format</th>
                              <th className="px-4 py-2 text-left">Mandatory</th>
                              <th className="px-4 py-2 text-left">Sequence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingComprehensiveData ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center">
                                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                                  Loading fields...
                                </td>
                              </tr>
                            ) : comprehensiveData?.fields?.map((field: any, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-mono text-sm">{field.field_tag}</td>
                                <td className="px-4 py-2">
                                  <div>
                                    <div className="font-medium">{field.field_name}</div>
                                    {field.field_description && (
                                      <div className="text-xs text-gray-500">{field.field_description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2 font-mono text-sm">
                                  <div>
                                    {field.format_specification}
                                    {field.format_option && (
                                      <div className="text-xs text-blue-600">{field.format_option}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <Badge variant={field.is_mandatory ? 'destructive' : 'secondary'}>
                                    {field.is_mandatory ? 'Required' : 'Optional'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2">{field.sequence}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rules" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Validation Rules</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {loadingComprehensiveData ? (
                          <div className="text-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading validation rules...
                          </div>
                        ) : comprehensiveData?.validationRules?.map((rule: any, index: number) => (
                          <div key={index} className="border rounded p-3 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium">{rule.rule_description}</h5>
                                <p className="text-sm text-gray-600 mt-1">{rule.rule_text}</p>
                                <div className="flex gap-2 mt-2">
                                  {rule.field_tag && (
                                    <Badge variant="outline">
                                      Field: {rule.field_tag}
                                    </Badge>
                                  )}
                                  {rule.severity_level && (
                                    <Badge variant={rule.severity_level === 'critical' ? 'destructive' : 'secondary'}>
                                      {rule.severity_level}
                                    </Badge>
                                  )}
                                  {rule.error_code && (
                                    <Badge variant="outline">
                                      Code: {rule.error_code}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant={rule.rule_type === 'network_validated' ? 'default' : 'secondary'}>
                                {rule.rule_type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="dependencies" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Message Dependencies</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {loadingComprehensiveData ? (
                          <div className="text-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading dependencies...
                          </div>
                        ) : comprehensiveData?.dependencies?.map((dep: any, index: number) => (
                          <div key={index} className="border rounded p-3 bg-blue-50">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                MT{dep.source_message_type} → MT{dep.target_message_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{dep.dependency_description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">
                                {dep.dependency_type}
                              </Badge>
                              {dep.is_mandatory && (
                                <Badge variant="destructive">
                                  Mandatory
                                </Badge>
                              )}
                              {dep.sequence_order && (
                                <Badge variant="secondary">
                                  Order: {dep.sequence_order}
                                </Badge>
                              )}
                            </div>
                            {dep.condition_rules && (
                              <div className="mt-2 p-2 bg-white rounded text-xs">
                                <strong>Conditions:</strong> {dep.condition_rules}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="codes" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Field Codes</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Field Tag</th>
                              <th className="px-4 py-2 text-left">Code Value</th>
                              <th className="px-4 py-2 text-left">Description</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingComprehensiveData ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center">
                                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                                  Loading field codes...
                                </td>
                              </tr>
                            ) : comprehensiveData?.fieldCodes?.map((code: any, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-mono text-sm">{code.field_tag}</td>
                                <td className="px-4 py-2 font-mono text-sm">{code.code_value}</td>
                                <td className="px-4 py-2">{code.code_description}</td>
                                <td className="px-4 py-2">
                                  <Badge variant={code.is_active ? 'default' : 'secondary'}>
                                    {code.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="instances" className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Recent Message Instances</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {loadingComprehensiveData ? (
                          <div className="text-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading message instances...
                          </div>
                        ) : comprehensiveData?.recentInstances?.map((instance: any, index: number) => (
                          <div key={index} className="border rounded p-4 bg-white">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">Instance #{instance.instance_id}</span>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={instance.validation_status === 'valid' ? 'default' : 'destructive'}>
                                  {instance.validation_status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(instance.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <h6 className="font-medium text-sm mb-2">Message Content:</h6>
                              <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 max-h-32 overflow-y-auto">
                                {instance.message_content}
                              </pre>
                            </div>

                            {instance.validation_errors && instance.validation_status !== 'valid' && (
                              <div className="bg-red-50 rounded p-3">
                                <h6 className="font-medium text-sm mb-2 text-red-700">Validation Errors:</h6>
                                <div className="text-xs text-red-600">
                                  {JSON.parse(instance.validation_errors).map((error: any, errorIndex: number) => (
                                    <div key={errorIndex} className="mb-1">
                                      <strong>{error.field}:</strong> {error.message}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {comprehensiveData?.recentInstances?.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No message instances found for this message type
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Message Validator Tab */}
        <TabsContent value="validator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SWIFT Message Validator</CardTitle>
              <CardDescription>
                Validate SWIFT MT7xx messages against Azure SQL database specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Type</label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select message type" />
                    </SelectTrigger>
                    <SelectContent>
                      {messageTypes?.map((type: any) => (
                        <SelectItem key={type.message_type_code} value={type.message_type_code}>
                          MT{type.message_type_code} - {type.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Validation Mode</label>
                  <Select defaultValue="strict">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict Validation</SelectItem>
                      <SelectItem value="lenient">Lenient Validation</SelectItem>
                      <SelectItem value="format-only">Format Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SWIFT Message Content</label>
                <Textarea
                  placeholder="Paste your SWIFT message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleMessageValidation} disabled={!messageText || !messageType}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate Message
                </Button>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button variant="outline" onClick={() => { setMessageText(""); setValidationResult(null); }}>
                  Clear
                </Button>
              </div>

              {validationResult && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {validationResult.isValid ? "Message Valid" : "Validation Failed"}
                    </span>
                  </div>
                  
                  {validationResult.errors?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Errors Found:</h4>
                      {validationResult.errors.map((error: any, index: number) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded">
                          <span className="font-medium">Field {error.field}:</span> {error.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Parser Tab */}
        <TabsContent value="parser" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Parser</CardTitle>
              <CardDescription>
                Parse and extract data from trade finance documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
                <p className="text-gray-500 mb-4">Drop files here or click to browse</p>
                <Button>Select Files</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Supported Formats</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• PDF Documents</li>
                      <li>• SWIFT Messages (.txt)</li>
                      <li>• Excel Files (.xlsx)</li>
                      <li>• Word Documents (.docx)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Document Types</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Letter of Credit</li>
                      <li>• Commercial Invoice</li>
                      <li>• Bill of Lading</li>
                      <li>• Insurance Certificate</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Processing</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• OCR Text Extraction</li>
                      <li>• Field Recognition</li>
                      <li>• Data Validation</li>
                      <li>• Discrepancy Detection</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Browser Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SWIFT Database Browser</CardTitle>
              <CardDescription>
                Browse and manage SWIFT message specifications from Azure SQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Search tables..." className="flex-1" />
                <Button variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="outline">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {swiftTables.map((table) => (
                  <Card 
                    key={table.name} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Database className="w-5 h-5 text-blue-500 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium">swift.{table.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle>swift.{selectedTable}</CardTitle>
                    <CardDescription>Table data and structure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingTable ? (
                      <div className="text-center py-4">Loading table data...</div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Select a table to view its data
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage validation rules and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Azure SQL Connection
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validation Rules
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Parser Configuration
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Message Templates
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Operations</CardTitle>
                <CardDescription>Import, export, and synchronize data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Import SWIFT Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Backup Data
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Azure SQL Server connection details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Server</label>
                    <p className="text-sm text-gray-600">shahulmi.database.windows.net</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Database</label>
                    <p className="text-sm text-gray-600">TF_genie</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tables</label>
                    <p className="text-sm text-gray-600">11 SWIFT tables</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
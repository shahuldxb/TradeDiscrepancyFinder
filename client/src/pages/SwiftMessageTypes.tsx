import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Search, 
  Filter,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Settings
} from "lucide-react";
import { Link } from "wouter";

export default function SwiftMessageTypes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState("all");
  const [selectedMessageType, setSelectedMessageType] = useState("all");

  // Fetch SWIFT message types from Azure
  const { data: messageTypes, isLoading: loadingMessageTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
    retry: false,
  });

  // Fetch SWIFT fields from Azure with message type filtering
  const { data: swiftFields, isLoading: loadingFields } = useQuery({
    queryKey: ["/api/swift/fields-azure", selectedMessageType],
    queryFn: async () => {
      const params = selectedMessageType !== "all" ? `?messageType=${selectedMessageType}` : "";
      const response = await fetch(`/api/swift/fields-azure${params}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    retry: false,
  });

  // Fetch comprehensive validation rules from Azure database with proper schema
  const { data: validationRules, isLoading: loadingValidationRules } = useQuery({
    queryKey: ["/api/swift/validation-rules-azure", selectedMessageType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMessageType !== "all") {
        params.append('messageTypeId', selectedMessageType);
      }
      const response = await fetch(`/api/swift/validation-rules-azure?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch validation rules');
      return response.json();
    },
    retry: false,
  });

  // Filter message types based on search and category
  const filteredMessageTypes = Array.isArray(messageTypes) ? messageTypes.filter((msgType: any) => {
    const matchesSearch = msgType.message_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msgType.message_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msgType.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || msgType.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  const handleMessageClick = (msgType: any) => {
    setSelectedMessage(msgType);
    setShowMessageDetail(true);
    setActiveTab("fields");
    // Set the message type filter to show only fields for this message
    setSelectedMessageType(msgType.message_type_id?.toString() || "1");
  };

  const categories = ["all", "7"];

  // Get message statistics
  const totalMessages = Array.isArray(messageTypes) ? messageTypes.length : 0;
  const activeMessages = Array.isArray(messageTypes) ? messageTypes.filter((msg: any) => msg.is_active).length : 0;
  const category7Messages = Array.isArray(messageTypes) ? messageTypes.filter((msg: any) => msg.category === "7").length : 0;

  // Get field statistics
  const totalFields = Array.isArray(swiftFields) ? swiftFields.length : 0;
  const activeFields = Array.isArray(swiftFields) ? swiftFields.filter((field: any) => field.is_active).length : 0;

  // Filter fields based on search and selected filters
  const filteredFields = Array.isArray(swiftFields) ? swiftFields.filter((field: any) => {
    const matchesSearch = searchTerm === "" || 
      field.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.field_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.content_options?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFieldType = selectedFieldType === "all" ||
      (selectedFieldType === "mandatory" && field.is_mandatory) ||
      (selectedFieldType === "optional" && !field.is_mandatory);
    
    const matchesMessageType = selectedMessageType === "all" ||
      field.message_type_id?.toString() === selectedMessageType;
    
    return matchesSearch && matchesFieldType && matchesMessageType;
  }) : [];

  // Group fields by mandatory/optional
  const mandatoryFields = filteredFields.filter((f: any) => f.is_mandatory);
  const optionalFields = filteredFields.filter((f: any) => !f.is_mandatory);

  if (loadingMessageTypes || loadingFields) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">SWIFT Message Types</h1>
          <p className="text-gray-600">
            Comprehensive overview of MT7xx message types and field definitions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{totalMessages}</p>
                  <p className="text-sm text-gray-600">Total Message Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{activeMessages}</p>
                  <p className="text-sm text-gray-600">Active Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{category7Messages}</p>
                  <p className="text-sm text-gray-600">Category 7 Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{totalFields}</p>
                  <p className="text-sm text-gray-600">SWIFT Fields</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Message Types Overview</TabsTrigger>
          <TabsTrigger value="fields">Field Definitions</TabsTrigger>
          <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          <TabsTrigger value="details">Message Details</TabsTrigger>
        </TabsList>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search message types, names, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="7">Category 7 (Documentary Credits)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Message Categories</CardTitle>
                <CardDescription>
                  SWIFT message types organized by functional category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.filter(cat => cat !== "all").map((category) => (
                    <div key={category} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Category {category}</h3>
                      <p className="text-sm text-gray-600 mb-2">Documentary Credits & Guarantees</p>
                      <p className="text-2xl font-bold">{category7Messages} messages</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Message Types Vertical Grid */}
            <Card>
              <CardHeader>
                <CardTitle>SWIFT Message Types - Detailed View</CardTitle>
                <CardDescription>
                  Complete information for all SWIFT message types from Azure database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMessageTypes.map((msgType: any) => (
                    <div 
                      key={msgType.message_type}
                      className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleMessageClick(msgType)}
                    >
                      {/* Message Type & Status */}
                      <div className="col-span-2 flex flex-col space-y-2">
                        <Badge variant="default" className="bg-blue-600 text-white font-mono text-sm w-fit">
                          {msgType.message_type}
                        </Badge>
                        <Badge className={msgType.is_active ? "bg-green-100 text-green-800 w-fit" : "bg-gray-100 text-gray-600 w-fit"}>
                          {msgType.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Message Name */}
                      <div className="col-span-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">Message Name</div>
                        <div className="font-semibold text-sm">{msgType.message_type_name}</div>
                      </div>

                      {/* Description */}
                      <div className="col-span-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Description</div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {msgType.description || msgType.message_type_name || 'SWIFT message type'}
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="col-span-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Purpose</div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {msgType.purpose || 'Documentary credit and trade finance processing'}
                        </div>
                      </div>

                      {/* Category & Code */}
                      <div className="col-span-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">Category</div>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">{msgType.category}</Badge>
                          <div className="font-mono text-xs text-gray-600">
                            {msgType.message_type_code || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {filteredMessageTypes.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No message types found matching your criteria.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>SWIFT Field Definitions</CardTitle>
              <CardDescription>
                Comprehensive list of SWIFT message fields and their specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Field Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalFields}</p>
                    <p className="text-sm text-gray-600">Total Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Array.isArray(swiftFields) ? swiftFields.filter((f: any) => f.is_mandatory).length : 0}</p>
                    <p className="text-sm text-gray-600">Mandatory Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Array.isArray(swiftFields) ? swiftFields.filter((f: any) => !f.is_mandatory).length : 0}</p>
                    <p className="text-sm text-gray-600">Optional Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Array.isArray(swiftFields) ? new Set(swiftFields.map((f: any) => f.message_type_id)).size : 0}</p>
                    <p className="text-sm text-gray-600">Message Types</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search fields by tag, name, or content options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedFieldType} onValueChange={setSelectedFieldType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      <SelectItem value="mandatory">Mandatory Only</SelectItem>
                      <SelectItem value="optional">Optional Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by message type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Message Types</SelectItem>
                      {Array.isArray(messageTypes) && messageTypes.map((msgType: any) => (
                        <SelectItem key={msgType.message_type_id} value={msgType.message_type_id?.toString()}>
                          {msgType.message_type} ({msgType.message_type_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Summary */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {filteredFields.length} of {totalFields} fields
                    {mandatoryFields.length > 0 && ` (${mandatoryFields.length} mandatory, ${optionalFields.length} optional)`}
                  </div>
                  {selectedMessageType !== "all" && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Filtered by: {messageTypes?.find((m: any) => m.message_type_id?.toString() === selectedMessageType)?.message_type}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedMessageType("all")}
                        className="text-xs"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mandatory Fields Section */}
                {mandatoryFields.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold text-red-800">Mandatory Fields</h3>
                      <Badge className="bg-red-100 text-red-800">{mandatoryFields.length}</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm border">
                        <thead>
                          <tr className="border-b bg-red-50">
                            <th className="text-left p-3 font-semibold w-20">Field ID</th>
                            <th className="text-left p-3 font-semibold w-32">Message Type</th>
                            <th className="text-left p-3 font-semibold w-20">Tag</th>
                            <th className="text-left p-3 font-semibold">Field Name</th>
                            <th className="text-left p-3 font-semibold">Content Options</th>
                            <th className="text-left p-3 font-semibold w-20">Sequence</th>
                            <th className="text-left p-3 font-semibold w-24">Created</th>
                            <th className="text-left p-3 font-semibold w-24">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mandatoryFields.map((field: any) => (
                            <tr key={field.field_id || field.field_code} className="border-b hover:bg-red-25 transition-colors">
                              <td className="p-3 font-mono text-blue-600">{field.field_id || 'N/A'}</td>
                              <td className="p-3">
                                <div className="flex flex-col min-w-[6rem]">
                                  <span className="font-semibold text-base text-blue-700 font-mono">
                                    {Array.isArray(messageTypes) && messageTypes.find((m: any) => m.message_type_id === field.message_type_id)?.message_type || 'MT700'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {Array.isArray(messageTypes) && messageTypes.find((m: any) => m.message_type_id === field.message_type_id)?.message_type_name || 'Issue LC'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-mono font-semibold">{field.tag || field.field_code}</td>
                              <td className="p-3 max-w-xs">
                                <div className="truncate" title={field.field_name}>
                                  {field.field_name}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-xs max-w-xs">
                                <div className="truncate" title={field.content_options}>
                                  {field.content_options || 'N/A'}
                                </div>
                              </td>
                              <td className="p-3 text-center">{field.sequence}</td>
                              <td className="p-3 text-xs text-gray-500">
                                {field.created_at ? new Date(field.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3 text-xs text-gray-500">
                                {field.updated_at ? new Date(field.updated_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Optional Fields Section */}
                {optionalFields.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-700">Optional Fields</h3>
                      <Badge className="bg-gray-100 text-gray-600">{optionalFields.length}</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm border">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-semibold w-20">Field ID</th>
                            <th className="text-left p-3 font-semibold w-32">Message Type</th>
                            <th className="text-left p-3 font-semibold w-20">Tag</th>
                            <th className="text-left p-3 font-semibold">Field Name</th>
                            <th className="text-left p-3 font-semibold">Content Options</th>
                            <th className="text-left p-3 font-semibold w-20">Sequence</th>
                            <th className="text-left p-3 font-semibold w-24">Created</th>
                            <th className="text-left p-3 font-semibold w-24">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {optionalFields.map((field: any) => (
                            <tr key={field.field_id || field.field_code} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="p-3 font-mono text-blue-600">{field.field_id || 'N/A'}</td>
                              <td className="p-3">
                                <div className="flex flex-col min-w-[6rem]">
                                  <span className="font-semibold text-base text-blue-700 font-mono">
                                    {Array.isArray(messageTypes) && messageTypes.find((m: any) => m.message_type_id === field.message_type_id)?.message_type || 'MT700'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {Array.isArray(messageTypes) && messageTypes.find((m: any) => m.message_type_id === field.message_type_id)?.message_type_name || 'Issue LC'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-mono font-semibold">{field.tag || field.field_code}</td>
                              <td className="p-3 max-w-xs">
                                <div className="truncate" title={field.field_name}>
                                  {field.field_name}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-xs max-w-xs">
                                <div className="truncate" title={field.content_options}>
                                  {field.content_options || 'N/A'}
                                </div>
                              </td>
                              <td className="p-3 text-center">{field.sequence}</td>
                              <td className="p-3 text-xs text-gray-500">
                                {field.created_at ? new Date(field.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3 text-xs text-gray-500">
                                {field.updated_at ? new Date(field.updated_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* No Results Message */}
                {filteredFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No fields found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <div className="space-y-6">
            {/* Enhanced Validation Rules Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SWIFT Validation Rules Engine
                </CardTitle>
                <CardDescription>
                  Comprehensive validation rules from Azure database with all 21 validation attributes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Statistics and Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {Array.isArray(validationRules) ? validationRules.length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Rules</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {Array.isArray(validationRules) ? validationRules.filter((r: any) => r.is_mandatory).length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Mandatory Rules</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {Array.isArray(validationRules) ? validationRules.filter((r: any) => r.character_type).length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Character Rules</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {Array.isArray(validationRules) ? validationRules.filter((r: any) => r.allows_repetition).length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Repetition Rules</div>
                  </Card>
                </div>

                {/* Validation Rules Display */}
                {loadingValidationRules ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : Array.isArray(validationRules) && validationRules.length > 0 ? (
                  <div className="space-y-6">
                    {/* Comprehensive Validation Rules Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm border">
                        <thead>
                          <tr className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                            <th className="text-left p-3 font-semibold min-w-[80px]">Rule ID</th>
                            <th className="text-left p-3 font-semibold min-w-[100px]">Field Tag</th>
                            <th className="text-left p-3 font-semibold min-w-[200px]">Field Name</th>
                            <th className="text-left p-3 font-semibold min-w-[120px]">Rule Type</th>
                            <th className="text-left p-3 font-semibold min-w-[300px]">Description</th>
                            <th className="text-left p-3 font-semibold min-w-[80px]">Priority</th>
                            <th className="text-left p-3 font-semibold min-w-[100px]">Mandatory</th>
                            <th className="text-left p-3 font-semibold min-w-[120px]">Character</th>
                            <th className="text-left p-3 font-semibold min-w-[100px]">Length</th>
                            <th className="text-left p-3 font-semibold min-w-[120px]">Formatting</th>
                            <th className="text-left p-3 font-semibold min-w-[120px]">Sections</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationRules.map((rule: any) => (
                            <tr key={rule.rule_id} className="border-b hover:bg-blue-25 transition-colors">
                              <td className="p-3">
                                <Badge variant="outline" className="font-mono">
                                  {rule.rule_id}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className="bg-blue-100 text-blue-800 font-mono font-bold">
                                  {rule.field_tag}
                                </Badge>
                              </td>
                              <td className="p-3 max-w-xs">
                                <div className="font-medium text-gray-900">
                                  {rule.field_name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Field ID: {rule.field_id} | Type ID: {rule.message_type_id}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge className={`
                                  ${rule.validation_rule_type?.includes('FORMAT') ? 'bg-green-100 text-green-800' : 
                                    rule.validation_rule_type?.includes('LENGTH') ? 'bg-yellow-100 text-yellow-800' :
                                    rule.validation_rule_type?.includes('CONTENT') ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'}
                                `}>
                                  {rule.validation_rule_type || 'Standard'}
                                </Badge>
                              </td>
                              <td className="p-3 max-w-sm">
                                <div className="text-sm text-gray-800">
                                  {rule.validation_rule_description}
                                </div>
                                {rule.content_options && (
                                  <div className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-1 rounded">
                                    {rule.content_options}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant={rule.rule_priority <= 1 ? "destructive" : rule.rule_priority <= 3 ? "default" : "secondary"}>
                                  {rule.rule_priority || 'N/A'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={rule.is_mandatory ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                                  {rule.is_mandatory ? 'Required' : 'Optional'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  {rule.character_type && (
                                    <Badge variant="outline" className="text-xs">
                                      {rule.character_type}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1 text-xs">
                                  {rule.min_length && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500">Min:</span>
                                      <span className="font-mono">{rule.min_length}</span>
                                    </div>
                                  )}
                                  {rule.max_length && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500">Max:</span>
                                      <span className="font-mono">{rule.max_length}</span>
                                    </div>
                                  )}
                                  {rule.exact_length && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500">Exact:</span>
                                      <span className="font-mono">{rule.exact_length}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  {rule.allows_repetition && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                      Repetition
                                    </Badge>
                                  )}
                                  {rule.allows_crlf && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                      CRLF
                                    </Badge>
                                  )}
                                  {rule.allows_slash && (
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                      Slash
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  {rule.has_optional_sections && (
                                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                      Optional
                                    </Badge>
                                  )}
                                  {rule.has_conditional_sections && (
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                      Conditional
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Rules Found</h3>
                    <p className="text-gray-600 mb-4">
                      {selectedMessageType === "all" 
                        ? "Select a specific message type to view validation rules" 
                        : "No validation rules available for this message type"}
                    </p>
                    <div className="text-sm text-gray-500">
                      Validation rules are automatically loaded from the Azure database
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-6">
            {showMessageDetail && selectedMessage ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedMessage.message_type} - {selectedMessage.message_type_name}
                  </CardTitle>
                  <CardDescription>
                    Detailed information about {selectedMessage.description || selectedMessage.message_type_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Message Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="font-medium text-gray-600">Message Type:</dt>
                          <dd className="font-mono">{selectedMessage.message_type}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Full Name:</dt>
                          <dd>{selectedMessage.message_type_name}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Purpose:</dt>
                          <dd>{selectedMessage.purpose || 'Not specified'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Category:</dt>
                          <dd>
                            <Badge>{selectedMessage.category}</Badge>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Max Length:</dt>
                          <dd>{selectedMessage.max_length || 'Not specified'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Related Fields</h4>
                      <div className="text-sm text-gray-600">
                        {Array.isArray(swiftFields) && swiftFields.filter((f: any) => 
                          f.message_type_id === selectedMessage.message_type_id).length} fields defined
                      </div>
                      <div className="mt-4 space-y-2">
                        <Button 
                          size="sm" 
                          onClick={() => setActiveTab("fields")}
                          className="w-full"
                        >
                          View Fields
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveTab("validation")}
                          className="w-full"
                        >
                          View Validation Rules
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Message Selected</h3>
                <p className="text-gray-600">
                  Select a message type from the overview tab to view detailed information
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
              <CardDescription>
                {selectedMessage ? `Details for ${selectedMessage.message_type}` : "Select a message type to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Message Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Message Type:</span>
                          <Badge variant="outline">{selectedMessage.message_type}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span>{selectedMessage.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Usage Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600 block mb-1">Purpose:</span>
                          <p className="text-sm">{selectedMessage.purpose}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a message type to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
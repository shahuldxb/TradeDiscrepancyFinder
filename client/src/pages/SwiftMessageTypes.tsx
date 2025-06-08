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

  // Fetch SWIFT message types from Azure
  const { data: messageTypes, isLoading: loadingMessageTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
    retry: false,
  });

  // Fetch SWIFT fields from Azure
  const { data: swiftFields, isLoading: loadingFields } = useQuery({
    queryKey: ["/api/swift/fields-azure"],
    retry: false,
  });

  // Filter message types based on search and category
  const filteredMessageTypes = (messageTypes || []).filter((msgType: any) => {
    const matchesSearch = msgType.message_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msgType.message_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msgType.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || msgType.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleMessageClick = (msgType: any) => {
    setSelectedMessage(msgType);
    setShowMessageDetail(true);
    setActiveTab("details");
  };

  const categories = ["all", "7"];

  // Get message statistics
  const totalMessages = (messageTypes || []).length;
  const activeMessages = (messageTypes || []).filter((msg: any) => msg.is_active).length;
  const category7Messages = (messageTypes || []).filter((msg: any) => msg.category === "7").length;

  // Get field statistics
  const totalFields = (swiftFields || []).length;
  const activeFields = (swiftFields || []).filter((field: any) => field.is_active).length;

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

            {/* Message Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMessageTypes.slice(0, 12).map((msgType: any) => (
                <Card 
                  key={msgType.message_type} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleMessageClick(msgType)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{msgType.message_type}</Badge>
                      <Badge className={msgType.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                        {msgType.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{msgType.message_type_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {msgType.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Category:</span>
                        <span>{msgType.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Purpose:</span>
                        <span className="text-right text-xs">{msgType.purpose?.substring(0, 50)}...</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

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
              <div className="space-y-4">
                {/* Field Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalFields}</p>
                    <p className="text-sm text-gray-600">Total Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{activeFields}</p>
                    <p className="text-sm text-gray-600">Active Fields</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(swiftFields || []).filter((f: any) => f.field_code?.startsWith('2')).length}</p>
                    <p className="text-sm text-gray-600">Reference Fields</p>
                  </div>
                </div>

                {/* Fields Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Field Code</th>
                        <th className="text-left p-2">Field Name</th>
                        <th className="text-left p-2">Format</th>
                        <th className="text-left p-2">Max Length</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(swiftFields || []).slice(0, 20).map((field: any) => (
                        <tr key={field.field_code} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <Badge variant="outline">{field.field_code}</Badge>
                          </td>
                          <td className="p-2 font-medium">{field.field_name}</td>
                          <td className="p-2 font-mono text-sm">{field.format}</td>
                          <td className="p-2">{field.max_length}</td>
                          <td className="p-2">
                            <Badge className={field.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                              {field.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Message validation rules and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">UCP 600 Compliance</h3>
                  <p className="text-sm text-blue-600">
                    All MT7xx messages must comply with UCP 600 documentary credit rules.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Field Format Validation</h3>
                  <p className="text-sm text-green-600">
                    Each field is validated against its defined format and length constraints.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Business Rule Validation</h3>
                  <p className="text-sm text-yellow-600">
                    Additional business logic validation ensures message consistency and completeness.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  {/* Message Information */}
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={selectedMessage.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                            {selectedMessage.is_active ? "Active" : "Inactive"}
                          </Badge>
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
                        <div>
                          <span className="text-gray-600 block mb-1">Description:</span>
                          <p className="text-sm">{selectedMessage.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Fields */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Related SWIFT Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(swiftFields || []).slice(0, 6).map((field: any) => (
                        <div key={field.field_code} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">{field.field_code}</Badge>
                            <span className="text-xs text-gray-500">{field.format}</span>
                          </div>
                          <p className="text-sm font-medium">{field.field_name}</p>
                          <p className="text-xs text-gray-600">Max: {field.max_length} chars</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setActiveTab("overview")}>
                      Back to Overview
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("fields")}>
                      View All Fields
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Message type not found or no data available.</p>
                  <p className="text-sm">Please select a message type from the overview tab.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
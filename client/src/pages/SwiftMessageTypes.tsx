import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MessageSquare, 
  FileText, 
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
  Network,
  Filter,
  Eye,
  Download,
  Settings
} from "lucide-react";
import { Link } from "wouter";

export default function SwiftMessageTypes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch SWIFT message types from Azure
  const { data: messageTypes, isLoading: loadingMessageTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
  });

  // Fetch SWIFT fields from Azure
  const { data: swiftFields, isLoading: loadingFields } = useQuery({
    queryKey: ["/api/swift/fields-azure"],
  });

  // Fetch validation statistics
  const { data: statistics } = useQuery({
    queryKey: ["/api/swift/statistics"],
  });

  // Filter messages based on search term and category
  const filteredMessages = messageTypes.filter((msg: any) => {
    const matchesSearch = 
      msg.message_type_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || 
      msg.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filtering
  const categories = Array.from(new Set(messageTypes.map((msg: any) => msg.category).filter(Boolean)));

  const handleMessageClick = (msgType: any) => {
    console.log("Selected message type:", msgType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">SWIFT Message Types</h1>
          <p className="text-lg text-gray-600">
            Comprehensive SWIFT MT7xx Message Type Directory
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Message Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{messageTypes.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">SWIFT Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{(swiftFields || []).length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold">{categories.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Active Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold">{filteredMessages.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Message Types Overview</TabsTrigger>
            <TabsTrigger value="fields">Field Definitions</TabsTrigger>
            <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          </TabsList>

          {/* Message Types Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  SWIFT Message Types Directory
                </CardTitle>
                <CardDescription>
                  Browse and explore all available SWIFT MT7xx message types from Azure database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by code, name, or purpose..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="px-3 py-2 border rounded-md bg-white"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map((category: string) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>

                {/* Message Types List */}
                {loadingMessageTypes ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((msg: any, index: number) => (
                      <Card 
                        key={index} 
                        className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 hover:border-l-blue-600 hover:bg-blue-50"
                        onClick={() => handleMessageClick(msg)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="font-mono text-sm">
                                  MT{msg.message_type_code}
                                </Badge>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {msg.message_type_name}
                                </h3>
                                {msg.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {msg.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                {msg.purpose || msg.description}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Network className="h-3 w-3" />
                                  SWIFT Network
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Documentary Credits
                                </span>
                                {msg.is_active && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {filteredMessages.length === 0 && !loadingMessageTypes && (
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Message Types Found</h3>
                      <p className="text-gray-500 text-center max-w-sm">
                        No SWIFT message types match your current search criteria. Try adjusting your search terms or filters.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Definitions Tab */}
          <TabsContent value="fields" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  SWIFT Field Definitions
                </CardTitle>
                <CardDescription>
                  Comprehensive field definitions for SWIFT message types
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFields ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Code</TableHead>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Max Length</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(swiftFields || []).slice(0, 20).map((field: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{field.field_code}</TableCell>
                            <TableCell className="font-medium">{field.field_name}</TableCell>
                            <TableCell className="text-sm text-gray-600">{field.format}</TableCell>
                            <TableCell>{field.max_length || 'N/A'}</TableCell>
                            <TableCell>
                              {field.is_active ? (
                                <Badge variant="secondary" className="text-green-600">Active</Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Rules Tab */}
          <TabsContent value="validation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Validation Rules
                </CardTitle>
                <CardDescription>
                  SWIFT message validation rules and compliance requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="text-lg">Format Validation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Validates message format according to SWIFT standards
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg">Field Validation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Ensures all mandatory fields are present and correctly formatted
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="text-lg">Business Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Applies business logic validation for trade finance compliance
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader>
                      <CardTitle className="text-lg">UCP 600 Compliance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Validates against UCP 600 rules for letter of credit processing
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
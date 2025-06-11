import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, TrendingUp, Database, Search, Filter, Download, Eye } from "lucide-react";

interface MTMessage {
  message_type: string;
  message_name: string;
  description: string;
  category: string;
  field_count: number;
  created_date: string;
  last_modified: string;
}

interface MTStatistics {
  totalMessages?: number;
  activeMessages?: number;
  totalFields?: number;
  mt7xxMessages?: number;
  documentaryCredits?: number;
  messageCategories?: number;
  messageTypes?: number;
  validatedMessages?: number;
  [key: string]: any;
}

export default function MTIntelligence() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedActiveStatus, setSelectedActiveStatus] = useState("all");

  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/swift/message-types-azure"]
  });

  const { data: statisticsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/swift/statistics"]
  });

  const messages: MTMessage[] = Array.isArray(messagesResponse) ? messagesResponse : [];
  const statistics = statisticsResponse || {};

  // Filter messages based on search and filters
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.message_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || message.category === selectedCategory;
    const matchesActiveStatus = selectedActiveStatus === "all";
    return matchesSearch && matchesCategory && matchesActiveStatus;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(messages.map(m => m.category).filter(Boolean)));

  const getMessageTypeBadge = (messageType: string) => {
    if (messageType?.startsWith('MT7')) return <Badge variant="default">Documentary Credit</Badge>;
    if (messageType?.startsWith('MT1')) return <Badge variant="secondary">Customer Transfer</Badge>;
    if (messageType?.startsWith('MT2')) return <Badge variant="outline">Financial Institution</Badge>;
    if (messageType?.startsWith('MT9')) return <Badge className="bg-purple-100 text-purple-800">Cash Management</Badge>;
    return <Badge variant="secondary">{messageType}</Badge>;
  };

  if (messagesLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading MT Intelligence Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MT Intelligence Dashboard</h1>
        <p className="text-gray-600">Comprehensive SWIFT Message Type Intelligence and Analytics</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Message Types</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Message Types</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.messageTypes || messages.length || 0}</div>
                <p className="text-xs text-muted-foreground">SWIFT message types configured</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{messages.length || 0}</div>
                <p className="text-xs text-muted-foreground">Currently processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MT7xx Messages</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{messages.filter(m => m.message_type?.startsWith('MT7')).length || 0}</div>
                <p className="text-xs text-muted-foreground">Documentary Credit messages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messages.reduce((acc, m) => acc + (m.field_count || 0), 0)}</div>
                <p className="text-xs text-muted-foreground">Message field definitions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">Message categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {messages.length > 0 ? Math.round((messages.length / messages.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Active message coverage</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Message Activity</CardTitle>
              <CardDescription>Latest updates to SWIFT message configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.slice(0, 5).map((message) => (
                  <div key={message.MessageID} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">{message.MessageTypeCode} - {message.MessageName}</div>
                        <div className="text-sm text-gray-500">{message.Category}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(message.LastModifiedDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Types Tab */}
        <TabsContent value="messages" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Message Type Explorer</CardTitle>
              <CardDescription>Browse and analyze SWIFT message types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search message types, codes, or categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={selectedActiveStatus} onValueChange={setSelectedActiveStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages Table */}
          <Card>
            <CardHeader>
              <CardTitle>SWIFT Message Types ({filteredMessages.length})</CardTitle>
              <CardDescription>Comprehensive list of supported SWIFT message types</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No message types found matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message Code</TableHead>
                        <TableHead>Message Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Fields</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMessages.map((message) => (
                        <TableRow key={message.MessageID}>
                          <TableCell className="font-mono font-medium">{message.MessageTypeCode}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{message.MessageName}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{message.Description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{message.Category}</Badge>
                          </TableCell>
                          <TableCell>{getMessageTypeBadge(message.MessageTypeCode)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{message.FieldCount || 0} fields</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={message.IsActive ? "default" : "secondary"}>
                              {message.IsActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(message.LastModifiedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Type Distribution</CardTitle>
                <CardDescription>Distribution of message types by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const count = messages.filter(m => m.Category === category).length;
                    const percentage = messages.length > 0 ? (count / messages.length) * 100 : 0;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm font-medium">{category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-500">{count} messages</div>
                          <div className="text-sm font-medium">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active vs Inactive Messages</CardTitle>
                <CardDescription>Status distribution of message types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium">Active Messages</span>
                    </div>
                    <div className="text-sm font-medium">{messages.filter(m => m.IsActive).length}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-400 rounded"></div>
                      <span className="text-sm font-medium">Inactive Messages</span>
                    </div>
                    <div className="text-sm font-medium">{messages.length - messages.filter(m => m.IsActive).length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>MT7xx Documentary Credit Analysis</CardTitle>
              <CardDescription>Detailed analysis of documentary credit message types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{messages.filter(m => m.MessageTypeCode?.startsWith('MT7')).length}</div>
                  <div className="text-sm text-gray-500">MT7xx Messages</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {messages.filter(m => m.MessageTypeCode?.startsWith('MT7') && m.IsActive).length}
                  </div>
                  <div className="text-sm text-gray-500">Active MT7xx</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {messages.filter(m => m.MessageTypeCode?.startsWith('MT7')).reduce((acc, m) => acc + (m.FieldCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Fields</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MT Intelligence Insights</CardTitle>
              <CardDescription>AI-powered insights and recommendations for SWIFT message optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Message Coverage Analysis</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your system covers {statistics.activeMessages} out of {statistics.totalMessages} message types. 
                    Consider activating {statistics.totalMessages - statistics.activeMessages} additional message types for comprehensive coverage.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900">Documentary Credit Optimization</h4>
                  <p className="text-sm text-green-700 mt-1">
                    MT7xx documentary credit messages are well-configured with {statistics.mt7xxMessages} message types. 
                    This provides strong support for letter of credit processing.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Field Definition Completeness</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Average of {statistics.totalMessages > 0 ? Math.round(statistics.totalFields / statistics.totalMessages) : 0} fields per message type. 
                    Ensure all critical fields are properly defined for accurate message processing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>System recommendations based on current configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Review Inactive Message Types</div>
                    <div className="text-sm text-gray-500">Evaluate {statistics.totalMessages - statistics.activeMessages} inactive message types for potential activation</div>
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Update Field Definitions</div>
                    <div className="text-sm text-gray-500">Ensure all message types have complete field specifications</div>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Optimize MT7xx Configuration</div>
                    <div className="text-sm text-gray-500">Review documentary credit message configurations for compliance</div>
                  </div>
                  <Button variant="outline" size="sm">Optimize</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
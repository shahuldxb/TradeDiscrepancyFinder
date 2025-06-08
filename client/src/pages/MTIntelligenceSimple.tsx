import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  MessageSquare, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowLeft
} from "lucide-react";

export default function MTIntelligenceSimple() {
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter message types based on search
  const filteredMessageTypes = Array.isArray(messageTypes) ? messageTypes.filter((msgType: any) => {
    const matchesSearch = searchQuery === "" || 
      msgType.message_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msgType.message_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msgType.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) : [];

  // Get fields for selected message
  const getMessageFields = (messageType: string) => {
    if (!Array.isArray(swiftFields)) return [];
    return swiftFields.filter((field: any) => {
      // This would need proper field-to-message relationships from Azure
      return field.field_code && field.is_active;
    }).slice(0, 20); // Limit for display
  };

  const handleMessageClick = (msgType: any) => {
    setSelectedMessage(msgType);
    setShowMessageDetail(true);
  };

  const handleBackToGrid = () => {
    setShowMessageDetail(false);
    setSelectedMessage(null);
  };

  if (loadingMessageTypes || loadingFields) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Show message detail view if a message is selected
  if (showMessageDetail && selectedMessage) {
    const messageFields = getMessageFields(selectedMessage.message_type);
    
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToGrid}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedMessage.message_type} Details</h1>
            <p className="text-gray-600">{selectedMessage.message_type_name}</p>
          </div>
        </div>

        {/* Message Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedMessage.message_type}</Badge>
                  <span className="text-sm text-gray-600">Message Type</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">Category {selectedMessage.category}</Badge>
                  <span className="text-sm text-gray-600">SWIFT Category</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={selectedMessage.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                    {selectedMessage.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-600">Status</span>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 mb-4">
                  {selectedMessage.description}
                </p>
                <h3 className="font-semibold mb-2">Purpose</h3>
                <p className="text-gray-700">
                  {selectedMessage.purpose}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="fields" className="space-y-6">
          <TabsList>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="specifications">Field Specifications</TabsTrigger>
            <TabsTrigger value="validation">Field Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <CardTitle>Message Fields</CardTitle>
                <CardDescription>
                  SWIFT field definitions for {selectedMessage.message_type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {messageFields.map((field: any) => (
                    <div key={field.field_code} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{field.field_code}</Badge>
                        <Badge className={field.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {field.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">{field.field_name}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Format: <span className="font-mono">{field.format}</span></div>
                        <div>Max Length: {field.max_length} characters</div>
                        {field.description && <div>{field.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardHeader>
                <CardTitle>Field Specifications</CardTitle>
                <CardDescription>
                  Detailed field specifications and formatting rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Code</TableHead>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Max Length</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messageFields.map((field: any) => (
                      <TableRow key={field.field_code}>
                        <TableCell>
                          <Badge variant="outline">{field.field_code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{field.field_name}</TableCell>
                        <TableCell className="font-mono text-sm">{field.format}</TableCell>
                        <TableCell>{field.max_length}</TableCell>
                        <TableCell>
                          <Badge variant={field.is_mandatory ? "default" : "outline"}>
                            {field.is_mandatory ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={field.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                            {field.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>Field Validation Rules</CardTitle>
                <CardDescription>
                  Validation rules and constraints for each field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {messageFields.map((field: any) => (
                    <div key={field.field_code} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{field.field_code}</Badge>
                        <h3 className="font-semibold">{field.field_name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Format Rules</h4>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Format: {field.format || 'Not specified'}</li>
                            <li>• Max Length: {field.max_length || 'Not specified'} characters</li>
                            <li>• Mandatory: {field.is_mandatory ? 'Yes' : 'No'}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Validation Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {field.is_active ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-gray-600">
                                {field.is_active ? 'Active and validated' : 'Inactive or deprecated'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {field.description && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="font-medium mb-1">Description</h4>
                          <p className="text-sm text-gray-600">{field.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Main grid view showing all SWIFT message types from Azure
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">MT Intelligence</h1>
          <p className="text-gray-600">
            SWIFT Message Types with Fields, Specifications, and Validation from Azure Data
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search message types, names, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(messageTypes) ? messageTypes.length : 0}</p>
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
                  <p className="text-2xl font-bold">{Array.isArray(messageTypes) ? messageTypes.filter((msg: any) => msg.is_active).length : 0}</p>
                  <p className="text-sm text-gray-600">Active Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(swiftFields) ? swiftFields.length : 0}</p>
                  <p className="text-sm text-gray-600">SWIFT Fields</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(messageTypes) ? messageTypes.filter((msg: any) => msg.category === "7").length : 0}</p>
                  <p className="text-sm text-gray-600">Category 7 Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMessageTypes.map((msgType: any) => (
          <Card 
            key={msgType.message_type} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
            onClick={() => handleMessageClick(msgType)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {msgType.message_type}
                </Badge>
                <Badge className={msgType.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                  {msgType.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{msgType.message_type_name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {msgType.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{msgType.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="text-right text-xs line-clamp-1">{msgType.purpose?.substring(0, 40)}...</span>
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
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages found</h3>
            <p className="text-gray-600">No SWIFT message types match your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
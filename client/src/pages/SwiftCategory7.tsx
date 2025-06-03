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
  Network
} from "lucide-react";
import { Link } from "wouter";

export default function SwiftCategory7() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch SWIFT message types
  const { data: messageTypes, isLoading } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
  });

  // Fetch validation statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/swift/statistics"],
  });

  // Filter messages based on search term
  const filteredMessages = messageTypes?.filter((msg: any) =>
    msg.message_type_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const messageCategories = {
    "Issuance": ["700", "701"],
    "Amendment": ["707", "708"],
    "Transfer": ["710", "711"],
    "Authorization": ["742", "743"],
    "Reimbursement": ["754", "755"],
    "Settlement": ["756", "757"]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">SWIFT Category 7 Messages</h1>
          <p className="text-lg text-gray-600">
            Comprehensive overview of Documentary Credits and Standby Letters of Credit message types
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{messageTypes?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Types</p>
                  <p className="text-2xl font-bold">{filteredMessages?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Field Rules</p>
                  <p className="text-2xl font-bold">{stats?.fieldRules || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{Object.keys(messageCategories).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">Message Types</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="lifecycle">Message Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>About SWIFT Category 7</CardTitle>
                  <CardDescription>
                    Documentary Credits and Standby Letters of Credit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    SWIFT Category 7 messages are used for Documentary Credits (Letters of Credit) and Standby Letters of Credit. 
                    These messages facilitate international trade by providing payment guarantees between banks.
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Features:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Secure payment mechanisms for international trade</li>
                      <li>• Standardized message formats across global banks</li>
                      <li>• Comprehensive field validation and compliance</li>
                      <li>• Support for complex documentary requirements</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and navigation shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/swift-message/700">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View MT700 Details
                    </Button>
                  </Link>
                  
                  <Link href="/swift/validation">
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validate Messages
                    </Button>
                  </Link>
                  
                  <Link href="/mt700-lifecycle">
                    <Button variant="outline" className="w-full justify-start">
                      <Network className="h-4 w-4 mr-2" />
                      View Lifecycle
                    </Button>
                  </Link>
                  
                  <Link href="/message-builder">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Builder
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Category 7 Message Types</CardTitle>
                <CardDescription>
                  Complete list of SWIFT MT7xx messages with descriptions and purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search message types..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                    <p>Loading message types...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMessages.map((message: any) => (
                        <TableRow key={message.message_type_code}>
                          <TableCell className="font-mono">
                            MT{message.message_type_code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {message.message_type_name}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {message.purpose || "Documentary Credit processing"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/swift-message/${message.message_type_code}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(messageCategories).map(([category, codes]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <CardDescription>
                      {codes.length} message type{codes.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {codes.map((code) => {
                        const messageInfo = messageTypes?.find((m: any) => m.message_type_code === code);
                        return (
                          <Link key={code} href={`/swift-message/${code}`}>
                            <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-mono font-medium">MT{code}</p>
                                  <p className="text-sm text-gray-600">
                                    {messageInfo?.message_type_name || `Message Type ${code}`}
                                  </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentary Credit Message Flow</CardTitle>
                <CardDescription>
                  Typical sequence of SWIFT messages in a documentary credit transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="font-bold text-blue-600">1</span>
                      </div>
                      <h4 className="font-medium">Issuance</h4>
                      <p className="text-sm text-gray-600">MT700 - Documentary Credit Issuance</p>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="font-bold text-green-600">2</span>
                      </div>
                      <h4 className="font-medium">Advice</h4>
                      <p className="text-sm text-gray-600">MT701 - Documentary Credit Advice</p>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="font-bold text-orange-600">3</span>
                      </div>
                      <h4 className="font-medium">Amendment</h4>
                      <p className="text-sm text-gray-600">MT707 - Amendment</p>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="font-bold text-purple-600">4</span>
                      </div>
                      <h4 className="font-medium">Settlement</h4>
                      <p className="text-sm text-gray-600">MT754 - Reimbursement</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link href="/mt700-lifecycle">
                      <Button className="w-full">
                        <Network className="h-4 w-4 mr-2" />
                        View Complete MT700 Lifecycle
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
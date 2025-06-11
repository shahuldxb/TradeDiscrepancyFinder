import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Database, Search, Eye, Download, Settings } from "lucide-react";

interface MT7xxMessage {
  MessageID: number;
  MessageType: string;
  MessageTypeCode: string;
  MessageName: string;
  Description: string;
  FieldCount: number;
  IsActive: boolean;
  Category: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export default function MT7xxMessages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ["/api/swift/mt7xx-messages"]
  });

  const messages: MT7xxMessage[] = Array.isArray(messagesResponse) ? 
    messagesResponse.filter(msg => msg.MessageTypeCode?.startsWith('MT7')) : [];

  // Filter messages based on search and status
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.MessageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.MessageTypeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.Description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && message.IsActive) ||
                         (selectedStatus === "inactive" && !message.IsActive);
    return matchesSearch && matchesStatus;
  });

  const getMessageBadge = (messageCode: string) => {
    switch (messageCode) {
      case "MT700": return <Badge className="bg-blue-100 text-blue-800">Issue of LC</Badge>;
      case "MT701": return <Badge className="bg-green-100 text-green-800">Amendment</Badge>;
      case "MT705": return <Badge className="bg-purple-100 text-purple-800">Pre-advice</Badge>;
      case "MT707": return <Badge className="bg-orange-100 text-orange-800">Amendment Advice</Badge>;
      case "MT710": return <Badge className="bg-cyan-100 text-cyan-800">Advice</Badge>;
      case "MT720": return <Badge className="bg-pink-100 text-pink-800">Transfer</Badge>;
      case "MT730": return <Badge className="bg-indigo-100 text-indigo-800">Acknowledgment</Badge>;
      case "MT740": return <Badge className="bg-yellow-100 text-yellow-800">Authorization</Badge>;
      case "MT750": return <Badge className="bg-red-100 text-red-800">Discrepancy</Badge>;
      case "MT752": return <Badge className="bg-gray-100 text-gray-800">Authorization</Badge>;
      case "MT754": return <Badge className="bg-emerald-100 text-emerald-800">Payment</Badge>;
      case "MT756": return <Badge className="bg-violet-100 text-violet-800">Advice</Badge>;
      default: return <Badge variant="secondary">{messageCode}</Badge>;
    }
  };

  const mt7xxStats = {
    total: messages.length,
    active: messages.filter(m => m.IsActive).length,
    totalFields: messages.reduce((acc, m) => acc + (m.FieldCount || 0), 0),
    avgFields: messages.length > 0 ? Math.round(messages.reduce((acc, m) => acc + (m.FieldCount || 0), 0) / messages.length) : 0
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading MT7xx Documentary Credit Messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MT7xx Documentary Credit Messages</h1>
        <p className="text-gray-600">Comprehensive management of SWIFT MT7xx documentary credit message types</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Message Types</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total MT7xx Types</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mt7xxStats.total}</div>
                <p className="text-xs text-muted-foreground">Documentary credit messages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
                <Database className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mt7xxStats.active}</div>
                <p className="text-xs text-muted-foreground">Currently configured</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
                <Settings className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mt7xxStats.totalFields}</div>
                <p className="text-xs text-muted-foreground">Field definitions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Fields/Message</CardTitle>
                <Database className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{mt7xxStats.avgFields}</div>
                <p className="text-xs text-muted-foreground">Field complexity</p>
              </CardContent>
            </Card>
          </div>

          {/* MT7xx Message Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["MT700", "MT701", "MT705", "MT707", "MT710", "MT720", "MT730", "MT740", "MT750", "MT752", "MT754", "MT756"].map((messageCode) => {
              const message = messages.find(m => m.MessageTypeCode === messageCode);
              return (
                <Card key={messageCode} className={`${message?.IsActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-mono">{messageCode}</CardTitle>
                      {getMessageBadge(messageCode)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{message?.MessageName || "Not configured"}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {message?.Description || "Message type not yet configured in the system"}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          {message?.FieldCount || 0} fields
                        </div>
                        <Badge variant={message?.IsActive ? "default" : "secondary"}>
                          {message?.IsActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>MT7xx Message Explorer</CardTitle>
              <CardDescription>Search and filter documentary credit message types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search MT7xx messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
              <CardTitle>MT7xx Message Types ({filteredMessages.length})</CardTitle>
              <CardDescription>Documentary credit SWIFT message specifications</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No MT7xx messages found matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message Code</TableHead>
                        <TableHead>Message Name</TableHead>
                        <TableHead>Purpose</TableHead>
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
                          <TableCell>{getMessageBadge(message.MessageTypeCode)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{message.FieldCount || 0} fields</Badge>
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
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
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

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MT7xx Message Specifications</CardTitle>
              <CardDescription>Detailed technical specifications for documentary credit messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Primary Messages</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">MT700 - Issue of Documentary Credit</div>
                          <div className="text-sm text-gray-500">Initial LC issuance by issuing bank</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">MT701 - Issue of Documentary Credit Amendment</div>
                          <div className="text-sm text-gray-500">Modifications to existing LC</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Amendment</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">MT710 - Advice of Third Bank's LC</div>
                          <div className="text-sm text-gray-500">LC advice from third party bank</div>
                        </div>
                        <Badge className="bg-cyan-100 text-cyan-800">Advice</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Processing Messages</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">MT750 - Discrepancy Advice</div>
                          <div className="text-sm text-gray-500">Document discrepancy notifications</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Discrepancy</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">MT754 - Payment/Acceptance/Negotiation</div>
                          <div className="text-sm text-gray-500">LC settlement processing</div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800">Settlement</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">MT756 - Advice of Reimbursement</div>
                          <div className="text-sm text-gray-500">Reimbursement instructions</div>
                        </div>
                        <Badge className="bg-violet-100 text-violet-800">Reimbursement</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">MT7xx Message Flow</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>1. <strong>MT700</strong> - Issuing bank issues the letter of credit</div>
                    <div>2. <strong>MT710</strong> - Advising bank receives and advises the LC</div>
                    <div>3. <strong>MT701</strong> - Amendments processed if needed</div>
                    <div>4. <strong>MT750</strong> - Discrepancies reported if documents don't comply</div>
                    <div>5. <strong>MT754</strong> - Payment/acceptance processed upon compliance</div>
                    <div>6. <strong>MT756</strong> - Reimbursement advice sent to issuing bank</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
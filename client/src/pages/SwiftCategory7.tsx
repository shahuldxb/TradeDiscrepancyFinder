import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Search, 
  FileText,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye
} from "lucide-react";

export default function SwiftCategory7() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Category 7 message data
  const { data: messageTypes, isLoading } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
    retry: false,
  });

  // Filter for Category 7 messages only
  const category7Messages = (messageTypes || []).filter((msg: any) => msg.category === "7");

  const filteredMessages = category7Messages.filter((msg: any) =>
    msg.message_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mock statistics for Category 7 messages
  const statistics = {
    totalMessages: category7Messages.length,
    activeMessages: category7Messages.filter((msg: any) => msg.is_active).length,
    monthlyVolume: 1247,
    averageProcessingTime: "2.1s"
  };

  const messageUsageData = [
    { messageType: "MT700", count: 456, percentage: 36.7 },
    { messageType: "MT707", count: 234, percentage: 18.8 },
    { messageType: "MT710", count: 189, percentage: 15.2 },
    { messageType: "MT750", count: 167, percentage: 13.4 },
    { messageType: "MT740", count: 112, percentage: 9.0 },
    { messageType: "Others", count: 89, percentage: 7.1 }
  ];

  if (isLoading) {
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
      <div>
        <h1 className="text-3xl font-bold">Category 7 Messages</h1>
        <p className="text-gray-600">
          Documentary Credits and Guarantees - Comprehensive overview of MT7xx message types
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{statistics.totalMessages}</p>
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
                <p className="text-2xl font-bold">{statistics.activeMessages}</p>
                <p className="text-sm text-gray-600">Active Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{statistics.monthlyVolume}</p>
                <p className="text-sm text-gray-600">Monthly Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{statistics.averageProcessingTime}</p>
                <p className="text-sm text-gray-600">Avg. Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Message Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Category 7 messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Category Description */}
            <Card>
              <CardHeader>
                <CardTitle>Documentary Credits & Guarantees</CardTitle>
                <CardDescription>
                  Category 7 messages handle all aspects of documentary credit and guarantee operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Primary Functions</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Documentary credit issuance and advice</li>
                      <li>• Amendments and modifications</li>
                      <li>• Document presentation and examination</li>
                      <li>• Payment and reimbursement instructions</li>
                      <li>• Guarantee operations</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Compliance Standards</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• UCP 600 (Uniform Customs and Practice)</li>
                      <li>• ISBP (International Standard Banking Practice)</li>
                      <li>• Local regulatory requirements</li>
                      <li>• Anti-money laundering standards</li>
                      <li>• Know Your Customer (KYC) guidelines</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMessages.map((msgType: any) => (
                <Card key={msgType.message_type} className="cursor-pointer hover:shadow-md transition-shadow">
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
                      <div className="text-sm">
                        <span className="text-gray-600">Purpose:</span>
                        <p className="text-xs mt-1">{msgType.purpose?.substring(0, 80)}...</p>
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

            {filteredMessages.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No Category 7 messages found matching your search.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Message Usage Distribution</CardTitle>
                <CardDescription>
                  Breakdown of Category 7 message usage by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messageUsageData.map((item) => (
                    <div key={item.messageType} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{item.messageType}</Badge>
                        <span className="text-sm">{item.count} messages</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>
                  Monthly trends for Category 7 message processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">+12%</p>
                      <p className="text-sm text-gray-600">Month over Month</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">94.2%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Peak Hour: 2:00 PM - 3:00 PM</span>
                      <span className="font-medium">187 messages</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Daily Volume</span>
                      <span className="font-medium">41 messages</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Most Active Day</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle">
          <Card>
            <CardHeader>
              <CardTitle>Documentary Credit Lifecycle</CardTitle>
              <CardDescription>
                Complete lifecycle management for Category 7 messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Issuance (MT700)</h3>
                  </div>
                  <p className="text-sm text-gray-600">Documentary credit issued by issuing bank to advising bank.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Advice (MT710)</h3>
                  </div>
                  <p className="text-sm text-gray-600">Advising bank notifies beneficiary of credit availability.</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Amendment (MT707)</h3>
                  </div>
                  <p className="text-sm text-gray-600">Modifications to original credit terms and conditions.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Documents (MT750)</h3>
                  </div>
                  <p className="text-sm text-gray-600">Document presentation and discrepancy advice.</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-semibold">Payment (MT740)</h3>
                  </div>
                  <p className="text-sm text-gray-600">Authorization to reimburse or make payment.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Closure</h3>
                  </div>
                  <p className="text-sm text-gray-600">Final settlement and closure of documentary credit.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitoring</CardTitle>
              <CardDescription>
                Regulatory compliance status for Category 7 operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Compliance Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">98.5%</p>
                    <p className="text-sm text-gray-600">UCP 600 Compliance</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">99.1%</p>
                    <p className="text-sm text-gray-600">SWIFT Standards</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">97.3%</p>
                    <p className="text-sm text-gray-600">Regulatory Compliance</p>
                  </div>
                </div>

                {/* Recent Compliance Issues */}
                <div>
                  <h3 className="font-semibold mb-4">Recent Compliance Reviews</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">MT700 Format Validation</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Passed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">UCP Article 14 Compliance</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Review Required</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">AML Screening</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                    </div>
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
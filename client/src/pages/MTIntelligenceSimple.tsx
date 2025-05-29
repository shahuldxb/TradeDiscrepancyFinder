import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Database,
  ArrowRight,
  Filter,
  FileText
} from "lucide-react";

export default function MTIntelligence() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("");

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["/api/swift/statistics"],
  });

  // Fetch message types from Azure
  const { data: messageTypes, isLoading: loadingMessageTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
  });

  const handleMessageClick = (msgType: any) => {
    setLocation(`/swift-message/${msgType.message_type_code}`);
  };

  const handleMessageValidation = async () => {
    if (!messageText || !messageType) return;
    
    try {
      const response = await fetch('/api/swift/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageText,
          messageType
        }),
      });
      
      const result = await response.json();
      console.log('Validation result:', result);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  // Filter messages based on search term
  const filteredMessages = messageTypes?.filter((msg: any) =>
    msg.message_type_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">MT Intelligence</h1>
          <p className="text-lg text-gray-600">
            SWIFT Message Analysis and Validation System
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Message Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{statistics?.messageTypes || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Validated Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{statistics?.validatedMessages || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Valid Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-2xl font-bold">{statistics?.validMessages || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Issues Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-2xl font-bold">{statistics?.issuesFound || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Validation Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              SWIFT Message Validator
            </CardTitle>
            <CardDescription>
              Validate SWIFT messages against official specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Input
                  placeholder="e.g., 700, 701, 710..."
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleMessageValidation}
                  disabled={!messageText || !messageType}
                  className="w-full"
                >
                  Validate Message
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Message Content</label>
              <Textarea
                placeholder="Paste your SWIFT message here..."
                className="min-h-32"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SWIFT Message Types
            </CardTitle>
            <CardDescription>
              Browse and explore all available SWIFT MT7xx message types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by code, name, or purpose..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {loadingMessageTypes ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((msg: any, index: number) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500 hover:border-l-blue-600"
                    onClick={() => handleMessageClick(msg)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              MT{msg.message_type_code}
                            </Badge>
                            <h3 className="font-semibold text-lg">
                              {msg.message_type_name}
                            </h3>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {msg.purpose}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              Category: Documentary Credits
                            </span>
                            <span className="text-xs text-gray-500">
                              Network: SWIFT
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredMessages.length === 0 && !loadingMessageTypes && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No message types found matching your search criteria.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
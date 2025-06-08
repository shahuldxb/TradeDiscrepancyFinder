import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings
} from "lucide-react";
import { Link } from "wouter";

export default function SwiftMessageDetails() {
  const [, params] = useRoute("/swift-message/:messageType");
  const messageType = params?.messageType ? `MT${params.messageType}` : "";

  // Fetch message details
  const { data: messageData, isLoading } = useQuery({
    queryKey: ["/api/swift/comprehensive-data", params?.messageType],
    retry: false,
  });

  // Fetch SWIFT fields
  const { data: swiftFields } = useQuery({
    queryKey: ["/api/swift/fields-azure"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Mock message data if not available from API
  const mockMessageData = {
    message_type: messageType,
    message_type_name: `${messageType} Message`,
    description: `SWIFT ${messageType} message details`,
    category: "7",
    is_active: true,
    purpose: `Purpose and usage information for ${messageType}`,
    fields: swiftFields?.slice(0, 8) || []
  };

  const displayData = messageData || mockMessageData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/swift-message-types">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Message Types
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{displayData.message_type} Details</h1>
          <p className="text-gray-600">{displayData.message_type_name}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Message Type:</span>
                    <Badge variant="outline">{displayData.message_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span>{displayData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={displayData.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {displayData.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 block mb-1">Description:</span>
                    <p className="text-sm">{displayData.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">Purpose:</span>
                    <p className="text-sm">{displayData.purpose}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="fields" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fields">Message Fields</TabsTrigger>
          <TabsTrigger value="structure">Message Structure</TabsTrigger>
          <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Message Fields</CardTitle>
              <CardDescription>
                Field definitions and specifications for {displayData.message_type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayData.fields?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayData.fields.map((field: any, index: number) => (
                      <div key={field.field_code || index} className="p-4 bg-gray-50 rounded-lg">
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No field information available for this message type.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>Message Structure</CardTitle>
              <CardDescription>
                SWIFT message format and structure guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Header Block</h3>
                  <p className="text-sm text-gray-600">
                    Contains application header with message type, destination, and processing flags.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Text Block</h3>
                  <p className="text-sm text-gray-600">
                    Contains the message fields in the format :tag:content for each field.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Trailer Block</h3>
                  <p className="text-sm text-gray-600">
                    Contains checksums and authentication information for message integrity.
                  </p>
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
                Validation requirements and business rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Format Validation</h3>
                    <p className="text-sm text-green-600">
                      All fields must conform to their specified format patterns and length constraints.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">Business Rules</h3>
                    <p className="text-sm text-blue-600">
                      Message content must comply with UCP 600 documentary credit rules and regulations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">Network Rules</h3>
                    <p className="text-sm text-yellow-600">
                      Messages must follow SWIFT network rules for routing and processing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Message Examples</CardTitle>
              <CardDescription>
                Sample {displayData.message_type} message structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="mb-2 text-gray-400">// Header Block</div>
                  <div>{"{"}{1:F01BANKGB2LAXXX0000000000{"}"}</div>
                  <div>{"{"}{2:I{displayData.message_type.slice(2)}BANKUS33XXXXN{"}"}</div>
                  <div>{"{"}{3:{"{"}108:MT{params?.messageType}EXAMPLE{"}"}{"{"}121:12345678-1234-1234-1234-123456789abc{"}"}{"}"}{"}"}</div>
                  
                  <div className="mt-4 mb-2 text-gray-400">// Text Block</div>
                  <div>{"{"}{4:</div>
                  <div>:20:EXAMPLEREF123</div>
                  <div>:23:CRED</div>
                  <div>:31C:241201</div>
                  <div>:32B:USD100000,00</div>
                  <div>:50K:APPLICANT BANK</div>
                  <div>:59:BENEFICIARY NAME</div>
                  <div>-{"}"}</div>
                  
                  <div className="mt-4 mb-2 text-gray-400">// Trailer Block</div>
                  <div>{"{"}{5:{"{"}CHK:123456789ABC{"}"}{"}"}{"}"}</div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">Field Descriptions:</p>
                  <ul className="space-y-1">
                    <li>• <span className="font-mono">:20:</span> Documentary Credit Number</li>
                    <li>• <span className="font-mono">:31C:</span> Date of Issue</li>
                    <li>• <span className="font-mono">:32B:</span> Currency Code and Amount</li>
                    <li>• <span className="font-mono">:50K:</span> Applicant Bank</li>
                    <li>• <span className="font-mono">:59:</span> Beneficiary</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link href="/swift-message-types">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Message Types
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Download Specification
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Build Message
          </Button>
        </div>
      </div>
    </div>
  );
}
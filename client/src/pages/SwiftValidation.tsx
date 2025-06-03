import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  Search,
  Upload,
  Download,
  Play,
  RefreshCw
} from "lucide-react";

export default function SwiftValidation() {
  const [messageText, setMessageText] = useState("");
  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch SWIFT message types
  const { data: messageTypes } = useQuery({
    queryKey: ["/api/swift/message-types-azure"],
  });

  // Fetch validation statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/swift/statistics"],
  });

  const handleValidation = async () => {
    if (!messageText || !selectedMessageType) return;
    
    setIsValidating(true);
    try {
      const response = await fetch('/api/swift/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageText,
          messageType: selectedMessageType
        }),
      });
      
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        success: false,
        errors: ['Failed to validate message. Please check your input and try again.']
      });
    } finally {
      setIsValidating(false);
    }
  };

  const sampleMessages = {
    "700": `:20:DOCREF123456
:23:ISSUANCE
:31C:240603
:40A:IRREVOCABLE
:20:LC240603001
:31D:240903USD50000.00
:50:APPLICANT BANK LTD
MAIN STREET 123
NEW YORK NY 10001 US
:59:BENEFICIARY CORP
TRADE AVENUE 456
LONDON EC1A 1BB GB
:32B:USD50000.00
:39A:APPROXIMATELY
:41A:AVAILABLE WITH ANY BANK
:42C:DRAFTS AT SIGHT
:43T:TRANSSHIPMENT PROHIBITED
:44A:FROM NEW YORK TO LONDON
:45A:COMMERCIAL INVOICE IN TRIPLICATE
PACKING LIST IN DUPLICATE
BILL OF LADING CONSIGNED TO ORDER
:46A:DOCUMENTS TO BE PRESENTED WITHIN 21 DAYS
:47A:ADDITIONAL CONDITIONS IF ANY
:71B:CHARGES FOR ACCOUNT OF APPLICANT`,
    "701": `:20:DOCREF123456
:21:OURREF789
:31C:240603
:23:ACKNOWLEDGEMENT
:50:ISSUING BANK
:57A:ADVISING BANK
:27:1/1
:40A:IRREVOCABLE
:20:LC240603001`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">SWIFT Message Validation</h1>
          <p className="text-lg text-gray-600">
            Validate SWIFT MT7xx messages against official standards and field requirements
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Message Types</p>
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
                  <p className="text-sm text-muted-foreground">Validated</p>
                  <p className="text-2xl font-bold">{stats?.validatedMessages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Errors Found</p>
                  <p className="text-2xl font-bold">{stats?.errorsFound || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Field Rules</p>
                  <p className="text-2xl font-bold">{stats?.fieldRules || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="validator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validator">Message Validator</TabsTrigger>
            <TabsTrigger value="samples">Sample Messages</TabsTrigger>
            <TabsTrigger value="rules">Validation Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="validator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Message Input</span>
                  </CardTitle>
                  <CardDescription>
                    Paste your SWIFT message text and select the message type for validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message Type</label>
                    <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select message type" />
                      </SelectTrigger>
                      <SelectContent>
                        {messageTypes?.map((type: any) => (
                          <SelectItem key={type.message_type_code} value={type.message_type_code}>
                            MT{type.message_type_code} - {type.message_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message Text</label>
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Paste your SWIFT message here..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleValidation}
                      disabled={!messageText || !selectedMessageType || isValidating}
                      className="flex-1"
                    >
                      {isValidating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Validate Message
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setMessageText("");
                      setValidationResult(null);
                    }}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Validation Results</span>
                  </CardTitle>
                  <CardDescription>
                    Review validation results and field-level analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!validationResult ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter a message and click validate to see results</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert className={validationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <div className="flex items-center space-x-2">
                          {validationResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <AlertDescription>
                            {validationResult.success ? "Message validation passed" : "Message validation failed"}
                          </AlertDescription>
                        </div>
                      </Alert>
                      
                      {validationResult.errors && validationResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-700">Validation Errors:</h4>
                          {validationResult.errors.map((error: string, index: number) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {validationResult.warnings && validationResult.warnings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-orange-700">Warnings:</h4>
                          {validationResult.warnings.map((warning: string, index: number) => (
                            <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="samples" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(sampleMessages).map(([type, message]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>MT{type} Sample</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMessageText(message);
                          setSelectedMessageType(type);
                        }}
                      >
                        Use Sample
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      {type === "700" ? "Documentary Credit Issuance" : "Documentary Credit Advice"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                      {message}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SWIFT MT7xx Validation Rules</CardTitle>
                <CardDescription>
                  Field validation rules and requirements for Category 7 messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Mandatory Fields</h4>
                    <div className="space-y-2">
                      <Badge variant="outline">:20: Reference</Badge>
                      <Badge variant="outline">:31C: Date of Issue</Badge>
                      <Badge variant="outline">:40A: Form of Credit</Badge>
                      <Badge variant="outline">:50: Applicant</Badge>
                      <Badge variant="outline">:59: Beneficiary</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Format Rules</h4>
                    <div className="space-y-2 text-sm">
                      <p>• Reference (:20:) - Max 16 characters</p>
                      <p>• Date (:31C:) - YYMMDD format</p>
                      <p>• Amount (:32B:) - Currency + amount</p>
                      <p>• Party fields - Max 4 lines of 35 characters</p>
                    </div>
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
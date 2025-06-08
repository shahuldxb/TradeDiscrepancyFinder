import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertTriangle, 
  Upload,
  FileText,
  Search,
  Settings,
  Shield,
  Clock
} from "lucide-react";

export default function SwiftValidation() {
  const [validationInput, setValidationInput] = useState("");
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch validation history
  const { data: validationHistory } = useQuery({
    queryKey: ["/api/swift/validation-history"],
    retry: false,
  });

  const validateMessage = async () => {
    setIsValidating(true);
    // Mock validation for demonstration
    setTimeout(() => {
      setValidationResults({
        isValid: true,
        score: 94,
        errors: [
          {
            field: "32B",
            message: "Currency code format should be ISO 4217",
            severity: "warning"
          }
        ],
        warnings: [
          {
            field: "77A",
            message: "Narrative field exceeds recommended length",
            severity: "info"
          }
        ],
        compliance: {
          ucp600: "compliant",
          swift: "compliant",
          network: "compliant"
        }
      });
      setIsValidating(false);
    }, 2000);
  };

  const recentValidations = [
    {
      id: "1",
      messageType: "MT700",
      reference: "LC240115001",
      status: "passed",
      score: 98,
      timestamp: "2024-01-15T14:30:00Z"
    },
    {
      id: "2",
      messageType: "MT707",
      reference: "AM240115002",
      status: "warning",
      score: 85,
      timestamp: "2024-01-15T13:45:00Z"
    },
    {
      id: "3",
      messageType: "MT750",
      reference: "DS240115003",
      status: "failed",
      score: 65,
      timestamp: "2024-01-15T13:20:00Z"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SWIFT Message Validation</h1>
        <p className="text-gray-600">
          Validate SWIFT messages against format rules, business logic, and compliance standards
        </p>
      </div>

      {/* Validation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">94.7%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-sm text-gray-600">Messages Validated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">67</p>
                <p className="text-sm text-gray-600">Warnings Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">1.8s</p>
                <p className="text-sm text-gray-600">Avg. Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="validate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="validate">Message Validation</TabsTrigger>
          <TabsTrigger value="history">Validation History</TabsTrigger>
          <TabsTrigger value="rules">Validation Rules</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Check</TabsTrigger>
        </TabsList>

        <TabsContent value="validate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Message Input</CardTitle>
                <CardDescription>
                  Paste your SWIFT message for validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste SWIFT message here..."
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={validateMessage} disabled={isValidating || !validationInput.trim()}>
                    {isValidating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Validate Message
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>
                  Message validation status and detailed feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {validationResults ? (
                  <div className="space-y-4">
                    {/* Overall Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {validationResults.isValid ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        )}
                        <span className="font-semibold">
                          {validationResults.isValid ? "Validation Passed" : "Validation Failed"}
                        </span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Score: {validationResults.score}%
                      </Badge>
                    </div>

                    {/* Compliance Status */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Compliance Status</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-sm font-medium">UCP 600</p>
                          <Badge className="bg-green-100 text-green-800">
                            {validationResults.compliance.ucp600}
                          </Badge>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-sm font-medium">SWIFT</p>
                          <Badge className="bg-green-100 text-green-800">
                            {validationResults.compliance.swift}
                          </Badge>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-sm font-medium">Network</p>
                          <Badge className="bg-green-100 text-green-800">
                            {validationResults.compliance.network}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Issues */}
                    {validationResults.errors?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-red-600">Errors</h3>
                        {validationResults.errors.map((error: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Field {error.field}</p>
                              <p className="text-sm text-red-600">{error.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {validationResults.warnings?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-yellow-600">Warnings</h3>
                        {validationResults.warnings.map((warning: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Field {warning.field}</p>
                              <p className="text-sm text-yellow-600">{warning.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a SWIFT message to begin validation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Validations</CardTitle>
              <CardDescription>
                History of recent message validations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentValidations.map((validation) => (
                  <div key={validation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(validation.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{validation.messageType}</Badge>
                          <span className="font-medium">{validation.reference}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(validation.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Score: {validation.score}%</p>
                        <Badge className={getStatusColor(validation.status)}>
                          {validation.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Configure validation rules and compliance standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Format Validation</h3>
                  <p className="text-sm text-blue-600">
                    Validates field formats, lengths, and character sets according to SWIFT standards.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Business Logic</h3>
                  <p className="text-sm text-green-600">
                    Checks business rules and relationships between fields for logical consistency.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Compliance Standards</h3>
                  <p className="text-sm text-purple-600">
                    Ensures compliance with UCP 600, ISBP, and local regulatory requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>
                Monitor compliance across different standards and regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-semibold">UCP 600</h3>
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-semibold">SWIFT Standards</h3>
                  <p className="text-2xl font-bold text-blue-600">99.2%</p>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Settings className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">Network Rules</h3>
                  <p className="text-2xl font-bold text-purple-600">97.8%</p>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
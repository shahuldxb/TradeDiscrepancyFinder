import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, FileText, AlertTriangle, Code, Network, Clock } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SwiftMessageDetails() {
  const [match, params] = useRoute("/swift-message/:messageType");
  const messageType = params?.messageType;

  const { data: comprehensiveData, isLoading } = useQuery({
    queryKey: [`/api/swift/comprehensive-data/${messageType}`],
    enabled: !!messageType,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!comprehensiveData || !comprehensiveData.messageType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Message type not found or no data available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { messageType: msgType, fields, fieldSpecifications, fieldFormatOptions, validationRules, dependencies, fieldCodes } = comprehensiveData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/mt-intelligence">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="h-4 w-4" />
              Back to Messages
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              MT{msgType.message_type_code} - {msgType.message_type_name}
            </h1>
            <p className="text-gray-600 mt-1">{msgType.purpose}</p>
          </div>
        </div>

        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Message Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-lg font-semibold">{msgType.category || 'Documentary Credits'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Fields</p>
                <p className="text-lg font-semibold">{fields?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mandatory Fields</p>
                <p className="text-lg font-semibold text-red-600">
                  {fields?.filter(f => f.is_mandatory)?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Optional Fields</p>
                <p className="text-lg font-semibold text-blue-600">
                  {fields?.filter(f => !f.is_mandatory)?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="fields" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fields">Message Fields</TabsTrigger>
            <TabsTrigger value="specifications">Field Specifications</TabsTrigger>
            <TabsTrigger value="validation">Validation Rules</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="codes">Field Codes</TabsTrigger>
          </TabsList>

          {/* Message Fields Tab */}
          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <CardTitle>Message Fields</CardTitle>
                <CardDescription>
                  All fields defined for MT{msgType.message_type_code} message type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag</TableHead>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Content Options</TableHead>
                      <TableHead>Sequence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields?.map((field, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{field.tag}</TableCell>
                        <TableCell className="font-medium">{field.field_name}</TableCell>
                        <TableCell>
                          <Badge variant={field.is_mandatory ? "destructive" : "secondary"}>
                            {field.is_mandatory ? "Mandatory" : "Optional"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {field.content_options || "N/A"}
                        </TableCell>
                        <TableCell>{field.sequence}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Specifications Tab */}
          <TabsContent value="specifications">
            <Card>
              <CardHeader>
                <CardTitle>Field Specifications</CardTitle>
                <CardDescription>
                  Detailed specifications for each field including format and presence rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldSpecifications?.map((spec, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900">Format Description</h4>
                            <p className="text-sm text-gray-600">{spec.format_description}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Presence</h4>
                            <p className="text-sm text-gray-600">{spec.presence_description}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Definition</h4>
                            <p className="text-sm text-gray-600">{spec.definition_description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Rules Tab */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Rules
                </CardTitle>
                <CardDescription>
                  Network validated rules, usage rules, and field validation rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validationRules?.map((rule, index) => (
                    <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{rule.rule_type?.replace('_', ' ')}</Badge>
                              {rule.rule_code && (
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {rule.rule_code}
                                </code>
                              )}
                            </div>
                            <p className="text-sm font-medium">{rule.rule_description}</p>
                            {rule.error_message && (
                              <p className="text-sm text-red-600">{rule.error_message}</p>
                            )}
                            {rule.validation_rule && (
                              <p className="text-xs text-gray-500">Rule: {rule.validation_rule}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Message Dependencies
                </CardTitle>
                <CardDescription>
                  Relationships with other SWIFT message types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dependencies?.map((dep, index) => (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{dep.dependency_type}</Badge>
                              <span className="text-sm text-gray-600">
                                {dep.source_type_code} → {dep.target_type_code}
                              </span>
                            </div>
                            <p className="text-sm">{dep.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Codes Tab */}
          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Field Codes
                </CardTitle>
                <CardDescription>
                  Predefined codes and values for specific fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldCodes?.map((code, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {code.code}
                            </code>
                          </div>
                          <p className="text-sm font-medium">{code.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
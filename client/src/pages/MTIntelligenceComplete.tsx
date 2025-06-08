import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Database, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SwiftMessage {
  message_type: string;
  message_type_code: string;
  message_type_name: string;
  description: string;
  category: string;
  purpose: string;
  is_active: boolean;
}

interface SwiftField {
  field_code: string;
  field_name: string;
  format: string;
  max_length: number;
  is_mandatory: boolean;
  sequence_number: number;
  description: string;
}

interface FieldValidation {
  field_code: string;
  field_name: string;
  rule_type: string;
  rule_description: string;
  validation_pattern: string;
  error_message: string;
}

interface FieldSpecification {
  field_code: string;
  field_name: string;
  specification: string;
  format: string;
  presence: string;
  definition: string;
}

export default function MTIntelligenceComplete() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SwiftMessage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch SWIFT message types from Azure database
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery<SwiftMessage[]>({
    queryKey: ['/api/swift/message-types-azure'],
    enabled: true,
  });

  // Fetch fields for selected message
  const { data: messageFields = [], isLoading: fieldsLoading } = useQuery<SwiftField[]>({
    queryKey: ['/api/swift/fields-by-message', selectedMessage?.message_type_code],
    enabled: !!selectedMessage?.message_type_code,
  });

  // Fetch field specifications
  const { data: fieldSpecs = [], isLoading: specsLoading } = useQuery<FieldSpecification[]>({
    queryKey: ['/api/swift/field-specifications', selectedMessage?.message_type_code],
    enabled: !!selectedMessage?.message_type_code,
  });

  // Fetch validation rules
  const { data: validationRules = [], isLoading: validationLoading } = useQuery<FieldValidation[]>({
    queryKey: ['/api/swift/field-validation', selectedMessage?.message_type_code],
    enabled: !!selectedMessage?.message_type_code,
  });

  // Filter messages based on search and category
  const filteredMessages = messages.filter((msg: SwiftMessage) => {
    const matchesSearch = msg.message_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.message_type_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || msg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get statistics
  const totalMessages = messages.length;
  const activeMessages = messages.filter((msg: SwiftMessage) => msg.is_active).length;
  const categories = Array.from(new Set(messages.map((msg: SwiftMessage) => msg.category)));
  const categoryStats = categories.map(cat => ({
    category: cat,
    count: messages.filter((msg: SwiftMessage) => msg.category === cat).length
  }));

  const handleMessageClick = (message: SwiftMessage) => {
    setSelectedMessage(message);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case '7': return 'bg-blue-100 text-blue-800';
      case '4': return 'bg-green-100 text-green-800';
      case '6': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'INFO': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (messagesError) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to connect to Azure database. Please ensure the database connection is properly configured.
            Expected tables: swift.message_types, swift.field_codes, swift.message_fields, swift.field_validation_rules, swift.field_specification
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">MT Intelligence</h1>
        <p className="text-muted-foreground">
          Comprehensive SWIFT Message Type Analysis and Field Intelligence
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">SWIFT message types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMessages}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Message categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fields</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageFields.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedMessage ? `${selectedMessage.message_type} fields` : 'Select message'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search message types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
            >
              Category {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Types Grid */}
        <Card>
          <CardHeader>
            <CardTitle>SWIFT Message Types</CardTitle>
            <CardDescription>
              {messagesLoading ? 'Loading...' : `${filteredMessages.length} of ${totalMessages} messages`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center text-muted-foreground">No messages found</div>
              ) : (
                filteredMessages.map((message: SwiftMessage) => (
                  <div
                    key={message.message_type}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedMessage?.message_type === message.message_type ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{message.message_type}</span>
                          <Badge className={getCategoryBadgeColor(message.category)}>
                            Cat {message.category}
                          </Badge>
                          {message.is_active && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {message.message_type_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMessage ? `${selectedMessage.message_type} Details` : 'Select a Message Type'}
            </CardTitle>
            <CardDescription>
              {selectedMessage ? selectedMessage.message_type_name : 'Click on a message type to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <Tabs defaultValue="fields" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>

                {/* Fields Tab */}
                <TabsContent value="fields" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Message Purpose</h4>
                    <p className="text-sm text-muted-foreground">{selectedMessage.purpose}</p>
                  </div>
                  
                  {fieldsLoading ? (
                    <div className="text-center text-muted-foreground">Loading fields...</div>
                  ) : messageFields.length === 0 ? (
                    <div className="text-center text-muted-foreground">No fields found</div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium">Message Fields ({messageFields.length})</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {messageFields.map((field: SwiftField) => (
                            <TableRow key={field.field_code}>
                              <TableCell className="font-medium">{field.field_code}</TableCell>
                              <TableCell>{field.field_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.format}</Badge>
                              </TableCell>
                              <TableCell>
                                {field.is_mandatory ? (
                                  <Badge variant="destructive">Required</Badge>
                                ) : (
                                  <Badge variant="secondary">Optional</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Specifications Tab */}
                <TabsContent value="specifications" className="space-y-4">
                  {specsLoading ? (
                    <div className="text-center text-muted-foreground">Loading specifications...</div>
                  ) : fieldSpecs.length === 0 ? (
                    <div className="text-center text-muted-foreground">No specifications found</div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium">Field Specifications</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Format</TableHead>
                            <TableHead>Presence</TableHead>
                            <TableHead>Definition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldSpecs.map((spec: FieldSpecification) => (
                            <TableRow key={spec.field_code}>
                              <TableCell className="font-medium">{spec.field_code}</TableCell>
                              <TableCell>{spec.field_name}</TableCell>
                              <TableCell className="font-mono text-xs">{spec.format}</TableCell>
                              <TableCell>
                                <Badge variant={spec.presence === 'Mandatory' ? 'destructive' : 'secondary'}>
                                  {spec.presence}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                {spec.definition}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Validation Tab */}
                <TabsContent value="validation" className="space-y-4">
                  {validationLoading ? (
                    <div className="text-center text-muted-foreground">Loading validation rules...</div>
                  ) : validationRules.length === 0 ? (
                    <div className="text-center text-muted-foreground">No validation rules found</div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium">Validation Rules</h4>
                      <div className="space-y-2">
                        {validationRules.map((rule: FieldValidation, index: number) => (
                          <div key={`${rule.field_code}-${index}`} className="border rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{rule.field_code}</span>
                                  <span className="text-sm text-muted-foreground">- {rule.field_name}</span>
                                  <Badge variant="outline">{rule.rule_type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rule.rule_description}
                                </p>
                                {rule.validation_pattern && (
                                  <p className="text-xs font-mono bg-gray-100 p-1 rounded mt-1">
                                    Pattern: {rule.validation_pattern}
                                  </p>
                                )}
                                <p className="text-xs text-red-600 mt-1">
                                  {rule.error_message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a SWIFT message type to view detailed field information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Message Category Distribution</CardTitle>
          <CardDescription>SWIFT message types by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryStats.map(stat => (
              <div key={stat.category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-sm text-muted-foreground">Category {stat.category} Messages</p>
                  </div>
                  <Badge className={getCategoryBadgeColor(stat.category)}>
                    Cat {stat.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
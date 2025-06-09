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
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch SWIFT message types from Azure database
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery<SwiftMessage[]>({
    queryKey: ['/api/swift/message-types-azure'],
    enabled: true,
  });

  // Fetch fields for selected message (only when field details tab is active)
  const { data: messageFields = [], isLoading: fieldsLoading } = useQuery<SwiftField[]>({
    queryKey: ['/api/swift/fields-by-message', selectedMessage?.message_type_code],
    queryFn: async () => {
      if (!selectedMessage?.message_type_code) return [];
      const response = await fetch(`/api/swift/fields-by-message?messageTypeCode=${selectedMessage.message_type_code}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: !!selectedMessage?.message_type_code && activeTab === 'fields',
  });

  // Fetch field specifications (only when specifications tab is active)
  const { data: fieldSpecs = [], isLoading: specsLoading } = useQuery<FieldSpecification[]>({
    queryKey: ['/api/swift/field-specifications', selectedMessage?.message_type_code],
    queryFn: async () => {
      if (!selectedMessage?.message_type_code) return [];
      const response = await fetch(`/api/swift/field-specifications?messageTypeCode=${selectedMessage.message_type_code}`);
      if (!response.ok) throw new Error('Failed to fetch specifications');
      return response.json();
    },
    enabled: !!selectedMessage?.message_type_code && activeTab === 'specifications',
  });

  // Fetch validation rules (only when validation tab is active)
  const { data: validationRules = [], isLoading: validationLoading } = useQuery<FieldValidation[]>({
    queryKey: ['/api/swift/field-validation', selectedMessage?.message_type_code],
    queryFn: async () => {
      if (!selectedMessage?.message_type_code) return [];
      const response = await fetch(`/api/swift/field-validation?messageTypeCode=${selectedMessage.message_type_code}`);
      if (!response.ok) throw new Error('Failed to fetch validation rules');
      return response.json();
    },
    enabled: !!selectedMessage?.message_type_code && activeTab === 'validation',
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Message Types Overview</TabsTrigger>
          <TabsTrigger value="fields" disabled={!selectedMessage}>
            Fields {selectedMessage ? `(${selectedMessage.message_type})` : ''}
          </TabsTrigger>
          <TabsTrigger value="specifications" disabled={!selectedMessage}>
            Specifications {selectedMessage ? `(${selectedMessage.message_type})` : ''}
          </TabsTrigger>
          <TabsTrigger value="validation" disabled={!selectedMessage}>
            Validation {selectedMessage ? `(${selectedMessage.message_type})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Main SWIFT Message Types Grid */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All SWIFT Message Types</CardTitle>
              <CardDescription>
                Complete grid view of all {totalMessages} SWIFT message types from Azure database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messagesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading SWIFT message types from Azure database...
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMessages.map((message: SwiftMessage) => (
                        <TableRow 
                          key={message.message_type}
                          className={selectedMessage?.message_type === message.message_type ? 'bg-blue-50' : ''}
                        >
                          <TableCell className="font-mono font-semibold">
                            {message.message_type}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="font-medium">{message.message_type_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryBadgeColor(message.category)}>
                              Category {message.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {message.is_active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {message.purpose}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={selectedMessage?.message_type === message.message_type ? "default" : "outline"}
                              onClick={() => {
                                setSelectedMessage(message);
                                setActiveTab('fields');
                              }}
                            >
                              View Fields
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab Content */}
        <TabsContent value="fields" className="space-y-4">
          {!selectedMessage ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Select a message type from the Overview tab to view field details
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedMessage.message_type} - Field Details</CardTitle>
                <CardDescription>{selectedMessage.message_type_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Message Purpose</h4>
                  <p className="text-sm text-muted-foreground">{selectedMessage.purpose}</p>
                </div>
                
                {fieldsLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading fields...</div>
                ) : messageFields.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No fields found</div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-medium">Message Fields ({messageFields.length})</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Code</TableHead>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Max Length</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messageFields.map((field: SwiftField) => (
                          <TableRow key={field.field_code}>
                            <TableCell className="font-mono font-medium">{field.field_code}</TableCell>
                            <TableCell>{field.field_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.format}</Badge>
                            </TableCell>
                            <TableCell>{field.max_length || 'N/A'}</TableCell>
                            <TableCell>
                              {field.is_mandatory ? (
                                <Badge variant="destructive">Required</Badge>
                              ) : (
                                <Badge variant="secondary">Optional</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs text-sm text-muted-foreground">
                              {field.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Specifications Tab Content */}
        <TabsContent value="specifications" className="space-y-4">
          {!selectedMessage ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Select a message type from the Overview tab to view specifications
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedMessage.message_type} - Field Specifications</CardTitle>
                <CardDescription>Technical specifications for all fields</CardDescription>
              </CardHeader>
              <CardContent>
                {specsLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading specifications...</div>
                ) : fieldSpecs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No specifications found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Code</TableHead>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Presence</TableHead>
                        <TableHead>Definition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fieldSpecs.map((spec: FieldSpecification) => (
                        <TableRow key={spec.field_code}>
                          <TableCell className="font-mono font-medium">{spec.field_code}</TableCell>
                          <TableCell>{spec.field_name}</TableCell>
                          <TableCell className="font-mono text-xs">{spec.format}</TableCell>
                          <TableCell>
                            <Badge variant={spec.presence === 'Mandatory' ? 'destructive' : 'secondary'}>
                              {spec.presence}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-sm">
                            {spec.definition}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Validation Tab Content */}
        <TabsContent value="validation" className="space-y-4">
          {!selectedMessage ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Select a message type from the Overview tab to view validation rules
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedMessage.message_type} - Validation Rules</CardTitle>
                <CardDescription>Field validation rules and constraints</CardDescription>
              </CardHeader>
              <CardContent>
                {validationLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading validation rules...</div>
                ) : validationRules.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No validation rules found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Code</TableHead>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Rule Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Pattern</TableHead>
                        <TableHead>Error Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationRules.map((rule: FieldValidation, index: number) => (
                        <TableRow key={`${rule.field_code}-${index}`}>
                          <TableCell className="font-mono font-medium">{rule.field_code}</TableCell>
                          <TableCell>{rule.field_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.rule_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs">
                            {rule.rule_description}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rule.validation_pattern || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs text-red-600 max-w-xs">
                            {rule.error_message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
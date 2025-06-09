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

  // Fetch ALL fields from database (when fields tab is active)
  const { data: allFields = [], isLoading: fieldsLoading } = useQuery<SwiftField[]>({
    queryKey: ['/api/swift/fields-by-message'],
    queryFn: async () => {
      const response = await fetch('/api/swift/fields-by-message');
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: activeTab === 'fields',
  });

  // Fetch ALL field specifications (when specifications tab is active)
  const { data: allFieldSpecs = [], isLoading: specsLoading } = useQuery<FieldSpecification[]>({
    queryKey: ['/api/swift/field-specifications'],
    queryFn: async () => {
      const response = await fetch('/api/swift/field-specifications');
      if (!response.ok) throw new Error('Failed to fetch specifications');
      return response.json();
    },
    enabled: activeTab === 'specifications',
  });

  // Fetch ALL validation rules (when validation tab is active)
  const { data: allValidationRules = [], isLoading: validationLoading } = useQuery<FieldValidation[]>({
    queryKey: ['/api/swift/field-validation'],
    queryFn: async () => {
      const response = await fetch('/api/swift/field-validation');
      if (!response.ok) throw new Error('Failed to fetch validation rules');
      return response.json();
    },
    enabled: activeTab === 'validation',
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

  const getValidationPatternExplanation = (fieldCode: string, pattern?: string) => {
    const explanations: { [key: string]: string } = {
      '20': 'Documentary Credit Number - Must be 1-16 alphanumeric characters. Format 16x contains letters, numbers, and limited special characters. Used as unique identifier for the LC transaction.',
      '23': 'Reference to Pre-Advice - Format 4!c exactly 4 characters indicating reference type (PHON, TELE, etc.). Links to preliminary notification of the credit.',
      '27': 'Sequence of Total - Format 1!n/1!n two single digits separated by slash (e.g., 1/1, 2/5). Indicates sequence number and total number of related messages.',
      '31C': 'Date of Issue - Format 6!n YYMMDD format (e.g., 240315 for March 15, 2024). Must be valid calendar date representing when the LC was issued.',
      '31D': 'Date and Place of Expiry - Format 6!n/4!a2!a date in YYMMDD format followed by 4-letter location code and 2-letter country code. Defines when and where the LC expires.',
      '32A': 'Value Date, Currency Code, Amount - Format 6!n/3!a/15d date (YYMMDD), currency (3-letter ISO code), and amount (up to 15 digits with decimals). Core financial details of the LC.',
      '32B': 'Currency Code, Amount - Format 3!a/15d currency code and amount without value date. Used for secondary amounts or fees.',
      '40A': 'Form of Documentary Credit - Format 1!a single character code R (Revocable), I (Irrevocable), T (Transferable). Defines the LC type and characteristics.',
      '41A': 'Available With By - Format 4!a/2!a/35x bank identifier, availability type, and bank details. Specifies which bank and how the credit is available.',
      '42C': 'Drafts at - Format 35x free text describing draft payment terms (e.g., SIGHT, 30 DAYS AFTER B/L DATE). Defines payment timing.',
      '43P': 'Partial Shipments - Format 35x text field ALLOWED or NOT ALLOWED. Indicates whether partial deliveries are permitted.',
      '44A': 'Loading on Board/Dispatch - Format 65x free text describing port or place of loading/dispatch. Critical for logistics and compliance.',
      '44B': 'For Transportation to - Format 65x destination port or place for transportation. Must match shipping documents.',
      '44C': 'Latest Date of Shipment - Format 6!n YYMMDD format. Last acceptable shipping date. Critical deadline for beneficiary compliance.',
      '44D': 'Shipment Period - Format 65x text describing shipping window or period. Alternative to fixed shipping date.',
      '45A': 'Description of Goods/Services - Format 65x*5 up to 5 lines of 65 characters each. Detailed description of goods or services being traded.',
      '46A': 'Documents Required - Format 65x*100 extensive field listing all required documents. Critical for LC compliance and payment.',
      '47A': 'Additional Conditions - Format 65x*100 special terms and conditions beyond standard requirements. Must be clearly achievable.',
      '48': 'Period for Presentation - Format 35x time limit for document presentation after shipment (e.g., 21 DAYS). Standard is 21 days per UCP 600.',
      '49': 'Confirmation Instructions - Format 35x instructions for confirming bank CONFIRM, MAY ADD, WITHOUT. Affects payment guarantee.',
      '50': 'Applicant - Format 35x*4 name and address of LC applicant (buyer). Must match exactly with underlying sales contract.',
      '51A': 'Applicant Bank - Format 1!a/4!a2!a/35x bank identifier using BIC code or name/address. Represents the applicant in banking relationship.',
      '52A': 'Issuing Bank - Format 1!a/4!a2!a/35x bank that issues the LC. Uses BIC code format. Primary liable party under the credit.',
      '53A': 'Reimbursing Bank - Format 1!a/4!a2!a/35x bank that reimburses the negotiating bank. Used in reimbursement arrangements.',
      '54A': 'Advising Bank - Format 1!a/4!a2!a/35x bank that advises the credit to beneficiary. First point of contact for beneficiary.',
      '55A': 'Confirming Bank - Format 1!a/4!a2!a/35x bank that adds confirmation to the credit. Provides additional payment guarantee.',
      '56A': 'Intermediary Bank - Format 1!a/4!a2!a/35x bank involved in payment process between issuing and advising banks.',
      '57A': 'Advise Through Bank - Format 1!a/4!a2!a/35x intermediate bank for routing the LC advice. Used in correspondent banking.',
      '58A': 'Beneficiary Bank - Format 1!a/4!a2!a/35x bank of the beneficiary. Where beneficiary maintains account for credit proceeds.',
      '59': 'Beneficiary - Format 35x*4 name and address of beneficiary (seller). Must match exactly with documents to be presented.',
      '70': 'Documentary Credit Text - Format 65x*35 additional narrative or instructions. Provides context and special requirements.',
      '71A': 'Charges - Format 3!a/3!a charge allocation codes. First code for LC charges, second for amendment charges (e.g., BEN/OUR).',
      '71B': 'Charges - Format 3!a/15d specific charge amount and currency. Used when exact charge amounts are specified.',
      '72': 'Sender to Receiver Information - Format 35x*6 bank-to-bank instructions. Internal banking communication not seen by parties.',
      '73': 'Instructions to Paying/Accepting Bank - Format 35x*10 specific instructions for the bank handling payment or acceptance.',
      '77A': 'Delivery Instructions - Format 20x instructions for delivery of documents or goods. Logistics coordination information.',
      '77B': 'For Account - Format 35x*4 account details for specific transactions. Banking arrangement specifications.'
    };

    if (explanations[fieldCode]) {
      return explanations[fieldCode];
    }

    // Default explanation based on pattern if available
    if (pattern) {
      if (pattern.includes('/6!n/')) {
        return 'Date field in YYMMDD format - Must be 6 numeric characters representing a valid calendar date.';
      }
      if (pattern.includes('/3!a/')) {
        return 'Currency code field - Must be exactly 3 alphabetic characters following ISO 4217 standard.';
      }
      if (pattern.includes('/35x/')) {
        return 'Text field up to 35 characters - Alphanumeric characters with limited special characters allowed.';
      }
      if (pattern.includes('/4!a2!a/')) {
        return 'Bank identifier - 4-character bank code followed by 2-character country code (BIC format).';
      }
      if (pattern.includes('15d')) {
        return 'Decimal amount field - Up to 15 digits including decimal places for monetary amounts.';
      }
    }

    return 'Standard SWIFT validation applies - Field must conform to SWIFT character set and length restrictions per message type specification.';
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
            <div className="text-2xl font-bold">{allFields.length}</div>
            <p className="text-xs text-muted-foreground">
              Total SWIFT fields
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
          <TabsTrigger value="fields">All Fields</TabsTrigger>
          <TabsTrigger value="specifications">All Specifications</TabsTrigger>
          <TabsTrigger value="validation">All Validation Rules</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle>All SWIFT Field Codes</CardTitle>
              <CardDescription>Complete list of all SWIFT field codes from Azure database</CardDescription>
            </CardHeader>
            <CardContent>
              {fieldsLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading all fields...</div>
              ) : allFields.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No fields found</div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium">Total Fields: {allFields.length}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Code</TableHead>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Max Length</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Sequence</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allFields.map((field: SwiftField, index: number) => (
                        <TableRow key={`${field.field_code}-${index}`}>
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
                          <TableCell>{field.sequence_number || 'N/A'}</TableCell>
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
        </TabsContent>

        {/* Specifications Tab Content */}
        <TabsContent value="specifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All SWIFT Field Specifications</CardTitle>
              <CardDescription>Complete technical specifications for all SWIFT fields from Azure database</CardDescription>
            </CardHeader>
            <CardContent>
              {specsLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading all specifications...</div>
              ) : allFieldSpecs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No specifications found</div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium">Total Specifications: {allFieldSpecs.length}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Code</TableHead>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Specification</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Presence</TableHead>
                        <TableHead>Definition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allFieldSpecs.map((spec: FieldSpecification, index: number) => (
                        <TableRow key={`${spec.field_code}-${index}`}>
                          <TableCell className="font-mono font-medium">{spec.field_code}</TableCell>
                          <TableCell>{spec.field_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs">
                            {spec.specification}
                          </TableCell>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab Content */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All SWIFT Field Validation Rules</CardTitle>
              <CardDescription>Complete validation rules and constraints for all SWIFT fields from Azure database</CardDescription>
            </CardHeader>
            <CardContent>
              {validationLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading all validation rules...</div>
              ) : allValidationRules.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No validation rules found</div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium">Total Validation Rules: {allValidationRules.length}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Code</TableHead>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Rule Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Validation Pattern Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allValidationRules.map((rule: FieldValidation, index: number) => (
                        <TableRow key={`${rule.field_code}-${index}`}>
                          <TableCell className="font-mono font-medium">{rule.field_code}</TableCell>
                          <TableCell>{rule.field_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.rule_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs">
                            {rule.rule_description}
                          </TableCell>
                          <TableCell className="text-sm max-w-md">
                            {getValidationPatternExplanation(rule.field_code, rule.validation_pattern)}
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
      </Tabs>
    </div>
  );
}
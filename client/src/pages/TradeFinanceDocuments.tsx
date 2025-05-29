import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  CreditCard, 
  Network, 
  Search, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function TradeFinanceDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedView, setSelectedView] = useState("overview");
  const [selectedCredit, setSelectedCredit] = useState("");
  const [selectedSwift, setSelectedSwift] = useState("");

  // Fetch trade finance statistics
  const { data: statistics } = useQuery({
    queryKey: ["/api/trade-finance/statistics"],
  });

  // Fetch documentary credits
  const { data: credits, isLoading: loadingCredits } = useQuery({
    queryKey: ["/api/trade-finance/documentary-credits"],
  });

  // Fetch master documents
  const { data: documents, isLoading: loadingDocuments } = useQuery({
    queryKey: ["/api/trade-finance/master-documents"],
  });

  // Fetch SWIFT message codes
  const { data: swiftCodes, isLoading: loadingSwift } = useQuery({
    queryKey: ["/api/trade-finance/swift-message-codes"],
  });

  // Fetch credit document summary
  const { data: creditSummary } = useQuery({
    queryKey: ["/api/trade-finance/credit-document-summary"],
  });

  // Fetch documents for selected credit
  const { data: creditDocuments } = useQuery({
    queryKey: [`/api/trade-finance/credit-documents/${selectedCredit}`],
    enabled: !!selectedCredit,
  });

  // Fetch documents for selected SWIFT message
  const { data: swiftDocuments } = useQuery({
    queryKey: [`/api/trade-finance/swift-documents/${selectedSwift}`],
    enabled: !!selectedSwift,
  });

  // Fetch SWIFT credit mappings
  const { data: swiftCreditMappings } = useQuery({
    queryKey: ["/api/trade-finance/swift-credit-mappings"],
  });

  // Fetch document SWIFT relationships
  const { data: documentRelationships } = useQuery({
    queryKey: ["/api/trade-finance/document-swift-relationships"],
  });

  // Filter functions
  const filteredCredits = credits?.filter((credit: any) =>
    credit.creditCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credit.creditName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredDocuments = documents?.filter((doc: any) =>
    doc.documentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredSwiftCodes = swiftCodes?.filter((swift: any) =>
    swift.swiftCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swift.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/mt-intelligence">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="h-4 w-4" />
              Back to MT Intelligence
            </button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Trade Finance Documentation Management</h1>
            <p className="text-lg text-gray-600 mt-1">
              Manage 18 documentary credit types, 40 document types, and 38 SWIFT message relationships
            </p>
          </div>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Documentary Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold">{statistics.totalCredits}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Master Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold">{statistics.totalDocuments}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">SWIFT Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-purple-600" />
                  <span className="text-2xl font-bold">{statistics.totalSwiftMessages}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Credit Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-2xl font-bold">{statistics.totalMappings}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span className="text-2xl font-bold">{statistics.totalRequirements}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search credits, documents, or SWIFT codes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="credits">Documentary Credits</SelectItem>
                  <SelectItem value="documents">Master Documents</SelectItem>
                  <SelectItem value="swift">SWIFT Messages</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="credits">Documentary Credits</TabsTrigger>
            <TabsTrigger value="documents">Master Documents</TabsTrigger>
            <TabsTrigger value="swift">SWIFT Messages</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Credit Document Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Documentary Credit Summary</CardTitle>
                  <CardDescription>
                    Document requirements for each credit type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Credit Code</TableHead>
                        <TableHead>Credit Name</TableHead>
                        <TableHead>Mandatory Documents</TableHead>
                        <TableHead>Optional Documents</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditSummary?.map((summary: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{summary.creditCode}</TableCell>
                          <TableCell className="font-medium">{summary.creditName}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{summary.mandatoryDocumentCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{summary.optionalDocumentCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {summary.mandatoryDocumentCount + summary.optionalDocumentCount}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documentary Credits Tab */}
          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <CardTitle>Documentary Credits ({credits?.length || 0})</CardTitle>
                <CardDescription>
                  All 18 documentary credit types in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={selectedCredit} onValueChange={setSelectedCredit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a credit type to view documents" />
                      </SelectTrigger>
                      <SelectContent>
                        {credits?.map((credit: any) => (
                          <SelectItem key={credit.creditId} value={credit.creditCode}>
                            {credit.creditCode} - {credit.creditName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCredits.map((credit: any) => (
                      <Card key={credit.creditId} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="font-mono">
                                {credit.creditCode}
                              </Badge>
                              <Badge variant="outline">
                                {credit.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-sm">{credit.creditName}</h3>
                            <p className="text-xs text-gray-600">{credit.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Selected Credit Documents */}
                  {selectedCredit && creditDocuments && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Documents for {selectedCredit}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Code</TableHead>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Conditional</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditDocuments.map((doc: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono">{doc.documentCode}</TableCell>
                                <TableCell>{doc.documentName}</TableCell>
                                <TableCell>
                                  <Badge variant={doc.status === 'Mandatory' ? 'destructive' : 'secondary'}>
                                    {doc.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {doc.isConditional ? (
                                    <Badge variant="outline">Conditional</Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Master Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Master Documents ({documents?.length || 0})</CardTitle>
                <CardDescription>
                  All 40 document types managed by the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((document: any) => (
                    <Card key={document.documentId} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="font-mono">
                              {document.documentCode}
                            </Badge>
                            <Badge variant="outline">
                              {document.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm">{document.documentName}</h3>
                          <p className="text-xs text-gray-600">{document.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SWIFT Messages Tab */}
          <TabsContent value="swift">
            <Card>
              <CardHeader>
                <CardTitle>SWIFT Message Codes ({swiftCodes?.length || 0})</CardTitle>
                <CardDescription>
                  All 38 SWIFT Category 7 message types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={selectedSwift} onValueChange={setSelectedSwift}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a SWIFT message to view documents" />
                      </SelectTrigger>
                      <SelectContent>
                        {swiftCodes?.map((swift: any) => (
                          <SelectItem key={swift.swiftCodeId} value={swift.swiftCode}>
                            {swift.swiftCode} - {swift.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSwiftCodes.map((swift: any) => (
                      <Card key={swift.swiftCodeId} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="font-mono">
                                {swift.swiftCode}
                              </Badge>
                              <Badge variant="outline">
                                {swift.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{swift.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Selected SWIFT Message Documents */}
                  {selectedSwift && swiftDocuments && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Documents Required for {selectedSwift}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Code</TableHead>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {swiftDocuments.map((doc: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono">{doc.documentCode}</TableCell>
                                <TableCell>{doc.documentName}</TableCell>
                                <TableCell>
                                  <Badge variant={doc.status === 'Mandatory' ? 'destructive' : 'secondary'}>
                                    {doc.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships">
            <div className="space-y-6">
              {/* SWIFT Credit Mappings */}
              <Card>
                <CardHeader>
                  <CardTitle>SWIFT Credit Mappings</CardTitle>
                  <CardDescription>
                    Relationship between documentary credits and SWIFT messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Credit Code</TableHead>
                        <TableHead>Credit Name</TableHead>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>SWIFT Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {swiftCreditMappings?.slice(0, 20).map((mapping: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{mapping.creditCode}</TableCell>
                          <TableCell>{mapping.creditName}</TableCell>
                          <TableCell className="font-mono">{mapping.swiftCode}</TableCell>
                          <TableCell className="text-sm">{mapping.swiftDescription}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {swiftCreditMappings && swiftCreditMappings.length > 20 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline">
                        Showing 20 of {swiftCreditMappings.length} mappings
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document SWIFT Relationships */}
              <Card>
                <CardHeader>
                  <CardTitle>Document-SWIFT Relationships</CardTitle>
                  <CardDescription>
                    How documents relate to SWIFT messages through credit types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Code</TableHead>
                        <TableHead>Document Name</TableHead>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>Credit Types</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentRelationships?.slice(0, 20).map((rel: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{rel.documentCode}</TableCell>
                          <TableCell>{rel.documentName}</TableCell>
                          <TableCell className="font-mono">{rel.swiftCode}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rel.numberOfCreditTypes}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {documentRelationships && documentRelationships.length > 20 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline">
                        Showing 20 of {documentRelationships.length} relationships
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
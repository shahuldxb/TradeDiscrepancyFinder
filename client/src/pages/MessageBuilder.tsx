import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Copy, 
  Download, 
  Upload, 
  FileText, 
  Settings, 
  Eye,
  Code,
  MessageSquare,
  Zap,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";

interface MT700Field {
  tag: string;
  name: string;
  description: string;
  format: string;
  mandatory: boolean;
  maxLength?: number;
  options?: string[];
  placeholder?: string;
  validation?: RegExp;
}

const MT700_FIELDS: MT700Field[] = [
  // Header Fields
  { tag: "20", name: "Documentary Credit Number", description: "Sender's reference", format: "16x", mandatory: true, maxLength: 16, placeholder: "DC123456789" },
  { tag: "23", name: "Reference to Pre-advice", description: "Reference to pre-advice if applicable", format: "16x", mandatory: false, maxLength: 16, placeholder: "PREADV123456" },
  { tag: "31C", name: "Date of Issue", description: "Date when LC is issued", format: "YYMMDD", mandatory: true, placeholder: "241201" },
  { tag: "40A", name: "Form of Documentary Credit", description: "Type of documentary credit", format: "1!a", mandatory: true, options: ["IRREVOCABLE", "REVOCABLE"] },
  { tag: "31D", name: "Date and Place of Expiry", description: "Expiry date and place", format: "YYMMDD4!a2!a", mandatory: true, placeholder: "250630LONDON" },
  
  // Applicant and Beneficiary
  { tag: "50", name: "Applicant", description: "Applicant (buyer) details", format: "4*35x", mandatory: true, placeholder: "ABC TRADING COMPANY\n123 MAIN STREET\nNEW YORK NY 10001\nUSA" },
  { tag: "59", name: "Beneficiary", description: "Beneficiary (seller) details", format: "4*35x", mandatory: true, placeholder: "XYZ EXPORT LIMITED\n456 TRADE AVENUE\nLONDON EC1A 1BB\nUNITED KINGDOM" },
  
  // Financial Information
  { tag: "32B", name: "Currency Code, Amount", description: "Currency and amount of credit", format: "3!a15d", mandatory: true, placeholder: "USD500000,00" },
  { tag: "39A", name: "Percentage Credit Amount Tolerance", description: "Tolerance for credit amount", format: "2n/2n", mandatory: false, placeholder: "10/10" },
  { tag: "39B", name: "Maximum Credit Amount", description: "Maximum credit amount", format: "3!a15d", mandatory: false, placeholder: "USD550000,00" },
  
  // Banking Details
  { tag: "41A", name: "Available With... By...", description: "Bank and method of availability", format: "4!a2!a2!c[3!a]", mandatory: false, options: ["PAYMENT", "ACCEPTANCE", "NEGOTIATION", "DEFERRED PAYMENT"] },
  { tag: "41D", name: "Available With Bank", description: "Available with any bank", format: "4*35x", mandatory: false, placeholder: "ANY BANK" },
  { tag: "42C", name: "Drafts at...", description: "Drafts tenor", format: "35x", mandatory: false, placeholder: "AT SIGHT" },
  { tag: "42A", name: "Drawee", description: "Drawee bank details", format: "4!a2!a2!c[3!a]", mandatory: false },
  { tag: "42D", name: "Drawee", description: "Drawee bank name and address", format: "4*35x", mandatory: false },
  { tag: "43P", name: "Partial Shipments", description: "Partial shipments allowed/prohibited", format: "9x", mandatory: false, options: ["ALLOWED", "PROHIBITED"] },
  { tag: "43T", name: "Transhipment", description: "Transhipment allowed/prohibited", format: "9x", mandatory: false, options: ["ALLOWED", "PROHIBITED"] },
  
  // Shipment Details
  { tag: "44A", name: "Loading on Board/Dispatch/Taking in Charge at/from", description: "Port of loading", format: "65x", mandatory: false, placeholder: "PORT OF SHANGHAI, CHINA" },
  { tag: "44E", name: "Port of Discharge", description: "Port of discharge", format: "65x", mandatory: false, placeholder: "PORT OF NEW YORK, USA" },
  { tag: "44F", name: "Port of Destination", description: "Final destination", format: "65x", mandatory: false, placeholder: "NEW YORK, USA" },
  { tag: "44B", name: "Port of Discharge", description: "Port of discharge", format: "65x", mandatory: false },
  { tag: "44C", name: "Latest Date of Shipment", description: "Latest shipment date", format: "YYMMDD", mandatory: false, placeholder: "250531" },
  
  // Document Requirements
  { tag: "45A", name: "Description of Goods and/or Services", description: "Detailed description of goods", format: "65*35x", mandatory: true, placeholder: "STEEL PIPES ACCORDING TO SPECIFICATIONS\nAS PER PROFORMA INVOICE NO. PI-2024-001\nDATED 01 DEC 2024\nHSCODE: 7306.30.00" },
  { tag: "46A", name: "Documents Required", description: "Required documents", format: "65*35x", mandatory: true, placeholder: "SIGNED COMMERCIAL INVOICE IN TRIPLICATE\nPACKING LIST IN DUPLICATE\nFULL SET CLEAN ON BOARD OCEAN BILLS OF LADING\nCERTIFICATE OF ORIGIN\nINSURANCE CERTIFICATE" },
  { tag: "47A", name: "Additional Conditions", description: "Additional conditions", format: "65*35x", mandatory: false, placeholder: "DOCUMENTS MUST BE PRESENTED WITHIN 21 DAYS\nAFTER SHIPMENT DATE BUT WITHIN\nTHE VALIDITY OF THIS CREDIT" },
  
  // Payment Terms
  { tag: "71B", name: "Charges", description: "Bank charges", format: "3*35x", mandatory: false, options: ["SHA", "BEN", "OUR"], placeholder: "ALL BANKING CHARGES OUTSIDE\nISSUING BANK ARE FOR\nBENEFICIARY'S ACCOUNT" },
  
  // Instructions
  { tag: "48", name: "Period for Presentation", description: "Presentation period", format: "35x", mandatory: false, placeholder: "DOCUMENTS MUST BE PRESENTED WITHIN 21 DAYS AFTER THE DATE OF SHIPMENT BUT WITHIN THE VALIDITY OF THE CREDIT" },
  { tag: "49", name: "Confirmation Instructions", description: "Confirmation instructions", format: "1!a", mandatory: false, options: ["CONFIRM", "MAY ADD", "WITHOUT"] },
  
  // Reimbursement
  { tag: "53A", name: "Reimbursing Bank", description: "Reimbursing bank", format: "4!a2!a2!c[3!a]", mandatory: false },
  { tag: "53D", name: "Reimbursing Bank", description: "Reimbursing bank name and address", format: "4*35x", mandatory: false },
  { tag: "78", name: "Instructions to Paying/Accepting/Negotiating Bank", description: "Instructions to banks", format: "65*35x", mandatory: false, placeholder: "REIMBURSEMENT TO BE CLAIMED ON\nISSUING BANK UPON RECEIPT OF\nCOMPLYING PRESENTATION" }
];

const CURRENCY_CODES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "HKD", "SGD", "INR", "AED", "SAR"
];

const INCOTERMS = [
  "EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP", "FAS", "FOB", "CFR", "CIF"
];

export default function MessageBuilder() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("builder");
  const [mt700Data, setMT700Data] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  // Update field value
  const updateField = (tag: string, value: string) => {
    setMT700Data(prev => ({ ...prev, [tag]: value }));
  };

  // Generate SWIFT MT700 message
  const generateMT700 = () => {
    let message = "{1:F01BANKUS33AXXX0000000000}\n";
    message += "{2:I700BANKGB2LXXXXN}\n";
    message += "{4:\n";
    
    // Add fields in SWIFT format
    Object.entries(mt700Data).forEach(([tag, value]) => {
      if (value.trim()) {
        message += `:${tag}:${value}\n`;
      }
    });
    
    message += "-}";
    return message;
  };

  // Parse MT700 message
  const parseMT700 = (message: string) => {
    const parsed: Record<string, string> = {};
    const fieldRegex = /:(\d+[A-Z]?):(.*?)(?=:\d+[A-Z]?:|$)/g;
    let match;
    
    while ((match = fieldRegex.exec(message)) !== null) {
      const [, tag, value] = match;
      parsed[tag] = value.trim();
    }
    
    setMT700Data(parsed);
    toast({ title: "MT700 message parsed successfully!" });
  };

  // Copy message to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMT700());
    toast({ title: "MT700 message copied to clipboard!" });
  };

  // Export message
  const exportMessage = () => {
    const message = generateMT700();
    const blob = new Blob([message], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MT700_${mt700Data['20'] || 'message'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "MT700 message exported successfully!" });
  };

  // Validate required fields
  const validateMessage = () => {
    const requiredFields = MT700_FIELDS.filter(field => field.mandatory);
    const missingFields = requiredFields.filter(field => !mt700Data[field.tag]);
    
    if (missingFields.length > 0) {
      toast({ 
        title: "Validation Error", 
        description: `Missing required fields: ${missingFields.map(f => f.name).join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    toast({ title: "Message validation passed!", description: "All required fields are complete." });
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <TopHeader 
          title="Message Builder"
          subtitle="Create and parse SWIFT MT 700 Documentary Credit messages"
        />
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="builder" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Builder</span>
                </TabsTrigger>
                <TabsTrigger value="parser" className="flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>Parser</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={validateMessage}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" onClick={exportMessage}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* MT700 Builder Tab */}
            <TabsContent value="builder" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Header Information */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>MT700 Header Information</span>
                    </CardTitle>
                    <CardDescription>
                      Basic documentary credit details and references
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {MT700_FIELDS.slice(0, 5).map((field) => (
                        <div key={field.tag} className="space-y-2">
                          <Label htmlFor={field.tag} className="text-sm font-medium">
                            {field.tag}: {field.name}
                            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.options ? (
                            <Select 
                              value={mt700Data[field.tag] || ""} 
                              onValueChange={(value) => updateField(field.tag, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={field.tag}
                              placeholder={field.placeholder}
                              value={mt700Data[field.tag] || ""}
                              onChange={(e) => updateField(field.tag, e.target.value)}
                              maxLength={field.maxLength}
                            />
                          )}
                          <p className="text-xs text-gray-500">{field.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Parties Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Parties Information</CardTitle>
                    <CardDescription>Applicant and beneficiary details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {MT700_FIELDS.slice(5, 7).map((field) => (
                      <div key={field.tag} className="space-y-2">
                        <Label htmlFor={field.tag} className="text-sm font-medium">
                          {field.tag}: {field.name}
                          {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id={field.tag}
                          placeholder={field.placeholder}
                          value={mt700Data[field.tag] || ""}
                          onChange={(e) => updateField(field.tag, e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">{field.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                    <CardDescription>Credit amount and currency details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {MT700_FIELDS.slice(7, 10).map((field) => (
                      <div key={field.tag} className="space-y-2">
                        <Label htmlFor={field.tag} className="text-sm font-medium">
                          {field.tag}: {field.name}
                          {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.tag}
                          placeholder={field.placeholder}
                          value={mt700Data[field.tag] || ""}
                          onChange={(e) => updateField(field.tag, e.target.value)}
                        />
                        <p className="text-xs text-gray-500">{field.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Banking Details */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Banking Details</CardTitle>
                    <CardDescription>Available with, drawee, and reimbursing bank information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {MT700_FIELDS.slice(10, 16).map((field) => (
                        <div key={field.tag} className="space-y-2">
                          <Label htmlFor={field.tag} className="text-sm font-medium">
                            {field.tag}: {field.name}
                            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.options ? (
                            <Select 
                              value={mt700Data[field.tag] || ""} 
                              onValueChange={(value) => updateField(field.tag, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.tag === "42D" || field.tag === "53D" ? (
                            <Textarea
                              id={field.tag}
                              placeholder={field.placeholder}
                              value={mt700Data[field.tag] || ""}
                              onChange={(e) => updateField(field.tag, e.target.value)}
                              rows={3}
                            />
                          ) : (
                            <Input
                              id={field.tag}
                              placeholder={field.placeholder}
                              value={mt700Data[field.tag] || ""}
                              onChange={(e) => updateField(field.tag, e.target.value)}
                            />
                          )}
                          <p className="text-xs text-gray-500">{field.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipment Details */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Shipment Details</CardTitle>
                    <CardDescription>Loading, discharge, and destination information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {MT700_FIELDS.slice(16, 21).map((field) => (
                        <div key={field.tag} className="space-y-2">
                          <Label htmlFor={field.tag} className="text-sm font-medium">
                            {field.tag}: {field.name}
                            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Input
                            id={field.tag}
                            placeholder={field.placeholder}
                            value={mt700Data[field.tag] || ""}
                            onChange={(e) => updateField(field.tag, e.target.value)}
                          />
                          <p className="text-xs text-gray-500">{field.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Documents and Conditions */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Documents and Conditions</CardTitle>
                    <CardDescription>Description of goods, required documents, and additional conditions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {MT700_FIELDS.slice(21, 24).map((field) => (
                      <div key={field.tag} className="space-y-2">
                        <Label htmlFor={field.tag} className="text-sm font-medium">
                          {field.tag}: {field.name}
                          {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id={field.tag}
                          placeholder={field.placeholder}
                          value={mt700Data[field.tag] || ""}
                          onChange={(e) => updateField(field.tag, e.target.value)}
                          rows={6}
                        />
                        <p className="text-xs text-gray-500">{field.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Instructions and Charges */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Instructions and Charges</CardTitle>
                    <CardDescription>Payment terms, charges, and special instructions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {MT700_FIELDS.slice(24).map((field) => (
                        <div key={field.tag} className="space-y-2">
                          <Label htmlFor={field.tag} className="text-sm font-medium">
                            {field.tag}: {field.name}
                            {field.mandatory && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.options ? (
                            <Select 
                              value={mt700Data[field.tag] || ""} 
                              onValueChange={(value) => updateField(field.tag, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.tag === "71B" || field.tag === "78" ? (
                            <Textarea
                              id={field.tag}
                              placeholder={field.placeholder}
                              value={mt700Data[field.tag] || ""}
                              onChange={(e) => updateField(field.tag, e.target.value)}
                              rows={4}
                            />
                          ) : (
                            <Input
                              id={field.tag}
                              placeholder={field.placeholder}
                              value={mt700Data[field.tag] || ""}
                              onChange={(e) => updateField(field.tag, e.target.value)}
                            />
                          )}
                          <p className="text-xs text-gray-500">{field.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Parser Tab */}
            <TabsContent value="parser" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>MT700 Message Parser</span>
                  </CardTitle>
                  <CardDescription>
                    Paste an MT700 message to automatically parse and populate all fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mt700-input">Paste MT700 Message</Label>
                    <Textarea
                      id="mt700-input"
                      placeholder="Paste your MT700 SWIFT message here..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => {
                      const textarea = document.getElementById('mt700-input') as HTMLTextAreaElement;
                      if (textarea.value.trim()) {
                        parseMT700(textarea.value);
                        setActiveTab("builder");
                      }
                    }}>
                      <Zap className="w-4 h-4 mr-2" />
                      Parse Message
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const textarea = document.getElementById('mt700-input') as HTMLTextAreaElement;
                      textarea.value = "";
                    }}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>MT700 Message Preview</span>
                  </CardTitle>
                  <CardDescription>
                    Generated SWIFT MT700 message in standard format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {generateMT700()}
                    </pre>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Message
                    </Button>
                    <Button variant="outline" onClick={exportMessage}>
                      <Download className="w-4 h-4 mr-2" />
                      Export File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Field Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Field Summary</CardTitle>
                  <CardDescription>Overview of populated fields and completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.keys(mt700Data).length}
                      </div>
                      <div className="text-sm text-gray-500">Fields Populated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {MT700_FIELDS.filter(f => f.mandatory && mt700Data[f.tag]).length}
                      </div>
                      <div className="text-sm text-gray-500">Required Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {MT700_FIELDS.filter(f => f.mandatory && !mt700Data[f.tag]).length}
                      </div>
                      <div className="text-sm text-gray-500">Required Missing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {Math.round((Object.keys(mt700Data).length / MT700_FIELDS.length) * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Completion</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
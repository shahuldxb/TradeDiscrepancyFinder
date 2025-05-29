import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Link2, 
  ArrowRight, 
  FileText, 
  Network,
  BookOpen,
  X
} from "lucide-react";

interface MessageTypeDetailsProps {
  messageType: string;
  isOpen: boolean;
  onClose: () => void;
}

// SWIFT field definitions with comprehensive rules based on 2019 standards
const SWIFT_FIELD_RULES = {
  ":20:": {
    name: "Transaction Reference Number",
    format: "16x",
    description: "Reference assigned by the Sender to unambiguously identify the message",
    mandatory: true,
    maxLength: 16,
    validationRules: [
      "Must be unique for each message from the same sender",
      "Only alphanumeric characters allowed (A-Z, 0-9)",
      "Cannot contain spaces or special characters",
      "Must be present in all MT7xx messages"
    ],
    businessRules: [
      "Should follow bank's internal reference numbering system",
      "Used for message tracking and reconciliation",
      "Referenced in subsequent related messages"
    ],
    examples: ["CRED240529001", "LC2024050001", "REF123456789"]
  },
  ":27:": {
    name: "Sequence of Total",
    format: "1!n/1!n",
    description: "Indicates the sequence number and total number of messages",
    mandatory: true,
    validationRules: [
      "Format must be N/N where N is a single digit 1-9",
      "Sequence number cannot exceed total number",
      "For single messages, use 1/1",
      "Multi-part messages must have consecutive sequence numbers"
    ],
    businessRules: [
      "Used when message exceeds SWIFT length limits",
      "All parts must have same reference number (:20:)",
      "Receiving bank should wait for all parts before processing"
    ],
    examples: ["1/1", "1/3", "2/3", "3/3"]
  },
  ":40A:": {
    name: "Form of Documentary Credit",
    format: "6!c",
    description: "Indicates whether the documentary credit is irrevocable or revocable",
    mandatory: true,
    allowedValues: ["IRREVOCABLE", "REVOCABLE"],
    validationRules: [
      "Must be exactly 'IRREVOCABLE' or 'REVOCABLE'",
      "Case sensitive - must be uppercase",
      "No additional text or spaces allowed"
    ],
    businessRules: [
      "IRREVOCABLE credits cannot be cancelled without beneficiary consent",
      "REVOCABLE credits can be cancelled by applicant anytime",
      "UCP 600 presumes all credits are irrevocable unless stated otherwise",
      "Affects field :42C: requirement when irrevocable"
    ],
    examples: ["IRREVOCABLE", "REVOCABLE"],
    dependencies: [
      "If IRREVOCABLE, field :42C: becomes conditional",
      "Affects confirmation instructions in :49:"
    ]
  },
  ":31D:": {
    name: "Date and Place of Expiry",
    format: "6!n4!a2a15d",
    description: "Date and place where the documentary credit expires for presentation of documents",
    mandatory: true,
    validationRules: [
      "Date format: YYMMDD (6 digits)",
      "Place code: 4-letter city code or country code",
      "Additional place information up to 15 characters",
      "Expiry date must be future date"
    ],
    businessRules: [
      "Documents must be presented before this date",
      "Place indicates where documents should be presented",
      "Critical for LC validity and operations",
      "Must allow reasonable time for document preparation"
    ],
    examples: ["241231USNY", "250630GBLON", "241215SGSGSINGAPORE"]
  },
  ":50:": {
    name: "Applicant",
    format: "4*35x",
    description: "Party on whose behalf the documentary credit is issued",
    mandatory: true,
    maxLength: 140,
    validationRules: [
      "Maximum 4 lines of 35 characters each",
      "Must include complete name and address",
      "No line can be empty if followed by content",
      "Should include country information"
    ],
    businessRules: [
      "Party requesting the credit issuance",
      "Usually the importer in trade transaction",
      "Must have account relationship with issuing bank",
      "Responsible for payment under the credit"
    ],
    examples: [
      "ABC TRADING COMPANY LTD",
      "123 BUSINESS STREET",
      "NEW YORK NY 10001",
      "UNITED STATES"
    ]
  },
  ":59:": {
    name: "Beneficiary",
    format: "4*35x",
    description: "Party in whose favour the documentary credit is issued",
    mandatory: true,
    maxLength: 140,
    validationRules: [
      "Maximum 4 lines of 35 characters each",
      "Must include complete name and address",
      "Should match exactly with commercial documents",
      "Country information recommended"
    ],
    businessRules: [
      "Party entitled to draw under the credit",
      "Usually the exporter in trade transaction",
      "Must present documents as per credit terms",
      "Name must match shipping documents exactly"
    ],
    examples: [
      "XYZ EXPORT CORPORATION",
      "456 INDUSTRIAL AVENUE",
      "SINGAPORE 123456",
      "SINGAPORE"
    ]
  },
  ":32B:": {
    name: "Currency Code, Amount",
    format: "3!a15d",
    description: "Currency and amount of the documentary credit",
    mandatory: true,
    validationRules: [
      "Currency code: 3-letter ISO code (USD, EUR, GBP, etc.)",
      "Amount: Up to 15 digits with decimal comma",
      "No spaces between currency and amount",
      "Amount must be greater than zero"
    ],
    businessRules: [
      "Defines maximum drawing amount under credit",
      "Currency should match underlying trade contract",
      "Amount can be fully or partially utilized",
      "Impacts foreign exchange considerations"
    ],
    examples: ["USD1000000,00", "EUR500000,50", "GBP750000,25"]
  },
  ":71B:": {
    name: "Charges",
    format: "35x",
    description: "Indicates which party bears the charges",
    mandatory: true,
    allowedValues: ["OUR", "BEN", "SHA"],
    validationRules: [
      "Must be exactly OUR, BEN, or SHA",
      "Case sensitive - must be uppercase",
      "No additional text or explanation"
    ],
    businessRules: [
      "OUR: All charges for account of applicant",
      "BEN: All charges for account of beneficiary", 
      "SHA: Charges shared between parties",
      "Affects cost allocation and pricing"
    ],
    examples: ["OUR", "BEN", "SHA"]
  }
};

// Message interrelationships based on SWIFT standards
const MESSAGE_RELATIONSHIPS = {
  "MT700": {
    description: "Issue of a Documentary Credit",
    triggers: ["MT705", "MT707", "MT720", "MT750", "MT754"],
    followedBy: [
      { code: "MT707", description: "Amendment to documentary credit", condition: "When changes needed" },
      { code: "MT750", description: "Advice of discrepancy", condition: "When documents don't comply" },
      { code: "MT754", description: "Advice of payment/acceptance", condition: "When documents are compliant" },
      { code: "MT720", description: "Transfer of credit", condition: "When credit is transferable" }
    ],
    relatedMessages: [
      { code: "MT710", description: "Third bank advice of credit" },
      { code: "MT730", description: "Acknowledgement" }
    ]
  },
  "MT707": {
    description: "Amendment to a Documentary Credit",
    requires: ["MT700"],
    triggers: ["MT730", "MT775"],
    followedBy: [
      { code: "MT730", description: "Acknowledgement of amendment", condition: "Confirmation of receipt" },
      { code: "MT775", description: "Amendment acceptance/rejection", condition: "Beneficiary response" }
    ]
  },
  "MT750": {
    description: "Advice of Discrepancy",
    requires: ["MT700"],
    triggers: ["MT754"],
    followedBy: [
      { code: "MT754", description: "Payment despite discrepancies", condition: "If applicant accepts" }
    ]
  }
};

export default function MessageTypeDetails({ messageType, isOpen, onClose }: MessageTypeDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const messageInfo = MESSAGE_RELATIONSHIPS[messageType as keyof typeof MESSAGE_RELATIONSHIPS];
  const messageTypeData = {
    "MT700": { name: "Issue of a Documentary Credit", category: "Documentary Credits" },
    "MT701": { name: "Issue of a Documentary Credit (Extended)", category: "Documentary Credits" },
    "MT705": { name: "Pre-Advice of a Documentary Credit", category: "Documentary Credits" },
    "MT707": { name: "Amendment to a Documentary Credit", category: "Documentary Credits" },
    "MT708": { name: "Amendment to a Documentary Credit (Extended)", category: "Documentary Credits" },
    "MT710": { name: "Advice of a Third Bank's Documentary Credit", category: "Documentary Credits" },
    "MT711": { name: "Advice of a Non-Bank's Documentary Credit", category: "Documentary Credits" },
    "MT720": { name: "Transfer of a Documentary Credit", category: "Documentary Credits" },
    "MT721": { name: "Transfer of a Documentary Credit (Extended)", category: "Documentary Credits" },
    "MT730": { name: "Acknowledgement", category: "Documentary Credits" },
    "MT732": { name: "Advice of Discharge", category: "Documentary Credits" },
    "MT734": { name: "Advice of Refusal", category: "Documentary Credits" },
    "MT740": { name: "Authorization to Reimburse", category: "Reimbursements" },
    "MT742": { name: "Reimbursement Claim", category: "Reimbursements" },
    "MT747": { name: "Amendment to an Authorization to Reimburse", category: "Reimbursements" },
    "MT750": { name: "Advice of Discrepancy", category: "Documentary Credits" },
    "MT752": { name: "Authorization to Pay, Accept or Negotiate", category: "Documentary Credits" },
    "MT754": { name: "Advice of Payment/Acceptance/Negotiation", category: "Documentary Credits" },
    "MT756": { name: "Advice of Reimbursement or Payment", category: "Documentary Credits" },
    "MT760": { name: "Guarantee", category: "Guarantees" },
    "MT767": { name: "Amendment to a Guarantee", category: "Guarantees" },
    "MT768": { name: "Acknowledgement of a Guarantee Message", category: "Guarantees" },
    "MT769": { name: "Advice of Reduction or Release", category: "Guarantees" },
    "MT775": { name: "Amendment of a Documentary Credit", category: "Documentary Credits" },
    "MT785": { name: "Notification of Charges", category: "Charges" },
    "MT786": { name: "Request for Payment of Charges", category: "Charges" },
    "MT787": { name: "Advice of Charges", category: "Charges" }
  }[messageType] || { name: "Unknown Message Type", category: "Unknown" };

  const getFieldsForMessageType = (msgType: string) => {
    const commonFields = [":20:", ":27:"];
    const typeSpecificFields = {
      "MT700": [":40A:", ":31D:", ":50:", ":59:", ":32B:", ":71B:"],
      "MT707": [":21:", ":32B:", ":31D:", ":59:", ":71B:"],
      "MT750": [":21:", ":32B:", ":50:", ":59:"],
      "MT754": [":21:", ":32B:", ":50:", ":59:"]
    };
    return [...commonFields, ...(typeSpecificFields[msgType as keyof typeof typeSpecificFields] || [])];
  };

  const fields = getFieldsForMessageType(messageType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>{messageType} - {messageTypeData.name}</span>
              </DialogTitle>
              <DialogDescription className="text-lg">
                SWIFT Category 7 - {messageTypeData.category} (2019 Standards)
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fields">Field Rules</TabsTrigger>
            <TabsTrigger value="relationships">Message Flow</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[70vh] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Message Purpose</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{messageInfo?.description || messageTypeData.name}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Mandatory Fields</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {fields.filter(f => SWIFT_FIELD_RULES[f as keyof typeof SWIFT_FIELD_RULES]?.mandatory).length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Optional Fields</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {fields.filter(f => !SWIFT_FIELD_RULES[f as keyof typeof SWIFT_FIELD_RULES]?.mandatory).length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Total Fields</h4>
                      <p className="text-2xl font-bold text-purple-600">{fields.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              <div className="space-y-4">
                {fields.map((fieldCode) => {
                  const field = SWIFT_FIELD_RULES[fieldCode as keyof typeof SWIFT_FIELD_RULES];
                  if (!field) return null;

                  return (
                    <Card key={fieldCode} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <code className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                              {fieldCode}
                            </code>
                            <div>
                              <h4 className="font-semibold">{field.name}</h4>
                              <p className="text-sm text-muted-foreground">{field.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {field.mandatory ? (
                              <Badge variant="destructive">Mandatory</Badge>
                            ) : (
                              <Badge variant="outline">Optional</Badge>
                            )}
                            <Badge variant="secondary">{field.format}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                              Validation Rules
                            </h5>
                            <ul className="text-sm space-y-1">
                              {field.validationRules.map((rule, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <CheckCircle className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                                  <span>{rule}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2 flex items-center">
                              <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                              Business Rules
                            </h5>
                            <ul className="text-sm space-y-1">
                              {field.businessRules.map((rule, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <Info className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                                  <span>{rule}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {field.examples && (
                          <div>
                            <h5 className="font-medium mb-2">Examples</h5>
                            <div className="flex flex-wrap gap-2">
                              {field.examples.map((example, idx) => (
                                <code key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {example}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {field.dependencies && (
                          <div>
                            <h5 className="font-medium mb-2 flex items-center">
                              <Link2 className="h-4 w-4 mr-1 text-purple-500" />
                              Field Dependencies
                            </h5>
                            <ul className="text-sm space-y-1">
                              {field.dependencies.map((dep, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <ArrowRight className="h-3 w-3 mt-1 text-purple-500 flex-shrink-0" />
                                  <span>{dep}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="relationships" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Network className="h-5 w-5" />
                    <span>Message Flow & Relationships</span>
                  </CardTitle>
                  <CardDescription>
                    How {messageType} interacts with other SWIFT MT7xx messages in the documentary credit lifecycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messageInfo ? (
                    <div className="space-y-6">
                      {messageInfo.requires && (
                        <div>
                          <h4 className="font-medium mb-3 text-red-700">Prerequisites</h4>
                          <div className="flex flex-wrap gap-2">
                            {messageInfo.requires.map((req) => (
                              <Badge key={req} variant="outline" className="border-red-200 text-red-700">
                                {req} required first
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {messageInfo.followedBy && (
                        <div>
                          <h4 className="font-medium mb-3 text-blue-700">Subsequent Messages</h4>
                          <div className="space-y-3">
                            {messageInfo.followedBy.map((msg, idx) => (
                              <div key={idx} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <ArrowRight className="h-4 w-4 text-blue-500" />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <code className="font-mono bg-blue-100 px-2 py-1 rounded text-sm">
                                      {msg.code}
                                    </code>
                                    <span className="font-medium">{msg.description}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{msg.condition}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {messageInfo.relatedMessages && (
                        <div>
                          <h4 className="font-medium mb-3 text-green-700">Related Messages</h4>
                          <div className="space-y-2">
                            {messageInfo.relatedMessages.map((msg, idx) => (
                              <div key={idx} className="flex items-center space-x-3 p-2 border-l-4 border-green-400 bg-green-50">
                                <code className="font-mono bg-white px-2 py-1 rounded text-sm border">
                                  {msg.code}
                                </code>
                                <span className="text-sm">{msg.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-medium text-muted-foreground mb-2">Message Relationships</h4>
                      <p className="text-sm text-muted-foreground">
                        Detailed message flow information available for core documentary credit messages (MT700, MT707, MT750, MT754)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
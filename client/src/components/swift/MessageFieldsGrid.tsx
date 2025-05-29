import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, FileText, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";

// Message-specific field mappings based on SWIFT MT7xx standards
const MESSAGE_FIELDS = {
  "MT700": {
    name: "Issue of a Documentary Credit",
    description: "Used to issue a new documentary credit",
    fields: [
      { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message" },
      { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number" },
      { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE or REVOCABLE" },
      { tag: ":20:", name: "Documentary Credit Number", format: "16x", mandatory: true, description: "LC reference number" },
      { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date" },
      { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place" },
      { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC" },
      { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued" },
      { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount" },
      { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Plus/minus tolerance" },
      { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: true, description: "Availability details" },
      { tag: ":42C:", name: "Drafts at...", format: "4*35x", mandatory: false, description: "Draft terms" },
      { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED" },
      { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED" },
      { tag: ":44A:", name: "Loading on Board/Dispatch", format: "65x", mandatory: false, description: "Port of loading" },
      { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Port of destination" },
      { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Latest shipment date" },
      { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: true, description: "Goods description" },
      { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: true, description: "Required documents" },
      { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Special conditions" },
      { tag: ":48:", name: "Period for Presentation", format: "77x", mandatory: false, description: "Presentation period" },
      { tag: ":49:", name: "Confirmation Instructions", format: "3*35x", mandatory: false, description: "Confirmation details" },
      { tag: ":71B:", name: "Charges", format: "35x", mandatory: true, description: "Charge bearer (OUR/BEN/SHA)" },
      { tag: ":78:", name: "Instructions to Paying Bank", format: "20*35x", mandatory: false, description: "Special instructions" },
      { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank BIC" },
      { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information" }
    ]
  },
  "MT701": {
    name: "Issue of a Documentary Credit (Extended)",
    description: "Extended version of MT700 with additional fields",
    fields: [
      { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message" },
      { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number" },
      { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE or REVOCABLE" },
      { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date" },
      { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place" },
      { tag: ":51A:", name: "Applicant Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Applicant's bank" },
      { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC" },
      { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued" },
      { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount" },
      { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Plus/minus tolerance" },
      { tag: ":39B:", name: "Maximum Credit Amount", format: "13x", mandatory: false, description: "Maximum amount clause" },
      { tag: ":39C:", name: "Additional Amounts Covered", format: "4*35x", mandatory: false, description: "Additional coverage" },
      { tag: ":41A:", name: "Available With... By... (Coded)", format: "4!a2!a", mandatory: false, description: "Availability (coded)" },
      { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: true, description: "Availability details" },
      { tag: ":42A:", name: "Drafts at... (Coded)", format: "4!a2!a", mandatory: false, description: "Draft terms (coded)" },
      { tag: ":42C:", name: "Drafts at...", format: "4*35x", mandatory: false, description: "Draft terms" },
      { tag: ":42M:", name: "Mixed Payment Details", format: "4*35x", mandatory: false, description: "Mixed payment terms" },
      { tag: ":42P:", name: "Deferred Payment Details", format: "4*35x", mandatory: false, description: "Deferred payment" },
      { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED" },
      { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED" },
      { tag: ":44A:", name: "Loading on Board/Dispatch", format: "65x", mandatory: false, description: "Port of loading" },
      { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Port of destination" },
      { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Latest shipment date" },
      { tag: ":44D:", name: "Shipment Period", format: "65x", mandatory: false, description: "Shipment period" },
      { tag: ":44E:", name: "Port of Loading", format: "65x", mandatory: false, description: "Loading port" },
      { tag: ":44F:", name: "Port of Discharge", format: "65x", mandatory: false, description: "Discharge port" },
      { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: true, description: "Goods description" },
      { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: true, description: "Required documents" },
      { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Special conditions" },
      { tag: ":71B:", name: "Charges", format: "35x", mandatory: true, description: "Charge bearer" }
    ]
  },
  "MT707": {
    name: "Amendment to a Documentary Credit",
    description: "Used to amend an existing documentary credit",
    fields: [
      { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for amendment" },
      { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference" },
      { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number" },
      { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC" },
      { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary" },
      { tag: ":32B:", name: "New Amount", format: "3!a15d", mandatory: false, description: "Amended LC amount" },
      { tag: ":33B:", name: "Original Amount", format: "3!a15d", mandatory: false, description: "Original LC amount" },
      { tag: ":31D:", name: "New Expiry Date and Place", format: "6!n4!a2a15d", mandatory: false, description: "Amended expiry" },
      { tag: ":26E:", name: "Number of Amendment", format: "1!n3!n", mandatory: true, description: "Amendment sequence" },
      { tag: ":30:", name: "Date of Amendment", format: "6!n", mandatory: true, description: "Amendment date" },
      { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Amended tolerance" },
      { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: false, description: "Amended availability" },
      { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: false, description: "Amended partial shipment" },
      { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: false, description: "Amended transhipment" },
      { tag: ":44A:", name: "Loading on Board/Dispatch", format: "65x", mandatory: false, description: "Amended loading port" },
      { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Amended destination" },
      { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Amended shipment date" },
      { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Amended goods description" },
      { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Amended documents" },
      { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Amended conditions" },
      { tag: ":48:", name: "Period for Presentation", format: "77x", mandatory: false, description: "Amended presentation period" },
      { tag: ":49:", name: "Confirmation Instructions", format: "3*35x", mandatory: false, description: "Amended confirmation" },
      { tag: ":71B:", name: "Charges", format: "35x", mandatory: false, description: "Amended charges" },
      { tag: ":78:", name: "Instructions to Paying Bank", format: "20*35x", mandatory: false, description: "Amended instructions" },
      { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Amendment details" }
    ]
  },
  "MT750": {
    name: "Advice of Discrepancy",
    description: "Used to advise discrepancies in presented documents",
    fields: [
      { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for discrepancy advice" },
      { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference" },
      { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number" },
      { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "Date of discrepancy advice" },
      { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant" },
      { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary" },
      { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Presented amount" },
      { tag: ":34A:", name: "Date of Presentation", format: "6!n", mandatory: true, description: "Document presentation date" },
      { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Bank advising discrepancy" },
      { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Cover letter details" },
      { tag: ":79:", name: "Narrative Description of Discrepancy", format: "20*35x", mandatory: true, description: "Detailed discrepancy description" },
      { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Goods as per documents" },
      { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Documents presented" }
    ]
  },
  "MT754": {
    name: "Advice of Payment/Acceptance/Negotiation",
    description: "Used to advise payment, acceptance or negotiation under the LC",
    fields: [
      { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for advice" },
      { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference" },
      { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number" },
      { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "Date of advice" },
      { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant" },
      { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary" },
      { tag: ":32D:", name: "Currency Code, Amount Claimed", format: "3!a15d", mandatory: true, description: "Amount paid/accepted/negotiated" },
      { tag: ":33B:", name: "Currency Code, Original Amount", format: "3!a15d", mandatory: false, description: "Original LC amount" },
      { tag: ":34A:", name: "Date of Payment/Acceptance", format: "6!n", mandatory: true, description: "Date of payment/acceptance" },
      { tag: ":56A:", name: "Intermediary Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Intermediary bank" },
      { tag: ":57A:", name: "Account With Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Account with bank" },
      { tag: ":70:", name: "Remittance Information", format: "4*35x", mandatory: false, description: "Payment details" },
      { tag: ":71D:", name: "Charges/Interest", format: "6*35x", mandatory: false, description: "Charges and interest" },
      { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information" },
      { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Goods description" },
      { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Documents presented" }
    ]
  }
};

interface MessageFieldsGridProps {
  selectedMessage?: string;
}

export default function MessageFieldsGrid({ selectedMessage }: MessageFieldsGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMessage, setExpandedMessage] = useState<string | null>(selectedMessage || "MT700");

  // Filter messages based on search
  const filteredMessages = Object.entries(MESSAGE_FIELDS).filter(([code, data]) => {
    if (!searchTerm) return true;
    return (
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getRowColor = (index: number, isField: boolean = false) => {
    if (isField) {
      return index % 2 === 0 ? "bg-blue-50" : "bg-white";
    }
    const colors = [
      "bg-gradient-to-r from-blue-50 to-blue-100",
      "bg-gradient-to-r from-green-50 to-green-100", 
      "bg-gradient-to-r from-purple-50 to-purple-100",
      "bg-gradient-to-r from-orange-50 to-orange-100",
      "bg-gradient-to-r from-pink-50 to-pink-100"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>SWIFT MT7xx Fields by Message Type</span>
          </CardTitle>
          <CardDescription>
            Complete field structure for each SWIFT Category 7 message type with mandatory/optional indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search message types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Type Cards */}
      <div className="space-y-4">
        {filteredMessages.map(([messageCode, messageData], messageIndex) => (
          <Card key={messageCode} className={`${getRowColor(messageIndex)} border-2`}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setExpandedMessage(expandedMessage === messageCode ? null : messageCode)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center space-x-3">
                    <code className="text-lg font-mono bg-white px-3 py-1 rounded border-2 border-blue-200">
                      {messageCode}
                    </code>
                    <span>{messageData.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {messageData.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {messageData.fields.filter(f => f.mandatory).length}
                    </div>
                    <div className="text-xs text-blue-800">Mandatory</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {messageData.fields.filter(f => !f.mandatory).length}
                    </div>
                    <div className="text-xs text-green-800">Optional</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {messageData.fields.length}
                    </div>
                    <div className="text-xs text-purple-800">Total</div>
                  </div>
                  <ArrowRight 
                    className={`h-5 w-5 transition-transform ${
                      expandedMessage === messageCode ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </div>
            </CardHeader>

            {expandedMessage === messageCode && (
              <CardContent className="pt-0">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="grid grid-cols-5 gap-0 bg-gray-100 p-3 font-semibold text-sm border-b">
                    <div>Field Tag</div>
                    <div>Field Name</div>
                    <div>Format</div>
                    <div>Required</div>
                    <div>Description</div>
                  </div>
                  
                  {messageData.fields.map((field, fieldIndex) => (
                    <div 
                      key={`${messageCode}-${field.tag}-${fieldIndex}`}
                      className={`grid grid-cols-5 gap-0 p-3 border-b border-gray-100 hover:bg-blue-100 transition-colors ${
                        getRowColor(fieldIndex, true)
                      }`}
                    >
                      <div className="font-mono text-sm font-bold">
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {field.tag}
                        </code>
                      </div>
                      <div className="text-sm font-medium">
                        {field.name}
                      </div>
                      <div className="text-sm font-mono text-gray-600">
                        {field.format}
                      </div>
                      <div>
                        {field.mandatory ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Optional
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {field.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Message Types Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
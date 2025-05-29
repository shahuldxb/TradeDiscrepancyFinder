import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Filter, Eye, AlertTriangle, CheckCircle } from "lucide-react";

// Comprehensive SWIFT MT7xx field definitions based on 2019 Category 7 standards
const MT7_FIELDS = [
  {
    tag: ":20:",
    name: "Transaction Reference Number",
    format: "16x",
    description: "Reference assigned by the Sender to unambiguously identify the message",
    mandatory: true,
    maxLength: 16,
    category: "Control",
    usage: "All MT7xx messages",
    example: "CRED240529001"
  },
  {
    tag: ":21:",
    name: "Related Reference",
    format: "16x",
    description: "Reference to the original documentary credit or related message",
    mandatory: true,
    maxLength: 16,
    category: "Control",
    usage: "MT707, MT750, MT754",
    example: "ORIG240529001"
  },
  {
    tag: ":25:",
    name: "Account Identification",
    format: "35x",
    description: "Account number of the applicant or party for whose account the credit is issued",
    mandatory: false,
    maxLength: 35,
    category: "Account",
    usage: "MT700, MT701",
    example: "ACC/USD/1234567890"
  },
  {
    tag: ":27:",
    name: "Sequence of Total",
    format: "1!n/1!n",
    description: "Indicates the sequence number and total number of messages",
    mandatory: true,
    maxLength: 3,
    category: "Control",
    usage: "All MT7xx messages",
    example: "1/1"
  },
  {
    tag: ":31C:",
    name: "Date of Issue",
    format: "6!n",
    description: "Date on which the documentary credit is issued",
    mandatory: true,
    maxLength: 6,
    category: "Date",
    usage: "MT700, MT701",
    example: "241205"
  },
  {
    tag: ":31D:",
    name: "Date and Place of Expiry",
    format: "6!n4!a2a15d",
    description: "Date and place where the documentary credit expires for presentation of documents",
    mandatory: true,
    maxLength: 29,
    category: "Date",
    usage: "MT700, MT701, MT707",
    example: "250630USNY"
  },
  {
    tag: ":32B:",
    name: "Currency Code, Amount",
    format: "3!a15d",
    description: "Currency and amount of the documentary credit",
    mandatory: true,
    maxLength: 18,
    category: "Amount",
    usage: "Most MT7xx messages",
    example: "USD1000000,00"
  },
  {
    tag: ":32D:",
    name: "Currency Code, Amount Claimed",
    format: "3!a15d",
    description: "Currency and amount claimed under the documentary credit",
    mandatory: true,
    maxLength: 18,
    category: "Amount",
    usage: "MT754, MT756",
    example: "USD950000,00"
  },
  {
    tag: ":33B:",
    name: "Currency Code, Original Amount",
    format: "3!a15d",
    description: "Original currency and amount of the documentary credit",
    mandatory: false,
    maxLength: 18,
    category: "Amount",
    usage: "MT707, MT754",
    example: "EUR800000,00"
  },
  {
    tag: ":39A:",
    name: "Percentage Credit Amount Tolerance",
    format: "2!n/2!n",
    description: "Percentage by which drawings may exceed or fall short of the credit amount",
    mandatory: false,
    maxLength: 5,
    category: "Terms",
    usage: "MT700, MT701, MT707",
    example: "05/05"
  },
  {
    tag: ":39B:",
    name: "Maximum Credit Amount",
    format: "13x",
    description: "Maximum amount available under the credit",
    mandatory: false,
    maxLength: 13,
    category: "Terms",
    usage: "MT700, MT701",
    example: "NOT EXCEEDING"
  },
  {
    tag: ":39C:",
    name: "Additional Amounts Covered",
    format: "4*35x",
    description: "Additional amounts covered under the documentary credit",
    mandatory: false,
    maxLength: 140,
    category: "Terms",
    usage: "MT700, MT701",
    example: "INSURANCE 110PCT"
  },
  {
    tag: ":40A:",
    name: "Form of Documentary Credit",
    format: "6!c",
    description: "Indicates whether the documentary credit is irrevocable or revocable",
    mandatory: true,
    maxLength: 10,
    category: "Credit Type",
    usage: "MT700, MT701",
    example: "IRREVOCABLE"
  },
  {
    tag: ":40E:",
    name: "Applicable Rules",
    format: "4*35x",
    description: "Rules under which the documentary credit is issued",
    mandatory: false,
    maxLength: 140,
    category: "Credit Type",
    usage: "MT700, MT701",
    example: "UCP LATEST VERSION"
  },
  {
    tag: ":41A:",
    name: "Available With... By...",
    format: "4!a2!a",
    description: "Bank with which the credit is available and how it is available (coded)",
    mandatory: false,
    maxLength: 6,
    category: "Availability",
    usage: "MT700, MT701",
    example: "BYPAYM"
  },
  {
    tag: ":41D:",
    name: "Available With... By...",
    format: "4*35x",
    description: "Bank with which the credit is available and how it is available (narrative)",
    mandatory: true,
    maxLength: 140,
    category: "Availability",
    usage: "MT700, MT701, MT707",
    example: "ANY BANK BY PAYMENT"
  },
  {
    tag: ":42A:",
    name: "Drafts at...",
    format: "4!a2!a",
    description: "Tenor of drafts drawn under the documentary credit (coded)",
    mandatory: false,
    maxLength: 6,
    category: "Draft Terms",
    usage: "MT700, MT701",
    example: "SIGHT"
  },
  {
    tag: ":42C:",
    name: "Drafts at...",
    format: "4*35x",
    description: "Tenor of drafts drawn under the documentary credit (narrative)",
    mandatory: false,
    maxLength: 140,
    category: "Draft Terms",
    usage: "MT700, MT701",
    example: "AT SIGHT"
  },
  {
    tag: ":42M:",
    name: "Mixed Payment Details",
    format: "4*35x",
    description: "Details of mixed payment terms",
    mandatory: false,
    maxLength: 140,
    category: "Draft Terms",
    usage: "MT700, MT701",
    example: "50PCT AT SIGHT"
  },
  {
    tag: ":42P:",
    name: "Deferred Payment Details",
    format: "4*35x",
    description: "Details of deferred payment terms",
    mandatory: false,
    maxLength: 140,
    category: "Draft Terms",
    usage: "MT700, MT701",
    example: "90 DAYS AFTER SIGHT"
  },
  {
    tag: ":43P:",
    name: "Partial Shipments",
    format: "9x",
    description: "Indicates whether partial shipments are allowed or prohibited",
    mandatory: true,
    maxLength: 9,
    category: "Shipment",
    usage: "MT700, MT701, MT707",
    example: "ALLOWED"
  },
  {
    tag: ":43T:",
    name: "Transhipment",
    format: "9x",
    description: "Indicates whether transhipment is allowed or prohibited",
    mandatory: true,
    maxLength: 9,
    category: "Shipment",
    usage: "MT700, MT701, MT707",
    example: "PROHIBITED"
  },
  {
    tag: ":44A:",
    name: "Loading on Board/Dispatch/Taking in Charge at/from",
    format: "65x",
    description: "Port, airport or place of loading, dispatch or taking in charge",
    mandatory: false,
    maxLength: 65,
    category: "Transport",
    usage: "MT700, MT701, MT707",
    example: "SHANGHAI PORT, CHINA"
  },
  {
    tag: ":44B:",
    name: "For Transportation to/to/to",
    format: "65x",
    description: "Port, airport or place of destination for transportation",
    mandatory: false,
    maxLength: 65,
    category: "Transport",
    usage: "MT700, MT701, MT707",
    example: "NEW YORK PORT, USA"
  },
  {
    tag: ":44C:",
    name: "Latest Date of Shipment",
    format: "6!n",
    description: "Latest date for loading on board, dispatch or taking in charge",
    mandatory: false,
    maxLength: 6,
    category: "Transport",
    usage: "MT700, MT701, MT707",
    example: "250615"
  },
  {
    tag: ":44D:",
    name: "Shipment Period",
    format: "65x",
    description: "Period during which shipment should take place",
    mandatory: false,
    maxLength: 65,
    category: "Transport",
    usage: "MT700, MT701",
    example: "BETWEEN 15JUN25 AND 30JUN25"
  },
  {
    tag: ":44E:",
    name: "Port of Loading/Airport of Departure",
    format: "65x",
    description: "Name of port of loading or airport of departure",
    mandatory: false,
    maxLength: 65,
    category: "Transport",
    usage: "MT700, MT701",
    example: "SHANGHAI PUDONG AIRPORT"
  },
  {
    tag: ":44F:",
    name: "Port of Discharge/Airport of Destination",
    format: "65x",
    description: "Name of port of discharge or airport of destination",
    mandatory: false,
    maxLength: 65,
    category: "Transport",
    usage: "MT700, MT701",
    example: "JFK INTERNATIONAL AIRPORT"
  },
  {
    tag: ":45A:",
    name: "Description of Goods and/or Services",
    format: "20*35x",
    description: "Description of goods and/or services being traded under the credit",
    mandatory: true,
    maxLength: 700,
    category: "Goods",
    usage: "MT700, MT701, MT707",
    example: "STEEL PIPES SEAMLESS"
  },
  {
    tag: ":46A:",
    name: "Documents Required",
    format: "20*35x",
    description: "Documents required for presentation under the credit",
    mandatory: true,
    maxLength: 700,
    category: "Documents",
    usage: "MT700, MT701, MT707",
    example: "COMMERCIAL INVOICE"
  },
  {
    tag: ":47A:",
    name: "Additional Conditions",
    format: "20*35x",
    description: "Additional conditions for the documentary credit",
    mandatory: false,
    maxLength: 700,
    category: "Conditions",
    usage: "MT700, MT701, MT707",
    example: "INSPECTION CERTIFICATE"
  },
  {
    tag: ":48:",
    name: "Period for Presentation",
    format: "77x",
    description: "Period within which documents must be presented",
    mandatory: false,
    maxLength: 77,
    category: "Presentation",
    usage: "MT700, MT701, MT707",
    example: "21 DAYS AFTER SHIPMENT"
  },
  {
    tag: ":49:",
    name: "Confirmation Instructions",
    format: "3*35x",
    description: "Instructions regarding confirmation of the documentary credit",
    mandatory: false,
    maxLength: 105,
    category: "Confirmation",
    usage: "MT700, MT701",
    example: "CONFIRM"
  },
  {
    tag: ":50:",
    name: "Applicant",
    format: "4*35x",
    description: "Party on whose behalf the documentary credit is issued",
    mandatory: true,
    maxLength: 140,
    category: "Parties",
    usage: "MT700, MT701, MT707",
    example: "ABC TRADING COMPANY"
  },
  {
    tag: ":51A:",
    name: "Applicant Bank",
    format: "1!a4!a2!a15d",
    description: "Bank of the applicant (with BIC and account)",
    mandatory: false,
    maxLength: 22,
    category: "Parties",
    usage: "MT700, MT701",
    example: "CHASUS33XXX"
  },
  {
    tag: ":51D:",
    name: "Applicant Bank",
    format: "4*35x",
    description: "Bank of the applicant (name and address)",
    mandatory: false,
    maxLength: 140,
    category: "Parties",
    usage: "MT700, MT701",
    example: "CHASE BANK NEW YORK"
  },
  {
    tag: ":52A:",
    name: "Issuing Bank",
    format: "1!a4!a2!a15d",
    description: "Bank issuing the documentary credit (with BIC)",
    mandatory: false,
    maxLength: 22,
    category: "Parties",
    usage: "MT700, MT701",
    example: "CITIUS33XXX"
  },
  {
    tag: ":52D:",
    name: "Issuing Bank",
    format: "4*35x",
    description: "Bank issuing the documentary credit (name and address)",
    mandatory: false,
    maxLength: 140,
    category: "Parties",
    usage: "MT700, MT701",
    example: "CITIBANK NEW YORK"
  },
  {
    tag: ":53A:",
    name: "Reimbursing Bank",
    format: "1!a4!a2!a15d",
    description: "Bank authorized to honor reimbursement claims (with BIC)",
    mandatory: false,
    maxLength: 22,
    category: "Parties",
    usage: "MT700, MT701",
    example: "BOFAUS3NXXX"
  },
  {
    tag: ":53D:",
    name: "Reimbursing Bank",
    format: "4*35x",
    description: "Bank authorized to honor reimbursement claims (name and address)",
    mandatory: false,
    maxLength: 140,
    category: "Parties",
    usage: "MT700, MT701",
    example: "BANK OF AMERICA NY"
  },
  {
    tag: ":56A:",
    name: "Intermediary Bank",
    format: "1!a4!a2!a15d",
    description: "Intermediary bank in the transaction chain (with BIC)",
    mandatory: false,
    maxLength: 22,
    category: "Parties",
    usage: "MT754, MT756",
    example: "HSBCUS33XXX"
  },
  {
    tag: ":56D:",
    name: "Intermediary Bank",
    format: "4*35x",
    description: "Intermediary bank in the transaction chain (name and address)",
    mandatory: false,
    maxLength: 140,
    category: "Parties",
    usage: "MT754, MT756",
    example: "HSBC BANK USA"
  },
  {
    tag: ":57A:",
    name: "Advising Bank",
    format: "1!a4!a2!a15d",
    description: "Bank advising the documentary credit (with BIC)",
    mandatory: false,
    maxLength: 22,
    category: "Parties",
    usage: "MT700, MT701",
    example: "SCBLSG22XXX"
  },
  {
    tag: ":57D:",
    name: "Advising Bank",
    format: "4*35x",
    description: "Bank advising the documentary credit (name and address)",
    mandatory: false,
    maxLength: 140,
    category: "Parties",
    usage: "MT700, MT701",
    example: "STANDARD CHARTERED SINGAPORE"
  },
  {
    tag: ":59:",
    name: "Beneficiary",
    format: "4*35x",
    description: "Party in whose favour the documentary credit is issued",
    mandatory: true,
    maxLength: 140,
    category: "Parties",
    usage: "MT700, MT701, MT707",
    example: "XYZ EXPORT CORP"
  },
  {
    tag: ":70:",
    name: "Remittance Information",
    format: "4*35x",
    description: "Information for the beneficiary regarding the payment",
    mandatory: false,
    maxLength: 140,
    category: "Information",
    usage: "MT754, MT756",
    example: "PAYMENT FOR INVOICE 123"
  },
  {
    tag: ":71A:",
    name: "Details of Charges",
    format: "3!a",
    description: "Indicates which party bears the charges (coded)",
    mandatory: false,
    maxLength: 3,
    category: "Charges",
    usage: "MT700, MT701",
    example: "SHA"
  },
  {
    tag: ":71B:",
    name: "Charges",
    format: "35x",
    description: "Indicates which party bears the charges",
    mandatory: true,
    maxLength: 35,
    category: "Charges",
    usage: "MT700, MT701, MT707",
    example: "OUR"
  },
  {
    tag: ":71D:",
    name: "Charges/Interest",
    format: "6*35x",
    description: "Details of charges and interest",
    mandatory: false,
    maxLength: 210,
    category: "Charges",
    usage: "MT754, MT756",
    example: "COMMISSION USD100"
  },
  {
    tag: ":72:",
    name: "Sender to Receiver Information",
    format: "6*35x",
    description: "Additional information for the receiver",
    mandatory: false,
    maxLength: 210,
    category: "Information",
    usage: "Most MT7xx messages",
    example: "PLEASE ADVISE RECEIPT"
  },
  {
    tag: ":73:",
    name: "Correspondence",
    format: "6*35x",
    description: "Information related to previous correspondence",
    mandatory: false,
    maxLength: 210,
    category: "Information",
    usage: "MT730, MT732",
    example: "REF YOUR MT700 DTD 051224"
  },
  {
    tag: ":77A:",
    name: "Narrative",
    format: "20*35x",
    description: "General narrative information",
    mandatory: false,
    maxLength: 700,
    category: "Information",
    usage: "Various MT7xx messages",
    example: "ADDITIONAL INSTRUCTIONS"
  },
  {
    tag: ":78:",
    name: "Instructions to the Paying/Accepting/Negotiating Bank",
    format: "20*35x",
    description: "Special instructions for the paying, accepting or negotiating bank",
    mandatory: false,
    maxLength: 700,
    category: "Instructions",
    usage: "MT700, MT701, MT707",
    example: "DOCUMENTS TO BE SENT TO"
  },
  {
    tag: ":79:",
    name: "Narrative Description of Discrepancy",
    format: "20*35x",
    description: "Description of discrepancies found in documents",
    mandatory: true,
    maxLength: 700,
    category: "Discrepancy",
    usage: "MT750",
    example: "INVOICE AMOUNT EXCEEDS"
  }
];

interface MT7FieldsGridProps {
  onFieldClick?: (field: typeof MT7_FIELDS[0]) => void;
}

export default function MT7FieldsGrid({ onFieldClick }: MT7FieldsGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(MT7_FIELDS.map(field => field.category)))];

  // Filter fields based on search and category
  const filteredFields = MT7_FIELDS.filter(field => {
    const matchesSearch = 
      field.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || field.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      "Control": "bg-blue-50 border-blue-200",
      "Account": "bg-green-50 border-green-200",
      "Date": "bg-purple-50 border-purple-200",
      "Amount": "bg-yellow-50 border-yellow-200",
      "Terms": "bg-pink-50 border-pink-200",
      "Credit Type": "bg-indigo-50 border-indigo-200",
      "Availability": "bg-cyan-50 border-cyan-200",
      "Draft Terms": "bg-orange-50 border-orange-200",
      "Shipment": "bg-emerald-50 border-emerald-200",
      "Transport": "bg-teal-50 border-teal-200",
      "Goods": "bg-red-50 border-red-200",
      "Documents": "bg-violet-50 border-violet-200",
      "Conditions": "bg-amber-50 border-amber-200",
      "Presentation": "bg-lime-50 border-lime-200",
      "Confirmation": "bg-sky-50 border-sky-200",
      "Parties": "bg-rose-50 border-rose-200",
      "Information": "bg-slate-50 border-slate-200",
      "Charges": "bg-gray-50 border-gray-200",
      "Instructions": "bg-neutral-50 border-neutral-200",
      "Discrepancy": "bg-zinc-50 border-zinc-200"
    };
    return colors[category as keyof typeof colors] || "bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">SWIFT MT7xx Field Reference</CardTitle>
          <CardDescription>
            Complete field definitions for SWIFT Category 7 - Documentary Credits and Guarantees (2019 Standards)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by field tag, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md bg-background"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredFields.length}</div>
              <div className="text-sm text-blue-800">Fields Found</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filteredFields.filter(f => f.mandatory).length}
              </div>
              <div className="text-sm text-green-800">Mandatory</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {filteredFields.filter(f => !f.mandatory).length}
              </div>
              <div className="text-sm text-orange-800">Optional</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {categories.length - 1}
              </div>
              <div className="text-sm text-purple-800">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFields.map((field, index) => (
          <Card 
            key={field.tag}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              getCategoryColor(field.category)
            } ${index % 2 === 0 ? 'border-l-4' : 'border-r-4'}`}
            onClick={() => onFieldClick?.(field)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-bold bg-white px-2 py-1 rounded border">
                  {field.tag}
                </code>
                <div className="flex items-center space-x-1">
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
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">{field.name}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {field.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {field.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    {field.format}
                  </span>
                  <span className="text-muted-foreground">
                    Max: {field.maxLength}
                  </span>
                </div>

                <div className="text-xs">
                  <div className="font-medium text-gray-700">Usage:</div>
                  <div className="text-muted-foreground">{field.usage}</div>
                </div>

                <div className="text-xs">
                  <div className="font-medium text-gray-700">Example:</div>
                  <code className="text-green-700 bg-green-50 px-1 rounded">
                    {field.example}
                  </code>
                </div>

                <div className="flex items-center justify-center pt-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground ml-1">Click for details</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Fields Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
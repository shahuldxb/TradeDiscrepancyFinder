import { db } from "./db";
import { 
  mtIntelligenceMessageTypes, 
  mtIntelligenceFields, 
  mtIntelligenceMessageTypeFields 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Seeds the complete MT700 field specifications based on SWIFT Category 7 
 * Documentary Credits and Guarantees Standards MT November 2019
 * Source: swift_solutions_sr2019_cat_7_advanceinformation.pdf
 */

interface MT700Field {
  fieldNumber: number;
  tag: string;
  fieldName: string;
  contentOptions: string;
  isMandatory: boolean;
  description: string;
  format: string;
  networkValidatedRules?: string;
  usageRules?: string;
}

const MT700_FIELDS: MT700Field[] = [
  {
    fieldNumber: 1,
    tag: "27",
    fieldName: "Sequence of Total",
    contentOptions: "1!n/1!n",
    isMandatory: true,
    description: "Specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.",
    format: "1!n/1!n (Number)(Total)",
    networkValidatedRules: "Number must have the fixed value of 1 and Total must have a value in the range 1 to 8"
  },
  {
    fieldNumber: 2,
    tag: "40A",
    fieldName: "Form of Documentary Credit",
    contentOptions: "24x",
    isMandatory: true,
    description: "Indicates the form of documentary credit.",
    format: "24x (Type)"
  },
  {
    fieldNumber: 3,
    tag: "20",
    fieldName: "Documentary Credit Number",
    contentOptions: "16x",
    isMandatory: true,
    description: "Contains the documentary credit number assigned by the issuing bank.",
    format: "16x"
  },
  {
    fieldNumber: 4,
    tag: "23",
    fieldName: "Reference to Pre-Advice",
    contentOptions: "16x",
    isMandatory: false,
    description: "Contains the reference of the pre-advice MT 705 to which this documentary credit relates.",
    format: "16x"
  },
  {
    fieldNumber: 5,
    tag: "31C",
    fieldName: "Date of Issue",
    contentOptions: "6!n",
    isMandatory: true,
    description: "Contains the date of issue of the documentary credit.",
    format: "6!n (YYMMDD)"
  },
  {
    fieldNumber: 6,
    tag: "40E",
    fieldName: "Applicable Rules",
    contentOptions: "30x[/35x]",
    isMandatory: true,
    description: "Indicates the rules under which the documentary credit is issued.",
    format: "30x[/35x]"
  },
  {
    fieldNumber: 7,
    tag: "31D",
    fieldName: "Date and Place of Expiry",
    contentOptions: "6!n29x",
    isMandatory: true,
    description: "Contains the expiry date and place of the documentary credit.",
    format: "6!n29x (Date)(Place)"
  },
  {
    fieldNumber: 8,
    tag: "51a",
    fieldName: "Applicant Bank",
    contentOptions: "A or D",
    isMandatory: false,
    description: "Identifies the applicant bank if different from the issuing bank.",
    format: "Option A or D"
  },
  {
    fieldNumber: 9,
    tag: "50",
    fieldName: "Applicant",
    contentOptions: "4*35x",
    isMandatory: true,
    description: "Contains the name and address of the applicant.",
    format: "4*35x"
  },
  {
    fieldNumber: 10,
    tag: "59",
    fieldName: "Beneficiary",
    contentOptions: "[/34x] 4*35x",
    isMandatory: true,
    description: "Contains the name and address of the beneficiary.",
    format: "[/34x] 4*35x"
  },
  {
    fieldNumber: 11,
    tag: "32B",
    fieldName: "Currency Code, Amount",
    contentOptions: "3!a15d",
    isMandatory: true,
    description: "Contains the currency and amount of the documentary credit.",
    format: "3!a15d (Currency)(Amount)"
  },
  {
    fieldNumber: 12,
    tag: "39A",
    fieldName: "Percentage Credit Amount Tolerance",
    contentOptions: "2n/2n",
    isMandatory: false,
    description: "Indicates the tolerance for the amount of the documentary credit in percentage.",
    format: "2n/2n (Plus)(Minus)"
  },
  {
    fieldNumber: 13,
    tag: "39C",
    fieldName: "Additional Amounts Covered",
    contentOptions: "4*35x",
    isMandatory: false,
    description: "Contains additional amounts covered by the documentary credit.",
    format: "4*35x"
  },
  {
    fieldNumber: 14,
    tag: "41a",
    fieldName: "Available With ... By ...",
    contentOptions: "A or D",
    isMandatory: true,
    description: "Identifies the bank with which the credit is available and the method of availability.",
    format: "Option A or D"
  },
  {
    fieldNumber: 15,
    tag: "42C",
    fieldName: "Drafts at ...",
    contentOptions: "3*35x",
    isMandatory: false,
    description: "Contains information about drafts.",
    format: "3*35x"
  },
  {
    fieldNumber: 16,
    tag: "42a",
    fieldName: "Drawee",
    contentOptions: "A or D",
    isMandatory: false,
    description: "Identifies the drawee of the draft.",
    format: "Option A or D"
  },
  {
    fieldNumber: 17,
    tag: "42M",
    fieldName: "Mixed Payment Details",
    contentOptions: "4*35x",
    isMandatory: false,
    description: "Contains mixed payment details.",
    format: "4*35x"
  },
  {
    fieldNumber: 18,
    tag: "42P",
    fieldName: "Negotiation/Deferred Payment Details",
    contentOptions: "4*35x",
    isMandatory: false,
    description: "Contains negotiation or deferred payment details.",
    format: "4*35x"
  },
  {
    fieldNumber: 19,
    tag: "43P",
    fieldName: "Partial Shipments",
    contentOptions: "11x",
    isMandatory: false,
    description: "Indicates whether partial shipments are allowed.",
    format: "11x"
  },
  {
    fieldNumber: 20,
    tag: "43T",
    fieldName: "Transhipment",
    contentOptions: "11x",
    isMandatory: false,
    description: "Indicates whether transhipment is allowed.",
    format: "11x"
  },
  {
    fieldNumber: 21,
    tag: "44A",
    fieldName: "Place of Taking in Charge/Dispatch from .../Place of Receipt",
    contentOptions: "65x",
    isMandatory: false,
    description: "Contains the place of taking in charge, dispatch from, or place of receipt.",
    format: "65x"
  },
  {
    fieldNumber: 22,
    tag: "44E",
    fieldName: "Port of Loading/Airport of Departure",
    contentOptions: "65x",
    isMandatory: false,
    description: "Contains the port of loading or airport of departure.",
    format: "65x"
  },
  {
    fieldNumber: 23,
    tag: "44F",
    fieldName: "Port of Discharge/Airport of Destination",
    contentOptions: "65x",
    isMandatory: false,
    description: "Contains the port of discharge or airport of destination.",
    format: "65x"
  },
  {
    fieldNumber: 24,
    tag: "44B",
    fieldName: "Place of Final Destination/For Transportation to .../Place of Delivery",
    contentOptions: "65x",
    isMandatory: false,
    description: "Contains the place of final destination, for transportation to, or place of delivery.",
    format: "65x"
  },
  {
    fieldNumber: 25,
    tag: "44C",
    fieldName: "Latest Date of Shipment",
    contentOptions: "6!n",
    isMandatory: false,
    description: "Contains the latest date of shipment.",
    format: "6!n (YYMMDD)"
  },
  {
    fieldNumber: 26,
    tag: "44D",
    fieldName: "Shipment Period",
    contentOptions: "6*65x",
    isMandatory: false,
    description: "Contains the shipment period.",
    format: "6*65x"
  },
  {
    fieldNumber: 27,
    tag: "45A",
    fieldName: "Description of Goods and/or Services",
    contentOptions: "100*65z",
    isMandatory: false,
    description: "Contains the description of goods and/or services.",
    format: "100*65z"
  },
  {
    fieldNumber: 28,
    tag: "46A",
    fieldName: "Documents Required",
    contentOptions: "100*65z",
    isMandatory: false,
    description: "Contains the documents required for presentation.",
    format: "100*65z"
  },
  {
    fieldNumber: 29,
    tag: "47A",
    fieldName: "Additional Conditions",
    contentOptions: "100*65z",
    isMandatory: false,
    description: "Contains additional conditions.",
    format: "100*65z"
  },
  {
    fieldNumber: 30,
    tag: "49G",
    fieldName: "Special Payment Conditions for Beneficiary",
    contentOptions: "100*65z",
    isMandatory: false,
    description: "Contains special payment conditions for the beneficiary.",
    format: "100*65z"
  },
  {
    fieldNumber: 31,
    tag: "49H",
    fieldName: "Special Payment Conditions for Receiving Bank",
    contentOptions: "100*65z",
    isMandatory: false,
    description: "Contains special payment conditions for the receiving bank.",
    format: "100*65z"
  },
  {
    fieldNumber: 32,
    tag: "71D",
    fieldName: "Charges",
    contentOptions: "6*35z",
    isMandatory: false,
    description: "Contains charges information.",
    format: "6*35z"
  },
  {
    fieldNumber: 33,
    tag: "48",
    fieldName: "Period for Presentation in Days",
    contentOptions: "3n[/35x]",
    isMandatory: false,
    description: "Contains the period for presentation in days.",
    format: "3n[/35x]"
  },
  {
    fieldNumber: 34,
    tag: "49",
    fieldName: "Confirmation Instructions",
    contentOptions: "7!x",
    isMandatory: true,
    description: "Contains confirmation instructions.",
    format: "7!x"
  },
  {
    fieldNumber: 35,
    tag: "58a",
    fieldName: "Requested Confirmation Party",
    contentOptions: "A or D",
    isMandatory: false,
    description: "Identifies the requested confirmation party.",
    format: "Option A or D"
  },
  {
    fieldNumber: 36,
    tag: "53a",
    fieldName: "Reimbursing Bank",
    contentOptions: "A or D",
    isMandatory: false,
    description: "Identifies the reimbursing bank.",
    format: "Option A or D"
  },
  {
    fieldNumber: 37,
    tag: "78",
    fieldName: "Instructions to the Paying/Accepting/Negotiating Bank",
    contentOptions: "12*65x",
    isMandatory: false,
    description: "Contains instructions to the paying, accepting, or negotiating bank.",
    format: "12*65x"
  },
  {
    fieldNumber: 38,
    tag: "57a",
    fieldName: "'Advise Through' Bank",
    contentOptions: "A, B, or D",
    isMandatory: false,
    description: "Identifies the 'advise through' bank.",
    format: "Option A, B, or D"
  },
  {
    fieldNumber: 39,
    tag: "72Z",
    fieldName: "Sender to Receiver Information",
    contentOptions: "6*35z",
    isMandatory: false,
    description: "Contains sender to receiver information.",
    format: "6*35z"
  }
];

export async function updateMT700Fields() {
  console.log("🔄 Updating MT700 with complete 39 field specifications from SWIFT documentation...");

  try {
    // Get MT700 message type
    const [mt700] = await db
      .select()
      .from(mtIntelligenceMessageTypes)
      .where(eq(mtIntelligenceMessageTypes.messageTypeCode, "MT700"));

    if (!mt700) {
      console.error("❌ MT700 message type not found in database");
      return;
    }

    // Delete existing MT700 field relationships
    await db
      .delete(mtIntelligenceMessageTypeFields)
      .where(eq(mtIntelligenceMessageTypeFields.messageTypeId, mt700.id));

    console.log("🗑️ Cleared existing MT700 field relationships");

    // Process each field
    for (const fieldSpec of MT700_FIELDS) {
      // Create or update field in mtIntelligenceFields
      const fieldId = `mt700-${fieldSpec.tag.toLowerCase()}`;
      
      // Delete existing field if it exists
      await db
        .delete(mtIntelligenceFields)
        .where(eq(mtIntelligenceFields.id, fieldId));

      // Insert updated field
      const [field] = await db
        .insert(mtIntelligenceFields)
        .values({
          id: fieldId,
          fieldCode: fieldSpec.tag,
          name: fieldSpec.fieldName,
          description: fieldSpec.description,
          format: fieldSpec.format,
          validationRegex: fieldSpec.networkValidatedRules || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create message type field relationship
      await db
        .insert(mtIntelligenceMessageTypeFields)
        .values({
          id: `${mt700.id}-${field.id}`,
          messageTypeId: mt700.id,
          fieldId: field.id,
          sequence: fieldSpec.fieldNumber,
          isMandatory: fieldSpec.isMandatory,
          createdAt: new Date()
        });

      console.log(`✅ Added field ${fieldSpec.fieldNumber}: ${fieldSpec.tag} - ${fieldSpec.fieldName} (${fieldSpec.isMandatory ? 'Mandatory' : 'Optional'})`);
    }

    // Verify the count
    const fieldCount = await db
      .select()
      .from(mtIntelligenceMessageTypeFields)
      .where(eq(mtIntelligenceMessageTypeFields.messageTypeId, mt700.id));

    console.log(`🎉 Successfully updated MT700 with ${fieldCount.length} fields (${MT700_FIELDS.filter(f => f.isMandatory).length} mandatory, ${MT700_FIELDS.filter(f => !f.isMandatory).length} optional)`);

  } catch (error) {
    console.error("❌ Error updating MT700 fields:", error);
    throw error;
  }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMT700Fields()
    .then(() => {
      console.log("✅ MT700 field update completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ MT700 field update failed:", error);
      process.exit(1);
    });
}
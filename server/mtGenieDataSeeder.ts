import { db } from "./db";
import { 
  mtGenieMessageTypes, 
  mtGenieMessageFields,
  mtGenieMessageDependencies
} from "@shared/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// Comprehensive MT700 field definitions based on SWIFT standards
export async function seedMT700Fields(messageTypeId: string) {
  const mt700Fields = [
    {
      id: nanoid(),
      messageTypeId,
      tag: "20",
      fieldName: "Documentary Credit Number",
      isMandatory: true,
      sequence: 1,
      formatDescription: "16x",
      presenceDescription: "Mandatory",
      definitionDescription: "Reference of the documentary credit",
      validationRules: {
        pattern: "^[A-Z0-9/\\-\\?:\\(\\)\\.,'+\\s]{1,16}$",
        maxLength: 16,
        patternDescription: "Max 16 characters, alphanumeric with limited special characters"
      },
      examples: ["DCREDIT001", "LC2024/001"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "23",
      fieldName: "Reference to Pre-advice",
      isMandatory: false,
      sequence: 2,
      formatDescription: "16x",
      presenceDescription: "Optional",
      definitionDescription: "Reference to the related pre-advice",
      validationRules: {
        pattern: "^[A-Z0-9/\\-\\?:\\(\\)\\.,'+\\s]{1,16}$",
        maxLength: 16
      },
      examples: ["PREADVICE001"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "31C",
      fieldName: "Date of Issue",
      isMandatory: true,
      sequence: 3,
      formatDescription: "6!n",
      presenceDescription: "Mandatory",
      definitionDescription: "Date when the documentary credit is issued",
      validationRules: {
        pattern: "^[0-9]{6}$",
        maxLength: 6,
        patternDescription: "YYMMDD format"
      },
      examples: ["241215", "250101"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "40A",
      fieldName: "Form of Documentary Credit",
      isMandatory: false,
      sequence: 4,
      formatDescription: "1!a",
      presenceDescription: "Either 40A or 40E must be present",
      definitionDescription: "Form of the documentary credit",
      validationRules: {
        pattern: "^[I|R]$",
        maxLength: 1,
        patternDescription: "I = Irrevocable, R = Revocable"
      },
      fieldCodes: {
        "I": "Irrevocable",
        "R": "Revocable"
      },
      examples: ["I"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "40E",
      fieldName: "Applicable Rules",
      isMandatory: false,
      sequence: 5,
      formatDescription: "4!c",
      presenceDescription: "Either 40A or 40E must be present",
      definitionDescription: "Rules applicable to the documentary credit",
      validationRules: {
        pattern: "^[A-Z]{4}$",
        maxLength: 4
      },
      fieldCodes: {
        "UCPD": "UCP 600 - Documentary Credits",
        "UCPS": "UCP 600 - Standby Credits",
        "OTHR": "Other Rules"
      },
      examples: ["UCPD"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "20C",
      fieldName: "Sender's Reference",
      isMandatory: false,
      sequence: 6,
      formatDescription: "16x",
      presenceDescription: "Optional",
      definitionDescription: "Sender's reference for the documentary credit",
      validationRules: {
        pattern: "^[A-Z0-9/\\-\\?:\\(\\)\\.,'+\\s]{1,16}$",
        maxLength: 16
      },
      examples: ["SREF001"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "31D",
      fieldName: "Date and Place of Expiry",
      isMandatory: true,
      sequence: 7,
      formatDescription: "6!n4!a2a",
      presenceDescription: "Mandatory",
      definitionDescription: "Expiry date and place of the documentary credit",
      validationRules: {
        pattern: "^[0-9]{6}[A-Z]{2}[A-Z]{2}$",
        maxLength: 10,
        patternDescription: "YYMMDD + 2-letter country code + 2-letter location code"
      },
      examples: ["250630USNY", "250731GBLO"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "50",
      fieldName: "Applicant",
      isMandatory: true,
      sequence: 8,
      formatDescription: "4*35x",
      presenceDescription: "Mandatory",
      definitionDescription: "Name and address of the applicant",
      validationRules: {
        maxLength: 140,
        patternDescription: "Up to 4 lines of 35 characters each"
      },
      examples: ["ABC TRADING COMPANY LTD\nMAIN STREET 123\nNEW YORK NY 10001\nUSA"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "59",
      fieldName: "Beneficiary",
      isMandatory: true,
      sequence: 9,
      formatDescription: "4*35x",
      presenceDescription: "Mandatory",
      definitionDescription: "Name and address of the beneficiary",
      validationRules: {
        maxLength: 140,
        patternDescription: "Up to 4 lines of 35 characters each"
      },
      examples: ["XYZ EXPORT COMPANY\nINDUSTRIAL ZONE 456\nLONDON E1 6AN\nUNITED KINGDOM"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "32B",
      fieldName: "Currency Code, Amount",
      isMandatory: true,
      sequence: 10,
      formatDescription: "3!a15d",
      presenceDescription: "Mandatory",
      definitionDescription: "Currency and amount of the credit",
      validationRules: {
        pattern: "^[A-Z]{3}[0-9,]{1,15}$",
        maxLength: 18,
        patternDescription: "3-letter currency code + amount with up to 15 digits"
      },
      examples: ["USD100000,00", "EUR50000,00"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "39A",
      fieldName: "Percentage Credit Amount Tolerance",
      isMandatory: false,
      sequence: 11,
      formatDescription: "2n/2n",
      presenceDescription: "Optional",
      definitionDescription: "Tolerance for the credit amount",
      validationRules: {
        pattern: "^[0-9]{1,2}/[0-9]{1,2}$",
        maxLength: 5,
        patternDescription: "Plus tolerance/Minus tolerance (e.g., 10/10)"
      },
      examples: ["10/10", "05/05"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "39B",
      fieldName: "Maximum Credit Amount",
      isMandatory: false,
      sequence: 12,
      formatDescription: "13x",
      presenceDescription: "Optional",
      definitionDescription: "Maximum amount of the documentary credit",
      validationRules: {
        maxLength: 13
      },
      examples: ["NOT EXCEEDING"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "39C",
      fieldName: "Additional Amounts Covered",
      isMandatory: false,
      sequence: 13,
      formatDescription: "4*35x",
      presenceDescription: "Optional",
      definitionDescription: "Additional amounts covered by the credit",
      validationRules: {
        maxLength: 140
      },
      examples: ["INSURANCE PREMIUM UP TO USD1000\nFREIGHT CHARGES"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "41A",
      fieldName: "Available With Bank",
      isMandatory: false,
      sequence: 14,
      formatDescription: "4!a2!a2!c[3!c]",
      presenceDescription: "Either 41A or 41D must be present",
      definitionDescription: "Bank with which the credit is available",
      validationRules: {
        pattern: "^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$",
        maxLength: 11,
        patternDescription: "BIC code format"
      },
      examples: ["CITIUS33XXX", "DEUTDEFFXXX"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "41D",
      fieldName: "Available With Bank",
      isMandatory: false,
      sequence: 15,
      formatDescription: "4*35x",
      presenceDescription: "Either 41A or 41D must be present",
      definitionDescription: "Name and address of bank with which credit is available",
      validationRules: {
        maxLength: 140
      },
      examples: ["ANY BANK\nIN UNITED KINGDOM"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "42C",
      fieldName: "Drafts at",
      isMandatory: false,
      sequence: 16,
      formatDescription: "35x",
      presenceDescription: "Optional",
      definitionDescription: "Terms for drafts",
      validationRules: {
        maxLength: 35
      },
      examples: ["AT SIGHT", "90 DAYS AFTER SIGHT"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "42A",
      fieldName: "Drawee",
      isMandatory: false,
      sequence: 17,
      formatDescription: "4!a2!a2!c[3!c]",
      presenceDescription: "Optional",
      definitionDescription: "Drawee bank",
      validationRules: {
        pattern: "^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$",
        maxLength: 11
      },
      examples: ["CITIUS33XXX"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "42D",
      fieldName: "Drawee",
      isMandatory: false,
      sequence: 18,
      formatDescription: "4*35x",
      presenceDescription: "Optional",
      definitionDescription: "Name and address of drawee",
      validationRules: {
        maxLength: 140
      },
      examples: ["CITIBANK N.A.\nNEW YORK"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "43P",
      fieldName: "Partial Shipments",
      isMandatory: false,
      sequence: 19,
      formatDescription: "1!a",
      presenceDescription: "Optional",
      definitionDescription: "Whether partial shipments are allowed",
      validationRules: {
        pattern: "^[A|N]$",
        maxLength: 1
      },
      fieldCodes: {
        "A": "Allowed",
        "N": "Not Allowed"
      },
      examples: ["A"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "43T",
      fieldName: "Transhipment",
      isMandatory: false,
      sequence: 20,
      formatDescription: "1!a",
      presenceDescription: "Optional",
      definitionDescription: "Whether transhipment is allowed",
      validationRules: {
        pattern: "^[A|N]$",
        maxLength: 1
      },
      fieldCodes: {
        "A": "Allowed",
        "N": "Not Allowed"
      },
      examples: ["N"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "44A",
      fieldName: "Place of Taking in Charge",
      isMandatory: false,
      sequence: 21,
      formatDescription: "65x",
      presenceDescription: "Optional",
      definitionDescription: "Place where goods are taken in charge",
      validationRules: {
        maxLength: 65
      },
      examples: ["NEW YORK PORT"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "44E",
      fieldName: "Port of Loading",
      isMandatory: false,
      sequence: 22,
      formatDescription: "65x",
      presenceDescription: "Optional",
      definitionDescription: "Port of loading",
      validationRules: {
        maxLength: 65
      },
      examples: ["PORT OF NEW YORK"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "44F",
      fieldName: "Port of Discharge",
      isMandatory: false,
      sequence: 23,
      formatDescription: "65x",
      presenceDescription: "Optional",
      definitionDescription: "Port of discharge",
      validationRules: {
        maxLength: 65
      },
      examples: ["PORT OF LONDON"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "44B",
      fieldName: "Place of Final Destination",
      isMandatory: false,
      sequence: 24,
      formatDescription: "65x",
      presenceDescription: "Optional",
      definitionDescription: "Final destination of goods",
      validationRules: {
        maxLength: 65
      },
      examples: ["LONDON, UK"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "44C",
      fieldName: "Latest Date of Shipment",
      isMandatory: false,
      sequence: 25,
      formatDescription: "6!n",
      presenceDescription: "Optional",
      definitionDescription: "Latest date for shipment",
      validationRules: {
        pattern: "^[0-9]{6}$",
        maxLength: 6,
        patternDescription: "YYMMDD format"
      },
      examples: ["250630"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "44D",
      fieldName: "Shipment Period",
      isMandatory: false,
      sequence: 26,
      formatDescription: "65x",
      presenceDescription: "Optional",
      definitionDescription: "Period for shipment",
      validationRules: {
        maxLength: 65
      },
      examples: ["SHIPMENT DURING JUNE 2025"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "45A",
      fieldName: "Description of Goods and/or Services",
      isMandatory: true,
      sequence: 27,
      formatDescription: "65*35x",
      presenceDescription: "Mandatory",
      definitionDescription: "Description of goods and/or services",
      validationRules: {
        maxLength: 2275,
        patternDescription: "Up to 65 lines of 35 characters each"
      },
      examples: ["COTTON FABRIC\n100% COTTON\nAS PER PROFORMA INVOICE NO. PI001"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "46A",
      fieldName: "Documents Required",
      isMandatory: true,
      sequence: 28,
      formatDescription: "65*35x",
      presenceDescription: "Mandatory",
      definitionDescription: "Documents required for presentation",
      validationRules: {
        maxLength: 2275
      },
      examples: ["COMMERCIAL INVOICE IN TRIPLICATE\nBILL OF LADING\nPACKING LIST\nCERTIFICATE OF ORIGIN"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "47A",
      fieldName: "Additional Conditions",
      isMandatory: false,
      sequence: 29,
      formatDescription: "65*35x",
      presenceDescription: "Optional",
      definitionDescription: "Additional conditions",
      validationRules: {
        maxLength: 2275
      },
      examples: ["BENEFICIARY TO CERTIFY THAT\nGOODS ARE IN ACCORDANCE WITH\nCONTRACT NO. ABC123"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "71D",
      fieldName: "Charges",
      isMandatory: false,
      sequence: 30,
      formatDescription: "35x",
      presenceDescription: "Optional",
      definitionDescription: "Details of charges",
      validationRules: {
        maxLength: 35
      },
      examples: ["ALL CHARGES OUTSIDE USA FOR\nBENEFICIARY ACCOUNT"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "48",
      fieldName: "Period for Presentation",
      isMandatory: false,
      sequence: 31,
      formatDescription: "35x",
      presenceDescription: "Optional",
      definitionDescription: "Period for presentation of documents",
      validationRules: {
        maxLength: 35
      },
      examples: ["DOCUMENTS TO BE PRESENTED\nWITHIN 21 DAYS AFTER SHIPMENT"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "49",
      fieldName: "Confirmation Instructions",
      isMandatory: false,
      sequence: 32,
      formatDescription: "65x",
      presenceDescription: "Optional",
      definitionDescription: "Instructions regarding confirmation",
      validationRules: {
        maxLength: 65
      },
      examples: ["CONFIRM", "WITHOUT CONFIRMATION"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "53A",
      fieldName: "Reimbursing Bank",
      isMandatory: false,
      sequence: 33,
      formatDescription: "4!a2!a2!c[3!c]",
      presenceDescription: "Optional",
      definitionDescription: "Reimbursing bank BIC",
      validationRules: {
        pattern: "^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$",
        maxLength: 11
      },
      examples: ["CITIUS33XXX"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "53D",
      fieldName: "Reimbursing Bank",
      isMandatory: false,
      sequence: 34,
      formatDescription: "4*35x",
      presenceDescription: "Optional",
      definitionDescription: "Reimbursing bank name and address",
      validationRules: {
        maxLength: 140
      },
      examples: ["CITIBANK N.A.\nNEW YORK NY 10043\nUSA"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "78",
      fieldName: "Instructions to the Paying/Accepting/Negotiating Bank",
      isMandatory: false,
      sequence: 35,
      formatDescription: "65*35x",
      presenceDescription: "Optional",
      definitionDescription: "Instructions to paying/accepting/negotiating bank",
      validationRules: {
        maxLength: 2275
      },
      examples: ["NEGOTIATE DOCUMENTS UPON\nPRESENTATION IF IN COMPLIANCE\nWITH CREDIT TERMS"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "57A",
      fieldName: "Advise Through Bank",
      isMandatory: false,
      sequence: 36,
      formatDescription: "4!a2!a2!c[3!c]",
      presenceDescription: "Optional",
      definitionDescription: "Advise through bank BIC",
      validationRules: {
        pattern: "^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$",
        maxLength: 11
      },
      examples: ["DEUTDEFFXXX"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "57D",
      fieldName: "Advise Through Bank",
      isMandatory: false,
      sequence: 37,
      formatDescription: "4*35x",
      presenceDescription: "Optional",
      definitionDescription: "Advise through bank name and address",
      validationRules: {
        maxLength: 140
      },
      examples: ["DEUTSCHE BANK AG\nFRANKFURT\nGERMANY"]
    },
    {
      id: nanoid(),
      messageTypeId,
      tag: "72Z",
      fieldName: "Sender to Receiver Information",
      isMandatory: false,
      sequence: 38,
      formatDescription: "6*35x",
      presenceDescription: "Optional",
      definitionDescription: "Additional information from sender to receiver",
      validationRules: {
        maxLength: 210
      },
      examples: ["THIS CREDIT IS SUBJECT TO UCP 600\nREVISION 2007 ICC PUBLICATION 600"]
    }
  ];

  try {
    await db.insert(mtGenieMessageFields).values(mt700Fields).onConflictDoNothing();
    console.log(`MT700 fields seeded successfully: ${mt700Fields.length} fields`);
    return mt700Fields.length;
  } catch (error) {
    console.error("Error seeding MT700 fields:", error);
    throw error;
  }
}

// Seed message dependencies
export async function seedMTGenieDependencies() {
  const messageTypes = await db.select().from(mtGenieMessageTypes);
  const mt700 = messageTypes.find(mt => mt.messageTypeCode === "700");
  const mt707 = messageTypes.find(mt => mt.messageTypeCode === "707");
  const mt750 = messageTypes.find(mt => mt.messageTypeCode === "750");
  const mt754 = messageTypes.find(mt => mt.messageTypeCode === "754");
  const mt756 = messageTypes.find(mt => mt.messageTypeCode === "756");

  if (!mt700) return;

  const dependencies = [
    {
      id: nanoid(),
      sourceMessageTypeId: mt700.id,
      targetMessageTypeId: mt707?.id || mt700.id,
      dependencyType: "AMENDMENT",
      description: "MT707 amends the original MT700 documentary credit"
    },
    {
      id: nanoid(),
      sourceMessageTypeId: mt700.id,
      targetMessageTypeId: mt750?.id || mt700.id,
      dependencyType: "DISCREPANCY",
      description: "MT750 advises discrepancies in documents presented under MT700"
    },
    {
      id: nanoid(),
      sourceMessageTypeId: mt700.id,
      targetMessageTypeId: mt754?.id || mt700.id,
      dependencyType: "PAYMENT_ADVICE",
      description: "MT754 advises payment/acceptance/negotiation under MT700"
    },
    {
      id: nanoid(),
      sourceMessageTypeId: mt700.id,
      targetMessageTypeId: mt756?.id || mt700.id,
      dependencyType: "REIMBURSEMENT",
      description: "MT756 advises reimbursement under MT700"
    }
  ];

  try {
    await db.insert(mtGenieMessageDependencies).values(dependencies).onConflictDoNothing();
    console.log(`MT Genie dependencies seeded: ${dependencies.length} dependencies`);
    return dependencies.length;
  } catch (error) {
    console.error("Error seeding MT Genie dependencies:", error);
    throw error;
  }
}

// Complete MT Genie seeding function
export async function seedCompleteMTGenieData() {
  console.log("Starting complete MT Genie data seeding...");
  
  try {
    // First seed message types
    const messageTypesData = [
      {
        id: nanoid(),
        messageTypeCode: "700",
        name: "Issue of a Documentary Credit",
        fullName: "MT700 - Issue of a Documentary Credit",
        purpose: "To issue a documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7",
        scope: "Documentary Credit Operations",
        formatSpecifications: "Standard MT700 format with mandatory and optional fields",
        networkValidatedRules: {
          "C1": "Either field 40A or 40E must be present, but not both",
          "C2": "If field 41A is not present, then field 41D must be present",
          "C3": "Field 31C date must not be earlier than the issue date"
        },
        usageRules: {
          "U1": "This message is used by the issuing bank to issue a documentary credit",
          "U2": "May be sent directly to the beneficiary's bank or through correspondent banks"
        }
      },
      {
        id: nanoid(),
        messageTypeCode: "701",
        name: "Issue of a Documentary Credit",
        fullName: "MT701 - Issue of a Documentary Credit",
        purpose: "To issue a documentary credit by an issuing bank to an advising bank",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "705",
        name: "Pre-advice of a Documentary Credit",
        fullName: "MT705 - Pre-advice of a Documentary Credit",
        purpose: "To pre-advise the receiver of the main details of a documentary credit which is to follow",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "707",
        name: "Amendment to a Documentary Credit",
        fullName: "MT707 - Amendment to a Documentary Credit",
        purpose: "To amend the terms and conditions of a documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "710",
        name: "Advice of a Third Bank's Documentary Credit",
        fullName: "MT710 - Advice of a Third Bank's Documentary Credit",
        purpose: "To advise the beneficiary of a documentary credit issued by a third bank",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "720",
        name: "Transfer of a Documentary Credit",
        fullName: "MT720 - Transfer of a Documentary Credit",
        purpose: "To request the transfer of a transferable documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "730",
        name: "Acknowledgement",
        fullName: "MT730 - Acknowledgement",
        purpose: "To acknowledge receipt of a documentary credit or amendment",
        signed: false,
        maxLength: 1000,
        mug: false,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "740",
        name: "Authorization to Reimburse",
        fullName: "MT740 - Authorization to Reimburse",
        purpose: "To authorize a reimbursing bank to honour reimbursement claims",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "747",
        name: "Amendment to an Authorization to Reimburse",
        fullName: "MT747 - Amendment to an Authorization to Reimburse",
        purpose: "To amend the terms and conditions of an authorization to reimburse",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "750",
        name: "Advice of Discrepancy",
        fullName: "MT750 - Advice of Discrepancy",
        purpose: "To advise discrepancies in documents presented under a documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "752",
        name: "Authorization to Pay, Accept or Negotiate",
        fullName: "MT752 - Authorization to Pay, Accept or Negotiate",
        purpose: "To authorize payment, acceptance or negotiation under a documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "754",
        name: "Advice of Payment/Acceptance/Negotiation",
        fullName: "MT754 - Advice of Payment/Acceptance/Negotiation",
        purpose: "To advise payment, acceptance or negotiation under a documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "756",
        name: "Advice of Reimbursement or Payment",
        fullName: "MT756 - Advice of Reimbursement or Payment",
        purpose: "To advise reimbursement or payment under a documentary credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "760",
        name: "Guarantee",
        fullName: "MT760 - Guarantee",
        purpose: "To issue, advise or confirm a guarantee or standby letter of credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "767",
        name: "Guarantee/Standby Letter of Credit Amendment",
        fullName: "MT767 - Guarantee/Standby Letter of Credit Amendment",
        purpose: "To amend the terms and conditions of a guarantee or standby letter of credit",
        signed: true,
        maxLength: 2000,
        mug: true,
        category: "7"
      },
      {
        id: nanoid(),
        messageTypeCode: "768",
        name: "Acknowledgement of a Guarantee/Standby Letter of Credit",
        fullName: "MT768 - Acknowledgement of a Guarantee/Standby Letter of Credit",
        purpose: "To acknowledge receipt of a guarantee or standby letter of credit or its amendment",
        signed: false,
        maxLength: 1000,
        mug: false,
        category: "7"
      }
    ];

    await db.insert(mtGenieMessageTypes).values(messageTypesData).onConflictDoNothing();
    console.log(`MT Genie message types seeded: ${messageTypesData.length} types`);

    // Seed MT700 fields
    const mt700 = messageTypesData.find(mt => mt.messageTypeCode === "700");
    if (mt700) {
      await seedMT700Fields(mt700.id);
    }

    // Seed dependencies
    await seedMTGenieDependencies();

    console.log("Complete MT Genie data seeding completed successfully");
    return {
      success: true,
      messageTypes: messageTypesData.length,
      fields: 38, // MT700 fields
      dependencies: 4
    };
    
  } catch (error) {
    console.error("Error in complete MT Genie seeding:", error);
    throw error;
  }
}
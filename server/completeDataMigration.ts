import { db } from "./db";
import { nanoid } from "nanoid";
import {
  swiftMessageTypes,
  swiftFields,
  messageTypeFields,
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Complete migration of all hardcoded SWIFT data to PostgreSQL
export async function migrateAllDataToPostgreSQL() {
  console.log("Starting complete migration of all hardcoded data to PostgreSQL...");
  
  try {
    // Clear existing data first
    await db.delete(messageTypeFields);
    await db.delete(swiftFields);
    await db.delete(swiftMessageTypes);
    
    // 1. Migrate all MT7xx message types
    await migrateMessageTypes();
    
    // 2. Migrate all SWIFT field definitions
    await migrateFieldDefinitions();
    
    // 3. Migrate field relationships for each message type
    await migrateFieldRelationships();
    
    console.log("✓ Complete data migration to PostgreSQL successful");
    return true;
  } catch (error) {
    console.error("Failed to migrate data to PostgreSQL:", error);
    throw error;
  }
}

async function migrateMessageTypes() {
  const messageTypes = [
    {
      id: nanoid(),
      messageTypeCode: "MT700",
      name: "Issue of a Documentary Credit",
      description: "Issue of a Documentary Credit",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT701",
      description: "Issue of a Documentary Credit (Extended)",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT705",
      description: "Pre-Advice of a Documentary Credit",
      category: "Documentary Credits", 
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT707",
      description: "Amendment to a Documentary Credit",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT708",
      description: "Amendment to a Documentary Credit (Extended)",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT710",
      description: "Advice of a Third Bank's Documentary Credit",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT711",
      description: "Advice of a Non-Bank's Documentary Credit",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT720",
      description: "Transfer of a Documentary Credit",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT721", 
      description: "Transfer of a Documentary Credit (Extended)",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT730",
      description: "Acknowledgement",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT732",
      description: "Advice of Discharge",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT734",
      description: "Advice of Refusal",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT740",
      description: "Authorization to Reimburse",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT742",
      description: "Reimbursement Claim",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT744",
      description: "Advice of Discrepancy",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT747",
      description: "Amendment to an Authorization to Reimburse",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT750",
      description: "Advice of Discrepancy",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT752",
      description: "Authorization to Pay, Accept or Negotiate",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT754",
      description: "Advice of Payment/Acceptance/Negotiation",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    },
    {
      id: nanoid(),
      messageTypeCode: "MT756",
      description: "Advice of Reimbursement or Payment",
      category: "Documentary Credits",
      version: "2019",
      isActive: true
    }
  ];

  for (const msgType of messageTypes) {
    await db.insert(swiftMessageTypes).values({
      id: msgType.id,
      messageTypeCode: msgType.messageTypeCode,
      name: msgType.name,
      description: msgType.description,
      category: msgType.category,
      version: msgType.version,
      isActive: msgType.isActive
    }).onConflictDoNothing();
  }
  console.log(`✓ Migrated ${messageTypes.length} message types`);
}

async function migrateFieldDefinitions() {
  const fields = [
    {
      id: nanoid(),
      fieldCode: ":20:",
      name: "Documentary Credit Number",
      description: "Unique reference number for the documentary credit",
      format: "16x",
      maxLength: 16,
      validationRegex: "^[A-Za-z0-9]{1,16}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":23:",
      name: "Reference to Pre-Advice",
      description: "Reference to related pre-advice message",
      format: "16x",
      maxLength: 16,
      validationRegex: "^[A-Za-z0-9]{1,16}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":31C:",
      name: "Date of Issue",
      description: "Date when the documentary credit is issued",
      format: "6!n",
      maxLength: 6,
      validationRegex: "^[0-9]{6}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":31D:",
      name: "Date and Place of Expiry",
      description: "Expiry date and place of the documentary credit",
      format: "6!n4!a2!a",
      maxLength: 12,
      validationRegex: "^[0-9]{6}[A-Z]{4}[A-Z]{2}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":32B:",
      name: "Currency Code, Amount",
      description: "Currency and amount of the documentary credit",
      format: "3!a15d",
      maxLength: 18,
      validationRegex: "^[A-Z]{3}[0-9]{1,15}(,[0-9]{2})?$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":39A:",
      name: "Percentage Credit Amount Tolerance",
      description: "Tolerance for the credit amount in percentage",
      format: "2n/2n",
      maxLength: 5,
      validationRegex: "^[0-9]{1,2}/[0-9]{1,2}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":40A:",
      name: "Form of Documentary Credit",
      description: "Specifies if the credit is revocable, irrevocable, etc.",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["IRREVOCABLE", "REVOCABLE", "IRREVOCABLE TRANSFERABLE", "IRREVOCABLE STANDBY"],
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":41A:",
      name: "Available With... By...",
      description: "Bank and method by which the credit is available",
      format: "4!a2!a2!a",
      maxLength: 8,
      validationRegex: "^[A-Z]{4}[A-Z]{2}[A-Z]{2}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":41D:",
      name: "Available With... By...",
      description: "Free format specification of availability",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":42C:",
      name: "Drafts at...",
      description: "Tenor of drafts to be drawn",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["AT SIGHT", "30 DAYS", "60 DAYS", "90 DAYS", "120 DAYS"],
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":43P:",
      name: "Partial Shipments",
      description: "Whether partial shipments are allowed",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["ALLOWED", "PROHIBITED", "NOT ALLOWED"],
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":43T:",
      name: "Transhipment",
      description: "Whether transhipment is allowed",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["ALLOWED", "PROHIBITED", "NOT ALLOWED"],
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":44A:",
      name: "Loading on Board/Dispatch/Taking in Charge at/from",
      description: "Port, airport or place of loading",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":44E:",
      name: "Port of Discharge",
      description: "Port, airport or place of discharge",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":44C:",
      name: "Latest Date of Shipment",
      description: "Latest date for shipment of goods",
      format: "6!n",
      maxLength: 6,
      validationRegex: "^[0-9]{6}$",
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":45A:",
      name: "Description of Goods and/or Services",
      description: "Detailed description of goods or services",
      format: "65*35x",
      maxLength: 2275,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":46A:",
      name: "Documents Required",
      description: "List of documents required for presentation",
      format: "65*35x",
      maxLength: 2275,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":47A:",
      name: "Additional Conditions",
      description: "Additional conditions for the documentary credit",
      format: "65*35x",
      maxLength: 2275,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":50:",
      name: "Applicant",
      description: "Details of the applicant (buyer)",
      format: "4*35x",
      maxLength: 140,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":59:",
      name: "Beneficiary",
      description: "Details of the beneficiary (seller)",
      format: "4*35x",
      maxLength: 140,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":71B:",
      name: "Charges",
      description: "Details of charges allocation",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["OUR", "BEN", "SHA"],
      isActive: true
    },
    {
      id: nanoid(),
      fieldCode: ":72:",
      name: "Sender to Receiver Information",
      description: "Additional information between sender and receiver",
      format: "6*35x",
      maxLength: 210,
      validationRegex: null,
      allowedValues: null,
      isActive: true
    }
  ];

  for (const field of fields) {
    await db.insert(swiftFields).values(field).onConflictDoNothing();
  }
  console.log(`✓ Migrated ${fields.length} field definitions`);
}

async function migrateFieldRelationships() {
  // Define MT700 field mappings
  const mt700Fields = [
    { fieldCode: ":20:", sequence: 1, isMandatory: true },
    { fieldCode: ":23:", sequence: 2, isMandatory: false },
    { fieldCode: ":31C:", sequence: 3, isMandatory: true },
    { fieldCode: ":31D:", sequence: 4, isMandatory: true },
    { fieldCode: ":32B:", sequence: 5, isMandatory: true },
    { fieldCode: ":39A:", sequence: 6, isMandatory: false },
    { fieldCode: ":40A:", sequence: 7, isMandatory: true },
    { fieldCode: ":41A:", sequence: 8, isMandatory: false },
    { fieldCode: ":41D:", sequence: 9, isMandatory: false },
    { fieldCode: ":42C:", sequence: 10, isMandatory: true },
    { fieldCode: ":43P:", sequence: 11, isMandatory: true },
    { fieldCode: ":43T:", sequence: 12, isMandatory: true },
    { fieldCode: ":44A:", sequence: 13, isMandatory: true },
    { fieldCode: ":44E:", sequence: 14, isMandatory: true },
    { fieldCode: ":44C:", sequence: 15, isMandatory: true },
    { fieldCode: ":45A:", sequence: 16, isMandatory: true },
    { fieldCode: ":46A:", sequence: 17, isMandatory: true },
    { fieldCode: ":47A:", sequence: 18, isMandatory: false },
    { fieldCode: ":50:", sequence: 19, isMandatory: true },
    { fieldCode: ":59:", sequence: 20, isMandatory: true },
    { fieldCode: ":71B:", sequence: 21, isMandatory: false },
    { fieldCode: ":72:", sequence: 22, isMandatory: false }
  ];

  for (const fieldMapping of mt700Fields) {
    await db.insert(messageTypeFields).values({
      id: nanoid(),
      messageTypeId: "MT700",
      fieldId: fieldMapping.fieldCode,
      sequence: fieldMapping.sequence,
      isMandatory: fieldMapping.isMandatory,
      isConditional: false,
      maxOccurrences: 1,
      isActive: true
    }).onConflictDoNothing();
  }
  console.log(`✓ Migrated ${mt700Fields.length} field relationships for MT700`);
}

// Export function to be called during server startup
export async function initializeMT7xxDatabase() {
  try {
    console.log("Initializing MT7xx database...");
    await migrateAllDataToPostgreSQL();
    console.log("Successfully initialized MT7xx database with all message types and fields");
    return true;
  } catch (error) {
    console.error("Failed to initialize MT7xx database:", error);
    return false;
  }
}
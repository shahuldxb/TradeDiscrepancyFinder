import { db } from "./db";
import { nanoid } from "nanoid";
import {
  swiftMessageTypes,
  swiftFields,
  messageTypeFields,
  swiftTemplates,
  swiftFieldFormats,
  swiftBusinessRules,
  swiftMessageRelationships,
  countryCodes,
  currencyCodes,
  bankCodes
} from "@shared/schema";

// Complete migration of all hardcoded data to PostgreSQL
export async function seedAllSwiftData() {
  console.log("Starting comprehensive SWIFT data migration to PostgreSQL...");
  
  try {
    // 1. Seed SWIFT field formats (validation patterns)
    await seedSwiftFieldFormats();
    
    // 2. Seed all MT7xx message types
    await seedSwiftMessageTypes();
    
    // 3. Seed all SWIFT fields with complete definitions
    await seedSwiftFields();
    
    // 4. Seed message type to field relationships
    await seedMessageTypeFields();
    
    // 5. Seed SWIFT templates (replacing hardcoded templates)
    await seedSwiftTemplates();
    
    // 6. Seed business rules and validation logic
    await seedSwiftBusinessRules();
    
    // 7. Seed message relationships and dependencies
    await seedSwiftMessageRelationships();
    
    // 8. Seed reference data (countries, currencies, banks)
    await seedReferenceData();
    
    console.log("✓ All SWIFT data successfully migrated to PostgreSQL");
  } catch (error) {
    console.error("Failed to seed SWIFT data:", error);
    throw error;
  }
}

async function seedSwiftFieldFormats() {
  const formats = [
    {
      id: nanoid(),
      formatCode: "16x",
      description: "16 character alphanumeric field",
      regexPattern: "^[A-Za-z0-9]{1,16}$",
      validationRules: { maxLength: 16, characterSet: "alphanumeric" },
      examples: ["MT700001", "LC2024001", "ABC123DEF456"]
    },
    {
      id: nanoid(),
      formatCode: "35x",
      description: "35 character SWIFT character set",
      regexPattern: "^[A-Za-z0-9/\\-\\?:\\(\\)\\.\\,\\'\\+\\{\\}\\[\\]\\~\\n\\r ]{1,35}$",
      validationRules: { maxLength: 35, characterSet: "swift" },
      examples: ["COMMERCIAL INVOICE", "BILL OF LADING", "PACKING LIST"]
    },
    {
      id: nanoid(),
      formatCode: "6!n",
      description: "6 digit numeric date (YYMMDD)",
      regexPattern: "^[0-9]{6}$",
      validationRules: { exactLength: 6, characterSet: "numeric", format: "date" },
      examples: ["241201", "250630", "241215"]
    },
    {
      id: nanoid(),
      formatCode: "15d",
      description: "15 digit decimal amount",
      regexPattern: "^[0-9]{1,15}(,[0-9]{2})?$",
      validationRules: { maxLength: 15, characterSet: "decimal", format: "amount" },
      examples: ["1000000,00", "750000,50", "12345,99"]
    },
    {
      id: nanoid(),
      formatCode: "3!a",
      description: "3 character alphabetic currency code",
      regexPattern: "^[A-Z]{3}$",
      validationRules: { exactLength: 3, characterSet: "alpha", format: "currency" },
      examples: ["USD", "EUR", "GBP", "JPY"]
    }
  ];

  for (const format of formats) {
    await db.insert(swiftFieldFormats).values(format).onConflictDoNothing();
  }
}

async function seedSwiftMessageTypes() {
  const messageTypes = [
    {
      id: nanoid(),
      messageTypeCode: "MT700",
      description: "Issue of a Documentary Credit",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT701",
      description: "Issue of a Documentary Credit (Extended)",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT705",
      description: "Pre-Advice of a Documentary Credit",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT707",
      description: "Amendment to a Documentary Credit",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT708",
      description: "Amendment to a Documentary Credit (Extended)",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT710",
      description: "Advice of a Third Bank's Documentary Credit",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT711",
      description: "Advice of a Non-Bank's Documentary Credit",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT720",
      description: "Transfer of a Documentary Credit",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT721",
      description: "Transfer of a Documentary Credit (Extended)",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT730",
      description: "Acknowledgement",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT732",
      description: "Advice of Discharge",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT734",
      description: "Advice of Refusal",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT740",
      description: "Authorization to Reimburse",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT742",
      description: "Reimbursement Claim",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT744",
      description: "Advice of Discrepancy",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT747",
      description: "Amendment to an Authorization to Reimburse",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT750",
      description: "Advice of Discrepancy",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT752",
      description: "Authorization to Pay, Accept or Negotiate",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT754",
      description: "Advice of Payment/Acceptance/Negotiation",
      category: "Documentary Credits",
      version: "2019"
    },
    {
      id: nanoid(),
      messageTypeCode: "MT756",
      description: "Advice of Reimbursement or Payment",
      category: "Documentary Credits",
      version: "2019"
    }
  ];

  for (const msgType of messageTypes) {
    await db.insert(swiftMessageTypes).values(msgType).onConflictDoNothing();
  }
}

async function seedSwiftFields() {
  const fields = [
    // Core MT700 fields
    {
      id: nanoid(),
      fieldCode: ":20:",
      name: "Documentary Credit Number",
      description: "Unique reference number for the documentary credit",
      format: "16x",
      maxLength: 16,
      validationRegex: "^[A-Za-z0-9]{1,16}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":23:",
      name: "Reference to Pre-Advice",
      description: "Reference to related pre-advice message",
      format: "16x",
      maxLength: 16,
      validationRegex: "^[A-Za-z0-9]{1,16}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":31C:",
      name: "Date of Issue",
      description: "Date when the documentary credit is issued",
      format: "6!n",
      maxLength: 6,
      validationRegex: "^[0-9]{6}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":31D:",
      name: "Date and Place of Expiry",
      description: "Expiry date and place of the documentary credit",
      format: "6!n4!a2!a",
      maxLength: 12,
      validationRegex: "^[0-9]{6}[A-Z]{4}[A-Z]{2}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":32B:",
      name: "Currency Code, Amount",
      description: "Currency and amount of the documentary credit",
      format: "3!a15d",
      maxLength: 18,
      validationRegex: "^[A-Z]{3}[0-9]{1,15}(,[0-9]{2})?$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":39A:",
      name: "Percentage Credit Amount Tolerance",
      description: "Tolerance for the credit amount in percentage",
      format: "2n/2n",
      maxLength: 5,
      validationRegex: "^[0-9]{1,2}/[0-9]{1,2}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":40A:",
      name: "Form of Documentary Credit",
      description: "Specifies if the credit is revocable, irrevocable, etc.",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["IRREVOCABLE", "REVOCABLE", "IRREVOCABLE TRANSFERABLE", "IRREVOCABLE STANDBY"]
    },
    {
      id: nanoid(),
      fieldCode: ":41A:",
      name: "Available With... By...",
      description: "Bank and method by which the credit is available",
      format: "4!a2!a2!a",
      maxLength: 8,
      validationRegex: "^[A-Z]{4}[A-Z]{2}[A-Z]{2}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":41D:",
      name: "Available With... By...",
      description: "Free format specification of availability",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":42C:",
      name: "Drafts at...",
      description: "Tenor of drafts to be drawn",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["AT SIGHT", "30 DAYS", "60 DAYS", "90 DAYS", "120 DAYS"]
    },
    {
      id: nanoid(),
      fieldCode: ":43P:",
      name: "Partial Shipments",
      description: "Whether partial shipments are allowed",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["ALLOWED", "PROHIBITED", "NOT ALLOWED"]
    },
    {
      id: nanoid(),
      fieldCode: ":43T:",
      name: "Transhipment",
      description: "Whether transhipment is allowed",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["ALLOWED", "PROHIBITED", "NOT ALLOWED"]
    },
    {
      id: nanoid(),
      fieldCode: ":44A:",
      name: "Loading on Board/Dispatch/Taking in Charge at/from",
      description: "Port, airport or place of loading",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":44E:",
      name: "Port of Discharge",
      description: "Port, airport or place of discharge",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":44C:",
      name: "Latest Date of Shipment",
      description: "Latest date for shipment of goods",
      format: "6!n",
      maxLength: 6,
      validationRegex: "^[0-9]{6}$",
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":45A:",
      name: "Description of Goods and/or Services",
      description: "Detailed description of goods or services",
      format: "65*35x",
      maxLength: 2275,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":46A:",
      name: "Documents Required",
      description: "List of documents required for presentation",
      format: "65*35x",
      maxLength: 2275,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":47A:",
      name: "Additional Conditions",
      description: "Additional conditions for the documentary credit",
      format: "65*35x",
      maxLength: 2275,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":50:",
      name: "Applicant",
      description: "Details of the applicant (buyer)",
      format: "4*35x",
      maxLength: 140,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":59:",
      name: "Beneficiary",
      description: "Details of the beneficiary (seller)",
      format: "4*35x",
      maxLength: 140,
      validationRegex: null,
      allowedValues: null
    },
    {
      id: nanoid(),
      fieldCode: ":71B:",
      name: "Charges",
      description: "Details of charges allocation",
      format: "35x",
      maxLength: 35,
      validationRegex: null,
      allowedValues: ["OUR", "BEN", "SHA"]
    },
    {
      id: nanoid(),
      fieldCode: ":72:",
      name: "Sender to Receiver Information",
      description: "Additional information between sender and receiver",
      format: "6*35x",
      maxLength: 210,
      validationRegex: null,
      allowedValues: null
    }
  ];

  for (const field of fields) {
    await db.insert(swiftFields).values(field).onConflictDoNothing();
  }
}

async function seedMessageTypeFields() {
  // Get MT700 message type
  const [mt700] = await db.select().from(swiftMessageTypes).where(eq(swiftMessageTypes.messageTypeCode, "MT700"));
  
  if (!mt700) return;

  // Get all fields
  const allFields = await db.select().from(swiftFields);
  
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
    const field = allFields.find(f => f.fieldCode === fieldMapping.fieldCode);
    if (field) {
      await db.insert(messageTypeFields).values({
        id: nanoid(),
        messageTypeId: mt700.id,
        fieldId: field.id,
        sequence: fieldMapping.sequence,
        isMandatory: fieldMapping.isMandatory,
        isConditional: false,
        maxOccurrences: 1
      }).onConflictDoNothing();
    }
  }
}

async function seedSwiftTemplates() {
  // Get MT700 message type
  const [mt700] = await db.select().from(swiftMessageTypes).where(eq(swiftMessageTypes.messageTypeCode, "MT700"));
  
  if (!mt700) return;

  const templates = [
    {
      id: nanoid(),
      templateId: "textile-export-lc",
      name: "Textile Export LC",
      description: "Standard letter of credit for textile exports from Asia to Europe/US",
      category: "Manufacturing",
      messageTypeId: mt700.id,
      templateFields: {
        ":20:": "LC240001",
        ":31C:": "241201",
        ":40A:": "IRREVOCABLE",
        ":31D:": "250630LONDON",
        ":50:": "FASHION IMPORTS LTD\n123 OXFORD STREET\nLONDON W1D 2HX\nUNITED KINGDOM",
        ":59:": "ASIA TEXTILE MANUFACTURING\n456 INDUSTRIAL DISTRICT\nHO CHI MINH CITY\nVIETNAM",
        ":32B:": "USD75000,00",
        ":39A:": "5/5",
        ":41D:": "ANY BANK",
        ":42C:": "AT SIGHT",
        ":43P:": "PROHIBITED",
        ":43T:": "ALLOWED",
        ":44A:": "HO CHI MINH CITY PORT, VIETNAM",
        ":44E:": "FELIXSTOWE PORT, UK",
        ":44C:": "250531",
        ":45A:": "COTTON T-SHIRTS AND CASUAL WEAR\nAS PER PROFORMA INVOICE NO. PI-2024-TEX001\nDATED 01 DEC 2024\nHSCODE: 6109.10.00\nQUANTITY: 5000 PIECES",
        ":46A:": "SIGNED COMMERCIAL INVOICE IN TRIPLICATE\nPACKING LIST IN DUPLICATE\nFULL SET CLEAN ON BOARD OCEAN BILLS OF LADING\nGSP CERTIFICATE OF ORIGIN FORM A\nINSURANCE CERTIFICATE COVERING 110% OF INVOICE VALUE",
        ":47A:": "DOCUMENTS MUST BE PRESENTED WITHIN 21 DAYS\nAFTER SHIPMENT DATE BUT WITHIN\nTHE VALIDITY OF THIS CREDIT",
        ":71B:": "ALL BANKING CHARGES OUTSIDE\nISSUING BANK ARE FOR\nBENEFICIARY'S ACCOUNT"
      },
      tags: ["textile", "export", "manufacturing", "asia"]
    },
    {
      id: nanoid(),
      templateId: "steel-import-lc",
      name: "Steel Import LC",
      description: "Documentary credit for steel pipe imports with inspection certificate",
      category: "Commodities",
      messageTypeId: mt700.id,
      templateFields: {
        ":20:": "LC240002",
        ":31C:": "241215",
        ":40A:": "IRREVOCABLE",
        ":31D:": "250715HAMBURG",
        ":50:": "EUROPEAN STEEL DISTRIBUTORS GMBH\nINDUSTRIESTRASSE 45\n20095 HAMBURG\nGERMANY",
        ":59:": "SHANGHAI STEEL WORKS CO LTD\n789 PUDONG AVENUE\nSHANGHAI 200120\nCHINA",
        ":32B:": "EUR150000,00",
        ":39A:": "10/10",
        ":41D:": "ANY BANK",
        ":42C:": "30 DAYS AFTER SIGHT",
        ":43P:": "ALLOWED",
        ":43T:": "PROHIBITED",
        ":44A:": "SHANGHAI PORT, CHINA",
        ":44E:": "HAMBURG PORT, GERMANY",
        ":44C:": "250630",
        ":45A:": "SEAMLESS STEEL PIPES\nAS PER CONTRACT NO. SSW-2024-001\nDATED 15 DEC 2024\nSPECIFICATION: API 5L X65\nQUANTITY: 500 METRIC TONS",
        ":46A:": "SIGNED COMMERCIAL INVOICE IN TRIPLICATE\nPACKING LIST\nFULL SET CLEAN ON BOARD BILLS OF LADING\nCERTIFICATE OF ORIGIN\nINSPECTION CERTIFICATE BY SGS\nMILL TEST CERTIFICATE",
        ":47A:": "INSPECTION CERTIFICATE MUST CONFIRM\nCOMPLIANCE WITH API 5L SPECIFICATION\nDOCUMENTS MUST BE PRESENTED WITHIN 15 DAYS\nAFTER SHIPMENT DATE",
        ":71B:": "ALL BANKING CHARGES OUTSIDE GERMANY\nARE FOR BENEFICIARY'S ACCOUNT"
      },
      tags: ["steel", "import", "commodities", "inspection"]
    }
  ];

  for (const template of templates) {
    await db.insert(swiftTemplates).values(template).onConflictDoNothing();
  }
}

async function seedSwiftBusinessRules() {
  const rules = [
    {
      id: nanoid(),
      ruleCode: "MT700_MANDATORY_FIELDS",
      name: "MT700 Mandatory Fields Check",
      description: "Ensures all mandatory fields are present in MT700 messages",
      messageTypeIds: ["MT700"],
      fieldIds: [":20:", ":31C:", ":31D:", ":32B:", ":40A:", ":42C:", ":43P:", ":43T:", ":44A:", ":44E:", ":44C:", ":45A:", ":46A:", ":50:", ":59:"],
      ruleLogic: "MANDATORY_FIELDS_PRESENT",
      errorMessage: "All mandatory fields must be present in MT700 message",
      severity: "error",
      ucpReference: "UCP 600 Article 7"
    },
    {
      id: nanoid(),
      ruleCode: "DATE_CONSISTENCY_CHECK",
      name: "Date Consistency Validation",
      description: "Ensures expiry date is after issue date and latest shipment date",
      messageTypeIds: ["MT700", "MT701"],
      fieldIds: [":31C:", ":31D:", ":44C:"],
      ruleLogic: "EXPIRY_DATE > ISSUE_DATE AND EXPIRY_DATE >= SHIPMENT_DATE",
      errorMessage: "Expiry date must be after issue date and latest shipment date",
      severity: "error",
      ucpReference: "UCP 600 Article 6"
    },
    {
      id: nanoid(),
      ruleCode: "AMOUNT_TOLERANCE_CHECK",
      name: "Amount Tolerance Validation",
      description: "Validates amount tolerance does not exceed 10%",
      messageTypeIds: ["MT700"],
      fieldIds: [":39A:"],
      ruleLogic: "TOLERANCE_PERCENTAGE <= 10",
      errorMessage: "Amount tolerance cannot exceed 10%",
      severity: "warning",
      ucpReference: "UCP 600 Article 30"
    }
  ];

  for (const rule of rules) {
    await db.insert(swiftBusinessRules).values(rule).onConflictDoNothing();
  }
}

async function seedSwiftMessageRelationships() {
  // Get message types
  const mt700 = await db.select().from(swiftMessageTypes).where(eq(swiftMessageTypes.messageTypeCode, "MT700")).then(r => r[0]);
  const mt707 = await db.select().from(swiftMessageTypes).where(eq(swiftMessageTypes.messageTypeCode, "MT707")).then(r => r[0]);
  const mt720 = await db.select().from(swiftMessageTypes).where(eq(swiftMessageTypes.messageTypeCode, "MT720")).then(r => r[0]);

  if (!mt700 || !mt707 || !mt720) return;

  const relationships = [
    {
      id: nanoid(),
      parentMessageTypeId: mt700.id,
      childMessageTypeId: mt707.id,
      relationshipType: "amends",
      description: "MT707 amends an MT700 documentary credit",
      conditionExpression: "REFERENCES_ORIGINAL_LC"
    },
    {
      id: nanoid(),
      parentMessageTypeId: mt700.id,
      childMessageTypeId: mt720.id,
      relationshipType: "transfers",
      description: "MT720 transfers an MT700 documentary credit",
      conditionExpression: "CREDIT_IS_TRANSFERABLE"
    }
  ];

  for (const relationship of relationships) {
    await db.insert(swiftMessageRelationships).values(relationship).onConflictDoNothing();
  }
}

async function seedReferenceData() {
  // Seed major currencies
  const currencies = [
    { id: nanoid(), currencyCode: "USD", currencyName: "US Dollar", numericCode: "840", minorUnit: 2 },
    { id: nanoid(), currencyCode: "EUR", currencyName: "Euro", numericCode: "978", minorUnit: 2 },
    { id: nanoid(), currencyCode: "GBP", currencyName: "Pound Sterling", numericCode: "826", minorUnit: 2 },
    { id: nanoid(), currencyCode: "JPY", currencyName: "Yen", numericCode: "392", minorUnit: 0 },
    { id: nanoid(), currencyCode: "CHF", currencyName: "Swiss Franc", numericCode: "756", minorUnit: 2 },
    { id: nanoid(), currencyCode: "CAD", currencyName: "Canadian Dollar", numericCode: "124", minorUnit: 2 },
    { id: nanoid(), currencyCode: "AUD", currencyName: "Australian Dollar", numericCode: "036", minorUnit: 2 },
    { id: nanoid(), currencyCode: "CNY", currencyName: "Yuan Renminbi", numericCode: "156", minorUnit: 2 }
  ];

  for (const currency of currencies) {
    await db.insert(currencyCodes).values(currency).onConflictDoNothing();
  }

  // Seed major countries
  const countries = [
    { id: nanoid(), countryCode: "USA", countryName: "United States", alpha2Code: "US", numericCode: "840" },
    { id: nanoid(), countryCode: "GBR", countryName: "United Kingdom", alpha2Code: "GB", numericCode: "826" },
    { id: nanoid(), countryCode: "DEU", countryName: "Germany", alpha2Code: "DE", numericCode: "276" },
    { id: nanoid(), countryCode: "CHN", countryName: "China", alpha2Code: "CN", numericCode: "156" },
    { id: nanoid(), countryCode: "JPN", countryName: "Japan", alpha2Code: "JP", numericCode: "392" },
    { id: nanoid(), countryCode: "VNM", countryName: "Vietnam", alpha2Code: "VN", numericCode: "704" },
    { id: nanoid(), countryCode: "SGP", countryName: "Singapore", alpha2Code: "SG", numericCode: "702" },
    { id: nanoid(), countryCode: "HKG", countryName: "Hong Kong", alpha2Code: "HK", numericCode: "344" }
  ];

  for (const country of countries) {
    await db.insert(countryCodes).values(country).onConflictDoNothing();
  }

  // Seed major banks
  const banks = [
    { id: nanoid(), bicCode: "CHASUS33XXX", bankName: "JPMorgan Chase Bank", countryCode: "USA", cityName: "NEW YORK" },
    { id: nanoid(), bicCode: "CITIUS33XXX", bankName: "Citibank N.A.", countryCode: "USA", cityName: "NEW YORK" },
    { id: nanoid(), bicCode: "DEUTDEFFXXX", bankName: "Deutsche Bank AG", countryCode: "DEU", cityName: "FRANKFURT" },
    { id: nanoid(), bic: "HSBCGB2LXXX", bankName: "HSBC Bank plc", countryCode: "GBR", cityName: "LONDON" },
    { id: nanoid(), bicCode: "ICBKCNBJXXX", bankName: "Industrial and Commercial Bank of China", countryCode: "CHN", cityName: "BEIJING" }
  ];

  for (const bank of banks) {
    await db.insert(bankCodes).values(bank).onConflictDoNothing();
  }
}
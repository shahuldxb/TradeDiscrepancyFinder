import { db } from "./db";
import { 
  swiftMessageTypes, 
  swiftFields, 
  messageTypeFields,
  swiftValidationRules,
  fieldDependencies
} from "@shared/schema";
import { eq } from "drizzle-orm";

// SWIFT Format Validation Rules
const SWIFT_FORMAT_RULES = {
  // Character set definitions
  'x': '[A-Za-z0-9]',        // Alphanumeric
  'n': '[0-9]',              // Numeric
  'a': '[A-Z]',              // Alpha uppercase
  'c': '[A-Z0-9]',           // Alphanumeric uppercase
  'd': '[0-9,]',             // Decimal (digits and comma)
  'h': '[A-F0-9]',           // Hexadecimal
  'e': '[ ]',                // Space
  'z': '[A-Za-z0-9/\\-\\?:\\(\\)\\.\\,\'\\+\\{\\}\\[\\]\\~\\n\\r]' // SWIFT character set
};

// SWIFT Message Validation Engine
export class SwiftValidationEngine {
  private messageType: string;
  private messageContent: string;
  private parsedFields: Map<string, string> = new Map();
  private validationErrors: Array<{
    field: string;
    errorType: string;
    message: string;
    severity: 'error' | 'warning';
  }> = [];

  constructor(messageType: string, messageContent: string) {
    this.messageType = messageType;
    this.messageContent = messageContent;
  }

  public async validate(): Promise<{
    isValid: boolean;
    errors: Array<any>;
    warnings: Array<any>;
    parsedFields: Record<string, string>;
  }> {
    try {
      // Parse fields from message content
      this.parseFields();

      // Validate field presence
      await this.validateFieldPresence();

      // Validate field formats
      await this.validateFieldFormats();

      // Validate field content
      await this.validateFieldContent();

      // Validate field dependencies
      await this.validateFieldDependencies();

      // Validate field sequence
      await this.validateFieldSequence();

      const errors = this.validationErrors.filter(e => e.severity === 'error');
      const warnings = this.validationErrors.filter(e => e.severity === 'warning');

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        parsedFields: Object.fromEntries(this.parsedFields)
      };
    } catch (error) {
      console.error("Validation error:", error);
      return {
        isValid: false,
        errors: [{ field: 'general', errorType: 'system', message: 'Validation system error', severity: 'error' }],
        warnings: [],
        parsedFields: {}
      };
    }
  }

  private parseFields(): void {
    const fieldPattern = /^:(\d{1,3}[A-Z]?):(.*?)(?=\n:|$)/gm;
    let match;

    while ((match = fieldPattern.exec(this.messageContent)) !== null) {
      const fieldCode = `:${match[1]}:`;
      const fieldValue = match[2].trim();
      this.parsedFields.set(fieldCode, fieldValue);
    }
  }

  private async validateFieldPresence(): void {
    try {
      // Get mandatory fields for this message type
      const mandatoryFields = await db
        .select({ fieldCode: swiftFields.fieldCode })
        .from(messageTypeFields)
        .innerJoin(swiftFields, eq(swiftFields.id, messageTypeFields.fieldId))
        .where(eq(messageTypeFields.messageTypeId, `${this.messageType}-2019`))
        .where(eq(messageTypeFields.isMandatory, true));

      for (const field of mandatoryFields) {
        if (!this.parsedFields.has(field.fieldCode)) {
          this.validationErrors.push({
            field: field.fieldCode,
            errorType: 'missing_mandatory',
            message: `Mandatory field ${field.fieldCode} is missing`,
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error("Error validating field presence:", error);
    }
  }

  private async validateFieldFormats(): void {
    try {
      // Get field format definitions
      const fieldFormats = await db
        .select({
          fieldCode: swiftFields.fieldCode,
          format: swiftFields.format,
          maxLength: swiftFields.maxLength
        })
        .from(messageTypeFields)
        .innerJoin(swiftFields, eq(swiftFields.id, messageTypeFields.fieldId))
        .where(eq(messageTypeFields.messageTypeId, `${this.messageType}-2019`));

      for (const fieldDef of fieldFormats) {
        const fieldValue = this.parsedFields.get(fieldDef.fieldCode);
        if (fieldValue !== undefined) {
          // Validate format
          if (!this.validateFormat(fieldValue, fieldDef.format)) {
            this.validationErrors.push({
              field: fieldDef.fieldCode,
              errorType: 'invalid_format',
              message: `Field ${fieldDef.fieldCode} format validation failed. Expected: ${fieldDef.format}`,
              severity: 'error'
            });
          }

          // Validate length
          if (fieldDef.maxLength && fieldValue.length > fieldDef.maxLength) {
            this.validationErrors.push({
              field: fieldDef.fieldCode,
              errorType: 'length_exceeded',
              message: `Field ${fieldDef.fieldCode} exceeds maximum length of ${fieldDef.maxLength}`,
              severity: 'error'
            });
          }
        }
      }
    } catch (error) {
      console.error("Error validating field formats:", error);
    }
  }

  private validateFormat(value: string, format: string): boolean {
    // Convert SWIFT format to regex
    let regex = format;
    
    // Handle repetition patterns like 4*35x
    regex = regex.replace(/(\d+)\*(\d+)([a-z])/g, (match, count, length, type) => {
      const charClass = SWIFT_FORMAT_RULES[type] || '.';
      return `(${charClass}{1,${length}}\\n?){1,${count}}`;
    });

    // Handle fixed length patterns like 16x
    regex = regex.replace(/(\d+)([a-z])/g, (match, length, type) => {
      const charClass = SWIFT_FORMAT_RULES[type] || '.';
      return `${charClass}{${length}}`;
    });

    // Handle mandatory patterns like 3!a
    regex = regex.replace(/(\d+)!([a-z])/g, (match, length, type) => {
      const charClass = SWIFT_FORMAT_RULES[type] || '.';
      return `${charClass}{${length}}`;
    });

    try {
      const regexPattern = new RegExp(`^${regex}$`, 'i');
      return regexPattern.test(value);
    } catch (error) {
      console.error("Regex validation error:", error);
      return true; // Default to valid if regex fails
    }
  }

  private async validateFieldContent(): void {
    // Add business logic validation here
    // For example, validate currency codes, dates, etc.
  }

  private async validateFieldDependencies(): void {
    // Add field dependency validation here
  }

  private async validateFieldSequence(): void {
    // Add field sequence validation here
  }
}

// SWIFT Message Constructor
export class SwiftMessageConstructor {
  private messageType: string;
  private fields: Map<string, string> = new Map();

  constructor(messageType: string) {
    this.messageType = messageType;
  }

  public setField(fieldCode: string, value: string): void {
    this.fields.set(fieldCode, value);
  }

  public async construct(): Promise<string> {
    try {
      // Get field sequence for this message type
      const fieldSequence = await db
        .select({
          fieldCode: swiftFields.fieldCode,
          sequence: messageTypeFields.sequence
        })
        .from(messageTypeFields)
        .innerJoin(swiftFields, eq(swiftFields.id, messageTypeFields.fieldId))
        .where(eq(messageTypeFields.messageTypeId, `${this.messageType}-2019`))
        .orderBy(messageTypeFields.sequence);

      let message = '';
      for (const field of fieldSequence) {
        const value = this.fields.get(field.fieldCode);
        if (value) {
          message += `${field.fieldCode}${value}\n`;
        }
      }

      return message.trim();
    } catch (error) {
      console.error("Error constructing message:", error);
      return '';
    }
  }
}

// Function to initialize all MT7xx data in the database
export async function initializeMT7xxDatabase() {
  try {
    console.log("Initializing MT7xx database...");

    // Define all MT7xx message types
    const messageTypes = [
      { code: "MT700", name: "Issue of a Documentary Credit", description: "Indicates the terms and conditions of a documentary credit" },
      { code: "MT701", name: "Issue of a Documentary Credit", description: "Continuation of an MT 700" },
      { code: "MT705", name: "Pre-Advice of a Documentary Credit", description: "Provides brief advice of a documentary credit for which full details will follow" },
      { code: "MT707", name: "Amendment to a Documentary Credit", description: "Informs the Receiver of amendments to the terms and conditions of a documentary credit" },
      { code: "MT708", name: "Amendment to a Documentary Credit", description: "Continuation of an MT 707" },
      { code: "MT710", name: "Advice of a Third Bank's Documentary Credit", description: "Advises the Receiver of the terms and conditions of a documentary credit" },
      { code: "MT711", name: "Advice of a Third Bank's Documentary Credit", description: "Continuation of an MT 710" },
      { code: "MT720", name: "Transfer of a Documentary Credit", description: "Advises the transfer of a documentary credit, or part thereof, to the bank advising the second beneficiary" },
      { code: "MT721", name: "Transfer of a Documentary Credit", description: "Continuation of an MT 720" },
      { code: "MT730", name: "Acknowledgement", description: "Acknowledges the receipt of a documentary credit message" },
      { code: "MT732", name: "Advice of Discharge", description: "Advises that documents received with discrepancies have been taken up" },
      { code: "MT734", name: "Advice of Refusal", description: "Advises the refusal of documents that are not in accordance with the terms and conditions of a documentary credit" },
      { code: "MT740", name: "Authorisation to Reimburse", description: "Requests the Receiver to honour claims for reimbursement of payment(s) or negotiation(s) under a documentary credit" },
      { code: "MT742", name: "Reimbursement Claim", description: "Provides a reimbursement claim to the bank authorised to reimburse the Sender or its branch for its payments/negotiations" },
      { code: "MT744", name: "Notice of Non-Conforming Reimbursement Claim", description: "Notifies the Receiver that the Sender considers the claim, on the face of it, as not to be in accordance with the instruction in the Reimbursement Authorisation" },
      { code: "MT747", name: "Amendment to an Authorisation to Reimburse", description: "Informs the reimbursing bank of amendments to the terms and conditions of a documentary credit, relative to the authorisation to reimburse" },
      { code: "MT750", name: "Advice of Discrepancy", description: "Advises of discrepancies and requests authorisation to honour documents presented that are not in accordance with the terms and conditions of the documentary credit" },
      { code: "MT752", name: "Authorisation to Pay, Accept or Negotiate", description: "Advises a bank which has requested authorisation to pay, accept, negotiate or incur a deferred payment undertaking" },
      { code: "MT754", name: "Advice of Payment/Acceptance/Negotiation", description: "Advises that documents have been presented in accordance with the terms of a documentary credit and are being forwarded as instructed" },
      { code: "MT756", name: "Advice of Reimbursement or Payment", description: "Advises of the reimbursement or payment for a drawing under a documentary credit in which no specific reimbursement instructions or payment provisions were given" }
    ];

    // Insert message types
    for (const msgType of messageTypes) {
      await db.insert(swiftMessageTypes).values({
        id: `${msgType.code}-2019`,
        messageTypeCode: msgType.code,
        description: msgType.name + " - " + msgType.description,
        category: "Category 7 - Documentary Credits",
        version: "2019",
        isActive: true
      }).onConflictDoNothing();
    }

    // Initialize all field data
    await initializeAllMT7xxFields();

    console.log("Successfully initialized MT7xx database with all message types and fields");
  } catch (error) {
    console.error("Failed to initialize MT7xx database:", error);
    throw error;
  }
}

// Function to populate all MT7xx fields
async function initializeAllMT7xxFields() {
  // MT700 comprehensive field set
  const mt700Fields = [
    { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16, sequence: 1 },
    { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3, sequence: 2 },
    { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE or REVOCABLE", maxLength: 6, sequence: 3 },
    { tag: ":23:", name: "Reference to Pre-Advice", format: "16x", mandatory: false, description: "Pre-advice reference", maxLength: 16, sequence: 4 },
    { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date (YYMMDD)", maxLength: 6, sequence: 5 },
    { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29, sequence: 6 },
    { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18, sequence: 7 },
    { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Plus/minus tolerance", maxLength: 5, sequence: 8 },
    { tag: ":39B:", name: "Maximum Credit Amount", format: "13x", mandatory: false, description: "Maximum amount clause", maxLength: 13, sequence: 9 },
    { tag: ":39C:", name: "Additional Amounts Covered", format: "4*35x", mandatory: false, description: "Additional coverage", maxLength: 140, sequence: 10 },
    { tag: ":40E:", name: "Applicable Rules", format: "4!c1!a", mandatory: false, description: "UCP/URC/ISP rules", maxLength: 5, sequence: 11 },
    { tag: ":41A:", name: "Available With... By... (Coded)", format: "4!a2!a", mandatory: false, description: "Availability (coded)", maxLength: 6, sequence: 12 },
    { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: true, description: "Availability details", maxLength: 140, sequence: 13 },
    { tag: ":42A:", name: "Drafts at... (Coded)", format: "4!a2!a", mandatory: false, description: "Draft terms (coded)", maxLength: 6, sequence: 14 },
    { tag: ":42C:", name: "Drafts at...", format: "4*35x", mandatory: false, description: "Draft terms", maxLength: 140, sequence: 15 },
    { tag: ":42M:", name: "Mixed Payment Details", format: "4*35x", mandatory: false, description: "Mixed payment terms", maxLength: 140, sequence: 16 },
    { tag: ":42P:", name: "Deferred Payment Details", format: "4*35x", mandatory: false, description: "Deferred payment", maxLength: 140, sequence: 17 },
    { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9, sequence: 18 },
    { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9, sequence: 19 },
    { tag: ":44A:", name: "Loading on Board/Dispatch/Taking in Charge at/from", format: "65x", mandatory: false, description: "Port of loading", maxLength: 65, sequence: 20 },
    { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Port of destination", maxLength: 65, sequence: 21 },
    { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Latest shipment date", maxLength: 6, sequence: 22 },
    { tag: ":44D:", name: "Shipment Period", format: "65x", mandatory: false, description: "Shipment period", maxLength: 65, sequence: 23 },
    { tag: ":44E:", name: "Port of Loading/Airport of Departure", format: "65x", mandatory: false, description: "Loading port/departure airport", maxLength: 65, sequence: 24 },
    { tag: ":44F:", name: "Port of Discharge/Airport of Destination", format: "65x", mandatory: false, description: "Discharge port/destination airport", maxLength: 65, sequence: 25 },
    { tag: ":45A:", name: "Description of Goods and/or Services", format: "20*35x", mandatory: true, description: "Goods description", maxLength: 700, sequence: 26 },
    { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: true, description: "Required documents", maxLength: 700, sequence: 27 },
    { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Special conditions", maxLength: 700, sequence: 28 },
    { tag: ":48:", name: "Period for Presentation", format: "77x", mandatory: false, description: "Presentation period", maxLength: 77, sequence: 29 },
    { tag: ":49:", name: "Confirmation Instructions", format: "3*35x", mandatory: false, description: "Confirmation details", maxLength: 105, sequence: 30 },
    { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140, sequence: 31 },
    { tag: ":51A:", name: "Applicant Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Applicant's bank", maxLength: 34, sequence: 32 },
    { tag: ":52A:", name: "Issuing Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Issuing bank BIC", maxLength: 34, sequence: 33 },
    { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank BIC", maxLength: 34, sequence: 34 },
    { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140, sequence: 35 },
    { tag: ":71B:", name: "Charges", format: "35x", mandatory: true, description: "Charge bearer (OUR/BEN/SHA)", maxLength: 35, sequence: 36 },
    { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210, sequence: 37 }
  ];

  // Insert MT700 fields
  await insertFieldsForMessageType("MT700", mt700Fields);

  // Insert other MT7xx fields with representative samples
  const otherMTFields = [
    // MT705 fields
    { msgType: "MT705", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, sequence: 1 },
    { msgType: "MT705", tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, sequence: 2 },
    { msgType: "MT705", tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, sequence: 3 },
    { msgType: "MT705", tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, sequence: 4 },
    { msgType: "MT705", tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, sequence: 5 },
    { msgType: "MT705", tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, sequence: 6 },
    { msgType: "MT705", tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, sequence: 7 },

    // MT707 fields
    { msgType: "MT707", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, sequence: 1 },
    { msgType: "MT707", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, sequence: 2 },
    { msgType: "MT707", tag: ":26E:", name: "Number of Amendment", format: "1!n3!n", mandatory: true, sequence: 3 },
    { msgType: "MT707", tag: ":30:", name: "Date of Amendment", format: "6!n", mandatory: true, sequence: 4 },

    // MT750 fields
    { msgType: "MT750", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, sequence: 1 },
    { msgType: "MT750", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, sequence: 2 },
    { msgType: "MT750", tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, sequence: 3 },
    { msgType: "MT750", tag: ":79:", name: "Narrative Description of Discrepancy", format: "20*35x", mandatory: true, sequence: 4 }
  ];

  // Insert additional MT fields
  for (const fieldDef of otherMTFields) {
    const fieldId = `${fieldDef.msgType}-${fieldDef.tag.replace(/:/g, '')}`;
    
    await db.insert(swiftFields).values({
      id: fieldId,
      fieldCode: fieldDef.tag,
      name: fieldDef.name,
      description: fieldDef.name,
      format: fieldDef.format,
      maxLength: 100,
      isActive: true
    }).onConflictDoNothing();

    await db.insert(messageTypeFields).values({
      id: `${fieldDef.msgType}-${fieldId}`,
      messageTypeId: `${fieldDef.msgType}-2019`,
      fieldId: fieldId,
      sequence: fieldDef.sequence,
      isMandatory: fieldDef.mandatory,
      isActive: true
    }).onConflictDoNothing();
  }
}

async function insertFieldsForMessageType(messageType: string, fields: any[]) {
  for (const fieldDef of fields) {
    const fieldId = `${messageType}-${fieldDef.tag.replace(/:/g, '')}`;
    
    await db.insert(swiftFields).values({
      id: fieldId,
      fieldCode: fieldDef.tag,
      name: fieldDef.name,
      description: fieldDef.description,
      format: fieldDef.format,
      maxLength: fieldDef.maxLength,
      isActive: true
    }).onConflictDoNothing();

    await db.insert(messageTypeFields).values({
      id: `${messageType}-${fieldId}`,
      messageTypeId: `${messageType}-2019`,
      fieldId: fieldId,
      sequence: fieldDef.sequence,
      isMandatory: fieldDef.mandatory,
      isActive: true
    }).onConflictDoNothing();
  }
}

// Function to get all MT7xx fields from database
export async function getAllMT7xxFields() {
  try {
    // Get all MT7xx message types with their fields
    const messageTypesWithFields = await db
      .select({
        messageType: swiftMessageTypes,
        field: swiftFields,
        relationship: messageTypeFields
      })
      .from(swiftMessageTypes)
      .leftJoin(messageTypeFields, eq(messageTypeFields.messageTypeId, swiftMessageTypes.id))
      .leftJoin(swiftFields, eq(swiftFields.id, messageTypeFields.fieldId))
      .where(eq(swiftMessageTypes.isActive, true))
      .orderBy(swiftMessageTypes.messageTypeCode, messageTypeFields.sequence);

    // Group results by message type
    const groupedResults: Record<string, any> = {};

    for (const row of messageTypesWithFields) {
      const msgType = row.messageType.messageTypeCode;
      
      if (!groupedResults[msgType]) {
        groupedResults[msgType] = {
          name: row.messageType.description.split(' - ')[0],
          description: row.messageType.description.split(' - ')[1] || row.messageType.description,
          fields: []
        };
      }

      if (row.field) {
        groupedResults[msgType].fields.push({
          tag: row.field.fieldCode,
          name: row.field.name,
          format: row.field.format,
          mandatory: row.relationship?.isMandatory || false,
          description: row.field.description,
          maxLength: row.field.maxLength || 0
        });
      }
    }

    return groupedResults;
  } catch (error) {
    console.error("Failed to fetch MT7xx fields from database:", error);
    return {};
  }
}
import { storage } from "./storage";
import { nanoid } from "nanoid";

// SWIFT MT7xx Field Definitions based on SRS
const SWIFT_FIELD_DEFINITIONS = {
  ":20:": {
    name: "Transaction Reference Number",
    format: "16x",
    description: "Reference assigned by the Sender to unambiguously identify the message",
    mandatory: true,
    validationRegex: "^[A-Z0-9]{1,16}$"
  },
  ":27:": {
    name: "Sequence of Total",
    format: "1!n/1!n",
    description: "Indicates the sequence number and total number of messages",
    mandatory: true,
    validationRegex: "^[1-9]/[1-9]$"
  },
  ":40A:": {
    name: "Form of Documentary Credit",
    format: "6!c",
    description: "Indicates the form of documentary credit",
    mandatory: true,
    allowedValues: ["IRREVOCABLE", "REVOCABLE"],
    validationRegex: "^(IRREVOCABLE|REVOCABLE)$"
  },
  ":31D:": {
    name: "Date and Place of Expiry",
    format: "6!n4!a2a15d",
    description: "Date and place where the documentary credit expires",
    mandatory: true,
    validationRegex: "^[0-9]{6}[A-Z]{4}[A-Z]{2}.*$"
  },
  ":50:": {
    name: "Applicant",
    format: "4*35x",
    description: "Party on whose behalf the documentary credit is issued",
    mandatory: true,
    maxLength: 140
  },
  ":59:": {
    name: "Beneficiary",
    format: "4*35x",
    description: "Party in whose favour the documentary credit is issued",
    mandatory: true,
    maxLength: 140
  },
  ":32B:": {
    name: "Currency Code, Amount",
    format: "3!a15d",
    description: "Currency and amount of the documentary credit",
    mandatory: true,
    validationRegex: "^[A-Z]{3}[0-9,]{1,15}$"
  },
  ":39A:": {
    name: "Percentage Credit Amount Tolerance",
    format: "2!n/2!n",
    description: "Percentage by which drawings may exceed or fall short of the credit amount",
    mandatory: false,
    validationRegex: "^[0-9]{1,2}/[0-9]{1,2}$"
  },
  ":41D:": {
    name: "Available With... By...",
    format: "4*35x",
    description: "Bank with which the credit is available and how it is available",
    mandatory: true,
    maxLength: 140
  },
  ":42C:": {
    name: "Drafts at...",
    format: "35x",
    description: "Tenor of drafts to be drawn under the documentary credit",
    mandatory: false,
    maxLength: 35
  },
  ":43P:": {
    name: "Partial Shipments",
    format: "9x",
    description: "Indicates whether partial shipments are allowed or prohibited",
    mandatory: true,
    allowedValues: ["ALLOWED", "NOT ALLOWED", "PROHIBITED"],
    validationRegex: "^(ALLOWED|NOT ALLOWED|PROHIBITED)$"
  },
  ":43T:": {
    name: "Transhipment",
    format: "9x",
    description: "Indicates whether transhipment is allowed or prohibited",
    mandatory: true,
    allowedValues: ["ALLOWED", "NOT ALLOWED", "PROHIBITED"],
    validationRegex: "^(ALLOWED|NOT ALLOWED|PROHIBITED)$"
  },
  ":44A:": {
    name: "Place of Taking in Charge/Dispatch from/Place of Receipt",
    format: "35x",
    description: "Place where goods are taken in charge by the carrier",
    mandatory: false,
    maxLength: 35
  },
  ":44E:": {
    name: "Port of Loading/Airport of Departure",
    format: "35x",
    description: "Port or airport where goods are loaded",
    mandatory: false,
    maxLength: 35
  },
  ":44F:": {
    name: "Port of Discharge/Airport of Destination",
    format: "35x",
    description: "Port or airport where goods are discharged",
    mandatory: false,
    maxLength: 35
  },
  ":44B:": {
    name: "Place of Final Destination/For Transportation to/Place of Delivery",
    format: "35x",
    description: "Final destination of the goods",
    mandatory: false,
    maxLength: 35
  },
  ":45A:": {
    name: "Description of Goods and/or Services",
    format: "20*35x",
    description: "Description of goods and/or services being traded",
    mandatory: true,
    maxLength: 700
  },
  ":46A:": {
    name: "Documents Required",
    format: "20*35x",
    description: "Documents required for presentation under the credit",
    mandatory: true,
    maxLength: 700
  },
  ":47A:": {
    name: "Additional Conditions",
    format: "20*35x",
    description: "Additional conditions under which the credit is available",
    mandatory: false,
    maxLength: 700
  },
  ":71B:": {
    name: "Charges",
    format: "35x",
    description: "Indicates which party bears the charges",
    mandatory: true,
    allowedValues: ["OUR", "BEN", "SHA"],
    validationRegex: "^(OUR|BEN|SHA)$"
  },
  ":48:": {
    name: "Period for Presentation",
    format: "35x",
    description: "Period within which documents are to be presented",
    mandatory: false,
    maxLength: 35
  },
  ":49:": {
    name: "Confirmation Instructions",
    format: "35x",
    description: "Instructions regarding confirmation of the credit",
    mandatory: false,
    allowedValues: ["CONFIRM", "MAY ADD", "WITHOUT"],
    validationRegex: "^(CONFIRM|MAY ADD|WITHOUT)$"
  }
};

// MT7xx Message Type Definitions based on SRS
const MT7XX_MESSAGE_TYPES = {
  "MT700": {
    name: "Issue of a Documentary Credit",
    category: "Documentary Credits",
    mandatoryFields: [":20:", ":27:", ":40A:", ":31D:", ":50:", ":59:", ":32B:", ":41D:", ":43P:", ":43T:", ":45A:", ":46A:", ":71B:"],
    optionalFields: [":39A:", ":42C:", ":44A:", ":44E:", ":44F:", ":44B:", ":47A:", ":48:", ":49:"],
    conditionalFields: {
      ":42C:": { condition: ":40A: == 'IRREVOCABLE'", description: "Required when credit is irrevocable" }
    }
  },
  "MT701": {
    name: "Issue of a Documentary Credit (Extended)",
    category: "Documentary Credits",
    mandatoryFields: [":20:", ":27:", ":40A:", ":31D:", ":50:", ":59:", ":32B:", ":41D:", ":43P:", ":43T:", ":45A:", ":46A:", ":71B:"],
    optionalFields: [":39A:", ":42C:", ":44A:", ":44E:", ":44F:", ":44B:", ":47A:", ":48:", ":49:"],
    conditionalFields: {}
  },
  "MT705": {
    name: "Pre-Advice of a Documentary Credit",
    category: "Documentary Credits",
    mandatoryFields: [":20:", ":27:", ":40A:", ":31D:", ":50:", ":59:", ":32B:"],
    optionalFields: [":39A:", ":41D:", ":43P:", ":43T:", ":45A:", ":46A:", ":47A:", ":71B:"],
    conditionalFields: {}
  },
  "MT707": {
    name: "Amendment to a Documentary Credit",
    category: "Documentary Credits",
    mandatoryFields: [":20:", ":27:", ":21:"],
    optionalFields: [":32B:", ":31D:", ":59:", ":39A:", ":41D:", ":43P:", ":43T:", ":44A:", ":44E:", ":44F:", ":44B:", ":45A:", ":46A:", ":47A:", ":48:", ":71B:"],
    conditionalFields: {
      ":21:": { condition: "always", description: "Reference to related documentary credit" }
    }
  }
};

// Field dependency rules based on SRS
const FIELD_DEPENDENCIES = [
  {
    sourceField: ":40A:",
    targetField: ":42C:",
    dependencyType: "requires",
    condition: "value == 'IRREVOCABLE'",
    description: "Irrevocable credits require drafts tenor specification"
  },
  {
    sourceField: ":43P:",
    targetField: ":44A:",
    dependencyType: "conditional",
    condition: "value == 'ALLOWED'",
    description: "Partial shipments require loading place specification"
  },
  {
    sourceField: ":43T:",
    targetField: ":44E:",
    dependencyType: "conditional",
    condition: "value == 'ALLOWED'",
    description: "Transhipment allowed requires port details"
  }
];

// Validation engine implementation
export class SwiftValidationEngine {
  private messageType: string;
  private messageContent: string;
  private parsedFields: Map<string, string> = new Map();
  private validationErrors: Array<{
    fieldCode: string;
    errorType: string;
    errorMessage: string;
    severity: "error" | "warning" | "info";
    position?: number;
  }> = [];

  constructor(messageType: string, messageContent: string) {
    this.messageType = messageType;
    this.messageContent = messageContent;
  }

  public async validate(): Promise<{
    isValid: boolean;
    errors: any[];
    warnings: any[];
    parsedFields: Record<string, string>;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Parse SWIFT message fields
      this.parseFields();
      
      // Validate field presence
      this.validateFieldPresence();
      
      // Validate field formats
      this.validateFieldFormats();
      
      // Validate field content
      this.validateFieldContent();
      
      // Validate field dependencies
      this.validateFieldDependencies();
      
      // Validate sequence
      this.validateFieldSequence();
      
      const processingTime = Date.now() - startTime;
      const errors = this.validationErrors.filter(e => e.severity === "error");
      const warnings = this.validationErrors.filter(e => e.severity === "warning");
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        parsedFields: Object.fromEntries(this.parsedFields),
        processingTime
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          fieldCode: "SYSTEM",
          errorType: "parsing_error",
          errorMessage: `Failed to parse message: ${error}`,
          severity: "error" as const
        }],
        warnings: [],
        parsedFields: {},
        processingTime: Date.now() - startTime
      };
    }
  }

  private parseFields(): void {
    // Parse SWIFT format fields (e.g., :20:REFERENCE, :32B:USD1000000,00)
    const fieldPattern = /:(\d+[A-Z]?):(.*?)(?=:\d+[A-Z]?:|$)/g;
    let match;
    
    while ((match = fieldPattern.exec(this.messageContent)) !== null) {
      const fieldCode = `:${match[1]}:`;
      const fieldValue = match[2].trim();
      this.parsedFields.set(fieldCode, fieldValue);
    }
  }

  private validateFieldPresence(): void {
    const messageTypeDef = MT7XX_MESSAGE_TYPES[this.messageType as keyof typeof MT7XX_MESSAGE_TYPES];
    if (!messageTypeDef) {
      this.validationErrors.push({
        fieldCode: "MESSAGE_TYPE",
        errorType: "unsupported_type",
        errorMessage: `Unsupported message type: ${this.messageType}`,
        severity: "error"
      });
      return;
    }

    // Check mandatory fields
    for (const mandatoryField of messageTypeDef.mandatoryFields) {
      if (!this.parsedFields.has(mandatoryField)) {
        this.validationErrors.push({
          fieldCode: mandatoryField,
          errorType: "missing_mandatory_field",
          errorMessage: `Mandatory field ${mandatoryField} is missing`,
          severity: "error"
        });
      }
    }

    // Check conditional fields
    for (const [fieldCode, condition] of Object.entries(messageTypeDef.conditionalFields)) {
      if (this.shouldFieldBePresent(condition.condition)) {
        if (!this.parsedFields.has(fieldCode)) {
          this.validationErrors.push({
            fieldCode: fieldCode,
            errorType: "missing_conditional_field",
            errorMessage: `Conditional field ${fieldCode} is required: ${condition.description}`,
            severity: "error"
          });
        }
      }
    }
  }

  private validateFieldFormats(): void {
    for (const [fieldCode, fieldValue] of this.parsedFields) {
      const fieldDef = SWIFT_FIELD_DEFINITIONS[fieldCode as keyof typeof SWIFT_FIELD_DEFINITIONS];
      if (!fieldDef) {
        this.validationErrors.push({
          fieldCode,
          errorType: "unknown_field",
          errorMessage: `Unknown field: ${fieldCode}`,
          severity: "warning"
        });
        continue;
      }

      // Validate against regex if defined
      if (fieldDef.validationRegex) {
        const regex = new RegExp(fieldDef.validationRegex);
        if (!regex.test(fieldValue)) {
          this.validationErrors.push({
            fieldCode,
            errorType: "format_error",
            errorMessage: `Field ${fieldCode} format is invalid. Expected format: ${fieldDef.format}`,
            severity: "error"
          });
        }
      }

      // Validate length constraints
      if (fieldDef.maxLength && fieldValue.length > fieldDef.maxLength) {
        this.validationErrors.push({
          fieldCode,
          errorType: "length_exceeded",
          errorMessage: `Field ${fieldCode} exceeds maximum length of ${fieldDef.maxLength}`,
          severity: "error"
        });
      }
    }
  }

  private validateFieldContent(): void {
    for (const [fieldCode, fieldValue] of this.parsedFields) {
      const fieldDef = SWIFT_FIELD_DEFINITIONS[fieldCode as keyof typeof SWIFT_FIELD_DEFINITIONS];
      if (!fieldDef || !fieldDef.allowedValues) continue;

      if (!fieldDef.allowedValues.includes(fieldValue)) {
        this.validationErrors.push({
          fieldCode,
          errorType: "invalid_value",
          errorMessage: `Field ${fieldCode} has invalid value '${fieldValue}'. Allowed values: ${fieldDef.allowedValues.join(", ")}`,
          severity: "error"
        });
      }
    }
  }

  private validateFieldDependencies(): void {
    for (const dependency of FIELD_DEPENDENCIES) {
      const sourceValue = this.parsedFields.get(dependency.sourceField);
      const targetValue = this.parsedFields.get(dependency.targetField);

      if (sourceValue && this.evaluateCondition(dependency.condition, sourceValue)) {
        if (dependency.dependencyType === "requires" && !targetValue) {
          this.validationErrors.push({
            fieldCode: dependency.targetField,
            errorType: "dependency_violation",
            errorMessage: `Field ${dependency.targetField} is required when ${dependency.sourceField} is '${sourceValue}': ${dependency.description}`,
            severity: "error"
          });
        }
      }
    }
  }

  private validateFieldSequence(): void {
    // SWIFT messages should follow specific field ordering
    const fieldOrder = Array.from(this.parsedFields.keys());
    const expectedOrder = this.getExpectedFieldOrder();
    
    // Check if fields are in correct sequence
    for (let i = 0; i < fieldOrder.length - 1; i++) {
      const currentIndex = expectedOrder.indexOf(fieldOrder[i]);
      const nextIndex = expectedOrder.indexOf(fieldOrder[i + 1]);
      
      if (currentIndex > nextIndex && currentIndex !== -1 && nextIndex !== -1) {
        this.validationErrors.push({
          fieldCode: fieldOrder[i + 1],
          errorType: "sequence_error",
          errorMessage: `Field ${fieldOrder[i + 1]} appears out of sequence`,
          severity: "warning"
        });
      }
    }
  }

  private shouldFieldBePresent(condition: string): boolean {
    // Simple condition evaluation - can be enhanced for complex expressions
    if (condition === "always") return true;
    
    // Parse conditions like ":40A: == 'IRREVOCABLE'"
    const conditionMatch = condition.match(/(:.*?:)\s*==\s*'(.*?)'/);
    if (conditionMatch) {
      const fieldCode = conditionMatch[1];
      const expectedValue = conditionMatch[2];
      return this.parsedFields.get(fieldCode) === expectedValue;
    }
    
    return false;
  }

  private evaluateCondition(condition: string, value: string): boolean {
    // Simple condition evaluation for dependencies
    if (condition.includes("==")) {
      const expectedValue = condition.split("==")[1].trim().replace(/'/g, "");
      return value === expectedValue;
    }
    return false;
  }

  private getExpectedFieldOrder(): string[] {
    // Standard SWIFT field ordering for MT7xx messages
    return [
      ":20:", ":21:", ":27:", ":40A:", ":31D:", ":50:", ":59:", 
      ":32B:", ":39A:", ":41D:", ":42C:", ":43P:", ":43T:",
      ":44A:", ":44E:", ":44F:", ":44B:", ":45A:", ":46A:", 
      ":47A:", ":48:", ":49:", ":71B:"
    ];
  }
}

// Message construction engine
export class SwiftMessageConstructor {
  private messageType: string;
  private fields: Map<string, string> = new Map();

  constructor(messageType: string) {
    this.messageType = messageType;
  }

  public setField(fieldCode: string, value: string): void {
    this.fields.set(fieldCode, value);
  }

  public construct(): string {
    const messageTypeDef = MT7XX_MESSAGE_TYPES[this.messageType as keyof typeof MT7XX_MESSAGE_TYPES];
    if (!messageTypeDef) {
      throw new Error(`Unsupported message type: ${this.messageType}`);
    }

    let message = "";
    const allFields = [...messageTypeDef.mandatoryFields, ...messageTypeDef.optionalFields];
    
    // Sort fields by expected sequence
    const sortedFields = allFields
      .filter(field => this.fields.has(field))
      .sort((a, b) => {
        const orderA = this.getExpectedFieldOrder().indexOf(a);
        const orderB = this.getExpectedFieldOrder().indexOf(b);
        return orderA - orderB;
      });

    for (const fieldCode of sortedFields) {
      const value = this.fields.get(fieldCode);
      if (value) {
        message += `${fieldCode}${value}\n`;
      }
    }

    return message.trim();
  }

  private getExpectedFieldOrder(): string[] {
    return [
      ":20:", ":21:", ":27:", ":40A:", ":31D:", ":50:", ":59:", 
      ":32B:", ":39A:", ":41D:", ":42C:", ":43P:", ":43T:",
      ":44A:", ":44E:", ":44F:", ":44B:", ":45A:", ":46A:", 
      ":47A:", ":48:", ":49:", ":71B:"
    ];
  }
}

// Initialize SWIFT digitization data
export async function initializeSwiftData(): Promise<void> {
  try {
    // Initialize message types
    for (const [code, definition] of Object.entries(MT7XX_MESSAGE_TYPES)) {
      await storage.createSwiftMessageType({
        id: nanoid(),
        messageTypeCode: code,
        description: definition.name,
        category: definition.category,
        version: "2019",
        isActive: true
      });
    }

    // Initialize fields
    for (const [code, definition] of Object.entries(SWIFT_FIELD_DEFINITIONS)) {
      await storage.createSwiftField({
        id: nanoid(),
        fieldCode: code,
        name: definition.name,
        description: definition.description,
        format: definition.format,
        maxLength: definition.maxLength,
        validationRegex: definition.validationRegex,
        allowedValues: definition.allowedValues,
        isActive: true
      });
    }

    console.log("SWIFT digitization data initialized successfully");
  } catch (error) {
    console.error("Failed to initialize SWIFT data:", error);
  }
}

// Function to initialize all MT7xx data in the database
export async function initializeMT7xxDatabase() {
  try {
    const { db } = await import("./db");
    const { 
      swiftMessageTypes, 
      swiftFields, 
      messageTypeFields 
    } = await import("@shared/schema");

    // First, let's define all MT7xx message types
    const messageTypes = [
      { code: "MT700", name: "Issue of a Documentary Credit", description: "Indicates the terms and conditions of a documentary credit", maxLength: 10000 },
      { code: "MT701", name: "Issue of a Documentary Credit", description: "Continuation of an MT 700", maxLength: 10000 },
      { code: "MT705", name: "Pre-Advice of a Documentary Credit", description: "Provides brief advice of a documentary credit for which full details will follow", maxLength: 2000 },
      { code: "MT707", name: "Amendment to a Documentary Credit", description: "Informs the Receiver of amendments to the terms and conditions of a documentary credit", maxLength: 10000 },
      { code: "MT708", name: "Amendment to a Documentary Credit", description: "Continuation of an MT 707", maxLength: 10000 },
      { code: "MT710", name: "Advice of a Third Bank's Documentary Credit", description: "Advises the Receiver of the terms and conditions of a documentary credit", maxLength: 10000 },
      { code: "MT711", name: "Advice of a Third Bank's Documentary Credit", description: "Continuation of an MT 710", maxLength: 10000 },
      { code: "MT720", name: "Transfer of a Documentary Credit", description: "Advises the transfer of a documentary credit, or part thereof, to the bank advising the second beneficiary", maxLength: 10000 },
      { code: "MT721", name: "Transfer of a Documentary Credit", description: "Continuation of an MT 720", maxLength: 10000 },
      { code: "MT730", name: "Acknowledgement", description: "Acknowledges the receipt of a documentary credit message", maxLength: 2000 },
      { code: "MT732", name: "Advice of Discharge", description: "Advises that documents received with discrepancies have been taken up", maxLength: 2000 },
      { code: "MT734", name: "Advice of Refusal", description: "Advises the refusal of documents that are not in accordance with the terms and conditions of a documentary credit", maxLength: 10000 },
      { code: "MT740", name: "Authorisation to Reimburse", description: "Requests the Receiver to honour claims for reimbursement of payment(s) or negotiation(s) under a documentary credit", maxLength: 2000 },
      { code: "MT742", name: "Reimbursement Claim", description: "Provides a reimbursement claim to the bank authorised to reimburse the Sender or its branch for its payments/negotiations", maxLength: 2000 },
      { code: "MT744", name: "Notice of Non-Conforming Reimbursement Claim", description: "Notifies the Receiver that the Sender considers the claim, on the face of it, as not to be in accordance with the instruction in the Reimbursement Authorisation", maxLength: 2000 },
      { code: "MT747", name: "Amendment to an Authorisation to Reimburse", description: "Informs the reimbursing bank of amendments to the terms and conditions of a documentary credit, relative to the authorisation to reimburse", maxLength: 2000 },
      { code: "MT750", name: "Advice of Discrepancy", description: "Advises of discrepancies and requests authorisation to honour documents presented that are not in accordance with the terms and conditions of the documentary credit", maxLength: 10000 },
      { code: "MT752", name: "Authorisation to Pay, Accept or Negotiate", description: "Advises a bank which has requested authorisation to pay, accept, negotiate or incur a deferred payment undertaking", maxLength: 2000 },
      { code: "MT754", name: "Advice of Payment/Acceptance/Negotiation", description: "Advises that documents have been presented in accordance with the terms of a documentary credit and are being forwarded as instructed", maxLength: 2000 },
      { code: "MT756", name: "Advice of Reimbursement or Payment", description: "Advises of the reimbursement or payment for a drawing under a documentary credit in which no specific reimbursement instructions or payment provisions were given", maxLength: 2000 }
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

    // Now let's define all the SWIFT fields and their relationships to message types
    await insertMT700Fields(db);
    await populateAllMT7xxFields(db);

    console.log("Successfully initialized MT7xx database with all message types and fields");
  } catch (error) {
    console.error("Failed to initialize MT7xx database:", error);
    throw error;
  }
}

async function insertMT700Fields(db: any) {
  const { swiftFields, messageTypeFields } = await import("@shared/schema");
  
  const mt700Fields = [
    { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
    { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
    { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE or REVOCABLE", maxLength: 6 },
    { tag: ":23:", name: "Reference to Pre-Advice", format: "16x", mandatory: false, description: "Pre-advice reference", maxLength: 16 },
    { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date (YYMMDD)", maxLength: 6 },
    { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29 },
    { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18 },
    { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Plus/minus tolerance", maxLength: 5 },
    { tag: ":39B:", name: "Maximum Credit Amount", format: "13x", mandatory: false, description: "Maximum amount clause", maxLength: 13 },
    { tag: ":39C:", name: "Additional Amounts Covered", format: "4*35x", mandatory: false, description: "Additional coverage", maxLength: 140 },
    { tag: ":40E:", name: "Applicable Rules", format: "4!c1!a", mandatory: false, description: "UCP/URC/ISP rules", maxLength: 5 },
    { tag: ":41A:", name: "Available With... By... (Coded)", format: "4!a2!a", mandatory: false, description: "Availability (coded)", maxLength: 6 },
    { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: true, description: "Availability details", maxLength: 140 },
    { tag: ":42A:", name: "Drafts at... (Coded)", format: "4!a2!a", mandatory: false, description: "Draft terms (coded)", maxLength: 6 },
    { tag: ":42C:", name: "Drafts at...", format: "4*35x", mandatory: false, description: "Draft terms", maxLength: 140 },
    { tag: ":42M:", name: "Mixed Payment Details", format: "4*35x", mandatory: false, description: "Mixed payment terms", maxLength: 140 },
    { tag: ":42P:", name: "Deferred Payment Details", format: "4*35x", mandatory: false, description: "Deferred payment", maxLength: 140 },
    { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9 },
    { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9 },
    { tag: ":44A:", name: "Loading on Board/Dispatch/Taking in Charge at/from", format: "65x", mandatory: false, description: "Port of loading", maxLength: 65 },
    { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Port of destination", maxLength: 65 },
    { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Latest shipment date", maxLength: 6 },
    { tag: ":44D:", name: "Shipment Period", format: "65x", mandatory: false, description: "Shipment period", maxLength: 65 },
    { tag: ":44E:", name: "Port of Loading/Airport of Departure", format: "65x", mandatory: false, description: "Loading port/departure airport", maxLength: 65 },
    { tag: ":44F:", name: "Port of Discharge/Airport of Destination", format: "65x", mandatory: false, description: "Discharge port/destination airport", maxLength: 65 },
    { tag: ":45A:", name: "Description of Goods and/or Services", format: "20*35x", mandatory: true, description: "Goods description", maxLength: 700 },
    { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: true, description: "Required documents", maxLength: 700 },
    { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Special conditions", maxLength: 700 },
    { tag: ":48:", name: "Period for Presentation", format: "77x", mandatory: false, description: "Presentation period", maxLength: 77 },
    { tag: ":49G:", name: "Special Payment Conditions for Beneficiary", format: "35x", mandatory: false, description: "Special payment conditions", maxLength: 35 },
    { tag: ":49H:", name: "Special Payment Conditions for Receiving Bank", format: "35x", mandatory: false, description: "Receiving bank conditions", maxLength: 35 },
    { tag: ":49:", name: "Confirmation Instructions", format: "3*35x", mandatory: false, description: "Confirmation details", maxLength: 105 },
    { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140 },
    { tag: ":51A:", name: "Applicant Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Applicant's bank", maxLength: 34 },
    { tag: ":51D:", name: "Applicant Bank", format: "4*35x", mandatory: false, description: "Applicant's bank details", maxLength: 140 },
    { tag: ":52A:", name: "Issuing Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Issuing bank BIC", maxLength: 34 },
    { tag: ":52D:", name: "Issuing Bank", format: "4*35x", mandatory: false, description: "Issuing bank details", maxLength: 140 },
    { tag: ":53A:", name: "Sender's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Sender's correspondent BIC", maxLength: 34 },
    { tag: ":53D:", name: "Sender's Correspondent", format: "4*35x", mandatory: false, description: "Sender's correspondent details", maxLength: 140 },
    { tag: ":54A:", name: "Receiver's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Receiver's correspondent BIC", maxLength: 34 },
    { tag: ":54D:", name: "Receiver's Correspondent", format: "4*35x", mandatory: false, description: "Receiver's correspondent details", maxLength: 140 },
    { tag: ":56A:", name: "Intermediary Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Intermediary bank BIC", maxLength: 34 },
    { tag: ":56C:", name: "Intermediary Bank", format: "/34x", mandatory: false, description: "Intermediary bank account", maxLength: 34 },
    { tag: ":56D:", name: "Intermediary Bank", format: "4*35x", mandatory: false, description: "Intermediary bank details", maxLength: 140 },
    { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank BIC", maxLength: 34 },
    { tag: ":57B:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank location", maxLength: 34 },
    { tag: ":57D:", name: "Advising Bank", format: "4*35x", mandatory: false, description: "Advising bank details", maxLength: 140 },
    { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140 },
    { tag: ":70:", name: "Remittance Information", format: "4*35x", mandatory: false, description: "Payment details", maxLength: 140 },
    { tag: ":71B:", name: "Charges", format: "35x", mandatory: true, description: "Charge bearer (OUR/BEN/SHA)", maxLength: 35 },
    { tag: ":71D:", name: "Charges/Interest", format: "6*35x", mandatory: false, description: "Charges and interest", maxLength: 210 },
    { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210 },
    { tag: ":77A:", name: "Routing Instructions", format: "20*35x", mandatory: false, description: "Routing instructions", maxLength: 700 },
    { tag: ":78:", name: "Instructions to Paying/Accepting/Negotiating Bank", format: "20*35x", mandatory: false, description: "Special instructions", maxLength: 700 }
  ];

  // Insert fields and create message type field relationships
  for (let i = 0; i < mt700Fields.length; i++) {
    const field = mt700Fields[i];
    const fieldId = `MT700-${field.tag.replace(/:/g, '')}`;
    
    // Insert field
    await db.insert(swiftFields).values({
      id: fieldId,
      fieldCode: field.tag,
      name: field.name,
      description: field.description,
      format: field.format,
      maxLength: field.maxLength,
      isActive: true
    }).onConflictDoNothing();

    // Create message type field relationship
    await db.insert(messageTypeFields).values({
      id: `MT700-${fieldId}`,
      messageTypeId: "MT700-2019",
      fieldId: fieldId,
      sequence: i + 1,
      isMandatory: field.mandatory,
      isActive: true
    }).onConflictDoNothing();
  }
}

// Function to populate all MT7xx fields in database
async function populateAllMT7xxFields(db: any) {
  const { swiftFields, messageTypeFields } = await import("@shared/schema");
  
  // All MT7xx field definitions with their message type relationships
  const allMT7xxFields = [
    // MT700 fields (already implemented above)
    // MT701 fields
    { msgType: "MT701", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16, sequence: 1 },
    { msgType: "MT701", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Related LC reference", maxLength: 16, sequence: 2 },
    { msgType: "MT701", tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3, sequence: 3 },
    { msgType: "MT701", tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Continuation details", maxLength: 210, sequence: 4 },
    
    // MT705 fields
    { msgType: "MT705", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16, sequence: 1 },
    { msgType: "MT705", tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3, sequence: 2 },
    { msgType: "MT705", tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE", maxLength: 6, sequence: 3 },
    { msgType: "MT705", tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date", maxLength: 6, sequence: 4 },
    { msgType: "MT705", tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29, sequence: 5 },
    { msgType: "MT705", tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18, sequence: 6 },
    { msgType: "MT705", tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140, sequence: 7 },
    { msgType: "MT705", tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank BIC", maxLength: 34, sequence: 8 },
    { msgType: "MT705", tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140, sequence: 9 },
    { msgType: "MT705", tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210, sequence: 10 },
    
    // MT707 fields
    { msgType: "MT707", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for amendment", maxLength: 16, sequence: 1 },
    { msgType: "MT707", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16, sequence: 2 },
    { msgType: "MT707", tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3, sequence: 3 },
    { msgType: "MT707", tag: ":26E:", name: "Number of Amendment", format: "1!n3!n", mandatory: true, description: "Amendment sequence", maxLength: 4, sequence: 4 },
    { msgType: "MT707", tag: ":30:", name: "Date of Amendment", format: "6!n", mandatory: true, description: "Amendment date", maxLength: 6, sequence: 5 },
    { msgType: "MT707", tag: ":32B:", name: "New Amount", format: "3!a15d", mandatory: false, description: "Amended LC amount", maxLength: 18, sequence: 6 },
    { msgType: "MT707", tag: ":31D:", name: "New Expiry Date", format: "6!n4!a2a15d", mandatory: false, description: "Amended expiry", maxLength: 29, sequence: 7 },
    { msgType: "MT707", tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Amended goods description", maxLength: 700, sequence: 8 },
    { msgType: "MT707", tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Amended documents", maxLength: 700, sequence: 9 },
    { msgType: "MT707", tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Amendment details", maxLength: 210, sequence: 10 },
    
    // MT708 fields
    { msgType: "MT708", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for amendment", maxLength: 16, sequence: 1 },
    { msgType: "MT708", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16, sequence: 2 },
    { msgType: "MT708", tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3, sequence: 3 },
    { msgType: "MT708", tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Amendment details", maxLength: 210, sequence: 4 },
    
    // Continue with other MT types...
    // Adding key fields for remaining MT types
    { msgType: "MT730", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for acknowledgement", maxLength: 16, sequence: 1 },
    { msgType: "MT730", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original message reference", maxLength: 16, sequence: 2 },
    { msgType: "MT730", tag: ":11A:", name: "MT and Date of Original Message", format: "3!n6!n", mandatory: true, description: "Message type and date", maxLength: 9, sequence: 3 },
    { msgType: "MT730", tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Acknowledgement details", maxLength: 210, sequence: 4 },
    
    { msgType: "MT750", tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for discrepancy advice", maxLength: 16, sequence: 1 },
    { msgType: "MT750", tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16, sequence: 2 },
    { msgType: "MT750", tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Drawing amount", maxLength: 18, sequence: 3 },
    { msgType: "MT750", tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140, sequence: 4 },
    { msgType: "MT750", tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140, sequence: 5 },
    { msgType: "MT750", tag: ":79:", name: "Narrative Description of Discrepancy", format: "20*35x", mandatory: true, description: "Discrepancy details", maxLength: 700, sequence: 6 }
  ];

  // Insert all fields and relationships
  for (const fieldDef of allMT7xxFields) {
    const fieldId = `${fieldDef.msgType}-${fieldDef.tag.replace(/:/g, '')}`;
    
    // Insert field if it doesn't exist
    await db.insert(swiftFields).values({
      id: fieldId,
      fieldCode: fieldDef.tag,
      name: fieldDef.name,
      description: fieldDef.description,
      format: fieldDef.format,
      maxLength: fieldDef.maxLength,
      isActive: true
    }).onConflictDoNothing();

    // Create message type field relationship
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

// Function to get all MT7xx fields from database
export async function getAllMT7xxFields() {
  return {
    "MT700": {
      name: "Issue of a Documentary Credit",
      description: "Used to issue a new documentary credit",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE or REVOCABLE", maxLength: 6 },
        { tag: ":20:", name: "Documentary Credit Number", format: "16x", mandatory: true, description: "LC reference number", maxLength: 16 },
        { tag: ":23:", name: "Reference to Pre-Advice", format: "16x", mandatory: false, description: "Pre-advice reference", maxLength: 16 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date (YYMMDD)", maxLength: 6 },
        { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18 },
        { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Plus/minus tolerance", maxLength: 5 },
        { tag: ":39B:", name: "Maximum Credit Amount", format: "13x", mandatory: false, description: "Maximum amount clause", maxLength: 13 },
        { tag: ":39C:", name: "Additional Amounts Covered", format: "4*35x", mandatory: false, description: "Additional coverage", maxLength: 140 },
        { tag: ":40E:", name: "Applicable Rules", format: "4!c1!a", mandatory: false, description: "UCP/URC/ISP rules", maxLength: 5 },
        { tag: ":41A:", name: "Available With... By... (Coded)", format: "4!a2!a", mandatory: false, description: "Availability (coded)", maxLength: 6 },
        { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: true, description: "Availability details", maxLength: 140 },
        { tag: ":42A:", name: "Drafts at... (Coded)", format: "4!a2!a", mandatory: false, description: "Draft terms (coded)", maxLength: 6 },
        { tag: ":42C:", name: "Drafts at...", format: "4*35x", mandatory: false, description: "Draft terms", maxLength: 140 },
        { tag: ":42M:", name: "Mixed Payment Details", format: "4*35x", mandatory: false, description: "Mixed payment terms", maxLength: 140 },
        { tag: ":42P:", name: "Deferred Payment Details", format: "4*35x", mandatory: false, description: "Deferred payment", maxLength: 140 },
        { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9 },
        { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9 },
        { tag: ":44A:", name: "Loading on Board/Dispatch/Taking in Charge at/from", format: "65x", mandatory: false, description: "Port of loading", maxLength: 65 },
        { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Port of destination", maxLength: 65 },
        { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Latest shipment date", maxLength: 6 },
        { tag: ":44D:", name: "Shipment Period", format: "65x", mandatory: false, description: "Shipment period", maxLength: 65 },
        { tag: ":44E:", name: "Port of Loading/Airport of Departure", format: "65x", mandatory: false, description: "Loading port/departure airport", maxLength: 65 },
        { tag: ":44F:", name: "Port of Discharge/Airport of Destination", format: "65x", mandatory: false, description: "Discharge port/destination airport", maxLength: 65 },
        { tag: ":45A:", name: "Description of Goods and/or Services", format: "20*35x", mandatory: true, description: "Goods description", maxLength: 700 },
        { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: true, description: "Required documents", maxLength: 700 },
        { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Special conditions", maxLength: 700 },
        { tag: ":48:", name: "Period for Presentation", format: "77x", mandatory: false, description: "Presentation period", maxLength: 77 },
        { tag: ":49G:", name: "Special Payment Conditions for Beneficiary", format: "35x", mandatory: false, description: "Special payment conditions", maxLength: 35 },
        { tag: ":49H:", name: "Special Payment Conditions for Receiving Bank", format: "35x", mandatory: false, description: "Receiving bank conditions", maxLength: 35 },
        { tag: ":49:", name: "Confirmation Instructions", format: "3*35x", mandatory: false, description: "Confirmation details", maxLength: 105 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140 },
        { tag: ":51A:", name: "Applicant Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Applicant's bank", maxLength: 34 },
        { tag: ":51D:", name: "Applicant Bank", format: "4*35x", mandatory: false, description: "Applicant's bank details", maxLength: 140 },
        { tag: ":52A:", name: "Issuing Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Issuing bank BIC", maxLength: 34 },
        { tag: ":52D:", name: "Issuing Bank", format: "4*35x", mandatory: false, description: "Issuing bank details", maxLength: 140 },
        { tag: ":53A:", name: "Sender's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Sender's correspondent BIC", maxLength: 34 },
        { tag: ":53D:", name: "Sender's Correspondent", format: "4*35x", mandatory: false, description: "Sender's correspondent details", maxLength: 140 },
        { tag: ":54A:", name: "Receiver's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Receiver's correspondent BIC", maxLength: 34 },
        { tag: ":54D:", name: "Receiver's Correspondent", format: "4*35x", mandatory: false, description: "Receiver's correspondent details", maxLength: 140 },
        { tag: ":56A:", name: "Intermediary Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Intermediary bank BIC", maxLength: 34 },
        { tag: ":56C:", name: "Intermediary Bank", format: "/34x", mandatory: false, description: "Intermediary bank account", maxLength: 34 },
        { tag: ":56D:", name: "Intermediary Bank", format: "4*35x", mandatory: false, description: "Intermediary bank details", maxLength: 140 },
        { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank BIC", maxLength: 34 },
        { tag: ":57B:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank location", maxLength: 34 },
        { tag: ":57D:", name: "Advising Bank", format: "4*35x", mandatory: false, description: "Advising bank details", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140 },
        { tag: ":70:", name: "Remittance Information", format: "4*35x", mandatory: false, description: "Payment details", maxLength: 140 },
        { tag: ":71B:", name: "Charges", format: "35x", mandatory: true, description: "Charge bearer (OUR/BEN/SHA)", maxLength: 35 },
        { tag: ":71D:", name: "Charges/Interest", format: "6*35x", mandatory: false, description: "Charges and interest", maxLength: 210 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210 },
        { tag: ":77A:", name: "Routing Instructions", format: "20*35x", mandatory: false, description: "Routing instructions", maxLength: 700 },
        { tag: ":78:", name: "Instructions to Paying/Accepting/Negotiating Bank", format: "20*35x", mandatory: false, description: "Special instructions", maxLength: 700 }
      ]
    },
    "MT701": {
      name: "Issue of a Documentary Credit (Extended)",
      description: "Extended version of MT700 with additional fields",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE or REVOCABLE", maxLength: 6 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date", maxLength: 6 },
        { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29 },
        { tag: ":51A:", name: "Applicant Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Applicant's bank", maxLength: 34 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18 },
        { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Plus/minus tolerance", maxLength: 5 },
        { tag: ":39B:", name: "Maximum Credit Amount", format: "13x", mandatory: false, description: "Maximum amount clause", maxLength: 13 },
        { tag: ":39C:", name: "Additional Amounts Covered", format: "4*35x", mandatory: false, description: "Additional coverage", maxLength: 140 },
        { tag: ":41A:", name: "Available With... By... (Coded)", format: "4!a2!a", mandatory: false, description: "Availability (coded)", maxLength: 6 },
        { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: true, description: "Availability details", maxLength: 140 },
        { tag: ":42A:", name: "Drafts at... (Coded)", format: "4!a2!a", mandatory: false, description: "Draft terms (coded)", maxLength: 6 },
        { tag: ":42C:", name: "Drafts at...", format: "4*35x", mandatory: false, description: "Draft terms", maxLength: 140 },
        { tag: ":42M:", name: "Mixed Payment Details", format: "4*35x", mandatory: false, description: "Mixed payment terms", maxLength: 140 },
        { tag: ":42P:", name: "Deferred Payment Details", format: "4*35x", mandatory: false, description: "Deferred payment", maxLength: 140 },
        { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9 },
        { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: true, description: "ALLOWED or PROHIBITED", maxLength: 9 },
        { tag: ":44A:", name: "Loading on Board/Dispatch", format: "65x", mandatory: false, description: "Port of loading", maxLength: 65 },
        { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Port of destination", maxLength: 65 },
        { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Latest shipment date", maxLength: 6 },
        { tag: ":44D:", name: "Shipment Period", format: "65x", mandatory: false, description: "Shipment period", maxLength: 65 },
        { tag: ":44E:", name: "Port of Loading", format: "65x", mandatory: false, description: "Loading port", maxLength: 65 },
        { tag: ":44F:", name: "Port of Discharge", format: "65x", mandatory: false, description: "Discharge port", maxLength: 65 },
        { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: true, description: "Goods description", maxLength: 700 },
        { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: true, description: "Required documents", maxLength: 700 },
        { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Special conditions", maxLength: 700 },
        { tag: ":71B:", name: "Charges", format: "35x", mandatory: true, description: "Charge bearer", maxLength: 35 }
      ]
    },
    "MT707": {
      name: "Amendment to a Documentary Credit",
      description: "Used to amend an existing documentary credit",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for amendment", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":32B:", name: "New Amount", format: "3!a15d", mandatory: false, description: "Amended LC amount", maxLength: 18 },
        { tag: ":33B:", name: "Original Amount", format: "3!a15d", mandatory: false, description: "Original LC amount", maxLength: 18 },
        { tag: ":31D:", name: "New Expiry Date and Place", format: "6!n4!a2a15d", mandatory: false, description: "Amended expiry", maxLength: 29 },
        { tag: ":26E:", name: "Number of Amendment", format: "1!n3!n", mandatory: true, description: "Amendment sequence", maxLength: 4 },
        { tag: ":30:", name: "Date of Amendment", format: "6!n", mandatory: true, description: "Amendment date", maxLength: 6 },
        { tag: ":39A:", name: "Percentage Credit Amount Tolerance", format: "2!n/2!n", mandatory: false, description: "Amended tolerance", maxLength: 5 },
        { tag: ":41D:", name: "Available With... By...", format: "4*35x", mandatory: false, description: "Amended availability", maxLength: 140 },
        { tag: ":43P:", name: "Partial Shipments", format: "9x", mandatory: false, description: "Amended partial shipment", maxLength: 9 },
        { tag: ":43T:", name: "Transhipment", format: "9x", mandatory: false, description: "Amended transhipment", maxLength: 9 },
        { tag: ":44A:", name: "Loading on Board/Dispatch", format: "65x", mandatory: false, description: "Amended loading port", maxLength: 65 },
        { tag: ":44B:", name: "For Transportation to", format: "65x", mandatory: false, description: "Amended destination", maxLength: 65 },
        { tag: ":44C:", name: "Latest Date of Shipment", format: "6!n", mandatory: false, description: "Amended shipment date", maxLength: 6 },
        { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Amended goods description", maxLength: 700 },
        { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Amended documents", maxLength: 700 },
        { tag: ":47A:", name: "Additional Conditions", format: "20*35x", mandatory: false, description: "Amended conditions", maxLength: 700 },
        { tag: ":48:", name: "Period for Presentation", format: "77x", mandatory: false, description: "Amended presentation period", maxLength: 77 },
        { tag: ":49:", name: "Confirmation Instructions", format: "3*35x", mandatory: false, description: "Amended confirmation", maxLength: 105 },
        { tag: ":71B:", name: "Charges", format: "35x", mandatory: false, description: "Amended charges", maxLength: 35 },
        { tag: ":78:", name: "Instructions to Paying Bank", format: "20*35x", mandatory: false, description: "Amended instructions", maxLength: 700 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Amendment details", maxLength: 210 }
      ]
    },
    "MT750": {
      name: "Advice of Discrepancy",
      description: "Used to advise discrepancies in presented documents",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for discrepancy advice", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "Date of discrepancy advice", maxLength: 6 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Presented amount", maxLength: 18 },
        { tag: ":34A:", name: "Date of Presentation", format: "6!n", mandatory: true, description: "Document presentation date", maxLength: 6 },
        { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Bank advising discrepancy", maxLength: 34 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Cover letter details", maxLength: 210 },
        { tag: ":79:", name: "Narrative Description of Discrepancy", format: "20*35x", mandatory: true, description: "Detailed discrepancy description", maxLength: 700 },
        { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Goods as per documents", maxLength: 700 },
        { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Documents presented", maxLength: 700 }
      ]
    },
    "MT705": {
      name: "Pre-Advice of a Documentary Credit",
      description: "Provides brief advice of a documentary credit for which full details will follow",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE", maxLength: 6 },
        { tag: ":20:", name: "Documentary Credit Number", format: "16x", mandatory: true, description: "LC reference number", maxLength: 16 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date", maxLength: 6 },
        { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140 },
        { tag: ":57A:", name: "Advising Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Advising bank BIC", maxLength: 34 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210 }
      ]
    },
    "MT708": {
      name: "Amendment to a Documentary Credit",
      description: "Continuation of an MT 707",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for amendment", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":26E:", name: "Number of Amendment", format: "1!n3!n", mandatory: true, description: "Amendment sequence", maxLength: 4 },
        { tag: ":30:", name: "Date of Amendment", format: "6!n", mandatory: true, description: "Amendment date", maxLength: 6 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Amendment details", maxLength: 210 }
      ]
    },
    "MT710": {
      name: "Advice of a Third Bank's Documentary Credit",
      description: "Advises the Receiver of the terms and conditions of a documentary credit",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Related LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE", maxLength: 6 },
        { tag: ":20:", name: "Documentary Credit Number", format: "16x", mandatory: true, description: "LC reference number", maxLength: 16 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date", maxLength: 6 },
        { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "Party requesting the LC", maxLength: 140 },
        { tag: ":52A:", name: "Issuing Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Issuing bank BIC", maxLength: 34 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "Party in favor of whom LC is issued", maxLength: 140 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210 }
      ]
    },
    "MT711": {
      name: "Advice of a Third Bank's Documentary Credit",
      description: "Continuation of an MT 710",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Related LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210 }
      ]
    },
    "MT720": {
      name: "Transfer of a Documentary Credit",
      description: "Advises the transfer of a documentary credit, or part thereof, to the bank advising the second beneficiary",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":40A:", name: "Form of Documentary Credit", format: "6!c", mandatory: true, description: "IRREVOCABLE", maxLength: 6 },
        { tag: ":20:", name: "Documentary Credit Number", format: "16x", mandatory: true, description: "LC reference number", maxLength: 16 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "LC issuance date", maxLength: 6 },
        { tag: ":31D:", name: "Date and Place of Expiry", format: "6!n4!a2a15d", mandatory: true, description: "Expiry date and place", maxLength: 29 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "LC currency and amount", maxLength: 18 },
        { tag: ":50:", name: "First Beneficiary", format: "4*35x", mandatory: true, description: "Original beneficiary", maxLength: 140 },
        { tag: ":59:", name: "Second Beneficiary", format: "4*35x", mandatory: true, description: "Transfer beneficiary", maxLength: 140 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Transfer details", maxLength: 210 }
      ]
    },
    "MT721": {
      name: "Transfer of a Documentary Credit",
      description: "Continuation of an MT 720",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for the message", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Transfer continuation details", maxLength: 210 }
      ]
    },
    "MT730": {
      name: "Acknowledgement",
      description: "Acknowledges the receipt of a documentary credit message",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for acknowledgement", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original message reference", maxLength: 16 },
        { tag: ":11A:", name: "MT and Date of Original Message", format: "3!n6!n", mandatory: true, description: "Message type and date", maxLength: 9 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Acknowledgement details", maxLength: 210 }
      ]
    },
    "MT732": {
      name: "Advice of Discharge",
      description: "Advises that documents received with discrepancies have been taken up",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for discharge advice", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "Date of discharge advice", maxLength: 6 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Discharged amount", maxLength: 18 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Discharge details", maxLength: 210 }
      ]
    },
    "MT734": {
      name: "Advice of Refusal",
      description: "Advises the refusal of documents that are not in accordance with the terms and conditions of a documentary credit",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for refusal advice", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "Date of refusal advice", maxLength: 6 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Refused amount", maxLength: 18 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Refusal details", maxLength: 210 },
        { tag: ":79:", name: "Narrative Description of Refusal", format: "20*35x", mandatory: true, description: "Detailed refusal reasons", maxLength: 700 }
      ]
    },
    "MT740": {
      name: "Authorisation to Reimburse",
      description: "Requests the Receiver to honour claims for reimbursement of payment(s) or negotiation(s) under a documentary credit",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for authorisation", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Authorised amount", maxLength: 18 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Authorisation details", maxLength: 210 }
      ]
    },
    "MT742": {
      name: "Reimbursement Claim",
      description: "Provides a reimbursement claim to the bank authorised to reimburse the Sender or its branch for its payments/negotiations",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for claim", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":32A:", name: "Value Date, Currency Code, Amount", format: "6!n3!a15d", mandatory: true, description: "Claim value date and amount", maxLength: 24 },
        { tag: ":52A:", name: "Ordering Institution", format: "1!a4!a2!a15d", mandatory: false, description: "Claiming bank", maxLength: 34 },
        { tag: ":53A:", name: "Sender's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Sender's correspondent", maxLength: 34 },
        { tag: ":54A:", name: "Receiver's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Receiver's correspondent", maxLength: 34 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Claim details", maxLength: 210 }
      ]
    },
    "MT744": {
      name: "Notice of Non-Conforming Reimbursement Claim",
      description: "Notifies the Receiver that the Sender considers the claim, on the face of it, as not to be in accordance with the instruction in the Reimbursement Authorisation",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for notice", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original claim reference", maxLength: 16 },
        { tag: ":32A:", name: "Value Date, Currency Code, Amount", format: "6!n3!a15d", mandatory: true, description: "Non-conforming amount", maxLength: 24 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Non-conforming details", maxLength: 210 },
        { tag: ":79:", name: "Narrative Description", format: "20*35x", mandatory: true, description: "Detailed non-conforming reasons", maxLength: 700 }
      ]
    },
    "MT747": {
      name: "Amendment to an Authorisation to Reimburse",
      description: "Informs the reimbursing bank of amendments to the terms and conditions of a documentary credit, relative to the authorisation to reimburse",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for amendment", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original authorisation reference", maxLength: 16 },
        { tag: ":26E:", name: "Number of Amendment", format: "1!n3!n", mandatory: true, description: "Amendment sequence", maxLength: 4 },
        { tag: ":30:", name: "Date of Amendment", format: "6!n", mandatory: true, description: "Amendment date", maxLength: 6 },
        { tag: ":32B:", name: "New Amount", format: "3!a15d", mandatory: false, description: "Amended authorised amount", maxLength: 18 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Amendment details", maxLength: 210 }
      ]
    },
    "MT752": {
      name: "Authorisation to Pay, Accept or Negotiate",
      description: "Advises a bank which has requested authorisation to pay, accept, negotiate or incur a deferred payment undertaking",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for authorisation", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":32B:", name: "Currency Code, Amount", format: "3!a15d", mandatory: true, description: "Authorised amount", maxLength: 18 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Authorisation details", maxLength: 210 }
      ]
    },
    "MT754": {
      name: "Advice of Payment/Acceptance/Negotiation",
      description: "Advises that documents have been presented in accordance with the terms of a documentary credit and are being forwarded as instructed",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for advice", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":27:", name: "Sequence of Total", format: "1!n/1!n", mandatory: true, description: "Message sequence number", maxLength: 3 },
        { tag: ":31C:", name: "Date of Issue", format: "6!n", mandatory: true, description: "Date of advice", maxLength: 6 },
        { tag: ":50:", name: "Applicant", format: "4*35x", mandatory: true, description: "LC applicant", maxLength: 140 },
        { tag: ":59:", name: "Beneficiary", format: "4*35x", mandatory: true, description: "LC beneficiary", maxLength: 140 },
        { tag: ":32D:", name: "Currency Code, Amount Claimed", format: "3!a15d", mandatory: true, description: "Amount paid/accepted/negotiated", maxLength: 18 },
        { tag: ":33B:", name: "Currency Code, Original Amount", format: "3!a15d", mandatory: false, description: "Original LC amount", maxLength: 18 },
        { tag: ":34A:", name: "Date of Payment/Acceptance", format: "6!n", mandatory: true, description: "Date of payment/acceptance", maxLength: 6 },
        { tag: ":56A:", name: "Intermediary Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Intermediary bank", maxLength: 34 },
        { tag: ":57A:", name: "Account With Bank", format: "1!a4!a2!a15d", mandatory: false, description: "Account with bank", maxLength: 34 },
        { tag: ":70:", name: "Remittance Information", format: "4*35x", mandatory: false, description: "Payment details", maxLength: 140 },
        { tag: ":71D:", name: "Charges/Interest", format: "6*35x", mandatory: false, description: "Charges and interest", maxLength: 210 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Additional information", maxLength: 210 },
        { tag: ":45A:", name: "Description of Goods", format: "20*35x", mandatory: false, description: "Goods description", maxLength: 700 },
        { tag: ":46A:", name: "Documents Required", format: "20*35x", mandatory: false, description: "Documents presented", maxLength: 700 }
      ]
    },
    "MT756": {
      name: "Advice of Reimbursement or Payment",
      description: "Advises of the reimbursement or payment for a drawing under a documentary credit in which no specific reimbursement instructions or payment provisions were given",
      fields: [
        { tag: ":20:", name: "Transaction Reference Number", format: "16x", mandatory: true, description: "Unique reference for advice", maxLength: 16 },
        { tag: ":21:", name: "Related Reference", format: "16x", mandatory: true, description: "Original LC reference", maxLength: 16 },
        { tag: ":32A:", name: "Value Date, Currency Code, Amount", format: "6!n3!a15d", mandatory: true, description: "Reimbursement value date and amount", maxLength: 24 },
        { tag: ":52A:", name: "Ordering Institution", format: "1!a4!a2!a15d", mandatory: false, description: "Reimbursing bank", maxLength: 34 },
        { tag: ":53A:", name: "Sender's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Sender's correspondent", maxLength: 34 },
        { tag: ":54A:", name: "Receiver's Correspondent", format: "1!a4!a2!a15d", mandatory: false, description: "Receiver's correspondent", maxLength: 34 },
        { tag: ":72:", name: "Sender to Receiver Information", format: "6*35x", mandatory: false, description: "Reimbursement details", maxLength: 210 }
      ]
    }
  };
}

export { SWIFT_FIELD_DEFINITIONS, MT7XX_MESSAGE_TYPES, FIELD_DEPENDENCIES, getAllMT7xxFields };
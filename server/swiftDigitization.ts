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

export { SWIFT_FIELD_DEFINITIONS, MT7XX_MESSAGE_TYPES, FIELD_DEPENDENCIES };
import { db } from "./db";
import { 
  mtIntelligenceMessageTypes, 
  mtIntelligenceFields, 
  mtIntelligenceMessageTypeFields,
  mtIntelligenceValidationRules,
  mtIntelligenceMessages,
  mtIntelligenceValidationResults,
  mtIntelligenceValidationErrors,
  type MtIntelligenceMessageType,
  type MtIntelligenceField,
  type InsertMtIntelligenceMessage,
  type InsertMtIntelligenceValidationResult,
  type MtIntelligenceValidationResult
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export class MTIntelligenceService {
  
  /**
   * Get all available message types
   */
  async getMessageTypes(): Promise<MtIntelligenceMessageType[]> {
    return await db
      .select()
      .from(mtIntelligenceMessageTypes)
      .where(eq(mtIntelligenceMessageTypes.isActive, true))
      .orderBy(mtIntelligenceMessageTypes.messageTypeCode);
  }

  /**
   * Get message type by ID with fields
   */
  async getMessageTypeWithFields(messageTypeId: string): Promise<any> {
    const messageType = await db
      .select()
      .from(mtIntelligenceMessageTypes)
      .where(eq(mtIntelligenceMessageTypes.id, messageTypeId))
      .limit(1);

    if (messageType.length === 0) {
      throw new Error("Message type not found");
    }

    const fields = await db
      .select({
        field: mtIntelligenceFields,
        messageTypeField: mtIntelligenceMessageTypeFields
      })
      .from(mtIntelligenceMessageTypeFields)
      .innerJoin(mtIntelligenceFields, eq(mtIntelligenceFields.id, mtIntelligenceMessageTypeFields.fieldId))
      .where(eq(mtIntelligenceMessageTypeFields.messageTypeId, messageTypeId))
      .orderBy(mtIntelligenceMessageTypeFields.sequence);

    const validationRules = await db
      .select()
      .from(mtIntelligenceValidationRules)
      .where(eq(mtIntelligenceValidationRules.messageTypeId, messageTypeId));

    return {
      ...messageType[0],
      fields: fields.map(f => ({
        ...f.field,
        sequence: f.messageTypeField.sequence,
        isMandatory: f.messageTypeField.isMandatory,
        isConditional: f.messageTypeField.isConditional,
        conditionExpression: f.messageTypeField.conditionExpression,
        maxOccurrences: f.messageTypeField.maxOccurrences
      })),
      validationRules
    };
  }

  /**
   * Get all fields for a specific message type
   */
  async getFieldsByMessageType(messageTypeCode: string): Promise<any[]> {
    const messageType = await db
      .select()
      .from(mtIntelligenceMessageTypes)
      .where(eq(mtIntelligenceMessageTypes.messageTypeCode, messageTypeCode))
      .limit(1);

    if (messageType.length === 0) {
      throw new Error("Message type not found");
    }

    return await db
      .select({
        field: mtIntelligenceFields,
        messageTypeField: mtIntelligenceMessageTypeFields
      })
      .from(mtIntelligenceMessageTypeFields)
      .innerJoin(mtIntelligenceFields, eq(mtIntelligenceFields.id, mtIntelligenceMessageTypeFields.fieldId))
      .where(eq(mtIntelligenceMessageTypeFields.messageTypeId, messageType[0].id))
      .orderBy(mtIntelligenceMessageTypeFields.sequence);
  }

  /**
   * Validate a SWIFT message against MT Intelligence rules
   */
  async validateMessage(messageTypeCode: string, messageContent: string, userId: string): Promise<any> {
    const messageType = await db
      .select()
      .from(mtIntelligenceMessageTypes)
      .where(eq(mtIntelligenceMessageTypes.messageTypeCode, messageTypeCode))
      .limit(1);

    if (messageType.length === 0) {
      throw new Error("Message type not found");
    }

    // Parse message content to extract field values
    const parsedFields = this.parseMessageContent(messageContent);
    
    // Get validation rules for this message type
    const validationRules = await db
      .select()
      .from(mtIntelligenceValidationRules)
      .where(eq(mtIntelligenceValidationRules.messageTypeId, messageType[0].id));

    // Get message type fields
    const messageTypeFields = await db
      .select({
        field: mtIntelligenceFields,
        messageTypeField: mtIntelligenceMessageTypeFields
      })
      .from(mtIntelligenceMessageTypeFields)
      .innerJoin(mtIntelligenceFields, eq(mtIntelligenceFields.id, mtIntelligenceMessageTypeFields.fieldId))
      .where(eq(mtIntelligenceMessageTypeFields.messageTypeId, messageType[0].id));

    // Validate the message
    const validationErrors: any[] = [];
    let isValid = true;

    // Check mandatory fields
    for (const mtf of messageTypeFields) {
      if (mtf.messageTypeField.isMandatory && !parsedFields[mtf.field.fieldCode]) {
        validationErrors.push({
          fieldCode: mtf.field.fieldCode,
          fieldName: mtf.field.name,
          errorType: "mandatory_missing",
          errorMessage: `Mandatory field ${mtf.field.fieldCode} is missing`,
          severity: "error"
        });
        isValid = false;
      }
    }

    // Apply validation rules
    for (const rule of validationRules) {
      const fieldValue = parsedFields[rule.fieldId || ''];
      const ruleViolated = this.applyValidationRule(rule, fieldValue, parsedFields);
      
      if (ruleViolated) {
        validationErrors.push({
          fieldCode: rule.fieldId,
          fieldName: rule.name,
          errorType: rule.ruleType,
          errorMessage: rule.errorMessage,
          severity: rule.severity,
          ruleCode: rule.ruleCode,
          fieldValue: fieldValue
        });
        
        if (rule.severity === "error") {
          isValid = false;
        }
      }
    }

    // Store validation result
    const resultId = nanoid();
    await db.insert(mtIntelligenceValidationResults).values({
      id: resultId,
      messageId: null, // For ad-hoc validation
      isValid,
      validatedBy: userId,
      validationSummary: {
        totalErrors: validationErrors.filter(e => e.severity === "error").length,
        totalWarnings: validationErrors.filter(e => e.severity === "warning").length,
        messageTypeCode,
        parsedFields
      }
    });

    // Store validation errors
    for (const error of validationErrors) {
      await db.insert(mtIntelligenceValidationErrors).values({
        id: nanoid(),
        resultId,
        fieldId: error.fieldCode,
        errorType: error.errorType,
        errorMessage: error.errorMessage,
        severity: error.severity,
        fieldValue: error.fieldValue,
        ruleId: error.ruleCode
      });
    }

    return {
      resultId,
      isValid,
      messageTypeCode,
      validationErrors,
      summary: {
        totalErrors: validationErrors.filter(e => e.severity === "error").length,
        totalWarnings: validationErrors.filter(e => e.severity === "warning").length,
        fieldsValidated: Object.keys(parsedFields).length,
        rulesApplied: validationRules.length
      }
    };
  }

  /**
   * Construct a SWIFT message based on field inputs
   */
  async constructMessage(messageTypeCode: string, fieldValues: Record<string, string>, userId: string): Promise<any> {
    const messageType = await db
      .select()
      .from(mtIntelligenceMessageTypes)
      .where(eq(mtIntelligenceMessageTypes.messageTypeCode, messageTypeCode))
      .limit(1);

    if (messageType.length === 0) {
      throw new Error("Message type not found");
    }

    // Get message type fields in sequence
    const messageTypeFields = await db
      .select({
        field: mtIntelligenceFields,
        messageTypeField: mtIntelligenceMessageTypeFields
      })
      .from(mtIntelligenceMessageTypeFields)
      .innerJoin(mtIntelligenceFields, eq(mtIntelligenceFields.id, mtIntelligenceMessageTypeFields.fieldId))
      .where(eq(mtIntelligenceMessageTypeFields.messageTypeId, messageType[0].id))
      .orderBy(mtIntelligenceMessageTypeFields.sequence);

    // Construct the message content
    let messageContent = `{1:F01${messageTypeCode}}\n{2:I${messageTypeCode}N}\n{4:\n`;
    
    for (const mtf of messageTypeFields) {
      const fieldValue = fieldValues[mtf.field.fieldCode];
      if (fieldValue) {
        messageContent += `${mtf.field.fieldCode}${fieldValue}\n`;
      }
    }
    
    messageContent += "-}";

    // Generate reference number
    const referenceNumber = fieldValues[":20:"] || `REF${Date.now()}`;

    // Store the constructed message
    const messageId = nanoid();
    await db.insert(mtIntelligenceMessages).values({
      id: messageId,
      messageTypeId: messageType[0].id,
      referenceNumber,
      content: messageContent,
      status: "draft",
      createdBy: userId,
      lastModifiedBy: userId
    });

    return {
      messageId,
      messageTypeCode,
      referenceNumber,
      content: messageContent,
      status: "draft",
      fieldValues
    };
  }

  /**
   * Get validation history
   */
  async getValidationHistory(userId: string): Promise<MtIntelligenceValidationResult[]> {
    return await db
      .select()
      .from(mtIntelligenceValidationResults)
      .where(eq(mtIntelligenceValidationResults.validatedBy, userId))
      .orderBy(desc(mtIntelligenceValidationResults.validationDate))
      .limit(50);
  }

  /**
   * Parse SWIFT message content to extract field values
   */
  private parseMessageContent(content: string): Record<string, string> {
    const fields: Record<string, string> = {};
    
    // Simple regex to match SWIFT field patterns like :20:value
    const fieldRegex = /:(\d+[A-Z]?):(.*?)(?=:|$)/gs;
    let match;
    
    while ((match = fieldRegex.exec(content)) !== null) {
      const fieldCode = `:${match[1]}:`;
      const fieldValue = match[2].trim();
      fields[fieldCode] = fieldValue;
    }
    
    return fields;
  }

  /**
   * Apply a validation rule to a field value
   */
  private applyValidationRule(rule: any, fieldValue: string, allFields: Record<string, string>): boolean {
    switch (rule.ruleType) {
      case "format":
        if (rule.ruleExpression === "REGEX_MATCH") {
          const field = rule.fieldId;
          // Get field definition to get validation regex
          return false; // Simplified for now
        }
        break;
      
      case "content":
        if (rule.ruleExpression === "VALUE_IN_LIST") {
          // Check if field value is in allowed list
          const allowedValues = this.getAllowedValuesForField(rule.fieldId);
          return allowedValues.length > 0 && !allowedValues.includes(fieldValue);
        }
        break;
      
      case "business":
        if (rule.ruleExpression.includes("FIELD_31D > FIELD_31C")) {
          const expiryDate = allFields[":31D:"];
          const issueDate = allFields[":31C:"];
          if (expiryDate && issueDate) {
            return expiryDate <= issueDate;
          }
        }
        break;
      
      case "mandatory":
        return !fieldValue || fieldValue.trim() === "";
    }
    
    return false;
  }

  /**
   * Get allowed values for a specific field
   */
  private getAllowedValuesForField(fieldId: string): string[] {
    const allowedValues: Record<string, string[]> = {
      "field-40a": ["IRREVOCABLE", "REVOCABLE"],
      "field-43p": ["ALLOWED", "PROHIBITED"],
      "field-43t": ["ALLOWED", "PROHIBITED"],
      "field-71b": ["OUR", "BEN", "SHA"]
    };
    
    return allowedValues[fieldId] || [];
  }
}

export const mtIntelligenceService = new MTIntelligenceService();
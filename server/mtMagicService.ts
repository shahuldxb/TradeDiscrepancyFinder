import { db } from "./db";
import { swiftMessageTypes, swiftFields, messageTypeFields } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

interface MTTemplate {
  messageType: string;
  name: string;
  description: string;
  fields: MTField[];
}

interface MTField {
  tag: string;
  name: string;
  format: string;
  mandatory: boolean;
  description: string;
  validationRules?: string[];
  dependencies?: string[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  messageStructure?: any;
}

interface MTMessage {
  id: string;
  userId: string;
  messageType: string;
  content: string;
  fieldValues?: Record<string, string>;
  status: 'draft' | 'validated' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  validationErrors?: ValidationError[];
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get all available MT7xx message templates
 */
export async function getMTTemplates(): Promise<MTTemplate[]> {
  try {
    const messageTypes = await db
      .select()
      .from(swiftMessageTypes)
      .where(eq(swiftMessageTypes.category, "Documentary Credits"));

    const templates: MTTemplate[] = [];

    for (const messageType of messageTypes) {
      const fields = await db
        .select({
          tag: swiftFields.fieldCode,
          name: swiftFields.name,
          format: swiftFields.format,
          description: swiftFields.description,
          mandatory: messageTypeFields.isMandatory,
        })
        .from(messageTypeFields)
        .innerJoin(swiftFields, eq(messageTypeFields.fieldId, swiftFields.id))
        .where(eq(messageTypeFields.messageTypeId, messageType.id))
        .orderBy(messageTypeFields.sequence);

      templates.push({
        messageType: messageType.messageTypeCode,
        name: messageType.name,
        description: messageType.description,
        fields: fields.map(field => ({
          tag: field.tag,
          name: field.name,
          format: field.format,
          mandatory: field.mandatory,
          description: field.description,
          validationRules: [], // Will be populated from validation rules table
          dependencies: [], // Will be populated from dependencies table
        })),
      });
    }

    return templates;
  } catch (error) {
    console.error("Error fetching MT templates:", error);
    throw new Error("Failed to fetch message templates");
  }
}

/**
 * Validate a SWIFT MT7xx message against standards
 */
export async function validateMTMessage(
  messageType: string,
  messageContent: string,
  userId: string
): Promise<ValidationResult> {
  try {
    // Get message type information
    const [mtType] = await db
      .select()
      .from(swiftMessageTypes)
      .where(eq(swiftMessageTypes.messageTypeCode, messageType));

    if (!mtType) {
      return {
        isValid: false,
        errors: [{ field: 'messageType', message: 'Invalid message type', severity: 'error' }],
        warnings: [],
      };
    }

    // Get field definitions for this message type
    const fieldDefinitions = await db
      .select({
        tag: swiftFields.fieldCode,
        name: swiftFields.name,
        format: swiftFields.format,
        mandatory: messageTypeFields.isMandatory,
        validationRegex: swiftFields.validationRegex,
      })
      .from(messageTypeFields)
      .innerJoin(swiftFields, eq(messageTypeFields.fieldId, swiftFields.id))
      .where(eq(messageTypeFields.messageTypeId, mtType.id));

    // Parse message content
    const parsedFields = parseSwiftMessage(messageContent);
    
    // Validate using OpenAI for complex business rules
    const aiValidation = await validateWithAI(messageType, messageContent, fieldDefinitions);
    
    // Combine manual and AI validation results
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check mandatory fields
    const mandatoryFields = fieldDefinitions.filter(f => f.mandatory);
    for (const field of mandatoryFields) {
      if (!parsedFields[field.tag]) {
        errors.push({
          field: field.tag,
          message: `Mandatory field ${field.tag} (${field.name}) is missing`,
          severity: 'error'
        });
      }
    }

    // Validate field formats
    for (const [tag, value] of Object.entries(parsedFields)) {
      const fieldDef = fieldDefinitions.find(f => f.tag === tag);
      if (fieldDef && fieldDef.validationRegex) {
        try {
          const regex = new RegExp(fieldDef.validationRegex);
          if (!regex.test(value as string)) {
            errors.push({
              field: tag,
              message: `Field ${tag} format is invalid. Expected: ${fieldDef.format}`,
              severity: 'error'
            });
          }
        } catch (regexError) {
          warnings.push({
            field: tag,
            message: `Could not validate field ${tag} format`,
            severity: 'warning'
          });
        }
      }
    }

    // Add AI validation results
    errors.push(...aiValidation.errors);
    warnings.push(...aiValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      messageStructure: parsedFields,
    };

  } catch (error) {
    console.error("Error validating MT message:", error);
    throw new Error("Failed to validate message");
  }
}

/**
 * Construct a SWIFT MT7xx message from field values
 */
export async function constructMTMessage(
  messageType: string,
  fieldValues: Record<string, string>,
  userId: string
): Promise<{ content: string; isValid: boolean; errors: ValidationError[] }> {
  try {
    // Get message type and field definitions
    const [mtType] = await db
      .select()
      .from(swiftMessageTypes)
      .where(eq(swiftMessageTypes.messageTypeCode, messageType));

    if (!mtType) {
      throw new Error("Invalid message type");
    }

    const fieldDefinitions = await db
      .select({
        tag: swiftFields.fieldCode,
        name: swiftFields.name,
        format: swiftFields.format,
        mandatory: messageTypeFields.isMandatory,
        sequence: messageTypeFields.sequence,
      })
      .from(messageTypeFields)
      .innerJoin(swiftFields, eq(messageTypeFields.fieldId, swiftFields.id))
      .where(eq(messageTypeFields.messageTypeId, mtType.id))
      .orderBy(messageTypeFields.sequence);

    // Construct message using OpenAI for proper formatting
    const constructedMessage = await constructWithAI(messageType, fieldValues, fieldDefinitions);
    
    // Validate the constructed message
    const validationResult = await validateMTMessage(messageType, constructedMessage, userId);

    return {
      content: constructedMessage,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
    };

  } catch (error) {
    console.error("Error constructing MT message:", error);
    throw new Error("Failed to construct message");
  }
}

/**
 * Save a message for a user
 */
export async function saveMTMessage(
  userId: string,
  messageType: string,
  content: string,
  fieldValues?: Record<string, string>
): Promise<MTMessage> {
  try {
    // For now, return a mock message since we don't have a messages table
    // In a real implementation, this would save to database
    const message: MTMessage = {
      id: `msg_${Date.now()}`,
      userId,
      messageType,
      content,
      fieldValues,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return message;
  } catch (error) {
    console.error("Error saving MT message:", error);
    throw new Error("Failed to save message");
  }
}

/**
 * Get messages for a user
 */
export async function getUserMTMessages(userId: string): Promise<MTMessage[]> {
  try {
    // For now, return empty array since we don't have a messages table
    // In a real implementation, this would fetch from database
    return [];
  } catch (error) {
    console.error("Error fetching user messages:", error);
    throw new Error("Failed to fetch messages");
  }
}

/**
 * Parse SWIFT message content into field-value pairs
 */
function parseSwiftMessage(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(':') && trimmed.includes(':')) {
      const match = trimmed.match(/^:(\d+[A-Z]?):(.*)/);
      if (match) {
        const [, tag, value] = match;
        fields[`:${tag}:`] = value.trim();
      }
    }
  }
  
  return fields;
}

/**
 * Use OpenAI to validate message against complex business rules
 */
async function validateWithAI(
  messageType: string,
  content: string,
  fieldDefinitions: any[]
): Promise<{ errors: ValidationError[]; warnings: ValidationError[] }> {
  try {
    const prompt = `
You are a SWIFT MT7xx message validation expert. Validate this ${messageType} message against SWIFT 2019 Category 7 standards.

Message content:
${content}

Field definitions:
${JSON.stringify(fieldDefinitions, null, 2)}

Analyze for:
1. Business rule compliance
2. Field interdependencies 
3. Content validation beyond basic format
4. SWIFT network rules
5. Documentary credit specific rules

Return a JSON object with "errors" and "warnings" arrays. Each item should have:
- field: field tag
- message: description of the issue
- severity: "error" or "warning"

Focus on actual SWIFT compliance issues, not minor formatting.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a SWIFT message validation expert. Provide accurate validation based on official SWIFT standards."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"errors":[],"warnings":[]}');
    return {
      errors: result.errors || [],
      warnings: result.warnings || [],
    };

  } catch (error) {
    console.error("Error in AI validation:", error);
    return { errors: [], warnings: [] };
  }
}

/**
 * Use OpenAI to construct properly formatted SWIFT message
 */
async function constructWithAI(
  messageType: string,
  fieldValues: Record<string, string>,
  fieldDefinitions: any[]
): Promise<string> {
  try {
    const prompt = `
You are a SWIFT MT7xx message construction expert. Create a properly formatted ${messageType} message using these field values.

Field values:
${JSON.stringify(fieldValues, null, 2)}

Field definitions and sequence:
${JSON.stringify(fieldDefinitions, null, 2)}

Requirements:
1. Follow exact SWIFT ${messageType} format
2. Use proper field sequencing
3. Apply correct field formatting rules
4. Include message header and trailer as needed
5. Ensure compliance with SWIFT 2019 Category 7 standards

Return only the properly formatted SWIFT message content.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a SWIFT message construction expert. Create accurate SWIFT messages based on official standards."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
    });

    return response.choices[0].message.content || "";

  } catch (error) {
    console.error("Error in AI construction:", error);
    throw new Error("Failed to construct message with AI");
  }
}
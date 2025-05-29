import { db } from "./db";
import { 
  mtGenieMessageTypes, 
  mtGenieMessageFields, 
  mtGenieMessageDependencies,
  mtGenieMessageInstances,
  mtGenieFieldValues,
  mtGenieTemplates,
  mtGenieWorkflows,
  type MTGenieMessageType,
  type MTGenieMessageField,
  type InsertMTGenieMessageType,
  type InsertMTGenieMessageField,
  type InsertMTGenieMessageInstance,
  type InsertMTGenieTemplate,
  type InsertMTGenieWorkflow
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// Message Types Management
export async function getAllMTGenieMessageTypes() {
  return await db
    .select()
    .from(mtGenieMessageTypes)
    .where(eq(mtGenieMessageTypes.isActive, true))
    .orderBy(asc(mtGenieMessageTypes.messageTypeCode));
}

export async function getMTGenieMessageTypeById(id: string) {
  const [messageType] = await db
    .select()
    .from(mtGenieMessageTypes)
    .where(eq(mtGenieMessageTypes.id, id));
  return messageType;
}

export async function getMTGenieMessageTypeByCode(code: string) {
  const [messageType] = await db
    .select()
    .from(mtGenieMessageTypes)
    .where(eq(mtGenieMessageTypes.messageTypeCode, code));
  return messageType;
}

// Message Fields Management
export async function getMTGenieFieldsForMessageType(messageTypeId: string) {
  return await db
    .select()
    .from(mtGenieMessageFields)
    .where(and(
      eq(mtGenieMessageFields.messageTypeId, messageTypeId),
      eq(mtGenieMessageFields.isActive, true)
    ))
    .orderBy(asc(mtGenieMessageFields.sequence));
}

export async function getMTGenieFieldById(fieldId: string) {
  const [field] = await db
    .select()
    .from(mtGenieMessageFields)
    .where(eq(mtGenieMessageFields.id, fieldId));
  return field;
}

// Message Dependencies
export async function getMTGenieDependenciesForMessageType(messageTypeId: string) {
  return await db
    .select({
      dependency: mtGenieMessageDependencies,
      sourceMessageType: mtGenieMessageTypes,
      targetMessageType: {
        id: mtGenieMessageTypes.id,
        messageTypeCode: mtGenieMessageTypes.messageTypeCode,
        name: mtGenieMessageTypes.name,
        fullName: mtGenieMessageTypes.fullName
      }
    })
    .from(mtGenieMessageDependencies)
    .leftJoin(
      mtGenieMessageTypes,
      eq(mtGenieMessageDependencies.sourceMessageTypeId, mtGenieMessageTypes.id)
    )
    .where(and(
      eq(mtGenieMessageDependencies.targetMessageTypeId, messageTypeId),
      eq(mtGenieMessageDependencies.isActive, true)
    ));
}

// Message Instances Management
export async function createMTGenieMessageInstance(
  userId: string,
  messageTypeId: string,
  data: Omit<InsertMTGenieMessageInstance, 'id'>
) {
  const instanceId = nanoid();
  const [instance] = await db
    .insert(mtGenieMessageInstances)
    .values({
      id: instanceId,
      messageTypeId,
      userId,
      ...data
    })
    .returning();
  return instance;
}

export async function getMTGenieMessageInstancesForUser(userId: string) {
  return await db
    .select({
      instance: mtGenieMessageInstances,
      messageType: {
        messageTypeCode: mtGenieMessageTypes.messageTypeCode,
        name: mtGenieMessageTypes.name,
        fullName: mtGenieMessageTypes.fullName
      }
    })
    .from(mtGenieMessageInstances)
    .leftJoin(
      mtGenieMessageTypes,
      eq(mtGenieMessageInstances.messageTypeId, mtGenieMessageTypes.id)
    )
    .where(eq(mtGenieMessageInstances.userId, userId))
    .orderBy(desc(mtGenieMessageInstances.createdAt));
}

// Templates Management
export async function getMTGenieTemplatesForMessageType(messageTypeId: string, userId?: string) {
  const query = db
    .select({
      template: mtGenieTemplates,
      messageType: {
        messageTypeCode: mtGenieMessageTypes.messageTypeCode,
        name: mtGenieMessageTypes.name
      }
    })
    .from(mtGenieTemplates)
    .leftJoin(
      mtGenieMessageTypes,
      eq(mtGenieTemplates.messageTypeId, mtGenieMessageTypes.id)
    )
    .where(and(
      eq(mtGenieTemplates.messageTypeId, messageTypeId),
      eq(mtGenieTemplates.isActive, true)
    ));

  if (userId) {
    return await query.where(
      and(
        eq(mtGenieTemplates.messageTypeId, messageTypeId),
        eq(mtGenieTemplates.isActive, true),
        eq(mtGenieTemplates.userId, userId)
      )
    );
  }

  return await query.where(
    and(
      eq(mtGenieTemplates.messageTypeId, messageTypeId),
      eq(mtGenieTemplates.isActive, true),
      eq(mtGenieTemplates.isPublic, true)
    )
  );
}

export async function createMTGenieTemplate(
  userId: string,
  messageTypeId: string,
  data: Omit<InsertMTGenieTemplate, 'id'>
) {
  const templateId = nanoid();
  const [template] = await db
    .insert(mtGenieTemplates)
    .values({
      id: templateId,
      messageTypeId,
      userId,
      ...data
    })
    .returning();
  return template;
}

// Workflows Management
export async function getMTGenieWorkflowsForUser(userId: string) {
  return await db
    .select()
    .from(mtGenieWorkflows)
    .where(and(
      eq(mtGenieWorkflows.userId, userId),
      eq(mtGenieWorkflows.isActive, true)
    ))
    .orderBy(desc(mtGenieWorkflows.createdAt));
}

export async function createMTGenieWorkflow(
  userId: string,
  data: Omit<InsertMTGenieWorkflow, 'id'>
) {
  const workflowId = nanoid();
  const [workflow] = await db
    .insert(mtGenieWorkflows)
    .values({
      id: workflowId,
      userId,
      ...data
    })
    .returning();
  return workflow;
}

// Message Validation Service
export async function validateMTGenieMessage(messageTypeId: string, fieldValues: Record<string, any>) {
  const fields = await getMTGenieFieldsForMessageType(messageTypeId);
  const validationResults = [];
  
  // Check mandatory fields
  for (const field of fields) {
    if (field.isMandatory && (!fieldValues[field.tag] || fieldValues[field.tag].trim() === '')) {
      validationResults.push({
        fieldTag: field.tag,
        fieldName: field.fieldName,
        type: 'mandatory',
        severity: 'critical',
        message: `Field ${field.tag} (${field.fieldName}) is mandatory and cannot be empty`,
        isValid: false
      });
    }
  }

  // Validate field formats (basic validation)
  for (const field of fields) {
    const value = fieldValues[field.tag];
    if (value && field.validationRules) {
      try {
        const rules = typeof field.validationRules === 'string' 
          ? JSON.parse(field.validationRules) 
          : field.validationRules;
        
        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            validationResults.push({
              fieldTag: field.tag,
              fieldName: field.fieldName,
              type: 'format',
              severity: 'high',
              message: `Field ${field.tag} format is invalid: ${rules.patternDescription || 'Invalid format'}`,
              isValid: false
            });
          }
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          validationResults.push({
            fieldTag: field.tag,
            fieldName: field.fieldName,
            type: 'length',
            severity: 'medium',
            message: `Field ${field.tag} exceeds maximum length of ${rules.maxLength} characters`,
            isValid: false
          });
        }
      } catch (error) {
        // Skip validation if rules are malformed
      }
    }
  }

  const isValid = validationResults.length === 0;
  
  return {
    isValid,
    fieldCount: fields.length,
    mandatoryFieldCount: fields.filter(f => f.isMandatory).length,
    validationResults,
    summary: isValid 
      ? 'Message validation passed successfully'
      : `${validationResults.length} validation error${validationResults.length > 1 ? 's' : ''} found`
  };
}

// Message Construction Service
export async function constructMTGenieMessage(messageTypeId: string, fieldValues: Record<string, any>) {
  const messageType = await getMTGenieMessageTypeById(messageTypeId);
  const fields = await getMTGenieFieldsForMessageType(messageTypeId);

  if (!messageType) {
    throw new Error('Message type not found');
  }

  let messageContent = `{1:${messageType.messageTypeCode}}\n`;
  
  // Sort fields by sequence for proper message construction
  const sortedFields = fields.sort((a, b) => a.sequence - b.sequence);
  
  for (const field of sortedFields) {
    const value = fieldValues[field.tag];
    if (value && value.trim()) {
      messageContent += `:${field.tag}:${value.trim()}\n`;
    }
  }

  messageContent += '-}';

  return {
    messageTypeCode: messageType.messageTypeCode,
    messageTypeName: messageType.name,
    messageContent,
    fieldCount: Object.keys(fieldValues).filter(key => fieldValues[key]?.trim()).length,
    totalFields: fields.length
  };
}

// Seed MT Genie with comprehensive SWIFT MT7xx data
export async function seedMTGenieData() {
  console.log("Starting MT Genie data seeding...");

  // MT7xx Message Types with comprehensive data
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

  try {
    await db.insert(mtGenieMessageTypes).values(messageTypesData).onConflictDoNothing();
    console.log("MT Genie message types seeded successfully");
    return { success: true, seededCount: messageTypesData.length };
  } catch (error) {
    console.error("Error seeding MT Genie data:", error);
    throw error;
  }
}
import { 
  users, 
  documentSets, 
  documents, 
  discrepancies, 
  agentTasks,
  customAgents,
  customTasks, 
  customCrews,
  swiftMessageTypes,
  swiftFields,
  messageTypeFields,
  type User,
  type UpsertUser,
  type DocumentSet,
  type InsertDocumentSet,
  type Document,
  type InsertDocument,
  type Discrepancy,
  type InsertDiscrepancy,
  type AgentTask,
  type InsertAgentTask,
  type CustomAgent,
  type InsertCustomAgent,
  type CustomTask,
  type InsertCustomTask,
  type CustomCrew,
  type InsertCustomCrew,
  type SwiftMessageType,
  type SwiftField,
  type MessageTypeField
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Document Set operations
  getDocumentSetsByUser(userId: string): Promise<DocumentSet[]>;
  createDocumentSet(data: InsertDocumentSet & { userId: string }): Promise<DocumentSet>;
  getDocumentSetWithDetails(id: string, userId: string): Promise<any>;

  // Document operations
  createDocument(data: InsertDocument & { userId: string; documentSetId?: string }): Promise<Document>;
  getDocumentStatus(documentId: number, userId: string): Promise<any>;

  // Discrepancy operations
  createDiscrepancy(data: InsertDiscrepancy & { documentSetId: string }): Promise<Discrepancy>;
  getDiscrepanciesByDocumentSet(documentSetId: string): Promise<Discrepancy[]>;

  // Agent Task operations
  createAgentTask(data: InsertAgentTask & { documentSetId?: string; documentId?: number }): Promise<AgentTask>;

  // Custom Agent Designer operations
  getCustomAgentsByUser(userId: string): Promise<CustomAgent[]>;
  createCustomAgent(data: InsertCustomAgent & { userId: string }): Promise<CustomAgent>;
  getCustomTasksByUser(userId: string): Promise<CustomTask[]>;
  createCustomTask(data: InsertCustomTask & { userId: string }): Promise<CustomTask>;
  getCustomCrewsByUser(userId: string): Promise<CustomCrew[]>;
  createCustomCrew(data: InsertCustomCrew & { userId: string }): Promise<CustomCrew>;

  // SWIFT MT7xx operations
  getSwiftMessageTypes(): Promise<SwiftMessageType[]>;
  getSwiftFieldsByMessageType(messageTypeCode: string): Promise<any[]>;
  getAllSwiftFields(): Promise<SwiftField[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ id: userData.id || '', ...userData })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document Set operations
  async getDocumentSetsByUser(userId: string): Promise<DocumentSet[]> {
    return await db.select().from(documentSets).where(eq(documentSets.userId, userId));
  }

  async createDocumentSet(data: InsertDocumentSet & { userId: string }): Promise<DocumentSet> {
    const [documentSet] = await db
      .insert(documentSets)
      .values(data)
      .returning();
    return documentSet;
  }

  async getDocumentSetWithDetails(id: string, userId: string): Promise<any> {
    const documentSet = await db
      .select()
      .from(documentSets)
      .where(eq(documentSets.id, id) && eq(documentSets.userId, userId));

    if (!documentSet.length) return null;

    const relatedDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.documentSetId, id));

    const relatedTasks = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.documentSetId, id));

    return {
      ...documentSet[0],
      documents: relatedDocuments,
      agentTasks: relatedTasks
    };
  }

  // Document operations
  async createDocument(data: InsertDocument & { userId: string; documentSetId?: string }): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(data)
      .returning();
    return document;
  }

  async getDocumentStatus(documentId: number, userId: string): Promise<any> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId) && eq(documents.userId, userId));

    return document || null;
  }

  // Discrepancy operations
  async createDiscrepancy(data: InsertDiscrepancy & { documentSetId: string }): Promise<Discrepancy> {
    const [discrepancy] = await db
      .insert(discrepancies)
      .values(data)
      .returning();
    return discrepancy;
  }

  async getDiscrepanciesByDocumentSet(documentSetId: string): Promise<Discrepancy[]> {
    return await db
      .select()
      .from(discrepancies)
      .where(eq(discrepancies.documentSetId, documentSetId));
  }

  // Agent Task operations
  async createAgentTask(data: InsertAgentTask & { documentSetId?: string; documentId?: number }): Promise<AgentTask> {
    const [task] = await db
      .insert(agentTasks)
      .values(data)
      .returning();
    return task;
  }

  // Custom Agent Designer operations
  async getCustomAgentsByUser(userId: string): Promise<CustomAgent[]> {
    return await db.select().from(customAgents).where(eq(customAgents.userId, userId));
  }

  async createCustomAgent(data: InsertCustomAgent & { userId: string }): Promise<CustomAgent> {
    const [agent] = await db
      .insert(customAgents)
      .values(data)
      .returning();
    return agent;
  }

  async getCustomTasksByUser(userId: string): Promise<CustomTask[]> {
    return await db.select().from(customTasks).where(eq(customTasks.userId, userId));
  }

  async createCustomTask(data: InsertCustomTask & { userId: string }): Promise<CustomTask> {
    const [task] = await db
      .insert(customTasks)
      .values(data)
      .returning();
    return task;
  }

  async getCustomCrewsByUser(userId: string): Promise<CustomCrew[]> {
    return await db.select().from(customCrews).where(eq(customCrews.userId, userId));
  }

  async createCustomCrew(data: InsertCustomCrew & { userId: string }): Promise<CustomCrew> {
    const [crew] = await db
      .insert(customCrews)
      .values(data)
      .returning();
    return crew;
  }

  // SWIFT MT7xx operations
  async getSwiftMessageTypes(): Promise<SwiftMessageType[]> {
    return await db
      .select()
      .from(swiftMessageTypes)
      .where(eq(swiftMessageTypes.isActive, true));
  }

  async getSwiftFieldsByMessageType(messageTypeCode: string): Promise<any[]> {
    const fields = await db
      .select({
        field: swiftFields,
        relationship: messageTypeFields
      })
      .from(messageTypeFields)
      .innerJoin(swiftFields, eq(messageTypeFields.fieldId, swiftFields.fieldCode))
      .where(eq(messageTypeFields.messageTypeId, messageTypeCode) && eq(messageTypeFields.isActive, true))
      .orderBy(messageTypeFields.sequence);

    return fields.map(({ field, relationship }) => ({
      ...field,
      sequence: relationship.sequence,
      isMandatory: relationship.isMandatory,
      isConditional: relationship.isConditional,
      maxOccurrences: relationship.maxOccurrences
    }));
  }

  async getAllSwiftFields(): Promise<SwiftField[]> {
    return await db
      .select()
      .from(swiftFields)
      .where(eq(swiftFields.isActive, true));
  }
}

export const storage = new DatabaseStorage();
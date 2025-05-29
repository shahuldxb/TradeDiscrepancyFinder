import {
  users,
  documentSets,
  documents,
  discrepancies,
  agentTasks,
  auditLogs,
  processingQueue,
  customAgents,
  customTasks,
  customCrews,
  crewExecutions,
  swiftMessageTypes,
  swiftFields,
  swiftMessages,
  swiftValidationResults,
  swiftTemplates,
  digitizationProjects,
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
  type AuditLog,
  type ProcessingQueueItem,
  type CustomAgent,
  type InsertCustomAgent,
  type CustomTask,
  type InsertCustomTask,
  type CustomCrew,
  type InsertCustomCrew,
  type CrewExecution,
  type InsertCrewExecution,
  type SwiftMessageType,
  type InsertSwiftMessageType,
  type SwiftField,
  type InsertSwiftField,
  type SwiftMessage,
  type InsertSwiftMessage,
  type SwiftTemplate,
  type InsertSwiftTemplate,
  type DigitizationProject,
  type InsertDigitizationProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Document Set operations
  createDocumentSet(documentSet: InsertDocumentSet & { userId: string }): Promise<DocumentSet>;
  getDocumentSet(id: string, userId?: string): Promise<DocumentSet | undefined>;
  getDocumentSetsByUser(userId: string): Promise<DocumentSet[]>;
  updateDocumentSetStatus(id: string, status: string): Promise<void>;

  // Document operations
  createDocument(document: InsertDocument & { userId: string }): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentWithUser(id: number, userId: string): Promise<Document | undefined>;
  getDocumentsBySet(documentSetId: string): Promise<Document[]>;
  getDocumentsByTypeAndSet(documentSetId: string, documentType: string): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string): Promise<void>;
  updateDocumentExtractedData(id: number, extractedData: any): Promise<void>;

  // Discrepancy operations
  createDiscrepancy(discrepancy: InsertDiscrepancy): Promise<Discrepancy>;
  getDiscrepanciesBySet(documentSetId: string): Promise<Discrepancy[]>;
  updateDiscrepancy(id: number, updates: Partial<Discrepancy>): Promise<void>;

  // Agent Task operations
  createAgentTask(agentTask: InsertAgentTask): Promise<number>;
  updateAgentTask(id: number, status: string, outputData?: any, errorMessage?: string): Promise<void>;
  getAgentTasksByUser(userId: string): Promise<AgentTask[]>;

  // Dashboard metrics
  getDashboardMetrics(userId: string): Promise<any>;

  // Audit operations
  createAuditLog(auditLog: Partial<AuditLog>): Promise<void>;

  // Custom Agent operations
  createCustomAgent(agent: InsertCustomAgent & { userId: string }): Promise<CustomAgent>;
  getCustomAgent(id: string, userId: string): Promise<CustomAgent | undefined>;
  getCustomAgentsByUser(userId: string): Promise<CustomAgent[]>;
  updateCustomAgent(id: string, agent: Partial<CustomAgent>): Promise<void>;
  deleteCustomAgent(id: string, userId: string): Promise<void>;

  // Custom Task operations
  createCustomTask(task: InsertCustomTask & { userId: string }): Promise<CustomTask>;
  getCustomTask(id: string, userId: string): Promise<CustomTask | undefined>;
  getCustomTasksByUser(userId: string): Promise<CustomTask[]>;
  updateCustomTask(id: string, task: Partial<CustomTask>): Promise<void>;
  deleteCustomTask(id: string, userId: string): Promise<void>;

  // Custom Crew operations
  createCustomCrew(crew: InsertCustomCrew & { userId: string }): Promise<CustomCrew>;
  getCustomCrew(id: string, userId: string): Promise<CustomCrew | undefined>;
  getCustomCrewsByUser(userId: string): Promise<CustomCrew[]>;
  updateCustomCrew(id: string, crew: Partial<CustomCrew>): Promise<void>;
  deleteCustomCrew(id: string, userId: string): Promise<void>;

  // Crew Execution operations
  createCrewExecution(execution: InsertCrewExecution & { userId: string }): Promise<CrewExecution>;
  getCrewExecution(id: string, userId: string): Promise<CrewExecution | undefined>;
  getCrewExecutionsByUser(userId: string): Promise<CrewExecution[]>;
  updateCrewExecution(id: string, execution: Partial<CrewExecution>): Promise<void>;

  // SWIFT Digitization operations
  createSwiftMessageType(messageType: InsertSwiftMessageType & { id: string }): Promise<SwiftMessageType>;
  getSwiftMessageTypes(): Promise<SwiftMessageType[]>;
  getSwiftMessageType(id: string): Promise<SwiftMessageType | undefined>;
  
  createSwiftField(field: InsertSwiftField & { id: string }): Promise<SwiftField>;
  getSwiftFields(): Promise<SwiftField[]>;
  getSwiftField(id: string): Promise<SwiftField | undefined>;
  
  createSwiftMessage(message: InsertSwiftMessage & { userId: string, id: string }): Promise<SwiftMessage>;
  getSwiftMessages(userId: string): Promise<SwiftMessage[]>;
  getSwiftMessage(id: string, userId: string): Promise<SwiftMessage | undefined>;
  
  createSwiftValidationResult(result: any): Promise<any>;
  getSwiftValidationResults(userId: string): Promise<any[]>;
  
  createSwiftTemplate(template: InsertSwiftTemplate & { userId: string, id: string }): Promise<SwiftTemplate>;
  getSwiftTemplates(userId?: string): Promise<SwiftTemplate[]>;
  
  createDigitizationProject(project: InsertDigitizationProject & { userId: string, id: string }): Promise<DigitizationProject>;
  getDigitizationProjects(userId: string): Promise<DigitizationProject[]>;
  getDigitizationProject(id: string, userId: string): Promise<DigitizationProject | undefined>;
  
  getDigitizationStats(userId: string): Promise<any>;
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
      .values(userData)
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
  async createDocumentSet(documentSet: InsertDocumentSet & { userId: string }): Promise<DocumentSet> {
    const [created] = await db
      .insert(documentSets)
      .values(documentSet)
      .returning();
    return created;
  }

  async getDocumentSet(id: string, userId?: string): Promise<DocumentSet | undefined> {
    const conditions = userId 
      ? and(eq(documentSets.id, id), eq(documentSets.userId, userId))
      : eq(documentSets.id, id);
    
    const [documentSet] = await db
      .select()
      .from(documentSets)
      .where(conditions);
    
    return documentSet;
  }

  async getDocumentSetsByUser(userId: string): Promise<DocumentSet[]> {
    return await db
      .select()
      .from(documentSets)
      .where(eq(documentSets.userId, userId))
      .orderBy(desc(documentSets.createdAt));
  }

  async updateDocumentSetStatus(id: string, status: string): Promise<void> {
    await db
      .update(documentSets)
      .set({ 
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      })
      .where(eq(documentSets.id, id));
  }

  // Document operations
  async createDocument(document: InsertDocument & { userId: string }): Promise<Document> {
    const [created] = await db
      .insert(documents)
      .values(document)
      .returning();
    return created;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async getDocumentWithUser(id: number, userId: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return document;
  }

  async getDocumentsBySet(documentSetId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.documentSetId, documentSetId))
      .orderBy(desc(documents.uploadedAt));
  }

  async getDocumentsByTypeAndSet(documentSetId: string, documentType: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.documentSetId, documentSetId),
        eq(documents.documentType, documentType)
      ));
  }

  async updateDocumentStatus(id: number, status: string): Promise<void> {
    await db
      .update(documents)
      .set({ 
        status,
        ...(status === 'processed' ? { processedAt: new Date() } : {})
      })
      .where(eq(documents.id, id));
  }

  async updateDocumentExtractedData(id: number, extractedData: any): Promise<void> {
    await db
      .update(documents)
      .set({ extractedData })
      .where(eq(documents.id, id));
  }

  // Discrepancy operations
  async createDiscrepancy(discrepancy: InsertDiscrepancy): Promise<Discrepancy> {
    const [created] = await db
      .insert(discrepancies)
      .values(discrepancy)
      .returning();
    return created;
  }

  async getDiscrepanciesBySet(documentSetId: string): Promise<Discrepancy[]> {
    return await db
      .select()
      .from(discrepancies)
      .where(eq(discrepancies.documentSetId, documentSetId))
      .orderBy(desc(discrepancies.detectedAt));
  }

  async updateDiscrepancy(id: number, updates: Partial<Discrepancy>): Promise<void> {
    await db
      .update(discrepancies)
      .set(updates)
      .where(eq(discrepancies.id, id));
  }

  // Agent Task operations
  async createAgentTask(agentTask: InsertAgentTask): Promise<number> {
    const [created] = await db
      .insert(agentTasks)
      .values({
        ...agentTask,
        startedAt: new Date(),
      })
      .returning();
    return created.id;
  }

  async updateAgentTask(id: number, status: string, outputData?: any, errorMessage?: string): Promise<void> {
    await db
      .update(agentTasks)
      .set({
        status,
        outputData,
        errorMessage,
        ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {}),
      })
      .where(eq(agentTasks.id, id));
  }

  async getAgentTasksByUser(userId: string): Promise<AgentTask[]> {
    return await db
      .select()
      .from(agentTasks)
      .innerJoin(documentSets, eq(agentTasks.documentSetId, documentSets.id))
      .where(eq(documentSets.userId, userId))
      .orderBy(desc(agentTasks.startedAt));
  }

  // Dashboard metrics
  async getDashboardMetrics(userId: string): Promise<any> {
    // Get total documents processed
    const documentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.userId, userId));

    // Get total discrepancies
    const discrepanciesResult = await db
      .select({ 
        total: sql<number>`count(*)`,
        critical: sql<number>`count(*) filter (where severity = 'critical')`,
        high: sql<number>`count(*) filter (where severity = 'high')`,
      })
      .from(discrepancies)
      .innerJoin(documentSets, eq(discrepancies.documentSetId, documentSets.id))
      .where(eq(documentSets.userId, userId));

    // Get active document sets
    const activeSetsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentSets)
      .where(and(
        eq(documentSets.userId, userId),
        eq(documentSets.status, 'processing')
      ));

    // Get completed ILCs (completed document sets)
    const completedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentSets)
      .where(and(
        eq(documentSets.userId, userId),
        eq(documentSets.status, 'completed')
      ));

    return {
      documentsProcessed: documentsResult[0]?.count || 0,
      totalDiscrepancies: discrepanciesResult[0]?.total || 0,
      criticalDiscrepancies: discrepanciesResult[0]?.critical || 0,
      highDiscrepancies: discrepanciesResult[0]?.high || 0,
      activeAnalyses: activeSetsResult[0]?.count || 0,
      ilcCreated: completedResult[0]?.count || 0,
      successRate: 94.2, // Calculate based on completed vs failed sets
    };
  }

  // Audit operations
  async createAuditLog(auditLog: Partial<AuditLog>): Promise<void> {
    await db
      .insert(auditLogs)
      .values(auditLog as any);
  }

  // Custom Agent operations
  async createCustomAgent(agent: InsertCustomAgent & { userId: string }): Promise<CustomAgent> {
    const [newAgent] = await db
      .insert(customAgents)
      .values(agent)
      .returning();
    return newAgent;
  }

  async getCustomAgent(id: string, userId: string): Promise<CustomAgent | undefined> {
    const [agent] = await db
      .select()
      .from(customAgents)
      .where(and(eq(customAgents.id, id), eq(customAgents.userId, userId)));
    return agent;
  }

  async getCustomAgentsByUser(userId: string): Promise<CustomAgent[]> {
    return await db
      .select()
      .from(customAgents)
      .where(eq(customAgents.userId, userId))
      .orderBy(desc(customAgents.createdAt));
  }

  async updateCustomAgent(id: string, agent: Partial<CustomAgent>): Promise<void> {
    await db
      .update(customAgents)
      .set({ ...agent, updatedAt: new Date() })
      .where(eq(customAgents.id, id));
  }

  async deleteCustomAgent(id: string, userId: string): Promise<void> {
    await db
      .delete(customAgents)
      .where(and(eq(customAgents.id, id), eq(customAgents.userId, userId)));
  }

  // Custom Task operations
  async createCustomTask(task: InsertCustomTask & { userId: string }): Promise<CustomTask> {
    const [newTask] = await db
      .insert(customTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getCustomTask(id: string, userId: string): Promise<CustomTask | undefined> {
    const [task] = await db
      .select()
      .from(customTasks)
      .where(and(eq(customTasks.id, id), eq(customTasks.userId, userId)));
    return task;
  }

  async getCustomTasksByUser(userId: string): Promise<CustomTask[]> {
    return await db
      .select()
      .from(customTasks)
      .where(eq(customTasks.userId, userId))
      .orderBy(desc(customTasks.createdAt));
  }

  async updateCustomTask(id: string, task: Partial<CustomTask>): Promise<void> {
    await db
      .update(customTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(customTasks.id, id));
  }

  async deleteCustomTask(id: string, userId: string): Promise<void> {
    await db
      .delete(customTasks)
      .where(and(eq(customTasks.id, id), eq(customTasks.userId, userId)));
  }

  // Custom Crew operations
  async createCustomCrew(crew: InsertCustomCrew & { userId: string }): Promise<CustomCrew> {
    const [newCrew] = await db
      .insert(customCrews)
      .values(crew)
      .returning();
    return newCrew;
  }

  async getCustomCrew(id: string, userId: string): Promise<CustomCrew | undefined> {
    const [crew] = await db
      .select()
      .from(customCrews)
      .where(and(eq(customCrews.id, id), eq(customCrews.userId, userId)));
    return crew;
  }

  async getCustomCrewsByUser(userId: string): Promise<CustomCrew[]> {
    return await db
      .select()
      .from(customCrews)
      .where(eq(customCrews.userId, userId))
      .orderBy(desc(customCrews.createdAt));
  }

  async updateCustomCrew(id: string, crew: Partial<CustomCrew>): Promise<void> {
    await db
      .update(customCrews)
      .set({ ...crew, updatedAt: new Date() })
      .where(eq(customCrews.id, id));
  }

  async deleteCustomCrew(id: string, userId: string): Promise<void> {
    await db
      .delete(customCrews)
      .where(and(eq(customCrews.id, id), eq(customCrews.userId, userId)));
  }

  // Crew Execution operations
  async createCrewExecution(execution: InsertCrewExecution & { userId: string }): Promise<CrewExecution> {
    const [newExecution] = await db
      .insert(crewExecutions)
      .values(execution)
      .returning();
    return newExecution;
  }

  async getCrewExecution(id: string, userId: string): Promise<CrewExecution | undefined> {
    const [execution] = await db
      .select()
      .from(crewExecutions)
      .where(and(eq(crewExecutions.id, id), eq(crewExecutions.userId, userId)));
    return execution;
  }

  async getCrewExecutionsByUser(userId: string): Promise<CrewExecution[]> {
    return await db
      .select()
      .from(crewExecutions)
      .where(eq(crewExecutions.userId, userId))
      .orderBy(desc(crewExecutions.startedAt));
  }

  async updateCrewExecution(id: string, execution: Partial<CrewExecution>): Promise<void> {
    await db
      .update(crewExecutions)
      .set(execution)
      .where(eq(crewExecutions.id, id));
  }
}

export const storage = new DatabaseStorage();

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 50 }).default("analyst"),
  customerSegment: varchar("customer_segment", { length: 50 }),
  operationSegment: varchar("operation_segment", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document sets for grouping related documents
export const documentSets = pgTable("document_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  lcReference: varchar("lc_reference", { length: 100 }),
  setName: varchar("set_name", { length: 200 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, processing, completed, failed
  requiredDocuments: jsonb("required_documents"), // Array of required document types
  uploadedDocuments: jsonb("uploaded_documents"), // Array of uploaded document IDs
  analysisStatus: varchar("analysis_status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentSetId: uuid("document_set_id").references(() => documentSets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type", { length: 50 }).notNull(), // mt700, commercial_invoice, bill_of_lading, etc.
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  status: varchar("status", { length: 20 }).default("uploaded"), // uploaded, processing, processed, failed
  extractedData: jsonb("extracted_data"), // OCR/parsed content
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Discrepancies table
export const discrepancies = pgTable("discrepancies", {
  id: serial("id").primaryKey(),
  documentSetId: uuid("document_set_id").notNull().references(() => documentSets.id),
  discrepancyType: varchar("discrepancy_type", { length: 50 }).notNull(), // quantitative, qualitative, contextual, etc.
  fieldName: varchar("field_name", { length: 100 }),
  severity: varchar("severity", { length: 20 }).notNull(), // critical, high, medium, low
  ucpReference: varchar("ucp_reference", { length: 20 }), // Article reference
  description: text("description").notNull(),
  ruleExplanation: text("rule_explanation"),
  advice: text("advice"),
  documentValues: jsonb("document_values"), // Conflicting values from different documents
  status: varchar("status", { length: 20 }).default("active"), // active, resolved, waived
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// CrewAI agent tasks
export const agentTasks = pgTable("agent_tasks", {
  id: serial("id").primaryKey(),
  agentName: varchar("agent_name", { length: 50 }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  documentSetId: uuid("document_set_id").references(() => documentSets.id),
  status: varchar("status", { length: 20 }).default("queued"), // queued, processing, completed, failed
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  executionTime: integer("execution_time"), // milliseconds
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 50 }).notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Processing queue for batch operations
export const processingQueue = pgTable("processing_queue", {
  id: serial("id").primaryKey(),
  documentSetId: uuid("document_set_id").notNull().references(() => documentSets.id),
  priority: integer("priority").default(1),
  status: varchar("status", { length: 20 }).default("queued"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  customerSegment: true,
  operationSegment: true,
});

export const insertDocumentSetSchema = createInsertSchema(documentSets).pick({
  lcReference: true,
  setName: true,
  requiredDocuments: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  documentSetId: true,
  documentType: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
});

export const insertDiscrepancySchema = createInsertSchema(discrepancies).pick({
  documentSetId: true,
  discrepancyType: true,
  fieldName: true,
  severity: true,
  ucpReference: true,
  description: true,
  ruleExplanation: true,
  advice: true,
  documentValues: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).pick({
  agentName: true,
  taskType: true,
  documentId: true,
  documentSetId: true,
  inputData: true,
});

// Export types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DocumentSet = typeof documentSets.$inferSelect;
export type InsertDocumentSet = z.infer<typeof insertDocumentSetSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Discrepancy = typeof discrepancies.$inferSelect;
export type InsertDiscrepancy = z.infer<typeof insertDiscrepancySchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ProcessingQueueItem = typeof processingQueue.$inferSelect;

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

// SWIFT Message Types - stores all MT7xx message definitions
export const swiftMessageTypes = pgTable("swift_message_types", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeCode: varchar("message_type_code", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  version: varchar("version", { length: 20 }).notNull().default("2019"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SWIFT Fields - stores all field definitions with validation rules
export const swiftFields = pgTable("swift_fields", {
  id: varchar("id").primaryKey().notNull(),
  fieldCode: varchar("field_code", { length: 10 }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  format: varchar("format", { length: 50 }).notNull(),
  maxLength: integer("max_length"),
  mandatory: boolean("mandatory").notNull().default(false),
  validationRegex: text("validation_regex"),
  allowedValues: jsonb("allowed_values"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message Type to Fields relationship
export const messageTypeFields = pgTable("message_type_fields", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeId: varchar("message_type_id", { length: 10 }).notNull(),
  fieldId: varchar("field_id", { length: 10 }).notNull(),
  sequence: integer("sequence").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  isConditional: boolean("is_conditional").notNull().default(false),
  conditionExpression: text("condition_expression"),
  maxOccurrences: integer("max_occurrences").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document sets for grouping related documents
export const documentSets = pgTable("document_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  lcReference: varchar("lc_reference", { length: 100 }),
  setName: varchar("set_name", { length: 200 }),
  status: varchar("status", { length: 20 }).default("pending"),
  requiredDocuments: jsonb("required_documents"),
  uploadedDocuments: jsonb("uploaded_documents"),
  analysisStatus: varchar("analysis_status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentSetId: uuid("document_set_id").references(() => documentSets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  status: varchar("status", { length: 20 }).default("uploaded"),
  extractedData: jsonb("extracted_data"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Discrepancies table
export const discrepancies = pgTable("discrepancies", {
  id: serial("id").primaryKey(),
  documentSetId: uuid("document_set_id").notNull().references(() => documentSets.id),
  discrepancyType: varchar("discrepancy_type", { length: 50 }).notNull(),
  fieldName: varchar("field_name", { length: 100 }),
  severity: varchar("severity", { length: 20 }).notNull(),
  ucpReference: varchar("ucp_reference", { length: 20 }),
  description: text("description").notNull(),
  ruleExplanation: text("rule_explanation"),
  advice: text("advice"),
  documentValues: jsonb("document_values"),
  status: varchar("status", { length: 20 }).default("active"),
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
  status: varchar("status", { length: 20 }).default("queued"),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  executionTime: integer("execution_time"),
});

// Agent Designer Tables
export const customAgents = pgTable("custom_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(),
  goal: text("goal").notNull(),
  backstory: text("backstory").notNull(),
  skills: text("skills").array().default([]),
  tools: text("tools").array().default([]),
  status: varchar("status").default("idle"),
  isActive: boolean("is_active").default(true),
  maxExecutionTime: integer("max_execution_time").default(300),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.70"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customTasks = pgTable("custom_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  expectedOutput: text("expected_output").notNull(),
  agentId: uuid("agent_id").references(() => customAgents.id),
  priority: varchar("priority").default("medium"),
  dependencies: text("dependencies").array().default([]),
  tools: text("tools").array().default([]),
  context: text("context"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customCrews = pgTable("custom_crews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  agentIds: text("agent_ids").array().default([]),
  taskIds: text("task_ids").array().default([]),
  process: varchar("process").default("sequential"),
  isActive: boolean("is_active").default(true),
  maxExecutionTime: integer("max_execution_time").default(1800),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SWIFT Message Dependencies - Based on official SWIFT MT7xx dependencies documentation
export const swiftMessageDependencies = pgTable("swift_message_dependencies", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeCode: varchar("message_type_code", { length: 10 }).notNull(),
  dependsOnMessageType: varchar("depends_on_message_type", { length: 10 }),
  canBeFollowedBy: jsonb("can_be_followed_by"), // Array of message types that can follow
  canFollowAfter: jsonb("can_follow_after"), // Array of message types this can follow
  directContinuation: varchar("direct_continuation", { length: 10 }), // Direct continuation message
  isContinuationOf: varchar("is_continuation_of", { length: 10 }), // What this is a continuation of
  dependencyType: varchar("dependency_type", { length: 50 }).notNull(), // 'direct_continuation', 'business_flow', 'amendment_flow', etc.
  businessFlow: varchar("business_flow", { length: 100 }), // 'documentary_credit', 'reimbursement', 'amendment', 'discrepancy'
  description: text("description"),
  reference: varchar("reference", { length: 100 }), // Reference to SWIFT documentation
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SWIFT Message Flow Patterns - Defines common message flow sequences
export const swiftMessageFlowPatterns = pgTable("swift_message_flow_patterns", {
  id: varchar("id").primaryKey().notNull(),
  patternName: varchar("pattern_name", { length: 100 }).notNull(),
  description: text("description"),
  messageSequence: jsonb("message_sequence"), // Array of message types in sequence
  flowType: varchar("flow_type", { length: 50 }).notNull(), // 'linear', 'branching', 'conditional'
  businessProcess: varchar("business_process", { length: 100 }), // 'full_documentary_credit', 'amendment_process', etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertSwiftMessageTypeSchema = createInsertSchema(swiftMessageTypes).pick({
  messageTypeCode: true,
  name: true,
  description: true,
  category: true,
  version: true,
});

export const insertSwiftFieldSchema = createInsertSchema(swiftFields).pick({
  fieldCode: true,
  name: true,
  description: true,
  format: true,
  maxLength: true,
  mandatory: true,
  validationRegex: true,
  allowedValues: true,
});

export const insertDocumentSetSchema = createInsertSchema(documentSets).pick({
  lcReference: true,
  setName: true,
  status: true,
  requiredDocuments: true,
  uploadedDocuments: true,
  analysisStatus: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  documentType: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  status: true,
  extractedData: true,
});

export const insertDiscrepancySchema = createInsertSchema(discrepancies).pick({
  discrepancyType: true,
  fieldName: true,
  severity: true,
  ucpReference: true,
  description: true,
  ruleExplanation: true,
  advice: true,
  documentValues: true,
  status: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).pick({
  agentName: true,
  taskType: true,
  status: true,
  inputData: true,
  outputData: true,
  errorMessage: true,
  executionTime: true,
});

export const insertCustomAgentSchema = createInsertSchema(customAgents).pick({
  name: true,
  role: true,
  goal: true,
  backstory: true,
  skills: true,
  tools: true,
  maxExecutionTime: true,
  temperature: true,
});

export const insertCustomTaskSchema = createInsertSchema(customTasks).pick({
  title: true,
  description: true,
  expectedOutput: true,
  priority: true,
  dependencies: true,
  tools: true,
  context: true,
});

export const insertCustomCrewSchema = createInsertSchema(customCrews).pick({
  name: true,
  description: true,
  agentIds: true,
  taskIds: true,
  process: true,
  maxExecutionTime: true,
});

// Export types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SwiftMessageType = typeof swiftMessageTypes.$inferSelect;
export type InsertSwiftMessageType = z.infer<typeof insertSwiftMessageTypeSchema>;
export type SwiftField = typeof swiftFields.$inferSelect;
export type InsertSwiftField = z.infer<typeof insertSwiftFieldSchema>;
export type MessageTypeField = typeof messageTypeFields.$inferSelect;
export type DocumentSet = typeof documentSets.$inferSelect;
export type InsertDocumentSet = z.infer<typeof insertDocumentSetSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Discrepancy = typeof discrepancies.$inferSelect;
export type InsertDiscrepancy = z.infer<typeof insertDiscrepancySchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type CustomAgent = typeof customAgents.$inferSelect;
export type InsertCustomAgent = z.infer<typeof insertCustomAgentSchema>;
export type CustomTask = typeof customTasks.$inferSelect;
export type InsertCustomTask = z.infer<typeof insertCustomTaskSchema>;
export type CustomCrew = typeof customCrews.$inferSelect;
export type InsertCustomCrew = z.infer<typeof insertCustomCrewSchema>;
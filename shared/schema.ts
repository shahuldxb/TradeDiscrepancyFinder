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

export const crewExecutions = pgTable("crew_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  crewId: uuid("crew_id").references(() => customCrews.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status").default("pending"),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  executionTime: integer("execution_time"),
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

export const insertCustomAgentSchema = createInsertSchema(customAgents).pick({
  name: true,
  role: true,
  goal: true,
  backstory: true,
  skills: true,
  tools: true,
  status: true,
  isActive: true,
  maxExecutionTime: true,
  temperature: true,
});

export const insertCustomTaskSchema = createInsertSchema(customTasks).pick({
  title: true,
  description: true,
  expectedOutput: true,
  agentId: true,
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
  isActive: true,
  maxExecutionTime: true,
});

export const insertCrewExecutionSchema = createInsertSchema(crewExecutions).pick({
  crewId: true,
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

// Agent Designer Types
export type CustomAgent = typeof customAgents.$inferSelect;
export type InsertCustomAgent = z.infer<typeof insertCustomAgentSchema>;
export type CustomTask = typeof customTasks.$inferSelect;
export type InsertCustomTask = z.infer<typeof insertCustomTaskSchema>;
export type CustomCrew = typeof customCrews.$inferSelect;
export type InsertCustomCrew = z.infer<typeof insertCustomCrewSchema>;
export type CrewExecution = typeof crewExecutions.$inferSelect;
export type InsertCrewExecution = z.infer<typeof insertCrewExecutionSchema>;

// MT xxx Digitization Tables
export const swiftMessageTypes = pgTable("swift_message_types", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeCode: varchar("message_type_code", { length: 10 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  version: varchar("version", { length: 20 }).notNull().default("2019"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swiftFields = pgTable("swift_fields", {
  id: varchar("id").primaryKey().notNull(),
  fieldCode: varchar("field_code", { length: 10 }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  format: varchar("format", { length: 50 }).notNull(),
  maxLength: integer("max_length"),
  validationRegex: text("validation_regex"),
  allowedValues: jsonb("allowed_values"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messageTypeFields = pgTable("message_type_fields", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeId: varchar("message_type_id").notNull().references(() => swiftMessageTypes.id),
  fieldId: varchar("field_id").notNull().references(() => swiftFields.id),
  sequence: integer("sequence").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  isConditional: boolean("is_conditional").notNull().default(false),
  conditionExpression: text("condition_expression"),
  maxOccurrences: integer("max_occurrences").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fieldDependencies = pgTable("field_dependencies_swift", {
  id: varchar("id").primaryKey().notNull(),
  sourceFieldId: varchar("source_field_id").notNull().references(() => swiftFields.id),
  targetFieldId: varchar("target_field_id").notNull().references(() => swiftFields.id),
  messageTypeId: varchar("message_type_id").references(() => swiftMessageTypes.id),
  dependencyType: varchar("dependency_type", { length: 50 }).notNull(),
  conditionExpression: text("condition_expression"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swiftValidationRules = pgTable("swift_validation_rules", {
  id: varchar("id").primaryKey().notNull(),
  fieldId: varchar("field_id").notNull().references(() => swiftFields.id),
  messageTypeId: varchar("message_type_id").references(() => swiftMessageTypes.id),
  ruleType: varchar("rule_type", { length: 50 }).notNull(),
  ruleExpression: text("rule_expression").notNull(),
  errorMessage: text("error_message").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("error"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swiftMessages = pgTable("swift_messages", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeId: varchar("message_type_id").notNull().references(() => swiftMessageTypes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  referenceNumber: varchar("reference_number", { length: 100 }),
  content: text("content").notNull(),
  parsedFields: jsonb("parsed_fields"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  isTemplate: boolean("is_template").notNull().default(false),
  templateName: varchar("template_name", { length: 255 }),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swiftValidationResults = pgTable("swift_validation_results", {
  id: varchar("id").primaryKey().notNull(),
  messageId: varchar("message_id").notNull().references(() => swiftMessages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isValid: boolean("is_valid").notNull(),
  totalErrors: integer("total_errors").notNull().default(0),
  totalWarnings: integer("total_warnings").notNull().default(0),
  validationSummary: jsonb("validation_summary"),
  processingTime: integer("processing_time"),
  validatedAt: timestamp("validated_at").defaultNow(),
});

export const swiftValidationErrors = pgTable("swift_validation_errors", {
  id: varchar("id").primaryKey().notNull(),
  validationResultId: varchar("validation_result_id").notNull().references(() => swiftValidationResults.id),
  fieldId: varchar("field_id").references(() => swiftFields.id),
  ruleId: varchar("rule_id").references(() => swiftValidationRules.id),
  errorType: varchar("error_type", { length: 50 }).notNull(),
  errorMessage: text("error_message").notNull(),
  fieldPath: varchar("field_path", { length: 200 }),
  actualValue: text("actual_value"),
  expectedValue: text("expected_value"),
  severity: varchar("severity", { length: 20 }).notNull().default("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SWIFT Templates table for storing message templates
export const swiftTemplates = pgTable("swift_templates", {
  id: varchar("id").primaryKey().notNull(),
  templateId: varchar("template_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  messageTypeId: varchar("message_type_id").notNull().references(() => swiftMessageTypes.id),
  templateFields: jsonb("template_fields").notNull(), // Pre-filled field values
  isActive: boolean("is_active").notNull().default(true),
  isPublic: boolean("is_public").notNull().default(true),
  userId: varchar("user_id").references(() => users.id), // Creator if custom template
  usageCount: integer("usage_count").notNull().default(0),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SWIFT Field Format Rules for validation patterns
export const swiftFieldFormats = pgTable("swift_field_formats", {
  id: varchar("id").primaryKey().notNull(),
  formatCode: varchar("format_code", { length: 10 }).notNull().unique(),
  description: text("description").notNull(),
  regexPattern: text("regex_pattern").notNull(),
  validationRules: jsonb("validation_rules"), // Additional validation logic
  examples: text("examples").array().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SWIFT Business Rules for complex validation logic
export const swiftBusinessRules = pgTable("swift_business_rules", {
  id: varchar("id").primaryKey().notNull(),
  ruleCode: varchar("rule_code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  messageTypeIds: text("message_type_ids").array().default([]), // Applicable message types
  fieldIds: text("field_ids").array().default([]), // Applicable fields
  ruleLogic: text("rule_logic").notNull(), // Business logic expression
  errorMessage: text("error_message").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("error"),
  ucpReference: varchar("ucp_reference", { length: 50 }), // UCP 600 article reference
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SWIFT Message Relationships for tracking dependencies
export const swiftMessageRelationships = pgTable("swift_message_relationships", {
  id: varchar("id").primaryKey().notNull(),
  parentMessageTypeId: varchar("parent_message_type_id").notNull().references(() => swiftMessageTypes.id),
  childMessageTypeId: varchar("child_message_type_id").notNull().references(() => swiftMessageTypes.id),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // follows, amends, cancels, etc.
  description: text("description"),
  conditionExpression: text("condition_expression"), // When this relationship applies
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Country and Currency codes (ISO standards)
export const countryCodes = pgTable("country_codes", {
  id: varchar("id").primaryKey().notNull(),
  countryCode: varchar("country_code", { length: 3 }).notNull().unique(), // ISO 3166-1 alpha-3
  countryName: varchar("country_name", { length: 255 }).notNull(),
  alpha2Code: varchar("alpha2_code", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  numericCode: varchar("numeric_code", { length: 3 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const currencyCodes = pgTable("currency_codes", {
  id: varchar("id").primaryKey().notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().unique(), // ISO 4217
  currencyName: varchar("currency_name", { length: 255 }).notNull(),
  numericCode: varchar("numeric_code", { length: 3 }).notNull(),
  minorUnit: integer("minor_unit").notNull().default(2), // Decimal places
  isActive: boolean("is_active").notNull().default(true),
});

// Bank codes and routing information
export const bankCodes = pgTable("bank_codes", {
  id: varchar("id").primaryKey().notNull(),
  bicCode: varchar("bic_code", { length: 11 }).notNull().unique(), // SWIFT BIC
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  countryCode: varchar("country_code", { length: 3 }).notNull().references(() => countryCodes.countryCode),
  cityName: varchar("city_name", { length: 100 }),
  branchCode: varchar("branch_code", { length: 3 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertSwiftTemplateSchema = createInsertSchema(swiftTemplates).pick({
  templateId: true,
  name: true,
  description: true,
  category: true,
  messageTypeId: true,
  templateFields: true,
  isActive: true,
  isPublic: true,
  tags: true,
});

export const insertSwiftFieldFormatSchema = createInsertSchema(swiftFieldFormats).pick({
  formatCode: true,
  description: true,
  regexPattern: true,
  validationRules: true,
  examples: true,
});

export const insertSwiftBusinessRuleSchema = createInsertSchema(swiftBusinessRules).pick({
  ruleCode: true,
  name: true,
  description: true,
  messageTypeIds: true,
  fieldIds: true,
  ruleLogic: true,
  errorMessage: true,
  severity: true,
  ucpReference: true,
});

// Types for new tables
export type SwiftTemplate = typeof swiftTemplates.$inferSelect;
export type InsertSwiftTemplate = z.infer<typeof insertSwiftTemplateSchema>;
export type SwiftFieldFormat = typeof swiftFieldFormats.$inferSelect;
export type InsertSwiftFieldFormat = z.infer<typeof insertSwiftFieldFormatSchema>;
export type SwiftBusinessRule = typeof swiftBusinessRules.$inferSelect;
export type InsertSwiftBusinessRule = z.infer<typeof insertSwiftBusinessRuleSchema>;
export type SwiftMessageRelationship = typeof swiftMessageRelationships.$inferSelect;
export type CountryCode = typeof countryCodes.$inferSelect;
export type CurrencyCode = typeof currencyCodes.$inferSelect;
export type BankCode = typeof bankCodes.$inferSelect;
  position: integer("position"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swiftTemplates = pgTable("swift_templates", {
  id: varchar("id").primaryKey().notNull(),
  messageTypeId: varchar("message_type_id").notNull().references(() => swiftMessageTypes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateContent: text("template_content").notNull(),
  defaultValues: jsonb("default_values"),
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messageInteractions = pgTable("message_interactions", {
  id: varchar("id").primaryKey().notNull(),
  parentMessageId: varchar("parent_message_id").notNull().references(() => swiftMessages.id),
  childMessageId: varchar("child_message_id").notNull().references(() => swiftMessages.id),
  interactionType: varchar("interaction_type", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const digitizationProjects = pgTable("digitization_projects", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  messageTypes: jsonb("message_types"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  totalMessages: integer("total_messages").notNull().default(0),
  completedMessages: integer("completed_messages").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for SWIFT digitization
export const insertSwiftMessageTypeSchema = createInsertSchema(swiftMessageTypes).pick({
  messageTypeCode: true,
  description: true,
  category: true,
  version: true,
  isActive: true,
});

export const insertSwiftFieldSchema = createInsertSchema(swiftFields).pick({
  fieldCode: true,
  name: true,
  description: true,
  format: true,
  maxLength: true,
  validationRegex: true,
  allowedValues: true,
  isActive: true,
});

export const insertMessageTypeFieldSchema = createInsertSchema(messageTypeFields).pick({
  messageTypeId: true,
  fieldId: true,
  sequence: true,
  isMandatory: true,
  isConditional: true,
  conditionExpression: true,
  maxOccurrences: true,
  isActive: true,
});

export const insertSwiftMessageSchema = createInsertSchema(swiftMessages).pick({
  messageTypeId: true,
  referenceNumber: true,
  content: true,
  parsedFields: true,
  status: true,
  isTemplate: true,
  templateName: true,
});

export const insertSwiftTemplateSchema = createInsertSchema(swiftTemplates).pick({
  messageTypeId: true,
  name: true,
  description: true,
  templateContent: true,
  defaultValues: true,
  isPublic: true,
  isActive: true,
});

export const insertDigitizationProjectSchema = createInsertSchema(digitizationProjects).pick({
  name: true,
  description: true,
  messageTypes: true,
  status: true,
});

// SWIFT Digitization Types
export type SwiftMessageType = typeof swiftMessageTypes.$inferSelect;
export type InsertSwiftMessageType = z.infer<typeof insertSwiftMessageTypeSchema>;
export type SwiftField = typeof swiftFields.$inferSelect;
export type InsertSwiftField = z.infer<typeof insertSwiftFieldSchema>;
export type MessageTypeField = typeof messageTypeFields.$inferSelect;
export type InsertMessageTypeField = z.infer<typeof insertMessageTypeFieldSchema>;
export type FieldDependency = typeof fieldDependencies.$inferSelect;
export type SwiftValidationRule = typeof swiftValidationRules.$inferSelect;
export type SwiftMessage = typeof swiftMessages.$inferSelect;
export type InsertSwiftMessage = z.infer<typeof insertSwiftMessageSchema>;
export type SwiftValidationResult = typeof swiftValidationResults.$inferSelect;
export type SwiftValidationError = typeof swiftValidationErrors.$inferSelect;
export type SwiftTemplate = typeof swiftTemplates.$inferSelect;
export type InsertSwiftTemplate = z.infer<typeof insertSwiftTemplateSchema>;
export type MessageInteraction = typeof messageInteractions.$inferSelect;
export type DigitizationProject = typeof digitizationProjects.$inferSelect;
export type InsertDigitizationProject = z.infer<typeof insertDigitizationProjectSchema>;

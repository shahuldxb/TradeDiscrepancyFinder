// PostgreSQL schema removed - all data now managed by Azure SQL
// This file provides type definitions for consistency across the application

// User types for authentication (managed by Azure SQL)
export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  customerSegment?: string | null;
  operationSegment?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpsertUser {
  id?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  customerSegment?: string | null;
  operationSegment?: string | null;
}

// Document Set types
export interface DocumentSet {
  id: string;
  userId: string;
  lcReference?: string | null;
  setName?: string | null;
  status?: string;
  requiredDocuments?: any;
  uploadedDocuments?: any;
  analysisStatus?: string;
  createdAt?: Date;
  completedAt?: Date | null;
}

export interface InsertDocumentSet {
  lcReference?: string | null;
  setName?: string | null;
  status?: string;
  requiredDocuments?: any;
  uploadedDocuments?: any;
  analysisStatus?: string;
}

// Document types
export interface Document {
  id: number;
  documentSetId?: string | null;
  userId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  status?: string;
  extractedData?: any;
  uploadedAt?: Date;
  processedAt?: Date | null;
}

export interface InsertDocument {
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  status?: string;
  extractedData?: any;
}

// Discrepancy types
export interface Discrepancy {
  id: number;
  documentSetId: string;
  discrepancyType: string;
  fieldName?: string | null;
  severity: string;
  ucpReference?: string | null;
  description: string;
  ruleExplanation?: string | null;
  advice?: string | null;
  documentValues?: any;
  status?: string;
  detectedAt?: Date;
  resolvedAt?: Date | null;
}

export interface InsertDiscrepancy {
  discrepancyType: string;
  fieldName?: string | null;
  severity: string;
  ucpReference?: string | null;
  description: string;
  ruleExplanation?: string | null;
  advice?: string | null;
  documentValues?: any;
  status?: string;
}

// Agent Task types
export interface AgentTask {
  id: number;
  agentName: string;
  taskType: string;
  documentId?: number | null;
  documentSetId?: string | null;
  status?: string;
  inputData?: any;
  outputData?: any;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  executionTime?: number | null;
}

export interface InsertAgentTask {
  agentName: string;
  taskType: string;
  status?: string;
  inputData?: any;
  outputData?: any;
  errorMessage?: string | null;
  executionTime?: number | null;
}

// Custom Agent types
export interface CustomAgent {
  id: string;
  userId: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  skills?: string[];
  tools?: string[];
  status?: string;
  isActive?: boolean;
  maxExecutionTime?: number;
  temperature?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertCustomAgent {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  skills?: string[];
  tools?: string[];
  maxExecutionTime?: number;
  temperature?: number;
}

// Custom Task types
export interface CustomTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  expectedOutput: string;
  agentId?: string | null;
  priority?: string;
  dependencies?: string[];
  tools?: string[];
  context?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertCustomTask {
  title: string;
  description: string;
  expectedOutput: string;
  priority?: string;
  dependencies?: string[];
  tools?: string[];
  context?: string | null;
}

// Custom Crew types
export interface CustomCrew {
  id: string;
  userId: string;
  name: string;
  description: string;
  agentIds?: string[];
  taskIds?: string[];
  process?: string;
  isActive?: boolean;
  maxExecutionTime?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertCustomCrew {
  name: string;
  description: string;
  agentIds?: string[];
  taskIds?: string[];
  process?: string;
  maxExecutionTime?: number;
}

// SWIFT Message types
export interface SwiftMessageType {
  id: string;
  messageTypeCode: string;
  name: string;
  description: string;
  category: string;
  version?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertSwiftMessageType {
  messageTypeCode: string;
  name: string;
  description: string;
  category: string;
  version?: string;
}

// SWIFT Field types
export interface SwiftField {
  id: string;
  fieldCode: string;
  name: string;
  description: string;
  format: string;
  maxLength?: number | null;
  mandatory?: boolean;
  validationRegex?: string | null;
  allowedValues?: any;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertSwiftField {
  fieldCode: string;
  name: string;
  description: string;
  format: string;
  maxLength?: number | null;
  mandatory?: boolean;
  validationRegex?: string | null;
  allowedValues?: any;
}

// Message Type Field relationship
export interface MessageTypeField {
  id: string;
  messageTypeId: string;
  fieldId: string;
  sequence: number;
  isMandatory?: boolean;
  isConditional?: boolean;
  conditionExpression?: string | null;
  maxOccurrences?: number | null;
  isActive?: boolean;
  createdAt?: Date;
}

// Validation schemas (simplified without Zod)
export const insertUserSchema = {
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  customerSegment: true,
  operationSegment: true,
};

export const insertSwiftMessageTypeSchema = {
  messageTypeCode: true,
  name: true,
  description: true,
  category: true,
  version: true,
};

export const insertSwiftFieldSchema = {
  fieldCode: true,
  name: true,
  description: true,
  format: true,
  maxLength: true,
  mandatory: true,
  validationRegex: true,
  allowedValues: true,
};

export const insertDocumentSetSchema = {
  lcReference: true,
  setName: true,
  status: true,
  requiredDocuments: true,
  uploadedDocuments: true,
  analysisStatus: true,
};

export const insertDocumentSchema = {
  documentType: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  status: true,
  extractedData: true,
};

export const insertDiscrepancySchema = {
  discrepancyType: true,
  fieldName: true,
  severity: true,
  ucpReference: true,
  description: true,
  ruleExplanation: true,
  advice: true,
  documentValues: true,
  status: true,
};

export const insertAgentTaskSchema = {
  agentName: true,
  taskType: true,
  status: true,
  inputData: true,
  outputData: true,
  errorMessage: true,
  executionTime: true,
};

export const insertCustomAgentSchema = {
  name: true,
  role: true,
  goal: true,
  backstory: true,
  skills: true,
  tools: true,
  maxExecutionTime: true,
  temperature: true,
};

export const insertCustomTaskSchema = {
  title: true,
  description: true,
  expectedOutput: true,
  priority: true,
  dependencies: true,
  tools: true,
  context: true,
};

export const insertCustomCrewSchema = {
  name: true,
  description: true,
  agentIds: true,
  taskIds: true,
  process: true,
  maxExecutionTime: true,
};
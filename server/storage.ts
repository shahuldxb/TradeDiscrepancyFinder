import { azureAgentService } from "./azureAgentService";
import { azureDataService } from "./azureDataService";

// Storage interface now using Azure SQL
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<any | undefined>;
  upsertUser(user: any): Promise<any>;

  // Document Set operations
  getDocumentSetsByUser(userId: string): Promise<any[]>;
  createDocumentSet(data: any): Promise<any>;
  getDocumentSetWithDetails(id: string, userId: string): Promise<any>;

  // Document operations
  createDocument(data: any): Promise<any>;
  getDocumentStatus(documentId: number, userId: string): Promise<any>;

  // Discrepancy operations
  createDiscrepancy(data: any): Promise<any>;
  getDiscrepanciesByDocumentSet(documentSetId: string): Promise<any[]>;

  // Agent Task operations
  createAgentTask(data: any): Promise<any>;

  // Custom Agent Designer operations (now using Azure SQL)
  getCustomAgentsByUser(userId: string): Promise<any[]>;
  createCustomAgent(data: any): Promise<any>;
  getCustomTasksByUser(userId: string): Promise<any[]>;
  createCustomTask(data: any): Promise<any>;
  getCustomCrewsByUser(userId: string): Promise<any[]>;
  createCustomCrew(data: any): Promise<any>;

  // SWIFT MT7xx operations
  getSwiftMessageTypes(): Promise<any[]>;
  getSwiftFieldsByMessageType(messageTypeCode: string): Promise<any[]>;
  getAllSwiftFields(): Promise<any[]>;
}

export class AzureStorage implements IStorage {
  // User operations using Azure SQL
  async getUser(id: string): Promise<any | undefined> {
    try {
      return await azureAgentService.getUser(id);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async upsertUser(userData: any): Promise<any> {
    try {
      return await azureAgentService.upsertUser(userData);
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Document Set operations using Azure SQL
  async getDocumentSetsByUser(userId: string): Promise<any[]> {
    try {
      return await azureDataService.getDocumentSets(userId);
    } catch (error) {
      console.error('Error getting document sets:', error);
      return [];
    }
  }

  async createDocumentSet(data: any): Promise<any> {
    try {
      return await azureDataService.createDocumentSet(data);
    } catch (error) {
      console.error('Error creating document set:', error);
      throw error;
    }
  }

  async getDocumentSetWithDetails(id: string, userId: string): Promise<any> {
    try {
      const documentSets = await azureDataService.getDocumentSets(userId);
      return documentSets.find(ds => ds.id === id);
    } catch (error) {
      console.error('Error getting document set details:', error);
      return null;
    }
  }

  // Document operations using Azure SQL
  async createDocument(data: any): Promise<any> {
    try {
      // Use Azure data service for document operations
      return await azureDataService.createDocumentSet(data);
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async getDocumentStatus(documentId: number, userId: string): Promise<any> {
    try {
      const documentSets = await azureDataService.getDocumentSets(userId);
      return documentSets.find(ds => ds.id === documentId);
    } catch (error) {
      console.error('Error getting document status:', error);
      return null;
    }
  }

  // Discrepancy operations using Azure SQL
  async createDiscrepancy(data: any): Promise<any> {
    try {
      return await azureDataService.createDiscrepancy(data);
    } catch (error) {
      console.error('Error creating discrepancy:', error);
      throw error;
    }
  }

  async getDiscrepanciesByDocumentSet(documentSetId: string): Promise<any[]> {
    try {
      return await azureDataService.getDiscrepancies({ documentSetId });
    } catch (error) {
      console.error('Error getting discrepancies:', error);
      return [];
    }
  }

  // Agent Task operations using Azure SQL
  async createAgentTask(data: any): Promise<any> {
    try {
      return await azureAgentService.createAgentTask(data);
    } catch (error) {
      console.error('Error creating agent task:', error);
      throw error;
    }
  }

  // Custom Agent Designer operations using Azure SQL
  async getCustomAgentsByUser(userId: string): Promise<any[]> {
    try {
      return await azureAgentService.getCustomAgents(userId);
    } catch (error) {
      console.error('Error getting custom agents:', error);
      return [];
    }
  }

  async createCustomAgent(data: any): Promise<any> {
    try {
      return await azureAgentService.createCustomAgent(data);
    } catch (error) {
      console.error('Error creating custom agent:', error);
      throw error;
    }
  }

  async getCustomTasksByUser(userId: string): Promise<any[]> {
    try {
      // Use Azure agent service for tasks
      return await azureAgentService.getAgentTasks({ userId });
    } catch (error) {
      console.error('Error getting custom tasks:', error);
      return [];
    }
  }

  async createCustomTask(data: any): Promise<any> {
    try {
      return await azureAgentService.createAgentTask(data);
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  }

  async getCustomCrewsByUser(userId: string): Promise<any[]> {
    try {
      // Custom crews can be retrieved from agent service
      return await azureAgentService.getCustomAgents(userId);
    } catch (error) {
      console.error('Error getting custom crews:', error);
      return [];
    }
  }

  async createCustomCrew(data: any): Promise<any> {
    try {
      return await azureAgentService.createCustomAgent(data);
    } catch (error) {
      console.error('Error creating custom crew:', error);
      throw error;
    }
  }

  // SWIFT MT7xx operations using Azure SQL
  async getSwiftMessageTypes(): Promise<any[]> {
    try {
      return await azureDataService.getSwiftMessageTypes();
    } catch (error) {
      console.error('Error getting SWIFT message types:', error);
      return [];
    }
  }

  async getSwiftFieldsByMessageType(messageTypeCode: string): Promise<any[]> {
    try {
      return await azureDataService.getSwiftFieldsByMessageType(messageTypeCode);
    } catch (error) {
      console.error('Error getting SWIFT fields:', error);
      return [];
    }
  }

  async getAllSwiftFields(): Promise<any[]> {
    try {
      return await azureDataService.getSwiftFields();
    } catch (error) {
      console.error('Error getting all SWIFT fields:', error);
      return [];
    }
  }
}

export const storage = new AzureStorage();
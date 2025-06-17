/**
 * Azure Document Intelligence Service
 * 
 * Provides comprehensive forms classification and field extraction
 * for trade finance documents using Azure's Document Intelligence API
 */

import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";

interface ClassificationResult {
  documentType: string;
  confidence: number;
  extractedFields: Record<string, any>;
  modelUsed: string;
  processingTime: number;
}

interface DocumentField {
  value: any;
  confidence: number;
  content?: string;
  boundingRegions?: any[];
}

export class AzureDocumentIntelligenceService {
  private client: DocumentAnalysisClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      console.warn('Azure Document Intelligence credentials not found. Classification will use fallback method.');
      this.isInitialized = false;
      return;
    }

    try {
      this.client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
      this.isInitialized = true;
      console.log('Azure Document Intelligence client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure Document Intelligence client:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Classify and extract data from a document using Azure Document Intelligence
   */
  async analyzeDocument(filePath: string, fileName: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    if (!this.isInitialized || !this.client) {
      return this.fallbackClassification(fileName, startTime);
    }

    try {
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(filePath);

      // Determine the best model based on file type and content
      const modelId = this.selectOptimalModel(fileName);
      
      console.log(`🔍 Analyzing ${fileName} with Azure Document Intelligence model: ${modelId}`);

      const poller = await this.client.beginAnalyzeDocument(modelId, fileBuffer);
      const result = await poller.pollUntilDone();

      const classification = this.processAnalysisResult(result, modelId, startTime);
      
      console.log(`✅ Azure Document Intelligence classified ${fileName} as ${classification.documentType} with ${classification.confidence}% confidence`);
      
      return classification;

    } catch (error) {
      console.error('Azure Document Intelligence analysis failed:', error);
      return this.fallbackClassification(fileName, startTime);
    }
  }

  /**
   * Select the optimal Azure Document Intelligence model based on document characteristics
   */
  private selectOptimalModel(fileName: string): string {
    const lowerFileName = fileName.toLowerCase();

    // Prebuilt models for common trade finance documents
    if (lowerFileName.includes('invoice') || lowerFileName.includes('commercial')) {
      return 'prebuilt-invoice';
    }
    
    if (lowerFileName.includes('receipt')) {
      return 'prebuilt-receipt';
    }
    
    if (lowerFileName.includes('id') || lowerFileName.includes('license') || lowerFileName.includes('passport')) {
      return 'prebuilt-idDocument';
    }
    
    if (lowerFileName.includes('business') || lowerFileName.includes('card')) {
      return 'prebuilt-businessCard';
    }

    // For trade finance documents, use layout model for comprehensive analysis
    if (lowerFileName.includes('bill') || 
        lowerFileName.includes('lading') || 
        lowerFileName.includes('certificate') || 
        lowerFileName.includes('origin') || 
        lowerFileName.includes('packing') || 
        lowerFileName.includes('manifest')) {
      return 'prebuilt-layout';
    }

    // Default to general document model
    return 'prebuilt-document';
  }

  /**
   * Process Azure Document Intelligence analysis results
   */
  private processAnalysisResult(result: any, modelId: string, startTime: number): ClassificationResult {
    const processingTime = Date.now() - startTime;
    const extractedFields: Record<string, any> = {};

    // Extract document type and confidence
    let documentType = 'Unknown Document';
    let confidence = 0;

    if (result.docType) {
      documentType = this.mapDocTypeToBusinessType(result.docType);
      confidence = Math.round((result.confidence || 0) * 100);
    }

    // Extract fields from the analysis
    if (result.documents && result.documents.length > 0) {
      const document = result.documents[0];
      
      if (document.fields) {
        for (const [fieldName, fieldData] of Object.entries(document.fields as Record<string, DocumentField>)) {
          extractedFields[fieldName] = {
            value: fieldData.value,
            confidence: Math.round((fieldData.confidence || 0) * 100),
            content: fieldData.content
          };
        }
      }

      // Update confidence and document type from document analysis
      if (document.docType) {
        documentType = this.mapDocTypeToBusinessType(document.docType);
        confidence = Math.round((document.confidence || 0) * 100);
      }
    }

    // Extract tables if present
    if (result.tables && result.tables.length > 0) {
      extractedFields.tables = result.tables.map((table: any) => ({
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        cells: table.cells.map((cell: any) => ({
          content: cell.content,
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
          confidence: Math.round((cell.confidence || 0) * 100)
        }))
      }));
    }

    // Extract key-value pairs
    if (result.keyValuePairs && result.keyValuePairs.length > 0) {
      extractedFields.keyValuePairs = result.keyValuePairs.map((kvp: any) => ({
        key: kvp.key?.content || '',
        value: kvp.value?.content || '',
        confidence: Math.round((kvp.confidence || 0) * 100)
      }));
    }

    return {
      documentType,
      confidence,
      extractedFields,
      modelUsed: modelId,
      processingTime
    };
  }

  /**
   * Map Azure Document Intelligence document types to business document types
   */
  private mapDocTypeToBusinessType(docType: string): string {
    const mappings: Record<string, string> = {
      'invoice': 'Commercial Invoice',
      'receipt': 'Receipt',
      'idDocument': 'Identity Document',
      'businessCard': 'Business Card',
      'document': 'General Document',
      'layout': 'Structured Document'
    };

    // Check for trade finance specific patterns
    if (docType.includes('invoice') || docType.includes('commercial')) {
      return 'Commercial Invoice';
    }
    
    if (docType.includes('bill') && docType.includes('lading')) {
      return 'Bill of Lading';
    }
    
    if (docType.includes('certificate')) {
      return 'Certificate of Origin';
    }
    
    if (docType.includes('packing')) {
      return 'Packing List';
    }
    
    if (docType.includes('manifest')) {
      return 'Cargo Manifest';
    }

    return mappings[docType] || 'Unknown Document';
  }

  /**
   * Fallback classification when Azure Document Intelligence is not available
   */
  private fallbackClassification(fileName: string, startTime: number): ClassificationResult {
    const processingTime = Date.now() - startTime;
    const lowerFileName = fileName.toLowerCase();

    let documentType = 'Unknown Document';
    let confidence = 60; // Lower confidence for fallback classification

    // Basic filename-based classification
    if (lowerFileName.includes('invoice') || lowerFileName.includes('commercial')) {
      documentType = 'Commercial Invoice';
      confidence = 75;
    } else if (lowerFileName.includes('bill') && lowerFileName.includes('lading')) {
      documentType = 'Bill of Lading';
      confidence = 75;
    } else if (lowerFileName.includes('certificate') || lowerFileName.includes('origin')) {
      documentType = 'Certificate of Origin';
      confidence = 75;
    } else if (lowerFileName.includes('packing')) {
      documentType = 'Packing List';
      confidence = 75;
    } else if (lowerFileName.includes('manifest')) {
      documentType = 'Cargo Manifest';
      confidence = 75;
    }

    console.log(`📋 Fallback classification: ${fileName} → ${documentType} (${confidence}% confidence)`);

    return {
      documentType,
      confidence,
      extractedFields: {},
      modelUsed: 'fallback-filename-analysis',
      processingTime
    };
  }

  /**
   * Get available Azure Document Intelligence models
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.isInitialized || !this.client) {
      return ['fallback-filename-analysis'];
    }

    try {
      const models = await this.client.listDocumentModels();
      const modelIds: string[] = [];
      
      for await (const model of models) {
        modelIds.push(model.modelId);
      }
      
      return modelIds;
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return ['fallback-filename-analysis'];
    }
  }

  /**
   * Check if Azure Document Intelligence service is available
   */
  isServiceAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }
}

export const azureDocumentIntelligence = new AzureDocumentIntelligenceService();
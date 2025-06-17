/**
 * Azure Forms Classification Service
 * 
 * Provides comprehensive document classification and field extraction
 * for individual PDFs and text files using Azure Document Intelligence
 */

import { azureDocumentIntelligence } from './azureDocumentIntelligence';

export interface ClassificationResult {
  documentType: string;
  confidence: number;
  extractedFields: Record<string, any>;
  modelUsed: string;
  processingTime: number;
}

export interface EnhancedProcessingResult {
  ocrText: string;
  classificationResult: ClassificationResult;
  enhancedFields: any;
  documentType: string;
  confidence: number;
  processingMethod: string;
}

export class AzureFormsClassifier {
  
  /**
   * Perform Azure Document Intelligence classification on uploaded files
   */
  async performAzureClassification(filename: string): Promise<ClassificationResult> {
    try {
      const path = await import('path');
      const fs = await import('fs');
      
      // Find the actual file path in uploads directory
      const uploadsDir = path.resolve('uploads');
      const files = fs.readdirSync(uploadsDir);
      
      let actualFilePath = null;
      let mostRecentTime = 0;
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile() && stats.mtimeMs > mostRecentTime) {
          actualFilePath = filePath;
          mostRecentTime = stats.mtimeMs;
        }
      }
      
      if (!actualFilePath) {
        throw new Error(`No files found for Azure classification: ${filename}`);
      }
      
      console.log(`🔍 Starting Azure Document Intelligence analysis for ${filename}`);
      const classificationResult = await azureDocumentIntelligence.analyzeDocument(actualFilePath, filename);
      
      console.log(`✅ Azure classification complete: ${classificationResult.documentType} (${classificationResult.confidence}% confidence)`);
      return classificationResult;
    } catch (error) {
      console.error('Azure Document Intelligence classification failed:', error);
      // Fallback classification
      return {
        documentType: this.classifyDocumentByName(filename),
        confidence: 60,
        extractedFields: {},
        modelUsed: 'fallback-filename-analysis',
        processingTime: 0
      };
    }
  }

  /**
   * Fallback document classification based on filename patterns
   */
  private classifyDocumentByName(filename: string): string {
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.includes('invoice') || lowerFilename.includes('commercial')) {
      return 'Commercial Invoice';
    } else if (lowerFilename.includes('bill') && lowerFilename.includes('lading')) {
      return 'Bill of Lading';
    } else if (lowerFilename.includes('certificate') || lowerFilename.includes('origin')) {
      return 'Certificate of Origin';
    } else if (lowerFilename.includes('packing')) {
      return 'Packing List';
    } else if (lowerFilename.includes('manifest')) {
      return 'Cargo Manifest';
    } else if (lowerFilename.includes('bill') && lowerFilename.includes('exchange')) {
      return 'Bill of Exchange';
    }
    
    return 'Trade Finance Document';
  }

  /**
   * Enhanced field extraction combining OCR text with Azure Document Intelligence results
   */
  async enhanceFieldExtraction(ocrText: string, classificationResult: ClassificationResult): Promise<any> {
    const enhancedFields: any = {
      // Basic OCR data
      extractedText: ocrText,
      textLength: ocrText.length,
      wordCount: ocrText.split(/\s+/).length,
      
      // Azure Document Intelligence results
      documentType: classificationResult.documentType,
      confidence: classificationResult.confidence,
      modelUsed: classificationResult.modelUsed,
      processingTime: classificationResult.processingTime,
      
      // Azure extracted fields
      azureFields: classificationResult.extractedFields || {}
    };

    // Document-specific field extraction
    switch (classificationResult.documentType) {
      case 'Commercial Invoice':
        enhancedFields.invoiceSpecific = this.extractInvoiceFields(ocrText, classificationResult.extractedFields);
        break;
      case 'Bill of Lading':
        enhancedFields.bolSpecific = this.extractBillOfLadingFields(ocrText, classificationResult.extractedFields);
        break;
      case 'Certificate of Origin':
        enhancedFields.certificateSpecific = this.extractCertificateFields(ocrText, classificationResult.extractedFields);
        break;
      case 'Packing List':
        enhancedFields.packingSpecific = this.extractPackingListFields(ocrText, classificationResult.extractedFields);
        break;
      case 'Bill of Exchange':
        enhancedFields.exchangeSpecific = this.extractBillOfExchangeFields(ocrText, classificationResult.extractedFields);
        break;
    }
    
    return enhancedFields;
  }

  /**
   * Extract Commercial Invoice specific fields
   */
  private extractInvoiceFields(text: string, azureFields: any): any {
    const invoiceFields: any = {};
    
    // Extract invoice number
    const invoiceNumberMatch = text.match(/invoice\s*(?:no|number|#)[:\s]*([A-Z0-9\-]+)/i);
    if (invoiceNumberMatch) {
      invoiceFields.invoiceNumber = invoiceNumberMatch[1];
    }
    
    // Extract total amount
    const totalMatch = text.match(/total[:\s]*\$?([0-9,]+\.?[0-9]*)/i);
    if (totalMatch) {
      invoiceFields.totalAmount = totalMatch[1];
    }
    
    // Extract date
    const dateMatch = text.match(/date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dateMatch) {
      invoiceFields.invoiceDate = dateMatch[1];
    }

    // Extract seller/buyer information
    const sellerMatch = text.match(/seller[:\s]*([^\n]+)/i);
    if (sellerMatch) {
      invoiceFields.seller = sellerMatch[1].trim();
    }

    const buyerMatch = text.match(/buyer[:\s]*([^\n]+)/i);
    if (buyerMatch) {
      invoiceFields.buyer = buyerMatch[1].trim();
    }
    
    return { ...invoiceFields, ...azureFields };
  }

  /**
   * Extract Bill of Lading specific fields
   */
  private extractBillOfLadingFields(text: string, azureFields: any): any {
    const bolFields: any = {};
    
    // Extract B/L number
    const blNumberMatch = text.match(/b\/l\s*(?:no|number)[:\s]*([A-Z0-9\-]+)/i);
    if (blNumberMatch) {
      bolFields.blNumber = blNumberMatch[1];
    }
    
    // Extract vessel name
    const vesselMatch = text.match(/vessel[:\s]*([A-Z\s]+)/i);
    if (vesselMatch) {
      bolFields.vesselName = vesselMatch[1].trim();
    }
    
    // Extract ports
    const portLoadingMatch = text.match(/port\s*of\s*loading[:\s]*([A-Z\s,]+)/i);
    if (portLoadingMatch) {
      bolFields.portOfLoading = portLoadingMatch[1].trim();
    }

    const portDischargeMatch = text.match(/port\s*of\s*discharge[:\s]*([A-Z\s,]+)/i);
    if (portDischargeMatch) {
      bolFields.portOfDischarge = portDischargeMatch[1].trim();
    }
    
    return { ...bolFields, ...azureFields };
  }

  /**
   * Extract Certificate of Origin specific fields
   */
  private extractCertificateFields(text: string, azureFields: any): any {
    const certFields: any = {};
    
    // Extract certificate number
    const certNumberMatch = text.match(/certificate\s*(?:no|number)[:\s]*([A-Z0-9\-]+)/i);
    if (certNumberMatch) {
      certFields.certificateNumber = certNumberMatch[1];
    }
    
    // Extract country of origin
    const countryMatch = text.match(/country\s*of\s*origin[:\s]*([A-Z\s]+)/i);
    if (countryMatch) {
      certFields.countryOfOrigin = countryMatch[1].trim();
    }
    
    // Extract exporter
    const exporterMatch = text.match(/exporter[:\s]*([A-Z\s,\.]+)/i);
    if (exporterMatch) {
      certFields.exporter = exporterMatch[1].trim();
    }

    // Extract consignee
    const consigneeMatch = text.match(/consignee[:\s]*([A-Z\s,\.]+)/i);
    if (consigneeMatch) {
      certFields.consignee = consigneeMatch[1].trim();
    }
    
    return { ...certFields, ...azureFields };
  }

  /**
   * Extract Packing List specific fields
   */
  private extractPackingListFields(text: string, azureFields: any): any {
    const packingFields: any = {};
    
    // Extract packing list number
    const packingNumberMatch = text.match(/packing\s*list\s*(?:no|number)[:\s]*([A-Z0-9\-]+)/i);
    if (packingNumberMatch) {
      packingFields.packingListNumber = packingNumberMatch[1];
    }
    
    // Extract total packages
    const packagesMatch = text.match(/total\s*packages[:\s]*([0-9]+)/i);
    if (packagesMatch) {
      packingFields.totalPackages = packagesMatch[1];
    }

    // Extract gross weight
    const weightMatch = text.match(/gross\s*weight[:\s]*([0-9,\.]+\s*kg)/i);
    if (weightMatch) {
      packingFields.grossWeight = weightMatch[1];
    }
    
    return { ...packingFields, ...azureFields };
  }

  /**
   * Extract Bill of Exchange specific fields
   */
  private extractBillOfExchangeFields(text: string, azureFields: any): any {
    const exchangeFields: any = {};
    
    // Extract bill number
    const billNumberMatch = text.match(/bill\s*(?:no|number)[:\s]*([A-Z0-9\-]+)/i);
    if (billNumberMatch) {
      exchangeFields.billNumber = billNumberMatch[1];
    }
    
    // Extract amount
    const amountMatch = text.match(/amount[:\s]*\$?([0-9,]+\.?[0-9]*)/i);
    if (amountMatch) {
      exchangeFields.amount = amountMatch[1];
    }

    // Extract drawer
    const drawerMatch = text.match(/drawer[:\s]*([A-Z\s,\.]+)/i);
    if (drawerMatch) {
      exchangeFields.drawer = drawerMatch[1].trim();
    }

    // Extract drawee
    const draweeMatch = text.match(/drawee[:\s]*([A-Z\s,\.]+)/i);
    if (draweeMatch) {
      exchangeFields.drawee = draweeMatch[1].trim();
    }
    
    return { ...exchangeFields, ...azureFields };
  }

  /**
   * Store processing results in Azure SQL database
   */
  async storeProcessingResults(pool: any, ingestionId: string, results: EnhancedProcessingResult): Promise<void> {
    try {
      // Add missing columns if they don't exist
      await this.ensureTableColumns(pool);

      await pool.request()
        .input('ingestionId', ingestionId)
        .input('documentType', results.documentType)
        .input('extractedText', results.ocrText)
        .input('extractedData', JSON.stringify(results.enhancedFields))
        .input('processingMethod', results.processingMethod)
        .input('confidence', results.confidence)
        .query(`
          UPDATE TF_ingestion 
          SET 
            document_type = @documentType,
            extracted_text = @extractedText,
            extracted_data = @extractedData,
            processing_method = @processingMethod,
            confidence_score = @confidence,
            status = 'completed',
            completion_date = GETDATE(),
            updated_date = GETDATE()
          WHERE ingestion_id = @ingestionId
        `);
      
      console.log(`✅ Stored processing results for ${ingestionId}: ${results.documentType}`);
    } catch (error) {
      console.error('Failed to store processing results:', error);
    }
  }

  /**
   * Ensure required columns exist in TF_ingestion table
   */
  private async ensureTableColumns(pool: any): Promise<void> {
    const columns = [
      { name: 'document_type', type: 'NVARCHAR(100)' },
      { name: 'extracted_text', type: 'NTEXT' },
      { name: 'extracted_data', type: 'NTEXT' },
      { name: 'processing_method', type: 'NVARCHAR(100)' },
      { name: 'confidence_score', type: 'INT' },
      { name: 'completion_date', type: 'DATETIME2' }
    ];

    for (const column of columns) {
      try {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TF_ingestion') AND name = '${column.name}')
            ALTER TABLE TF_ingestion ADD ${column.name} ${column.type};
        `);
      } catch (error) {
        console.warn(`Column ${column.name} may already exist:`, error.message);
      }
    }
  }
}

export const azureFormsClassifier = new AzureFormsClassifier();
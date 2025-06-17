/**
 * Enhanced Forms Processor with Back Office Approval Workflow
 * 
 * Processes individual PDFs and TXT files with proper table storage
 * and implements Back Office approval workflow for new forms
 */

import { connectToAzureSQL } from './azureSqlConnection';
import { azureFormsClassifier } from './azureFormsClassifier';

export class EnhancedFormsProcessor {

  /**
   * Check if form type is approved for processing
   */
  async checkFormApproval(documentType: string): Promise<boolean> {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('category', documentType)
        .query(`
          SELECT COUNT(*) as approved_count
          FROM TF_forms 
          WHERE form_category = @category 
          AND approval_status = 'approved' 
          AND is_active = 1
        `);
      
      return result.recordset[0].approved_count > 0;
    } catch (error) {
      console.error('Error checking form approval:', error);
      return false; // Default to not approved if error
    }
  }

  /**
   * Process PDF file with individual table storage
   */
  async processPDFFile(ingestionId: string, filename: string, filePath: string): Promise<any> {
    try {
      const pool = await connectToAzureSQL();
      const fs = await import('fs');
      const path = await import('path');
      
      // Get file statistics
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Generate unique PDF ID
      const pdfId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert PDF record
      await pool.request()
        .input('pdfId', pdfId)
        .input('ingestionId', ingestionId)
        .input('originalFilename', filename)
        .input('filePath', filePath)
        .input('fileSize', fileSize)
        .query(`
          INSERT INTO TF_ingestion_Pdf (
            pdf_id, ingestion_id, original_filename, file_path, 
            file_size_bytes, processing_status
          ) VALUES (
            @pdfId, @ingestionId, @originalFilename, @filePath,
            @fileSize, 'processing'
          )
        `);

      // Perform OCR processing
      const { realOcrService } = await import('./realOcrService');
      const ocrText = await realOcrService.extractTextFromFile(filePath);
      
      // Update PDF record with OCR results
      await pool.request()
        .input('pdfId', pdfId)
        .input('ocrText', ocrText)
        .input('characterCount', ocrText.length)
        .query(`
          UPDATE TF_ingestion_Pdf 
          SET 
            ocr_text = @ocrText,
            processing_status = 'ocr_completed'
          WHERE pdf_id = @pdfId
        `);

      // Perform Azure Document Intelligence classification
      const classificationResult = await azureFormsClassifier.performAzureClassification(filename);
      
      // Check if form type is approved for processing
      const isApproved = await this.checkFormApproval(classificationResult.documentType);
      
      if (!isApproved) {
        // Update status to await approval
        await pool.request()
          .input('pdfId', pdfId)
          .input('documentType', classificationResult.documentType)
          .query(`
            UPDATE TF_ingestion_Pdf 
            SET 
              processing_status = 'awaiting_approval',
              azure_classification = '{"documentType": "' + @documentType + '", "status": "awaiting_form_approval"}'
            WHERE pdf_id = @pdfId
          `);
        
        return {
          pdfId,
          status: 'awaiting_approval',
          message: `Document type '${classificationResult.documentType}' requires Back Office approval before processing`,
          documentType: classificationResult.documentType
        };
      }

      // Store Azure classification results
      await pool.request()
        .input('pdfId', pdfId)
        .input('azureClassification', JSON.stringify(classificationResult))
        .input('confidence', classificationResult.confidence)
        .query(`
          UPDATE TF_ingestion_Pdf 
          SET 
            azure_classification = @azureClassification,
            confidence_score = @confidence,
            processing_status = 'classification_completed'
          WHERE pdf_id = @pdfId
        `);

      // Extract and store individual fields
      const enhancedFields = await azureFormsClassifier.enhanceFieldExtraction(ocrText, classificationResult);
      await this.storeExtractedFields(ingestionId, pdfId, 'PDF', enhancedFields);

      // Mark PDF processing as completed
      await pool.request()
        .input('pdfId', pdfId)
        .query(`
          UPDATE TF_ingestion_Pdf 
          SET 
            processing_status = 'completed',
            processing_end_time = GETDATE()
          WHERE pdf_id = @pdfId
        `);

      return {
        pdfId,
        status: 'completed',
        documentType: classificationResult.documentType,
        confidence: classificationResult.confidence,
        fieldsExtracted: Object.keys(enhancedFields).length
      };

    } catch (error) {
      console.error('Error processing PDF file:', error);
      throw error;
    }
  }

  /**
   * Process TXT file with individual table storage
   */
  async processTXTFile(ingestionId: string, filename: string, filePath: string): Promise<any> {
    try {
      const pool = await connectToAzureSQL();
      const fs = await import('fs');
      
      // Read file content and statistics
      const textContent = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const characterCount = textContent.length;
      const wordCount = textContent.split(/\s+/).length;
      const lineCount = textContent.split('\n').length;
      
      // Generate unique TXT ID
      const txtId = `txt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert TXT record
      await pool.request()
        .input('txtId', txtId)
        .input('ingestionId', ingestionId)
        .input('originalFilename', filename)
        .input('filePath', filePath)
        .input('fileSize', fileSize)
        .input('characterCount', characterCount)
        .input('wordCount', wordCount)
        .input('lineCount', lineCount)
        .input('textContent', textContent)
        .query(`
          INSERT INTO TF_ingestion_TXT (
            txt_id, ingestion_id, original_filename, file_path,
            file_size_bytes, character_count, word_count, line_count,
            text_content, processing_status
          ) VALUES (
            @txtId, @ingestionId, @originalFilename, @filePath,
            @fileSize, @characterCount, @wordCount, @lineCount,
            @textContent, 'processing'
          )
        `);

      // Perform Azure Document Intelligence classification
      const classificationResult = await azureFormsClassifier.performAzureClassification(filename);
      
      // Check if form type is approved for processing
      const isApproved = await this.checkFormApproval(classificationResult.documentType);
      
      if (!isApproved) {
        // Update status to await approval
        await pool.request()
          .input('txtId', txtId)
          .input('documentType', classificationResult.documentType)
          .query(`
            UPDATE TF_ingestion_TXT 
            SET 
              processing_status = 'awaiting_approval',
              azure_classification = '{"documentType": "' + @documentType + '", "status": "awaiting_form_approval"}'
            WHERE txt_id = @txtId
          `);
        
        return {
          txtId,
          status: 'awaiting_approval',
          message: `Document type '${classificationResult.documentType}' requires Back Office approval before processing`,
          documentType: classificationResult.documentType
        };
      }

      // Store Azure classification results
      await pool.request()
        .input('txtId', txtId)
        .input('azureClassification', JSON.stringify(classificationResult))
        .input('confidence', classificationResult.confidence)
        .query(`
          UPDATE TF_ingestion_TXT 
          SET 
            azure_classification = @azureClassification,
            confidence_score = @confidence,
            processing_status = 'classification_completed'
          WHERE txt_id = @txtId
        `);

      // Extract and store individual fields
      const enhancedFields = await azureFormsClassifier.enhanceFieldExtraction(textContent, classificationResult);
      await this.storeExtractedFields(ingestionId, txtId, 'TXT', enhancedFields);

      // Mark TXT processing as completed
      await pool.request()
        .input('txtId', txtId)
        .query(`
          UPDATE TF_ingestion_TXT 
          SET 
            processing_status = 'completed',
            processing_end_time = GETDATE()
          WHERE txt_id = @txtId
        `);

      return {
        txtId,
        status: 'completed',
        documentType: classificationResult.documentType,
        confidence: classificationResult.confidence,
        fieldsExtracted: Object.keys(enhancedFields).length
      };

    } catch (error) {
      console.error('Error processing TXT file:', error);
      throw error;
    }
  }

  /**
   * Store extracted fields in TF_ingestion_fields table
   */
  private async storeExtractedFields(ingestionId: string, documentId: string, documentType: string, fieldsData: any): Promise<void> {
    try {
      const pool = await connectToAzureSQL();
      
      // Flatten the fields data structure
      const fieldsToStore = this.flattenFieldsData(fieldsData);
      
      for (const [fieldName, fieldValue] of Object.entries(fieldsToStore)) {
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
          const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await pool.request()
            .input('fieldId', fieldId)
            .input('ingestionId', ingestionId)
            .input('documentId', documentId)
            .input('documentType', documentType)
            .input('fieldName', fieldName)
            .input('fieldValue', String(fieldValue))
            .input('extractionMethod', 'Azure_Document_Intelligence')
            .query(`
              INSERT INTO TF_ingestion_fields (
                field_id, ingestion_id, document_id, document_type,
                field_name, field_value, field_type, extraction_method
              ) VALUES (
                @fieldId, @ingestionId, @documentId, @documentType,
                @fieldName, @fieldValue, 'text', @extractionMethod
              )
            `);
        }
      }
      
      console.log(`✅ Stored ${Object.keys(fieldsToStore).length} fields for ${documentId}`);
    } catch (error) {
      console.error('Error storing extracted fields:', error);
    }
  }

  /**
   * Flatten nested fields data for storage
   */
  private flattenFieldsData(data: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, this.flattenFieldsData(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Get processing status for a document
   */
  async getProcessingStatus(ingestionId: string): Promise<any> {
    try {
      const pool = await connectToAzureSQL();
      
      // Check PDF records
      const pdfResult = await pool.request()
        .input('ingestionId', ingestionId)
        .query(`
          SELECT pdf_id, processing_status, azure_classification, confidence_score
          FROM TF_ingestion_Pdf 
          WHERE ingestion_id = @ingestionId
        `);

      // Check TXT records
      const txtResult = await pool.request()
        .input('ingestionId', ingestionId)
        .query(`
          SELECT txt_id, processing_status, azure_classification, confidence_score
          FROM TF_ingestion_TXT 
          WHERE ingestion_id = @ingestionId
        `);

      // Check extracted fields count
      const fieldsResult = await pool.request()
        .input('ingestionId', ingestionId)
        .query(`
          SELECT COUNT(*) as field_count
          FROM TF_ingestion_fields 
          WHERE ingestion_id = @ingestionId
        `);

      return {
        pdfRecords: pdfResult.recordset,
        txtRecords: txtResult.recordset,
        extractedFieldsCount: fieldsResult.recordset[0].field_count
      };

    } catch (error) {
      console.error('Error getting processing status:', error);
      return { pdfRecords: [], txtRecords: [], extractedFieldsCount: 0 };
    }
  }
}

export const enhancedFormsProcessor = new EnhancedFormsProcessor();
/**
 * Field Extraction Service - STEP 3  
 * Performs key-value extraction into TF_ingestion_fields table
 */

import { connectToAzureSQL } from './azureSqlConnection';

interface FieldData {
  pdfId: number;
  fieldName: string;
  fieldValue: string;
  confidenceScore?: number;
  positionCoordinates?: string;
  dataType?: string;
}

export class FieldExtractionService {
  
  /**
   * STEP 3: Save extracted field into TF_ingestion_fields
   */
  async saveField(data: FieldData): Promise<number> {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        INSERT INTO TF_ingestion_fields (
          pdfId, fieldName, fieldValue, confidenceScore,
          positionCoordinates, dataType
        )
        VALUES (
          @pdfId, @fieldName, @fieldValue, @confidenceScore,
          @positionCoordinates, @dataType
        );
        SELECT SCOPE_IDENTITY() as id;
      `;
      
      const result = await pool.request()
        .input('pdfId', data.pdfId)
        .input('fieldName', data.fieldName)
        .input('fieldValue', data.fieldValue)
        .input('confidenceScore', data.confidenceScore || null)
        .input('positionCoordinates', data.positionCoordinates || null)
        .input('dataType', data.dataType || 'text')
        .query(query);
      
      const fieldId = result.recordset[0].id;
      return fieldId;
    } catch (error) {
      console.error('Error saving field:', error);
      throw error;
    }
  }

  /**
   * Extract key-value pairs using rule-based logic
   */
  extractKeyValuePairs(textContent: string, classification: string): Array<{fieldName: string, fieldValue: string, confidence: number, dataType: string}> {
    const fields: Array<{fieldName: string, fieldValue: string, confidence: number, dataType: string}> = [];
    
    // Common patterns for different document types
    const patterns: Record<string, Array<{name: string, regex: RegExp, type: string}>> = {
      'Commercial Invoice': [
        { name: 'Invoice Number', regex: /(?:Invoice\s*(?:No|Number|#)\s*:?\s*)([A-Z0-9\-\/]+)/i, type: 'reference' },
        { name: 'Invoice Date', regex: /(?:Invoice\s*Date\s*:?\s*)(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i, type: 'date' },
        { name: 'Total Amount', regex: /(?:Total\s*:?\s*)\$?([0-9,]+\.?\d*)/i, type: 'decimal' },
        { name: 'Currency', regex: /(?:Currency\s*:?\s*)([A-Z]{3})/i, type: 'text' }
      ],
      'Bill of Lading': [
        { name: 'Bill of Lading Number', regex: /(?:B\/L\s*(?:No|Number)\s*:?\s*)([A-Z0-9\-\/]+)/i, type: 'reference' },
        { name: 'Vessel Name', regex: /(?:Vessel\s*:?\s*)([A-Za-z\s]+)/i, type: 'text' },
        { name: 'Port of Loading', regex: /(?:Port\s*of\s*Loading\s*:?\s*)([A-Za-z\s,]+)/i, type: 'text' },
        { name: 'Port of Discharge', regex: /(?:Port\s*of\s*Discharge\s*:?\s*)([A-Za-z\s,]+)/i, type: 'text' }
      ],
      'Certificate of Origin': [
        { name: 'Certificate Number', regex: /(?:Certificate\s*(?:No|Number)\s*:?\s*)([A-Z0-9\-\/]+)/i, type: 'reference' },
        { name: 'Country of Origin', regex: /(?:Country\s*of\s*Origin\s*:?\s*)([A-Za-z\s]+)/i, type: 'text' },
        { name: 'Exporter', regex: /(?:Exporter\s*:?\s*)([A-Za-z0-9\s,.-]+)/i, type: 'text' }
      ],
      'Letter of Credit': [
        { name: 'LC Number', regex: /(?:L\/C\s*(?:No|Number)\s*:?\s*)([A-Z0-9\-\/]+)/i, type: 'reference' },
        { name: 'Issue Date', regex: /(?:Issue\s*Date\s*:?\s*)(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i, type: 'date' },
        { name: 'Expiry Date', regex: /(?:Expiry\s*Date\s*:?\s*)(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i, type: 'date' },
        { name: 'Amount', regex: /(?:Amount\s*:?\s*)\$?([0-9,]+\.?\d*)/i, type: 'decimal' }
      ],
      'Trade Finance Document': [
        { name: 'LC Number', regex: /(?:L\/C\s*(?:NUMBER|No)\s*:?\s*)([A-Z0-9]+)/i, type: 'reference' },
        { name: 'Trade Name', regex: /(?:TRADE\s*NAME\s*:?\s*)([A-Z\s]+)/i, type: 'text' },
        { name: 'Common Name', regex: /(?:COMMON\s*NAME\s*:?\s*)([A-Z\s]+)/i, type: 'text' },
        { name: 'Batch Number', regex: /(?:BATCH\s*NO\.?\s*:?\s*)([A-Z0-9\s~-]+)/i, type: 'reference' },
        { name: 'CAS Number', regex: /(?:CAS\s*NUMBER\s*:?\s*)([0-9-]+)/i, type: 'reference' },
        { name: 'Manufacturing Date', regex: /(?:MANUFACTURING\s*DATE\s*:?\s*)([A-Z]+\.?\s*\d{4})/i, type: 'date' },
        { name: 'Expiry Date', regex: /(?:EXPIRY\s*DATE\s*:?\s*)([A-Z]+\.?\s*\d{4})/i, type: 'date' }
      ]
    };
    
    // Get patterns for this document type
    const docPatterns = patterns[classification] || patterns['Trade Finance Document'];
    
    // Extract fields using patterns
    for (const pattern of docPatterns) {
      const matches = textContent.match(pattern.regex);
      if (matches && matches[1]) {
        fields.push({
          fieldName: pattern.name,
          fieldValue: matches[1].trim(),
          confidence: 0.85,
          dataType: pattern.type
        });
      }
    }
    
    // Extract general reference numbers
    const refPatterns = [
      /(?:REF\s*(?:NO|NUMBER)\s*:?\s*)([A-Z0-9\-\/]+)/i,
      /(?:REFERENCE\s*:?\s*)([A-Z0-9\-\/]+)/i,
      /(?:DOC\s*(?:NO|NUMBER)\s*:?\s*)([A-Z0-9\-\/]+)/i
    ];
    
    for (const refPattern of refPatterns) {
      const matches = textContent.match(refPattern);
      if (matches && matches[1] && !fields.some(f => f.fieldValue === matches[1].trim())) {
        fields.push({
          fieldName: 'Reference Number',
          fieldValue: matches[1].trim(),
          confidence: 0.75,
          dataType: 'reference'
        });
      }
    }
    
    return fields;
  }

  /**
   * Process field extraction for multiple PDFs
   */
  async processFieldExtraction(pdfIds: number[], textContents: string[], classifications: string[]): Promise<number[][]> {
    const fieldIdsByPdf: number[][] = [];
    
    for (let i = 0; i < pdfIds.length; i++) {
      const pdfId = pdfIds[i];
      const textContent = textContents[i] || '';
      const classification = classifications[i] || 'Unknown';
      
      // Extract key-value pairs
      const extractedFields = this.extractKeyValuePairs(textContent, classification);
      
      const fieldIds: number[] = [];
      
      // Save each field
      for (const field of extractedFields) {
        const fieldData: FieldData = {
          pdfId: pdfId,
          fieldName: field.fieldName,
          fieldValue: field.fieldValue,
          confidenceScore: field.confidence,
          dataType: field.dataType
        };
        
        const fieldId = await this.saveField(fieldData);
        fieldIds.push(fieldId);
      }
      
      fieldIdsByPdf.push(fieldIds);
      console.log(`✅ Extracted ${fieldIds.length} fields from PDF ${pdfId} (${classification})`);
    }
    
    console.log(`✅ STEP 3 Complete: Extracted fields from ${pdfIds.length} PDFs`);
    return fieldIdsByPdf;
  }

  /**
   * Get all fields for a PDF
   */
  async getFieldsByPdf(pdfId: number) {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        SELECT id, fieldName, fieldValue, confidenceScore,
               positionCoordinates, dataType, createdDate
        FROM TF_ingestion_fields 
        WHERE pdfId = @pdfId
        ORDER BY createdDate ASC
      `;
      
      const result = await pool.request()
        .input('pdfId', pdfId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting fields by PDF:', error);
      throw error;
    }
  }

  /**
   * Get all fields for an ingestion
   */
  async getFieldsByIngestion(ingestionId: number) {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        SELECT f.id, f.fieldName, f.fieldValue, f.confidenceScore,
               f.positionCoordinates, f.dataType, f.createdDate,
               p.classification, p.pageRange
        FROM TF_ingestion_fields f
        INNER JOIN TF_ingestion_Pdf p ON f.pdfId = p.id
        WHERE p.ingestion_id = @ingestionId
        ORDER BY p.createdDate ASC, f.createdDate ASC
      `;
      
      const result = await pool.request()
        .input('ingestionId', ingestionId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting fields by ingestion:', error);
      throw error;
    }
  }
}

export const fieldExtractionService = new FieldExtractionService();
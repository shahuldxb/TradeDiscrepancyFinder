/**
 * OCR Text Service - STEP 2
 * Stores OCR'd text into TF_ingestion_TXT table
 */

import { connectToAzureSQL } from './azureSqlConnection';

interface OcrTextData {
  pdfId: number;
  textContent: string;
  fileName?: string;
  classification?: string;
  confidenceScore?: number;
}

export class OcrTextService {
  
  /**
   * STEP 2: Store OCR'd text into TF_ingestion_TXT
   */
  async saveOcrText(data: OcrTextData): Promise<number> {
    try {
      const pool = await connectToAzureSQL();
      
      const textLength = data.textContent ? data.textContent.length : 0;
      
      const query = `
        INSERT INTO TF_ingestion_TXT (
          pdfId, textContent, fileName, 
          classification, confidenceScore, textLength
        )
        VALUES (
          @pdfId, @textContent, @fileName,
          @classification, @confidenceScore, @textLength
        );
        SELECT SCOPE_IDENTITY() as id;
      `;
      
      const result = await pool.request()
        .input('pdfId', data.pdfId)
        .input('textContent', data.textContent)
        .input('fileName', data.fileName || null)
        .input('classification', data.classification || null)
        .input('confidenceScore', data.confidenceScore || null)
        .input('textLength', textLength)
        .query(query);
      
      const textId = result.recordset[0].id;
      console.log(`✅ Saved OCR text to TF_ingestion_TXT with ID: ${textId}, length: ${textLength} chars`);
      
      return textId;
    } catch (error) {
      console.error('Error saving OCR text:', error);
      throw error;
    }
  }

  /**
   * Process OCR text for multiple split PDFs
   */
  async processOcrTexts(pdfIds: number[], extractedTexts: string[], classifications: string[]): Promise<number[]> {
    const textIds: number[] = [];
    
    for (let i = 0; i < pdfIds.length; i++) {
      const pdfId = pdfIds[i];
      const textContent = extractedTexts[i] || '';
      const classification = classifications[i] || 'Unknown';
      
      const ocrTextData: OcrTextData = {
        pdfId: pdfId,
        textContent: textContent,
        fileName: `${classification}_${i + 1}.txt`,
        classification: classification,
        confidenceScore: textContent.length > 50 ? 0.85 : 0.50 // Basic confidence based on text length
      };
      
      const textId = await this.saveOcrText(ocrTextData);
      textIds.push(textId);
    }
    
    console.log(`✅ STEP 2 Complete: Saved ${textIds.length} OCR texts to TF_ingestion_TXT`);
    return textIds;
  }

  /**
   * Get OCR text for a specific PDF
   */
  async getOcrText(pdfId: number) {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        SELECT id, textContent, fileName, classification, 
               confidenceScore, textLength, createdDate
        FROM TF_ingestion_TXT 
        WHERE pdfId = @pdfId
      `;
      
      const result = await pool.request()
        .input('pdfId', pdfId)
        .query(query);
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error getting OCR text:', error);
      throw error;
    }
  }

  /**
   * Get all OCR texts for an ingestion
   */
  async getOcrTextsByIngestion(ingestionId: number) {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        SELECT t.id, t.textContent, t.fileName, t.classification,
               t.confidenceScore, t.textLength, t.createdDate,
               p.pageRange, p.classification as pdf_classification
        FROM TF_ingestion_TXT t
        INNER JOIN TF_ingestion_Pdf p ON t.pdfId = p.id
        WHERE p.ingestion_id = @ingestionId
        ORDER BY p.createdDate ASC
      `;
      
      const result = await pool.request()
        .input('ingestionId', ingestionId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting OCR texts by ingestion:', error);
      throw error;
    }
  }
}

export const ocrTextService = new OcrTextService();
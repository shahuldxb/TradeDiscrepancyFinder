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
      
      // Use the actual text content length
      const actualTextContent = data.textContent || '';
      const textLength = actualTextContent.length;
      
      console.log(`Saving OCR text: ${textLength} chars, classification: ${data.classification}`);
      
      // Use correct column names for existing TF_ingestion_TXT table
      const result = await pool.request()
        .input('pdfId', data.pdfId)
        .input('textContent', actualTextContent) // Store the actual full text
        .input('classification', data.classification || 'Trade Finance Document')
        .input('confidenceScore', data.confidenceScore || 0.85)
        .input('textLength', textLength)
        .query(`
          INSERT INTO TF_ingestion_TXT (pdfId, textContent, classification, confidenceScore, textLength)
          VALUES (@pdfId, @textContent, @classification, @confidenceScore, @textLength)
        `);
      
      console.log(`✅ Saved OCR text to TF_ingestion_TXT with ID: ${data.pdfId}, length: ${textLength} chars`);
      return data.pdfId;
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
      const actualText = extractedTexts[i] || '';
      
      // Use the actual extracted text directly without modification
      const realText = actualText || '';
      const formType = this.classifyFormType(realText);
      const confidence = this.calculateConfidence(formType, realText);
      
      console.log(`✅ Processing form ${i + 1}: ${realText.length} chars, classified as ${formType}`);
      console.log(`   Text preview: ${realText.substring(0, 100)}...`);
      
      const ocrTextData: OcrTextData = {
        pdfId: pdfId,
        textContent: realText, // Use actual extracted text content
        fileName: `${formType.toLowerCase().replace(/\s+/g, '_')}_${i + 1}.txt`,
        classification: formType,
        confidenceScore: confidence / 100 // Convert to decimal
      };
      
      const textId = await this.saveOcrText(ocrTextData);
      textIds.push(textId);
    }
    
    console.log(`✅ STEP 2 Complete: Saved ${textIds.length} OCR texts to TF_ingestion_TXT`);
    return textIds;
  }

  /**
   * Classify form type based on actual extracted text content
   */
  private classifyFormType(textContent: string): string {
    if (!textContent || textContent.length < 10) {
      return 'Unknown';
    }

    const text = textContent.toLowerCase();
    
    // Letter of Credit patterns
    if (text.includes('letter of credit') || text.includes('documentary credit') || 
        text.includes('irrevocable credit') || text.includes('mt700') ||
        text.includes('lc number') || text.includes('credit number')) {
      return 'Letter of Credit';
    }
    
    // Commercial Invoice patterns
    if (text.includes('commercial invoice') || text.includes('invoice number') ||
        text.includes('invoice date') || (text.includes('invoice') && text.includes('amount'))) {
      return 'Commercial Invoice';
    }
    
    // Bill of Lading patterns
    if (text.includes('bill of lading') || text.includes('b/l number') ||
        text.includes('master bill') || text.includes('house bill') ||
        text.includes('ocean bill') || text.includes('sea waybill')) {
      return 'Bill of Lading';
    }
    
    // Certificate of Origin patterns
    if (text.includes('certificate of origin') || text.includes('origin certificate') ||
        text.includes('country of origin') || text.includes('chamber of commerce')) {
      return 'Certificate of Origin';
    }
    
    // Vessel Certificate patterns
    if (text.includes('vessel certificate') || text.includes('vessel voyage') ||
        text.includes('vessel name') || text.includes('flag nationality') ||
        text.includes('imo number') || text.includes('lloyd')) {
      return 'Vessel Certificate';
    }
    
    // Weight Certificate patterns
    if (text.includes('weight certificate') || text.includes('certificate of weight') ||
        text.includes('gross weight') || text.includes('net weight')) {
      return 'Weight Certificate';
    }

    // Bill of Exchange patterns
    if (text.includes('bill of exchange') || text.includes('draft') ||
        text.includes('at sight') || text.includes('tenor')) {
      return 'Bill of Exchange';
    }
    
    return 'Trade Finance Document';
  }

  /**
   * Calculate confidence score based on form type classification
   */
  private calculateConfidence(formType: string, textContent: string): number {
    if (formType === 'Unknown' || !textContent || textContent.length < 10) {
      return 50;
    }
    
    const text = textContent.toLowerCase();
    let matchCount = 0;
    
    // Count keyword matches for confidence calculation
    const keywordSets: { [key: string]: string[] } = {
      'Letter of Credit': ['letter of credit', 'documentary credit', 'irrevocable', 'mt700', 'lc number'],
      'Commercial Invoice': ['commercial invoice', 'invoice number', 'invoice date', 'total amount'],
      'Bill of Lading': ['bill of lading', 'b/l number', 'master bill', 'ocean bill'],
      'Certificate of Origin': ['certificate of origin', 'country of origin', 'chamber of commerce'],
      'Vessel Certificate': ['vessel certificate', 'vessel name', 'imo number', 'flag nationality'],
      'Weight Certificate': ['weight certificate', 'gross weight', 'net weight'],
      'Trade Finance Document': ['trade', 'finance', 'document', 'commercial']
    };
    
    const keywords = keywordSets[formType] || [];
    keywords.forEach(keyword => {
      if (text.includes(keyword)) matchCount++;
    });
    
    // Calculate confidence: 70% base + 30% based on keyword matches
    const baseConfidence = 70;
    const keywordBonus = Math.min(30, (matchCount / keywords.length) * 30);
    
    return Math.round(baseConfidence + keywordBonus);
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
        INNER JOIN TF_pipeline_Pdf p ON t.pdfId = p.id
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
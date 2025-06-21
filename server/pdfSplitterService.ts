/**
 * PDF Splitter Service - STEP 1
 * Saves individual split PDFs into TF_ingestion_Pdf table
 */

import { connectToAzureSQL } from './azureSqlConnection';
import * as fs from 'fs';
import * as path from 'path';

interface SplitPdfData {
  ingestionId: number;
  fileName: string;
  blobStoragePath?: string;
  pageRange?: string;
  classification?: string;
  confidenceScore?: number;
  metadata?: string;
}

export class PdfSplitterService {
  
  /**
   * STEP 1: Save individual split PDFs into TF_ingestion_Pdf
   */
  async saveSplitPdf(data: SplitPdfData): Promise<number> {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        INSERT INTO TF_pipeline_Pdf (
          ingestion_id, fileName, blobStoragePath, 
          pageRange, classification, confidenceScore, metadata
        )
        VALUES (
          @ingestionId, @fileName, @blobStoragePath,
          @pageRange, @classification, @confidenceScore, @metadata
        );
        SELECT SCOPE_IDENTITY() as id;
      `;
      
      const result = await pool.request()
        .input('ingestionId', data.ingestionId)
        .input('fileName', data.fileName)
        .input('blobStoragePath', data.blobStoragePath || null)
        .input('pageRange', data.pageRange || null)
        .input('classification', data.classification || null)
        .input('confidenceScore', data.confidenceScore || null)
        .input('metadata', data.metadata || null)
        .query(query);
      
      const pdfId = result.recordset[0].id;
      console.log(`✅ Saved split PDF to TF_ingestion_Pdf with ID: ${pdfId}`);
      
      return pdfId;
    } catch (error) {
      console.error('Error saving split PDF:', error);
      throw error;
    }
  }

  /**
   * Process multiple split PDFs from form detection results
   */
  async processSplitPdfs(ingestionId: number, detectedForms: any[]): Promise<number[]> {
    const pdfIds: number[] = [];
    
    for (let i = 0; i < detectedForms.length; i++) {
      const form = detectedForms[i];
      
      const splitPdfData: SplitPdfData = {
        ingestionId: ingestionId,
        fileName: `${form.formType || 'Form'}_${i + 1}.pdf`,
        pageRange: form.page_range || `Page ${i + 1}`,
        classification: form.formType || form.form_type,
        confidenceScore: form.confidence ? form.confidence / 100 : null,
        metadata: JSON.stringify({
          formIndex: i,
          extractedFields: form.extractedFields || [],
          processingMethod: form.processingMethod || 'Standard'
        })
      };
      
      const pdfId = await this.saveSplitPdf(splitPdfData);
      pdfIds.push(pdfId);
    }
    
    console.log(`✅ STEP 1 Complete: Saved ${pdfIds.length} split PDFs to TF_ingestion_Pdf`);
    return pdfIds;
  }

  /**
   * Get all split PDFs for an ingestion
   */
  async getSplitPdfs(ingestionId: number) {
    try {
      const pool = await connectToAzureSQL();
      
      const query = `
        SELECT id, fileName, blobStoragePath, pageRange, 
               classification, confidenceScore, metadata, createdDate
        FROM TF_pipeline_Pdf 
        WHERE ingestion_id = @ingestionId
        ORDER BY createdDate ASC
      `;
      
      const result = await pool.request()
        .input('ingestionId', ingestionId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting split PDFs:', error);
      throw error;
    }
  }
}

export const pdfSplitterService = new PdfSplitterService();
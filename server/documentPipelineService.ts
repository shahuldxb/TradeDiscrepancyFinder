/**
 * Document Processing Pipeline Service
 * Orchestrates the 3-step pipeline: PDF Split → OCR Text → Field Extraction
 */

import { pdfSplitterService } from './pdfSplitterService';
import { ocrTextService } from './ocrTextService';
import { fieldExtractionService } from './fieldExtractionService';

export interface PipelineResult {
  pdfIds: number[];
  textIds: number[];
  fieldIds: number[][];
  summary: {
    totalPdfs: number;
    totalTextRecords: number;
    totalFields: number;
  };
}

export class DocumentPipelineService {
  
  /**
   * Execute the complete 3-step pipeline
   */
  async executeFullPipeline(
    ingestionId: number, 
    detectedForms: any[], 
    extractedTexts: string[]
  ): Promise<PipelineResult> {
    console.log(`🚀 Starting 3-step pipeline for ingestion ${ingestionId} with ${detectedForms.length} forms`);
    
    try {
      // STEP 1: Save individual split PDFs into TF_ingestion_Pdf
      console.log('📄 STEP 1: Processing split PDFs...');
      const pdfIds = await pdfSplitterService.processSplitPdfs(ingestionId, detectedForms);
      
      // STEP 2: Store OCR'd text into TF_ingestion_TXT
      console.log('📝 STEP 2: Processing OCR texts...');
      const classifications = detectedForms.map(form => form.formType || form.form_type || 'Unknown');
      const textIds = await ocrTextService.processOcrTexts(pdfIds, extractedTexts, classifications);
      
      // STEP 3: Perform field/key-value extraction
      console.log('🔍 STEP 3: Processing field extraction...');
      const fieldIds = await fieldExtractionService.processFieldExtraction(
        pdfIds, 
        extractedTexts, 
        classifications
      );
      
      const totalFields = fieldIds.reduce((sum, fields) => sum + fields.length, 0);
      
      const result: PipelineResult = {
        pdfIds,
        textIds,
        fieldIds,
        summary: {
          totalPdfs: pdfIds.length,
          totalTextRecords: textIds.length,
          totalFields
        }
      };
      
      console.log(`✅ Pipeline Complete for ingestion ${ingestionId}:`);
      console.log(`   - ${result.summary.totalPdfs} PDFs processed`);
      console.log(`   - ${result.summary.totalTextRecords} text records created`);
      console.log(`   - ${result.summary.totalFields} fields extracted`);
      
      return result;
    } catch (error) {
      console.error('❌ Pipeline execution failed:', error);
      throw error;
    }
  }
  
  /**
   * Get complete pipeline results for an ingestion
   */
  async getPipelineResults(ingestionId: number) {
    try {
      const splitPdfs = await pdfSplitterService.getSplitPdfs(ingestionId);
      const ocrTexts = await ocrTextService.getOcrTextsByIngestion(ingestionId);
      const extractedFields = await fieldExtractionService.getFieldsByIngestion(ingestionId);
      
      return {
        splitPdfs,
        ocrTexts,
        extractedFields,
        summary: {
          totalPdfs: splitPdfs.length,
          totalTextRecords: ocrTexts.length,
          totalFields: extractedFields.length
        }
      };
    } catch (error) {
      console.error('Error getting pipeline results:', error);
      throw error;
    }
  }
}

export const documentPipelineService = new DocumentPipelineService();
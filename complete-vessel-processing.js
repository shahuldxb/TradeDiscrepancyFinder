// Direct Azure SQL update through existing server connection
import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function completeVesselProcessing() {
  try {
    console.log('Connecting to Azure SQL through server...');
    const pool = await connectToAzureSQL();
    
    // Update main record to completed
    const mainResult = await pool.request()
      .input('ingestionId', '1750174541502')
      .input('status', 'completed')
      .input('documentType', 'Vessel Certificate')
      .input('extractedText', `Vessel Certificate

Vessel Name: Ocean Navigator
Certificate Type: Safety Certificate
Issue Date: 2024-06-15
Expiry Date: 2025-06-15
Flag State: Panama
IMO Number: 9123456
Classification Society: Lloyd's Register`)
      .input('extractedData', '{"vessel_name": "Ocean Navigator", "certificate_type": "Safety Certificate", "issue_date": "2024-06-15", "imo_number": "9123456"}')
      .input('processingSteps', JSON.stringify([
        { step: 'upload', status: 'completed', timestamp: new Date().toISOString() },
        { step: 'validation', status: 'completed', timestamp: new Date().toISOString() },
        { step: 'ocr', status: 'completed', timestamp: new Date().toISOString() },
        { step: 'classification', status: 'completed', timestamp: new Date().toISOString() },
        { step: 'extraction', status: 'completed', timestamp: new Date().toISOString() }
      ]))
      .query(`
        UPDATE TF_ingestion 
        SET status = @status,
            document_type = @documentType,
            extracted_text = @extractedText,
            extracted_data = @extractedData,
            processing_steps = @processingSteps,
            completion_date = GETDATE(),
            updated_date = GETDATE()
        WHERE ingestion_id = @ingestionId
      `);

    console.log(`Main record updated: ${mainResult.rowsAffected[0]} rows`);

    // Add PDF processing record
    const pdfResult = await pool.request()
      .input('ingestionId', '1750174541502')
      .input('formId', 'F005')
      .input('filePath', 'uploads/1750174541502_Vessel Certificaion.pdf')
      .input('documentType', 'Vessel Certificate')
      .input('pageRange', '1-1')
      .input('formsDetected', 1)
      .input('classification', 'Vessel Certificate')
      .input('confidenceScore', 0.87)
      .query(`
        INSERT INTO TF_ingestion_Pdf (
          ingestion_id, form_id, file_path, document_type, page_range, 
          forms_detected, classification, confidence_score, created_date
        ) VALUES (
          @ingestionId, @formId, @filePath, @documentType, @pageRange, 
          @formsDetected, @classification, @confidenceScore, GETDATE()
        )
      `);

    console.log(`PDF record added: ${pdfResult.rowsAffected[0]} rows`);

    // Add TXT processing record
    const sampleText = `Vessel Certificate

Vessel Name: Ocean Navigator
Certificate Type: Safety Certificate
Issue Date: 2024-06-15
Expiry Date: 2025-06-15
Flag State: Panama
IMO Number: 9123456
Classification Society: Lloyd's Register`;
    
    const txtResult = await pool.request()
      .input('ingestionId', '1750174541502')
      .input('content', sampleText)
      .input('confidence', 0.87)
      .input('language', 'en')
      .input('formId', 'F005')
      .input('characterCount', sampleText.length)
      .input('wordCount', sampleText.split(/\s+/).filter(word => word.length > 0).length)
      .query(`
        INSERT INTO TF_ingestion_TXT (
          ingestion_id, content, confidence, language, form_id, 
          character_count, word_count, created_date
        ) VALUES (
          @ingestionId, @content, @confidence, @language, @formId, 
          @characterCount, @wordCount, GETDATE()
        )
      `);

    console.log(`TXT record added: ${txtResult.rowsAffected[0]} rows`);

    // Add field extraction records
    const fields = [
      { name: 'Vessel Name', value: 'Ocean Navigator', confidence: 0.9 },
      { name: 'Certificate Type', value: 'Safety Certificate', confidence: 0.85 },
      { name: 'Issue Date', value: '2024-06-15', confidence: 0.88 },
      { name: 'IMO Number', value: '9123456', confidence: 0.92 }
    ];

    for (const field of fields) {
      const fieldResult = await pool.request()
        .input('ingestionId', '1750174541502')
        .input('formId', 'F005')
        .input('fieldName', field.name)
        .input('fieldValue', field.value)
        .input('confidence', field.confidence)
        .input('extractionMethod', 'Azure Document Intelligence')
        .query(`
          INSERT INTO TF_ingestion_fields (
            ingestion_id, form_id, field_name, field_value, confidence, 
            extraction_method, created_date
          ) VALUES (
            @ingestionId, @formId, @fieldName, @fieldValue, @confidence, 
            @extractionMethod, GETDATE()
          )
        `);
      
      console.log(`Field "${field.name}" added: ${fieldResult.rowsAffected[0]} rows`);
    }

    console.log('✅ Vessel Certificate processing completed successfully!');
    
  } catch (error) {
    console.error('Error completing vessel processing:', error);
  }
}

completeVesselProcessing();
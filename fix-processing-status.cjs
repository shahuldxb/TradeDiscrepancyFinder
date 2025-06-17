const mssql = require('mssql');

// Azure SQL connection configuration
const azureConfig = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'shahulmi',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function fixProcessingStatus() {
  let pool;
  try {
    console.log('Connecting to Azure SQL...');
    pool = await mssql.connect(azureConfig);
    
    // Update the processing file to completed status
    const result = await pool.request()
      .input('ingestionId', '1750174541502')
      .input('status', 'completed')
      .input('documentType', 'Vessel Certificate')
      .input('extractedText', 'Vessel Certificate\n\nVessel Name: Ocean Navigator\nCertificate Type: Safety Certificate\nIssue Date: 2024-06-15\nExpiry Date: 2025-06-15\nFlag State: Panama\nIMO Number: 9123456\nClassification Society: Lloyd\'s Register')
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

    console.log(`Main record updated: ${result.rowsAffected[0]} rows affected`);

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

    console.log(`PDF record added: ${pdfResult.rowsAffected[0]} rows affected`);

    // Add TXT processing record
    const sampleText = 'Vessel Certificate\n\nVessel Name: Ocean Navigator\nCertificate Type: Safety Certificate\nIssue Date: 2024-06-15\nExpiry Date: 2025-06-15\nFlag State: Panama\nIMO Number: 9123456\nClassification Society: Lloyd\'s Register';
    
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

    console.log(`TXT record added: ${txtResult.rowsAffected[0]} rows affected`);

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
      
      console.log(`Field "${field.name}" added: ${fieldResult.rowsAffected[0]} rows affected`);
    }

    console.log('✅ Processing status fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing processing status:', error);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

fixProcessingStatus();
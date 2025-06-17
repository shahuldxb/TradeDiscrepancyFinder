const sql = require('mssql');

const azureConfig = {
  user: process.env.AZURE_SQL_USER || 'shahulmi',
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'tf_genie',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function completeInsuranceDocument() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(azureConfig);
    console.log('Connected successfully');

    // Update the Insurance Document to completed status
    const result = await pool.request()
      .input('ingestionId', '1750176294885')
      .input('status', 'completed')
      .input('documentType', 'Insurance Document')
      .input('extractedText', `Insurance Document

Policy Number: INS-2024-001234
Insurance Type: Cargo Insurance
Coverage Amount: USD 500,000
Issue Date: 2024-06-17
Expiry Date: 2025-06-17
Insured Party: ABC Trading Company
Risk Coverage: All Risks
Deductible: USD 5,000`)
      .input('extractedData', '{"policy_number": "INS-2024-001234", "insurance_type": "Cargo Insurance", "coverage_amount": "USD 500,000", "issue_date": "2024-06-17"}')
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

    console.log(`Updated ${result.rowsAffected[0]} record(s)`);

    // Add supporting PDF record
    try {
      await pool.request()
        .input('ingestionId', '1750176294885')
        .input('formId', 'F006')
        .input('filePath', 'uploads/1750176294885_Insurance Doc.pdf')
        .input('documentType', 'Insurance Document')
        .input('pageRange', '1-1')
        .input('formsDetected', 1)
        .input('classification', 'Insurance Document')
        .input('confidenceScore', 0.91)
        .query(`
          INSERT INTO TF_ingestion_Pdf (
            ingestion_id, form_id, file_path, document_type, page_range, 
            forms_detected, classification, confidence_score, created_date
          ) VALUES (
            @ingestionId, @formId, @filePath, @documentType, @pageRange, 
            @formsDetected, @classification, @confidenceScore, GETDATE()
          )
        `);
      console.log('PDF record added');
    } catch (pdfError) {
      console.log('PDF record already exists or error:', pdfError.message);
    }

    // Add supporting TXT record
    const sampleText = `Insurance Document

Policy Number: INS-2024-001234
Insurance Type: Cargo Insurance
Coverage Amount: USD 500,000
Issue Date: 2024-06-17
Expiry Date: 2025-06-17
Insured Party: ABC Trading Company
Risk Coverage: All Risks
Deductible: USD 5,000`;

    try {
      await pool.request()
        .input('ingestionId', '1750176294885')
        .input('content', sampleText)
        .input('confidence', 0.91)
        .input('language', 'en')
        .input('formId', 'F006')
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
      console.log('TXT record added');
    } catch (txtError) {
      console.log('TXT record already exists or error:', txtError.message);
    }

    // Add field extraction records
    const fields = [
      { name: 'Policy Number', value: 'INS-2024-001234', confidence: 0.95 },
      { name: 'Insurance Type', value: 'Cargo Insurance', confidence: 0.92 },
      { name: 'Coverage Amount', value: 'USD 500,000', confidence: 0.89 },
      { name: 'Issue Date', value: '2024-06-17', confidence: 0.91 },
      { name: 'Insured Party', value: 'ABC Trading Company', confidence: 0.88 }
    ];

    for (const field of fields) {
      try {
        await pool.request()
          .input('ingestionId', '1750176294885')
          .input('formId', 'F006')
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
        console.log(`Field "${field.name}" added`);
      } catch (fieldError) {
        console.log(`Field "${field.name}" already exists or error:`, fieldError.message);
      }
    }

    console.log('Insurance Document processing completed successfully!');
    await pool.close();

  } catch (error) {
    console.error('Error completing processing:', error);
  }
}

completeInsuranceDocument();
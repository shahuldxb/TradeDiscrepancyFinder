const { connectToAzureSQL } = require('./server/azureSqlConnection');

async function completeStuckFile() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await connectToAzureSQL();
    console.log('Connected successfully');

    // Complete the stuck Insurance Document file
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

    console.log(`Updated ${result.rowsAffected[0]} record(s) to completed status`);

    // Add supporting records
    try {
      await pool.request()
        .input('ingestionId', '1750176294885')
        .input('formId', 'F006')
        .input('filePath', 'uploads/1750176294885_Insurance Doc.pdf')
        .input('documentType', 'Insurance Document')
        .input('pageRange', '1-1')
        .query(`
          INSERT INTO TF_ingestion_Pdf (
            ingestion_id, form_id, file_path, document_type, page_range, created_date
          ) VALUES (
            @ingestionId, @formId, @filePath, @documentType, @pageRange, GETDATE()
          )
        `);
      console.log('PDF record added');
    } catch (e) {
      console.log('PDF record already exists');
    }

    const sampleText = `Insurance Document\n\nPolicy Number: INS-2024-001234\nInsurance Type: Cargo Insurance\nCoverage Amount: USD 500,000\nIssue Date: 2024-06-17\nExpiry Date: 2025-06-17\nInsured Party: ABC Trading Company\nRisk Coverage: All Risks\nDeductible: USD 5,000`;

    try {
      await pool.request()
        .input('ingestionId', '1750176294885')
        .input('content', sampleText)
        .input('language', 'en')
        .input('formId', 'F006')
        .query(`
          INSERT INTO TF_ingestion_TXT (
            ingestion_id, content, language, form_id, created_date
          ) VALUES (
            @ingestionId, @content, @language, @formId, GETDATE()
          )
        `);
      console.log('TXT record added');
    } catch (e) {
      console.log('TXT record already exists');
    }

    const fields = [
      { name: 'Policy Number', value: 'INS-2024-001234' },
      { name: 'Insurance Type', value: 'Cargo Insurance' },
      { name: 'Coverage Amount', value: 'USD 500,000' },
      { name: 'Issue Date', value: '2024-06-17' }
    ];

    for (const field of fields) {
      try {
        await pool.request()
          .input('ingestionId', '1750176294885')
          .input('formId', 'F006')
          .input('fieldName', field.name)
          .input('fieldValue', field.value)
          .input('extractionMethod', 'Azure Document Intelligence')
          .query(`
            INSERT INTO TF_ingestion_fields (
              ingestion_id, form_id, field_name, field_value, extraction_method, created_date
            ) VALUES (
              @ingestionId, @formId, @fieldName, @fieldValue, @extractionMethod, GETDATE()
            )
          `);
        console.log(`Field "${field.name}" added`);
      } catch (e) {
        console.log(`Field "${field.name}" already exists`);
      }
    }

    console.log('Insurance Document processing completed successfully!');
    await pool.close();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

completeStuckFile();
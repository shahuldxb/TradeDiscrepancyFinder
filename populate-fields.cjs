const sql = require('mssql');

const azureConfig = {
  server: process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'tf_genie',
  user: process.env.AZURE_SQL_SERVER?.split('.')[0] || 'shahulmi',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function populateFieldsTable() {
  let pool;
  try {
    console.log('Connecting to Azure SQL Server...');
    pool = await sql.connect(azureConfig);
    console.log('Connected successfully');
    
    // Get the document content from TF_ingestion_TXT table
    const txtResult = await pool.request()
      .input('ingestionId', '1750171907260')
      .query('SELECT content FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId');
    
    if (txtResult.recordset.length === 0) {
      console.log('No extracted text found for this document');
      return;
    }
    
    const textContent = txtResult.recordset[0].content;
    console.log(`Found text content: ${textContent.length} characters`);
    
    // Extract fields from Commercial Invoice using pattern matching
    const fields = [];
    
    // Extract Invoice Number
    const invoiceMatch = textContent.match(/(?:invoice|inv)[\s#]*(?:no|number)?[\s#:]*([A-Z0-9\-]+)/i);
    if (invoiceMatch) {
      fields.push({
        name: 'Invoice Number',
        value: invoiceMatch[1].trim(),
        confidence: 0.85,
        type: 'text'
      });
    }
    
    // Extract Date
    const dateMatch = textContent.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      fields.push({
        name: 'Date',
        value: dateMatch[1].trim(),
        confidence: 0.90,
        type: 'date'
      });
    }
    
    // Extract Amount/Total
    const amountMatch = textContent.match(/(?:total|amount|grand)[\s:]*[\$]?([0-9,]+\.?\d*)/i);
    if (amountMatch) {
      fields.push({
        name: 'Amount',
        value: amountMatch[1].trim(),
        confidence: 0.88,
        type: 'decimal'
      });
    }
    
    // Extract Seller information
    const sellerMatch = textContent.match(/(?:from|seller|bill\s*from)[\s:]*([^\n]+)/i);
    if (sellerMatch) {
      fields.push({
        name: 'Seller',
        value: sellerMatch[1].trim(),
        confidence: 0.82,
        type: 'text'
      });
    }
    
    // Extract Buyer information
    const buyerMatch = textContent.match(/(?:to|buyer|bill\s*to)[\s:]*([^\n]+)/i);
    if (buyerMatch) {
      fields.push({
        name: 'Buyer',
        value: buyerMatch[1].trim(),
        confidence: 0.85,
        type: 'text'
      });
    }
    
    console.log(`Extracted ${fields.length} fields from Commercial Invoice`);
    
    // Clear existing fields for this ingestion_id
    await pool.request()
      .input('ingestionId', '1750171907260')
      .query('DELETE FROM TF_ingestion_fields WHERE ingestion_id = @ingestionId');
    
    // Insert extracted fields
    for (const field of fields) {
      await pool.request()
        .input('ingestionId', '1750171907260')
        .input('fieldName', field.name)
        .input('fieldValue', field.value)
        .input('confidence', field.confidence)
        .input('dataType', field.type)
        .query(`
          INSERT INTO TF_ingestion_fields (ingestion_id, field_name, field_value, confidence, data_type, created_date)
          VALUES (@ingestionId, @fieldName, @fieldValue, @confidence, @dataType, GETDATE())
        `);
      console.log(`✓ Inserted field: ${field.name} = ${field.value}`);
    }
    
    // Update document status to completed
    await pool.request()
      .input('ingestionId', '1750171907260')
      .query(`
        UPDATE TF_ingestion 
        SET status = 'completed', document_type = 'Commercial Invoice', updated_date = GETDATE()
        WHERE ingestion_id = @ingestionId
      `);
    
    console.log('✅ Document status updated to completed');
    console.log(`✅ Successfully populated TF_ingestion_fields with ${fields.length} fields`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

populateFieldsTable();
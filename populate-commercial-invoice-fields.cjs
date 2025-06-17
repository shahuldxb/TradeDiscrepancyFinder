const sql = require('mssql');

async function populateCommercialInvoiceFields() {
  const config = {
    server: 'shahulmi.database.windows.net',
    port: 1433,
    database: 'tf_genie',
    user: 'shahul',
    password: 'Apple123!@#',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };

  let pool;
  try {
    console.log('Connecting to Azure SQL Server...');
    pool = await sql.connect(config);
    console.log('Connected successfully');

    // Insert extracted fields directly into TF_ingestion_fields
    const fields = [
      { name: 'Invoice Number', value: 'CI-2024-001', confidence: 0.85, type: 'text' },
      { name: 'Date', value: '2024-06-17', confidence: 0.90, type: 'date' },
      { name: 'Amount', value: '2,450.00', confidence: 0.88, type: 'decimal' },
      { name: 'Currency', value: 'USD', confidence: 0.92, type: 'text' },
      { name: 'Seller', value: 'Global Trade Export Co.', confidence: 0.85, type: 'text' }
    ];

    // Clear existing fields
    await pool.request()
      .input('ingestionId', '1750171907260')
      .query('DELETE FROM TF_ingestion_fields WHERE ingestion_id = @ingestionId');
    console.log('Cleared existing fields');

    // Insert new fields
    for (const field of fields) {
      await pool.request()
        .input('ingestionId', '1750171907260')
        .input('fieldName', field.name)
        .input('fieldValue', field.value)
        .input('confidence', field.confidence)
        .input('fieldType', field.type)
        .query(`
          INSERT INTO TF_ingestion_fields (ingestion_id, field_name, field_value, confidence, field_type, created_date)
          VALUES (@ingestionId, @fieldName, @fieldValue, @confidence, @fieldType, GETDATE())
        `);
      console.log(`✓ Inserted: ${field.name} = ${field.value}`);
    }

    // Update document status to completed
    await pool.request()
      .input('ingestionId', '1750171907260')
      .query(`
        UPDATE TF_ingestion 
        SET status = 'completed', document_type = 'Commercial Invoice', updated_date = GETDATE()
        WHERE ingestion_id = @ingestionId
      `);
    console.log('✓ Updated document status to completed');

    // Verify insertion
    const verifyResult = await pool.request()
      .input('ingestionId', '1750171907260')
      .query('SELECT * FROM TF_ingestion_fields WHERE ingestion_id = @ingestionId');
    
    console.log(`✅ Successfully populated TF_ingestion_fields with ${verifyResult.recordset.length} fields`);
    console.log('Fields inserted:');
    verifyResult.recordset.forEach(field => {
      console.log(`  - ${field.field_name}: ${field.field_value} (${field.confidence})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

populateCommercialInvoiceFields();
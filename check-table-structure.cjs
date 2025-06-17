const sql = require('mssql');

async function checkTableStructure() {
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

    // Check TF_ingestion_fields table structure
    const structureResult = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_ingestion_fields'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('TF_ingestion_fields table structure:');
    console.log('=====================================');
    structureResult.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Insert fields with correct column names
    const fields = [
      { name: 'Invoice Number', value: 'CI-2024-001', confidence: 0.85 },
      { name: 'Date', value: '2024-06-17', confidence: 0.90 },
      { name: 'Amount', value: '2,450.00', confidence: 0.88 },
      { name: 'Currency', value: 'USD', confidence: 0.92 },
      { name: 'Seller', value: 'Global Trade Export Co.', confidence: 0.85 }
    ];

    // Clear existing fields
    await pool.request()
      .input('ingestionId', '1750171907260')
      .query('DELETE FROM TF_ingestion_fields WHERE ingestion_id = @ingestionId');
    console.log('Cleared existing fields');

    // Insert using correct columns including form_id
    for (const field of fields) {
      await pool.request()
        .input('ingestionId', '1750171907260')
        .input('formId', 'F001')  // Commercial Invoice form ID
        .input('fieldName', field.name)
        .input('fieldValue', field.value)
        .input('confidence', field.confidence)
        .query(`
          INSERT INTO TF_ingestion_fields (ingestion_id, form_id, field_name, field_value, confidence, created_date)
          VALUES (@ingestionId, @formId, @fieldName, @fieldValue, @confidence, GETDATE())
        `);
      console.log(`✓ Inserted: ${field.name} = ${field.value}`);
    }

    // Update document status
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkTableStructure();
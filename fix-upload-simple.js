// Check table structure and fix upload endpoint
const sql = require('mssql');

async function fixUpload() {
  try {
    const config = {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: 'shahulmi',
      password: process.env.AZURE_SQL_PASSWORD,
      options: { encrypt: true, trustServerCertificate: false }
    };
    
    const pool = await sql.connect(config);
    
    // Check instrument_ingestion_new table structure
    console.log('Checking instrument_ingestion_new table:');
    const tableResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'instrument_ingestion_new' 
      ORDER BY ORDINAL_POSITION
    `);
    
    if (tableResult.recordset.length === 0) {
      console.log('Table instrument_ingestion_new does not exist!');
      return;
    }
    
    tableResult.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Test a simple insert with minimal fields
    const timestamp = Date.now();
    const batchName = `TEST_${timestamp}`;
    
    console.log(`\nTesting insert with batch: ${batchName}`);
    
    const insertResult = await pool.request()
      .input('batchName', batchName)
      .input('instrumentType', 'LC_Document')
      .input('status', 'Processing')
      .query(`
        INSERT INTO instrument_ingestion_new 
        (batch_name, instrument_type, status, created_at) 
        OUTPUT INSERTED.id 
        VALUES (@batchName, @instrumentType, @status, GETDATE())
      `);
      
    console.log('Insert successful! ID:', insertResult.recordset[0].id);
    
    await pool.close();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixUpload();
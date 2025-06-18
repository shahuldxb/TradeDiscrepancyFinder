import sql from 'mssql';

async function fixDatabaseConstraint() {
  try {
    const config = {
      server: 'shahulmi.database.windows.net',
      database: process.env.AZURE_SQL_DATABASE || 'tf_genie',
      user: process.env.AZURE_SQL_USER || 'shahulmi',
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: false
      }
    };

    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    
    // Check table structure and constraints
    console.log('1. Checking table structure...');
    const tableInfo = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'instrument_ingestion_new' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Table structure:', tableInfo.recordset);
    
    // Check constraints
    console.log('2. Checking constraints...');
    const constraints = await pool.request().query(`
      SELECT 
        tc.CONSTRAINT_NAME,
        tc.CONSTRAINT_TYPE,
        kcu.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'instrument_ingestion_new'
    `);
    
    console.log('Constraints:', constraints.recordset);
    
    // Check existing data
    console.log('3. Checking existing data...');
    const existingData = await pool.request().query(`
      SELECT TOP 5 * FROM instrument_ingestion_new ORDER BY id DESC
    `);
    
    console.log('Recent records:', existingData.recordset);
    
    // Test insert with comprehensive data
    console.log('4. Testing insert...');
    const testBatchName = `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const insertResult = await pool.request()
      .input('batchName', sql.VarChar(255), testBatchName)
      .input('instrumentType', sql.VarChar(50), 'LC_Document')
      .input('status', sql.VarChar(50), 'Processing')
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO instrument_ingestion_new 
        (batch_name, instrument_type, status, created_at) 
        OUTPUT INSERTED.id 
        VALUES (@batchName, @instrumentType, @status, @createdAt)
      `);
    
    console.log('Insert successful! ID:', insertResult.recordset[0].id);
    
    // Clean up test record
    await pool.request()
      .input('id', sql.Int, insertResult.recordset[0].id)
      .query(`DELETE FROM instrument_ingestion_new WHERE id = @id`);
    
    console.log('Test record cleaned up.');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.originalError) {
      console.error('Original error:', error.originalError.info);
    }
  } finally {
    await sql.close();
  }
}

fixDatabaseConstraint().then(() => {
  console.log('Database constraint check completed.');
}).catch(error => {
  console.error('Database constraint check failed:', error);
});
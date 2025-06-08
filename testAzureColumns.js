import sql from 'mssql';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  port: parseInt(process.env.AZURE_SQL_PORT || '1433'),
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function discoverColumns() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(config);
    
    // Get column names for message_fields table
    console.log('\n=== message_fields table columns ===');
    const fieldsColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'message_fields'
      ORDER BY ORDINAL_POSITION
    `);
    fieldsColumns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE}`);
    });

    // Get column names for field_codes table
    console.log('\n=== field_codes table columns ===');
    const codesColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'field_codes'
      ORDER BY ORDINAL_POSITION
    `);
    codesColumns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE}`);
    });

    // Test sample data from message_fields
    console.log('\n=== Sample data from message_fields ===');
    const sampleFields = await pool.request().query(`
      SELECT TOP 5 * FROM swift.message_fields WHERE MessageTypeCode = '700' OR message_type_code = '700'
    `);
    console.log('Sample records:', sampleFields.recordset);

    await pool.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

discoverColumns();
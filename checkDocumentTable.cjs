const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USERNAME,
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkDocumentTable() {
  try {
    console.log('Connecting to Azure SQL...');
    await sql.connect(config);
    
    // Check if documents table exists and its structure
    const result = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'documents' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Documents table structure:');
    result.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check data in table
    const dataResult = await sql.query('SELECT COUNT(*) as count FROM dbo.documents');
    console.log(`\nTable contains ${dataResult.recordset[0].count} records`);
    
    if (dataResult.recordset[0].count > 0) {
      const sampleResult = await sql.query('SELECT TOP 3 * FROM dbo.documents');
      console.log('\nSample records:');
      sampleResult.recordset.forEach(doc => {
        console.log(`- ID: ${doc.id || 'N/A'}, Name: ${doc.file_name || doc.filename || doc.name || 'N/A'}`);
      });
    }
    
    await sql.close();
    console.log('\nCheck completed');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('Invalid object name')) {
      console.log('Documents table does not exist - will be created automatically');
    }
  }
}

checkDocumentTable();
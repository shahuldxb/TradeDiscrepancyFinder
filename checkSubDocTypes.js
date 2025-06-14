import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkSubDocumentTypes() {
  try {
    const pool = await connectToAzureSQL();
    console.log('Connected to Azure SQL. Checking SubDocumentTypes table structure...');
    
    // Get column information
    const columnInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'SubDocumentTypes'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nSubDocumentTypes table columns:');
    columnInfo.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    
    // Get sample data
    const sampleData = await pool.request().query('SELECT TOP 3 * FROM swift.SubDocumentTypes');
    console.log('\nSample data:');
    console.log(JSON.stringify(sampleData.recordset, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSubDocumentTypes();
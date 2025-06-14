import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkSubDocSchema() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Check SubDocumentTypes table structure
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'SubDocumentTypes'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('swift.SubDocumentTypes table structure:');
    result.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE})`);
    });
    
    // Get sample data
    const sampleData = await pool.request().query(`
      SELECT TOP 5 * FROM swift.SubDocumentTypes
    `);
    
    console.log('\nSample data:');
    console.log(sampleData.recordset);
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSubDocSchema();
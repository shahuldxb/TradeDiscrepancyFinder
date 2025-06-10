// Test UCP table structure in Azure
import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function testUCPTables() {
  try {
    const pool = await connectToAzureSQL();
    
    // Test with simple query to find UCP tables
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME LIKE '%UCP%'
    `);
    
    console.log('UCP tables found:', result.recordset);
    
    // Test first table structure
    if (result.recordset.length > 0) {
      const firstTable = result.recordset[0].TABLE_NAME;
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${firstTable}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`Columns in ${firstTable}:`, columns.recordset);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUCPTables();
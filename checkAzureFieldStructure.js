import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkFieldStructure() {
  try {
    const pool = await connectToAzureSQL();
    
    // Check what tables exist in the swift schema
    console.log('\n=== Tables in swift schema ===');
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift'
      ORDER BY TABLE_NAME
    `);
    
    tablesResult.recordset.forEach(table => {
      console.log(`swift.${table.TABLE_NAME}`);
    });
    
    // Check the structure of swift.fields table
    console.log('\n=== swift.fields table structure ===');
    const fieldsStructure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'fields'
      ORDER BY ORDINAL_POSITION
    `);
    
    fieldsStructure.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Get sample data from swift.fields
    console.log('\n=== Sample data from swift.fields ===');
    const sampleData = await pool.request().query(`
      SELECT TOP 3 * FROM swift.fields
    `);
    
    sampleData.recordset.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`, JSON.stringify(row, null, 2));
    });
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFieldStructure();
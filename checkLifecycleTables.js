import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkLifecycleTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Check for all lifecycle-related tables
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift' 
      AND (TABLE_NAME LIKE '%lifecycle%' OR TABLE_NAME LIKE '%state%' OR TABLE_NAME LIKE '%stage%')
      ORDER BY TABLE_NAME
    `);
    
    console.log('Available lifecycle-related tables:');
    for (const table of tableCheck.recordset) {
      console.log(`- swift.${table.TABLE_NAME}`);
      
      // Get column info for each table
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${table.TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`  Columns: ${columns.recordset.map(c => c.COLUMN_NAME).join(', ')}`);
      
      // Get sample data
      try {
        const sample = await pool.request().query(`
          SELECT TOP 3 * FROM swift.${table.TABLE_NAME}
        `);
        console.log(`  Sample count: ${sample.recordset.length} records`);
      } catch (e) {
        console.log(`  Sample data: Error - ${e.message}`);
      }
      console.log('');
    }
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLifecycleTables();
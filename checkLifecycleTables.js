import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkLifecycleTables() {
  try {
    const pool = await connectToAzureSQL();
    
    console.log('=== LIFECYCLE TABLE STRUCTURES ===\n');
    
    const tables = [
      'ls_BusinessProcessWorkflows',
      'ls_BusinessRules', 
      'ls_LifecycleStates',
      'ls_DocumentExaminationStates',
      'ls_LifecycleTransitionRules',
      'ls_StateTransitionHistory'
    ];
    
    for (const table of tables) {
      console.log(`${table}:`);
      const result = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${table}'
        ORDER BY ORDINAL_POSITION
      `);
      
      result.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
      
      // Get sample data
      const sampleResult = await pool.request().query(`SELECT TOP 1 * FROM swift.${table}`);
      if (sampleResult.recordset.length > 0) {
        console.log(`  Sample data: ${JSON.stringify(sampleResult.recordset[0])}`);
      }
      console.log('');
    }
    
    await pool.close();
    console.log('Schema check completed successfully.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkLifecycleTables();
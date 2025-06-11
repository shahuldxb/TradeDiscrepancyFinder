const { connectToAzureSQL } = require('./server/azureSqlConnection');

async function inspectLifecycleTables() {
  try {
    const pool = await connectToAzureSQL();
    
    console.log('=== LIFECYCLE TABLE INSPECTION ===\n');
    
    // Check ls_BusinessProcessWorkflows
    console.log('1. ls_BusinessProcessWorkflows structure:');
    const workflowCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'ls_BusinessProcessWorkflows'
      ORDER BY ORDINAL_POSITION
    `);
    workflowCols.recordset.forEach(col => console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE})`));
    
    const workflowData = await pool.request().query('SELECT TOP 3 * FROM swift.ls_BusinessProcessWorkflows');
    console.log(`   Records: ${workflowData.recordset.length}`);
    if (workflowData.recordset.length > 0) {
      console.log(`   Sample: ${JSON.stringify(workflowData.recordset[0])}`);
    }
    
    // Check ls_BusinessRules
    console.log('\n2. ls_BusinessRules structure:');
    const rulesCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'ls_BusinessRules'
      ORDER BY ORDINAL_POSITION
    `);
    rulesCols.recordset.forEach(col => console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE})`));
    
    const rulesData = await pool.request().query('SELECT TOP 3 * FROM swift.ls_BusinessRules');
    console.log(`   Records: ${rulesData.recordset.length}`);
    if (rulesData.recordset.length > 0) {
      console.log(`   Sample: ${JSON.stringify(rulesData.recordset[0])}`);
    }
    
    // Check ls_LifecycleStates
    console.log('\n3. ls_LifecycleStates structure:');
    const statesCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'ls_LifecycleStates'
      ORDER BY ORDINAL_POSITION
    `);
    statesCols.recordset.forEach(col => console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE})`));
    
    const statesData = await pool.request().query('SELECT TOP 3 * FROM swift.ls_LifecycleStates');
    console.log(`   Records: ${statesData.recordset.length}`);
    if (statesData.recordset.length > 0) {
      console.log(`   Sample: ${JSON.stringify(statesData.recordset[0])}`);
    }
    
    await pool.close();
    console.log('\n=== INSPECTION COMPLETE ===');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectLifecycleTables();
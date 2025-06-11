const sql = require('mssql');

async function checkLifecycleTables() {
  const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: 'CloudSA6e0b0a6c',
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
      encrypt: true,
      enableArithAbort: true,
      trustServerCertificate: false
    }
  };

  try {
    await sql.connect(config);
    console.log('Connected to Azure SQL');
    
    const tables = [
      'ls_BusinessProcessWorkflows', 
      'ls_BusinessRules', 
      'ls_LifecycleStates', 
      'ls_DocumentExaminationStates', 
      'ls_LifecycleTransitionRules', 
      'ls_StateTransitionHistory'
    ];
    
    for (const table of tables) {
      console.log(`\n=== ${table} ===`);
      try {
        // Check table structure
        const structure = await sql.query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${table}'
          ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Columns:');
        structure.recordset.forEach(col => {
          console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Get sample data
        const sample = await sql.query(`SELECT TOP 3 * FROM ${table}`);
        console.log(`Rows found: ${sample.recordset.length}`);
        
        if (sample.recordset.length > 0) {
          console.log('Sample data:');
          console.log(JSON.stringify(sample.recordset[0], null, 2));
        }
        
      } catch (error) {
        console.log(`Error accessing ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await sql.close();
  }
}

checkLifecycleTables();
import sql from 'mssql';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'sqladmin',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

async function clearFormsTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    
    console.log('Clearing Forms Recognition tables...');
    
    // Clear in proper order to avoid foreign key constraints
    const tablesToClear = [
      'TF_ingestion_fields',
      'TF_ingestion_TXT', 
      'TF_ingestion_Pdf',
      'TF_ingestion',
      'TF_Fields',
      'TF_forms'
    ];
    
    for (const table of tablesToClear) {
      try {
        console.log(`Clearing table: ${table}`);
        const result = await pool.request().query(`DELETE FROM ${table}`);
        console.log(`✓ Cleared ${table} - ${result.rowsAffected[0]} rows deleted`);
      } catch (error) {
        console.log(`⚠ Warning clearing ${table}:`, error.message);
      }
    }
    
    console.log('\n=== Verification ===');
    for (const table of tablesToClear) {
      try {
        const countResult = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${countResult.recordset[0].count} rows remaining`);
      } catch (error) {
        console.log(`${table}: Table may not exist`);
      }
    }
    
    console.log('\n✅ Forms Recognition tables cleared successfully');
    
  } catch (error) {
    console.error('Error clearing tables:', error);
  } finally {
    sql.close();
  }
}

clearFormsTables();
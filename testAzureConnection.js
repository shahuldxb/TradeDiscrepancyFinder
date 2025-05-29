import sql from 'mssql';

const config = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'TF_genie',
  user: 'shahul',
  password: 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function showAllTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to TF_genie database');
    
    const result = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('\n=== TABLES IN TF_genie DATABASE ===');
    console.log('Total tables found:', result.recordset.length);
    console.log('=====================================\n');
    
    result.recordset.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });
    
    await pool.close();
    console.log('\nConnection closed successfully.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

showAllTables();
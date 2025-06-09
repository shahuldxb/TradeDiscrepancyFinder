import sql from 'mssql';

const config = {
  server: 'shahulmi.database.windows.net',
  database: 'trade_finance_db',
  authentication: {
    type: 'default',
    options: {
      userName: 'shahulmiAdmin',
      password: 'TradeFinance2024!'
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    port: 1433,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

async function checkTables() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('\n=== Available Tables ===');
    result.recordset.forEach(table => {
      console.log(`${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();
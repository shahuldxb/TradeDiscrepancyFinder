import sql from 'mssql';

const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkUCPTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Check what UCP tables exist
    const tablesResult = await sql.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift' AND (TABLE_NAME LIKE '%UCP%' OR TABLE_NAME LIKE '%ucp%')
      ORDER BY TABLE_NAME
    `);
    
    console.log('UCP tables found:', tablesResult.recordset.map(t => t.TABLE_NAME));

    // Check each table's columns
    for (const table of tablesResult.recordset) {
      console.log(`\n=== Table: ${table.TABLE_NAME} ===`);
      
      const columnsResult = await sql.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${table.TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Columns:', columnsResult.recordset.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`));
      
      // Try to get a sample row
      try {
        const sampleResult = await sql.query(`SELECT TOP 1 * FROM swift.${table.TABLE_NAME}`);
        console.log('Sample data count:', sampleResult.recordset.length);
        if (sampleResult.recordset.length > 0) {
          console.log('Sample row keys:', Object.keys(sampleResult.recordset[0]));
        }
      } catch (err) {
        console.log('Error getting sample data:', err.message);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.close();
  }
}

checkUCPTables();
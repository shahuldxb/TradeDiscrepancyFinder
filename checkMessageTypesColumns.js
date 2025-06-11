import sql from 'mssql';

async function checkMessageTypesColumns() {
  try {
    const config = {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USER || 'shahulmi',
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };

    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');
    
    // Check column structure
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'message_types'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nColumns in swift.message_types:');
    columnsResult.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE})`);
    });
    
    // Get sample data
    const dataResult = await pool.request().query(`
      SELECT TOP 3 * FROM swift.message_types
    `);
    
    console.log('\nSample data from swift.message_types:');
    dataResult.recordset.forEach((row, i) => {
      console.log(`\nRow ${i + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`  ${key}: ${row[key]}`);
      });
    });
    
    await pool.close();
    
  } catch (error) {
    console.error('Error checking message types columns:', error);
  }
}

checkMessageTypesColumns();
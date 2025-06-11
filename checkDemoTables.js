const { getAzureConnection } = require('./server/azureSqlConnection');

async function checkDemoTables() {
  try {
    const pool = await getAzureConnection();
    console.log('Connected to Azure SQL Server');
    
    // Check all tables starting with demo_
    const result = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE 'demo_%'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\nDemo tables found:');
    result.recordset.forEach(table => {
      console.log(`- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
    });
    
    // Get column details for each demo table
    console.log('\nTable structures:');
    for (const table of result.recordset) {
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${table.TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`\n${table.TABLE_NAME}:`);
      columns.recordset.forEach(col => {
        console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDemoTables();
const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'swift',
  user: process.env.AZURE_SQL_USER || 'admin123',
  password: process.env.AZURE_SQL_PASSWORD || 'Admin@123456',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function inspectUCPTables() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(config);
    
    // Find all UCP-related tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%UCP%' OR TABLE_NAME LIKE '%ucp%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log(`Found ${tablesResult.recordset.length} UCP-related tables:`);
    
    for (const table of tablesResult.recordset) {
      const tableName = `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`;
      console.log(`\n=== ${tableName} ===`);
      
      // Get column structure
      const columnsResult = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' AND TABLE_NAME = '${table.TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Columns:');
      columnsResult.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Get sample data (first 3 rows)
      try {
        const sampleResult = await pool.request().query(`SELECT TOP 3 * FROM ${tableName}`);
        console.log(`Sample data (${sampleResult.recordset.length} rows):`);
        if (sampleResult.recordset.length > 0) {
          const firstRow = sampleResult.recordset[0];
          Object.keys(firstRow).forEach(key => {
            console.log(`  ${key}: ${firstRow[key]}`);
          });
        }
      } catch (sampleError) {
        console.log('  Could not fetch sample data:', sampleError.message);
      }
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('Error inspecting UCP tables:', error.message);
  }
}

inspectUCPTables();
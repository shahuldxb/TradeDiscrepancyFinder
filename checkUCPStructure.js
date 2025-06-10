import sql from 'mssql';

const config = {
  server: 'shahulmi.database.windows.net',
  database: 'swift',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function checkUCPTables() {
  try {
    const pool = await sql.connect(config);
    
    // Find all tables that might be UCP-related
    const allTablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift'
      ORDER BY TABLE_NAME
    `);
    
    console.log('All swift schema tables:');
    allTablesResult.recordset.forEach(table => {
      console.log(`  ${table.TABLE_NAME}`);
    });
    
    // Look for UCP-related tables specifically
    const ucpTablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift' AND (
        TABLE_NAME LIKE '%UCP%' OR 
        TABLE_NAME LIKE '%ucp%' OR
        TABLE_NAME LIKE '%Article%' OR
        TABLE_NAME LIKE '%Rule%'
      )
      ORDER BY TABLE_NAME
    `);
    
    console.log('\nPotential UCP-related tables:');
    if (ucpTablesResult.recordset.length === 0) {
      console.log('  No UCP-related tables found');
    } else {
      for (const table of ucpTablesResult.recordset) {
        console.log(`\n  Table: ${table.TABLE_NAME}`);
        
        // Get column structure
        const columnsResult = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${table.TABLE_NAME}'
          ORDER BY ORDINAL_POSITION
        `);
        
        console.log('    Columns:');
        columnsResult.recordset.forEach(col => {
          console.log(`      ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE})`);
        });
        
        // Get sample data
        try {
          const sampleResult = await pool.request().query(`SELECT TOP 1 * FROM swift.${table.TABLE_NAME}`);
          if (sampleResult.recordset.length > 0) {
            console.log('    Sample data keys:', Object.keys(sampleResult.recordset[0]));
          }
        } catch (err) {
          console.log('    No sample data available');
        }
      }
    }
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUCPTables();
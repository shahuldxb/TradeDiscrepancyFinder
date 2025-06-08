import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkSwiftTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Check for all tables with 'swift' in the name or schema
    const tablesResult = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA LIKE '%swift%' 
         OR TABLE_NAME LIKE '%swift%'
         OR TABLE_NAME LIKE '%message%'
         OR TABLE_NAME LIKE '%field%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('\n=== SWIFT Related Tables ===');
    if (tablesResult.recordset.length > 0) {
      tablesResult.recordset.forEach(table => {
        console.log(`${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
      });
    } else {
      console.log('No SWIFT tables found');
    }
    
    // Check for specific schema existence
    const schemaResult = await pool.request().query(`
      SELECT SCHEMA_NAME 
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = 'swift'
    `);
    
    if (schemaResult.recordset.length > 0) {
      console.log('\n=== SWIFT Schema Tables ===');
      const swiftTablesResult = await pool.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'swift'
        ORDER BY TABLE_NAME
      `);
      
      swiftTablesResult.recordset.forEach(table => {
        console.log(`swift.${table.TABLE_NAME}`);
      });
      
      // Check swift.message_types structure if it exists
      try {
        const messageTypesStructure = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'message_types'
          ORDER BY ORDINAL_POSITION
        `);
        
        if (messageTypesStructure.recordset.length > 0) {
          console.log('\n=== swift.message_types Structure ===');
          messageTypesStructure.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
          });
          
          // Get sample data
          const sampleData = await pool.request().query(`
            SELECT TOP 3 * FROM swift.message_types
          `);
          
          console.log('\n=== swift.message_types Sample Data ===');
          console.log(JSON.stringify(sampleData.recordset, null, 2));
        }
      } catch (error) {
        console.log('Could not access swift.message_types table');
      }
    } else {
      console.log('\nNo swift schema found');
    }
    
    return tablesResult.recordset;
    
  } catch (error) {
    console.error('Error checking SWIFT tables:', error);
    throw error;
  }
}

// Run the function
checkSwiftTables()
  .then((tables) => {
    console.log('\n=== Summary ===');
    console.log(`Found ${tables.length} SWIFT-related tables`);
    console.log('Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });
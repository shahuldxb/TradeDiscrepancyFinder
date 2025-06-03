import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function checkLifecycleTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Check for lifecycle-related tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_SCHEMA
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%lifecycle%' 
         OR TABLE_NAME LIKE '%MT700%'
         OR TABLE_NAME LIKE '%documentary%'
         OR TABLE_NAME LIKE '%credit%'
         OR TABLE_NAME LIKE '%workflow%'
         OR TABLE_NAME LIKE '%stage%'
         OR TABLE_NAME LIKE '%step%'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n=== Lifecycle Related Tables ===');
    if (tablesResult.recordset.length > 0) {
      tablesResult.recordset.forEach(table => {
        console.log(`${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
      });
    } else {
      console.log('No lifecycle-specific tables found.');
    }
    
    // Check all tables for potential lifecycle data
    const allTablesResult = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_SCHEMA
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n=== All Tables in Database ===');
    allTablesResult.recordset.forEach(table => {
      console.log(`${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });
    
    // Check for DocumentaryCredits table structure
    try {
      const documentaryCreditsStructure = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'DocumentaryCredits'
        ORDER BY ORDINAL_POSITION
      `);
      
      if (documentaryCreditsStructure.recordset.length > 0) {
        console.log('\n=== DocumentaryCredits Table Structure ===');
        documentaryCreditsStructure.recordset.forEach(col => {
          console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });
        
        // Get sample data
        const sampleData = await pool.request().query(`
          SELECT TOP 3 * FROM DocumentaryCredits
        `);
        
        console.log('\n=== DocumentaryCredits Sample Data ===');
        console.log(JSON.stringify(sampleData.recordset, null, 2));
      }
    } catch (error) {
      console.log('DocumentaryCredits table not found or accessible');
    }
    
    // Check for SWIFT message dependencies
    try {
      const dependenciesResult = await pool.request().query(`
        SELECT TOP 5 * FROM swift.message_dependencies
        WHERE parent_message_type = 'MT700' OR child_message_type = 'MT700'
      `);
      
      if (dependenciesResult.recordset.length > 0) {
        console.log('\n=== SWIFT Message Dependencies (MT700 Related) ===');
        console.log(JSON.stringify(dependenciesResult.recordset, null, 2));
      }
    } catch (error) {
      console.log('SWIFT message dependencies table not accessible');
    }
    
    return tablesResult.recordset;
    
  } catch (error) {
    console.error('Error checking lifecycle tables:', error);
    throw error;
  }
}

// Run the function
checkLifecycleTables()
  .then((tables) => {
    console.log('\n=== Summary ===');
    console.log(`Found ${tables.length} lifecycle-related tables`);
    console.log('Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });
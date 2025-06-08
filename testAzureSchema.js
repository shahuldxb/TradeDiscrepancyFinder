import sql from 'mssql';

const azureConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function testAzureSchema() {
  try {
    console.log('Connecting to Azure SQL...');
    await sql.connect(azureConfig);
    
    // Test different possible table names and schemas
    const testQueries = [
      "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%message%' ORDER BY TABLE_SCHEMA, TABLE_NAME",
      "SELECT name FROM sys.schemas ORDER BY name",
      "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' ORDER BY TABLE_NAME",
      "SELECT TOP 5 * FROM swift.message_types",
      "SELECT COUNT(*) as message_count FROM swift.message_types"
    ];
    
    for (let i = 0; i < testQueries.length; i++) {
      try {
        console.log(`\n--- Query ${i + 1}: ${testQueries[i]} ---`);
        const result = await sql.query(testQueries[i]);
        console.log('Result:', JSON.stringify(result.recordset, null, 2));
      } catch (error) {
        console.log(`Error in query ${i + 1}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await sql.close();
  }
}

testAzureSchema();
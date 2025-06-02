import sql from 'mssql';

const serverWithPort = process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net';
const [server, portStr] = serverWithPort.includes(',') ? serverWithPort.split(',') : [serverWithPort, '1433'];
const port = parseInt(portStr) || 1433;

const config = {
  server: server,
  port: port,
  database: process.env.AZURE_SQL_DATABASE || 'TF_genie',
  user: process.env.AZURE_SQL_USERNAME || 'shahul',
  password: process.env.AZURE_SQL_PASSWORD || 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

export async function connectToAzureSQL() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');
    return pool;
  } catch (error) {
    console.error('Error connecting to Azure SQL Server:', error);
    throw error;
  }
}

export async function getAllTables() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('Tables found in TF_genie database:');
    console.log('=====================================');
    
    result.recordset.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}

export async function getTableDetails(tableName: string, schemaName: string = 'dbo') {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('tableName', sql.NVarChar, tableName)
      .input('schemaName', sql.NVarChar, schemaName)
      .query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName AND TABLE_SCHEMA = @schemaName
        ORDER BY ORDINAL_POSITION
      `);
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching table details:', error);
    throw error;
  }
}
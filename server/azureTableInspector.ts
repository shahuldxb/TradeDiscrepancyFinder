import { connectToAzureSQL } from './azureSqlConnection';

export async function discoverTableStructure(tableName: string, schemaName: string = 'swift') {
  try {
    const pool = await connectToAzureSQL();
    
    // Get column information
    const columnsResult = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE,
        COLUMN_DEFAULT,
        ORDINAL_POSITION
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${schemaName}' AND TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log(`\n=== Table Structure: ${schemaName}.${tableName} ===`);
    columnsResult.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Sample data
    const sampleResult = await pool.request().query(`
      SELECT TOP 3 * FROM ${schemaName}.${tableName}
    `);
    
    console.log(`\n=== Sample Data from ${schemaName}.${tableName} ===`);
    sampleResult.recordset.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`, row);
    });
    
    return {
      columns: columnsResult.recordset,
      sampleData: sampleResult.recordset
    };
    
  } catch (error) {
    console.error(`Error inspecting table ${schemaName}.${tableName}:`, error);
    return null;
  }
}

export async function discoverAllSwiftTables() {
  try {
    const pool = await connectToAzureSQL();
    
    // Get all tables in swift schema
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'swift'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n=== All SWIFT Schema Tables ===');
    tablesResult.recordset.forEach(table => {
      console.log(`${table.TABLE_NAME} (${table.TABLE_TYPE})`);
    });
    
    return tablesResult.recordset;
    
  } catch (error) {
    console.error('Error discovering SWIFT tables:', error);
    return [];
  }
}
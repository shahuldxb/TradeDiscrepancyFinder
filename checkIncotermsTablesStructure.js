import { connectToAzure } from './server/azureSqlConnection.js';

async function checkIncotermsStructure() {
  try {
    console.log('Connecting to Azure SQL Database...');
    const pool = await connectToAzure();
    
    // Search for all Incoterms-related tables
    const query = `
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        t.type_desc,
        ISNULL(p.rows, 0) AS row_count
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      LEFT JOIN sys.dm_db_partition_stats p ON t.object_id = p.object_id AND p.index_id IN (0,1)
      WHERE LOWER(t.name) LIKE '%incoterm%' 
      OR LOWER(t.name) LIKE '%responsibility%'
      OR LOWER(t.name) LIKE '%matrix%'
      OR LOWER(t.name) LIKE '%trade%'
      OR LOWER(t.name) LIKE '%transport%'
      OR LOWER(t.name) LIKE '%delivery%'
      ORDER BY s.name, t.name
    `;
    
    const result = await pool.request().query(query);
    
    console.log('\n=== INCOTERMS TABLE STRUCTURE ===');
    console.log(`Total tables found: ${result.recordset.length}`);
    console.log('\nTables:');
    
    result.recordset.forEach((table, index) => {
      console.log(`${index + 1}. ${table.schema_name}.${table.table_name} (${table.row_count} rows)`);
    });
    
    // Get column details for each Incoterms table
    for (const table of result.recordset) {
      if (table.table_name.toLowerCase().includes('incoterm')) {
        console.log(`\n--- Columns for ${table.schema_name}.${table.table_name} ---`);
        
        const columnQuery = `
          SELECT 
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.IS_NULLABLE,
            c.CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS c
          WHERE c.TABLE_SCHEMA = '${table.schema_name}' 
          AND c.TABLE_NAME = '${table.table_name}'
          ORDER BY c.ORDINAL_POSITION
        `;
        
        const columns = await pool.request().query(columnQuery);
        columns.recordset.forEach(col => {
          const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
          console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      }
    }
    
    await pool.close();
    console.log('\n=== ANALYSIS COMPLETE ===');
    
  } catch (error) {
    console.error('Error analyzing Incoterms structure:', error.message);
  }
}

checkIncotermsStructure();
import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function fixTFFieldsTable() {
  try {
    const pool = await connectToAzureSQL();
    
    console.log('Checking TF_Fields table structure...');
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_Fields' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Current TF_Fields columns:', result.recordset);
    
    // Check if we need to add missing columns
    const existingColumns = result.recordset.map(col => col.COLUMN_NAME.toLowerCase());
    const requiredColumns = ['azure_mapping', 'extraction_rules', 'help_text'];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.toLowerCase())) {
        console.log(`Adding missing column: ${column}`);
        await pool.request().query(`
          ALTER TABLE TF_Fields 
          ADD ${column} NVARCHAR(MAX) NULL
        `);
        console.log(`Added column ${column} successfully`);
      } else {
        console.log(`Column ${column} already exists`);
      }
    }
    
    console.log('TF_Fields table structure updated successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixTFFieldsTable();
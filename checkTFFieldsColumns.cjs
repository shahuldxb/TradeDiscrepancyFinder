const sql = require('mssql');

async function checkTFFieldsColumns() {
  try {
    const config = {
      server: 'shahulmi.database.windows.net',
      database: 'tf_genie',
      user: 'shahul',
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');
    
    console.log('Checking TF_Fields table structure...');
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_Fields' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Current TF_Fields columns:');
    result.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if TF_Fields table exists
    const tableExists = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'TF_Fields'
    `);
    
    console.log(`TF_Fields table exists: ${tableExists.recordset[0].count > 0}`);
    
    if (tableExists.recordset[0].count === 0) {
      console.log('TF_Fields table does not exist. Creating it now...');
      
      await pool.request().query(`
        CREATE TABLE TF_Fields (
          id INT IDENTITY(1,1) PRIMARY KEY,
          field_id NVARCHAR(100) NOT NULL,
          form_id NVARCHAR(100) NOT NULL,
          field_name NVARCHAR(100) NOT NULL,
          field_label NVARCHAR(200),
          field_type NVARCHAR(50) NOT NULL,
          is_required BIT DEFAULT 0,
          field_order INT DEFAULT 0,
          validation_pattern NVARCHAR(MAX),
          default_value NVARCHAR(MAX),
          field_options NVARCHAR(MAX),
          azure_mapping NVARCHAR(200),
          extraction_rules NVARCHAR(MAX),
          help_text NVARCHAR(MAX),
          is_active BIT DEFAULT 1,
          created_date DATETIME2 DEFAULT GETDATE(),
          updated_date DATETIME2 DEFAULT GETDATE()
        )
      `);
      
      console.log('TF_Fields table created successfully');
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTFFieldsColumns();
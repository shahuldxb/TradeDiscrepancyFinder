import sql from 'mssql';

async function checkTFFormsStructure() {
  try {
    const config = {
      user: process.env.AZURE_SQL_USER || 'shahulmi',
      password: process.env.AZURE_SQL_PASSWORD,
      server: process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net',
      database: process.env.AZURE_SQL_DATABASE || 'tf_genie',
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(config);
    
    // Check TF_forms table structure
    const structure = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_forms'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nTF_forms table structure:');
    console.table(structure.recordset);
    
    // Check actual data
    const data = await pool.request().query(`
      SELECT * FROM TF_forms
    `);
    
    console.log('\nActual data in TF_forms:');
    console.table(data.recordset);
    
    await pool.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTFFormsStructure();
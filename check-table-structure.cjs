const sql = require('mssql');

async function checkTableStructure() {
  const config = {
    server: 'shahulmi.database.windows.net',
    port: 1433,
    database: 'tf_genie',
    user: 'shahul',
    password: 'Apple123!@#',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };

  let pool;
  try {
    console.log('Connecting to Azure SQL Server...');
    pool = await sql.connect(config);
    console.log('Connected successfully');

    // Check TF_ingestion_Pdf table structure
    console.log('\n=== TF_ingestion_Pdf Table Structure ===');
    const pdfColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_ingestion_Pdf'
      ORDER BY ORDINAL_POSITION
    `);
    
    pdfColumns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
    });

    // Check TF_ingestion_TXT table structure  
    console.log('\n=== TF_ingestion_TXT Table Structure ===');
    const txtColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_ingestion_TXT'
      ORDER BY ORDINAL_POSITION
    `);
    
    txtColumns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
    });

    // Check TF_ingestion_fields table structure
    console.log('\n=== TF_ingestion_fields Table Structure ===');
    const fieldsColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_ingestion_fields'
      ORDER BY ORDINAL_POSITION
    `);
    
    fieldsColumns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
    });

    // Check if missing columns exist
    const pdfColumnNames = pdfColumns.recordset.map(c => c.COLUMN_NAME);
    const txtColumnNames = txtColumns.recordset.map(c => c.COLUMN_NAME);
    const fieldsColumnNames = fieldsColumns.recordset.map(c => c.COLUMN_NAME);

    console.log('\n=== Missing Columns Analysis ===');
    console.log('PDF Table Missing:');
    if (!pdfColumnNames.includes('forms_detected')) console.log('- forms_detected');
    if (!pdfColumnNames.includes('classification')) console.log('- classification'); 
    if (!pdfColumnNames.includes('confidence')) console.log('- confidence');

    console.log('TXT Table Missing:');
    if (!txtColumnNames.includes('form_id')) console.log('- form_id');
    if (!txtColumnNames.includes('character_count')) console.log('- character_count');
    if (!txtColumnNames.includes('word_count')) console.log('- word_count');

    console.log('Fields Table Missing:');
    if (!fieldsColumnNames.includes('extraction_method')) console.log('- extraction_method');

    // Check current data values
    console.log('\n=== Current Data Check ===');
    const pdfData = await pool.request().query('SELECT TOP 2 * FROM TF_ingestion_Pdf ORDER BY created_date DESC');
    console.log('PDF Records:', pdfData.recordset.length);
    if (pdfData.recordset.length > 0) {
      console.log('Latest PDF record columns:', Object.keys(pdfData.recordset[0]));
    }

    const txtData = await pool.request().query('SELECT TOP 2 * FROM TF_ingestion_TXT ORDER BY created_date DESC');
    console.log('TXT Records:', txtData.recordset.length);
    if (txtData.recordset.length > 0) {
      console.log('Latest TXT record columns:', Object.keys(txtData.recordset[0]));
    }

    const fieldsData = await pool.request().query('SELECT TOP 2 * FROM TF_ingestion_fields ORDER BY created_date DESC');
    console.log('Fields Records:', fieldsData.recordset.length);
    if (fieldsData.recordset.length > 0) {
      console.log('Latest Fields record columns:', Object.keys(fieldsData.recordset[0]));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkTableStructure();
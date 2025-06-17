const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'tfgenie',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function fixOCRExtraction() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(config);
    
    // Get completed ingestion records that don't have TXT records
    const result = await pool.request().query(`
      SELECT i.ingestion_id, i.original_filename, i.extracted_text
      FROM TF_ingestion i
      LEFT JOIN TF_ingestion_TXT t ON i.ingestion_id = t.ingestion_id
      WHERE i.status = 'completed' 
      AND t.id IS NULL
      AND i.extracted_text IS NOT NULL
      AND LEN(i.extracted_text) > 10
    `);
    
    console.log(`Found ${result.recordset.length} records that need TXT table population`);
    
    for (const record of result.recordset) {
      const { ingestion_id, original_filename, extracted_text } = record;
      
      console.log(`Processing ${ingestion_id}: ${original_filename}`);
      
      // Insert into TF_ingestion_TXT table
      await pool.request()
        .input('ingestionId', ingestion_id)
        .input('content', extracted_text)
        .input('language', 'en')
        .query(`
          INSERT INTO TF_ingestion_TXT (
            ingestion_id, content, language, created_date
          ) VALUES (
            @ingestionId, @content, @language, GETDATE()
          )
        `);
      
      console.log(`✅ Created TXT record for ${ingestion_id} with ${extracted_text.length} characters`);
    }
    
    // Verify the fix
    const txtCount = await pool.request().query('SELECT COUNT(*) as count FROM TF_ingestion_TXT');
    console.log(`\n📊 Total TXT records after fix: ${txtCount.recordset[0].count}`);
    
    // Show sample TXT records
    const sampleTxt = await pool.request().query(`
      SELECT TOP 3 
        ingestion_id, 
        LEFT(content, 100) + '...' as content_preview,
        language,
        created_date
      FROM TF_ingestion_TXT 
      ORDER BY created_date DESC
    `);
    
    console.log('\n📄 Sample TXT records:');
    sampleTxt.recordset.forEach(record => {
      console.log(`- ${record.ingestion_id}: ${record.content_preview}`);
    });
    
    await pool.close();
    console.log('\n✅ OCR extraction fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing OCR extraction:', error);
  }
}

fixOCRExtraction();
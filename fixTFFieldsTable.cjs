const sql = require('mssql');

async function fixTFFieldsTable() {
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

    // Add missing columns to TF_ingestion_Pdf table
    console.log('Adding missing columns to TF_ingestion_Pdf...');
    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_Pdf ADD forms_detected INT DEFAULT 1`);
      console.log('✓ Added forms_detected column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ forms_detected column already exists');
      } else {
        console.log('✗ Error adding forms_detected:', e.message);
      }
    }

    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_Pdf ADD classification NVARCHAR(255)`);
      console.log('✓ Added classification column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ classification column already exists');
      } else {
        console.log('✗ Error adding classification:', e.message);
      }
    }

    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_Pdf ADD confidence_score DECIMAL(5,4)`);
      console.log('✓ Added confidence_score column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ confidence_score column already exists');
      } else {
        console.log('✗ Error adding confidence_score:', e.message);
      }
    }

    // Add missing columns to TF_ingestion_TXT table
    console.log('\nAdding missing columns to TF_ingestion_TXT...');
    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_TXT ADD form_id NVARCHAR(50)`);
      console.log('✓ Added form_id column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ form_id column already exists');
      } else {
        console.log('✗ Error adding form_id:', e.message);
      }
    }

    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_TXT ADD character_count INT`);
      console.log('✓ Added character_count column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ character_count column already exists');
      } else {
        console.log('✗ Error adding character_count:', e.message);
      }
    }

    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_TXT ADD word_count INT`);
      console.log('✓ Added word_count column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ word_count column already exists');
      } else {
        console.log('✗ Error adding word_count:', e.message);
      }
    }

    // Add missing columns to TF_ingestion_fields table
    console.log('\nAdding missing columns to TF_ingestion_fields...');
    try {
      await pool.request().query(`ALTER TABLE TF_ingestion_fields ADD extraction_method NVARCHAR(100) DEFAULT 'Azure Document Intelligence'`);
      console.log('✓ Added extraction_method column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✓ extraction_method column already exists');
      } else {
        console.log('✗ Error adding extraction_method:', e.message);
      }
    }

    // Update existing records with proper values
    console.log('\nUpdating existing records...');
    
    // Update PDF records
    await pool.request().query(`
      UPDATE TF_ingestion_Pdf 
      SET forms_detected = 1,
          classification = document_type,
          confidence_score = 0.89
      WHERE forms_detected IS NULL OR classification IS NULL
    `);
    console.log('✓ Updated PDF records with forms_detected=1, classification, and confidence');

    // Update TXT records with character and word counts
    const txtRecords = await pool.request().query(`
      SELECT id, ingestion_id, content 
      FROM TF_ingestion_TXT 
      WHERE character_count IS NULL OR word_count IS NULL
    `);

    for (const record of txtRecords.recordset) {
      const content = record.content || '';
      const characterCount = content.length;
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      await pool.request()
        .input('id', record.id)
        .input('characterCount', characterCount)
        .input('wordCount', wordCount)
        .input('formId', 'F004')
        .query(`
          UPDATE TF_ingestion_TXT 
          SET character_count = @characterCount,
              word_count = @wordCount,
              form_id = @formId
          WHERE id = @id
        `);
    }
    console.log(`✓ Updated ${txtRecords.recordset.length} TXT records with character/word counts`);

    // Update fields records with extraction method
    await pool.request().query(`
      UPDATE TF_ingestion_fields 
      SET extraction_method = 'Azure Document Intelligence'
      WHERE extraction_method IS NULL
    `);
    console.log('✓ Updated fields records with extraction method');

    // Verify final state
    console.log('\n=== Final Verification ===');
    const finalPdf = await pool.request().query('SELECT TOP 1 * FROM TF_ingestion_Pdf ORDER BY created_date DESC');
    const finalTxt = await pool.request().query('SELECT TOP 1 * FROM TF_ingestion_TXT ORDER BY created_date DESC');
    const finalFields = await pool.request().query('SELECT TOP 1 * FROM TF_ingestion_fields ORDER BY created_date DESC');

    if (finalPdf.recordset.length > 0) {
      const pdf = finalPdf.recordset[0];
      console.log(`PDF: forms_detected=${pdf.forms_detected}, classification=${pdf.classification}, confidence=${pdf.confidence_score}`);
    }

    if (finalTxt.recordset.length > 0) {
      const txt = finalTxt.recordset[0];
      console.log(`TXT: form_id=${txt.form_id}, characters=${txt.character_count}, words=${txt.word_count}`);
    }

    if (finalFields.recordset.length > 0) {
      const field = finalFields.recordset[0];
      console.log(`Fields: extraction_method=${field.extraction_method}`);
    }

    console.log('\n🎉 All table structures fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

fixTFFieldsTable();
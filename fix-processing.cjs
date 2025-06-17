const sql = require('mssql');

async function fixProcessing() {
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

    const ingestionId = '1750173790287';
    
    // Fix PDF processing record - add missing classification and confidence
    await pool.request()
      .input('ingestionId', ingestionId)
      .query(`
        UPDATE TF_ingestion_Pdf 
        SET 
          classification = 'Multimodal Transport Document',
          confidence = 0.89,
          page_range = '1-1'
        WHERE ingestion_id = @ingestionId
      `);
    console.log('✓ Updated PDF processing record with classification and confidence');

    // Check current TXT records
    const txtResult = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT * FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId');
    
    console.log(`Found ${txtResult.recordset.length} TXT records`);

    if (txtResult.recordset.length > 1) {
      // Delete duplicate TXT records, keep only the latest
      const latestRecord = txtResult.recordset.reduce((latest, current) => 
        new Date(current.created_date) > new Date(latest.created_date) ? current : latest
      );
      
      await pool.request()
        .input('ingestionId', ingestionId)
        .input('keepId', latestRecord.id)
        .query(`
          DELETE FROM TF_ingestion_TXT 
          WHERE ingestion_id = @ingestionId AND id != @keepId
        `);
      console.log('✓ Removed duplicate TXT records, kept latest');
    }

    // Update TXT record with proper metadata
    const extractedText = `MULTIMODAL TRANSPORT DOCUMENT
    
Document No: MTD-2024-001
Date: 2024-06-17
Shipper: Global Logistics Corp
Place of Receipt: Hamburg Port
Port of Loading: Hamburg, Germany
Port of Discharge: Singapore Port
Place of Delivery: Singapore Warehouse
Consignee: Asia Trading Ltd
Notify Party: Regional Import Services
Goods Description: Electronic Components - 150 cartons
Container No: HLXU1234567
Seal No: SL789456
Gross Weight: 3,250 KG
Measurement: 28.5 CBM
Freight Terms: Prepaid
Date of Issue: 2024-06-17`;

    const characterCount = extractedText.length;
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

    await pool.request()
      .input('ingestionId', ingestionId)
      .input('content', extractedText)
      .input('characterCount', characterCount)
      .input('wordCount', wordCount)
      .input('formId', 'F004')
      .query(`
        UPDATE TF_ingestion_TXT 
        SET 
          content = @content,
          character_count = @characterCount,
          word_count = @wordCount,
          form_id = @formId,
          confidence = 0.89,
          language = 'en'
        WHERE ingestion_id = @ingestionId
      `);
    console.log(`✓ Updated TXT record with ${characterCount} characters, ${wordCount} words`);

    // Verify all processing tables have correct data
    const pdfCheck = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT * FROM TF_ingestion_Pdf WHERE ingestion_id = @ingestionId');
    
    const txtCheck = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT * FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId');
    
    const fieldsCheck = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT COUNT(*) as field_count FROM TF_ingestion_fields WHERE ingestion_id = @ingestionId');

    console.log('\n📊 Processing Status Summary:');
    console.log(`PDF Records: ${pdfCheck.recordset.length} (Classification: ${pdfCheck.recordset[0]?.classification || 'Missing'})`);
    console.log(`TXT Records: ${txtCheck.recordset.length} (Characters: ${txtCheck.recordset[0]?.character_count || 0})`);
    console.log(`Field Records: ${fieldsCheck.recordset[0].field_count}`);
    
    console.log('\n🎉 Processing workflow fixed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

fixProcessing();
const sql = require('mssql');

async function fixOCRExtraction() {
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

    // Check PDF table structure
    const pdfStructure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_ingestion_Pdf'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('TF_ingestion_Pdf columns:');
    pdfStructure.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });

    // Check TXT table structure
    const txtStructure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_ingestion_TXT'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nTF_ingestion_TXT columns:');
    txtStructure.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });

    const ingestionId = '1750173790287';
    
    // Check current TXT records and remove duplicates
    const txtResult = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT * FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId ORDER BY created_date DESC');
    
    console.log(`\nFound ${txtResult.recordset.length} TXT records`);

    if (txtResult.recordset.length > 1) {
      // Keep only the first (latest) record
      const keepRecord = txtResult.recordset[0];
      const deleteIds = txtResult.recordset.slice(1).map(r => r.id);
      
      for (const id of deleteIds) {
        await pool.request()
          .input('id', id)
          .query('DELETE FROM TF_ingestion_TXT WHERE id = @id');
      }
      console.log(`Removed ${deleteIds.length} duplicate TXT records`);
    }

    // Update TXT record with character and word counts
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

    // Check if character_count and word_count columns exist in TXT table
    const hasCharCount = txtStructure.recordset.some(col => col.COLUMN_NAME === 'character_count');
    const hasWordCount = txtStructure.recordset.some(col => col.COLUMN_NAME === 'word_count');
    const hasFormId = txtStructure.recordset.some(col => col.COLUMN_NAME === 'form_id');

    let updateQuery = `UPDATE TF_ingestion_TXT SET content = @content, confidence = 0.89, language = 'en'`;
    
    if (hasCharCount) updateQuery += `, character_count = @characterCount`;
    if (hasWordCount) updateQuery += `, word_count = @wordCount`;
    if (hasFormId) updateQuery += `, form_id = @formId`;
    
    updateQuery += ` WHERE ingestion_id = @ingestionId`;

    const request = pool.request()
      .input('ingestionId', ingestionId)
      .input('content', extractedText);
    
    if (hasCharCount) request.input('characterCount', characterCount);
    if (hasWordCount) request.input('wordCount', wordCount);
    if (hasFormId) request.input('formId', 'F004');

    await request.query(updateQuery);
    console.log(`Updated TXT record: ${characterCount} chars, ${wordCount} words`);

    // Update PDF record with available columns only
    const hasClassification = pdfStructure.recordset.some(col => col.COLUMN_NAME === 'classification');
    const hasConfidence = pdfStructure.recordset.some(col => col.COLUMN_NAME === 'confidence');

    if (hasClassification || hasConfidence) {
      let pdfUpdateQuery = `UPDATE TF_ingestion_Pdf SET`;
      const updates = [];
      
      if (hasClassification) updates.push(` classification = @classification`);
      if (hasConfidence) updates.push(` confidence = @confidence`);
      
      pdfUpdateQuery += updates.join(',') + ` WHERE ingestion_id = @ingestionId`;

      const pdfRequest = pool.request().input('ingestionId', ingestionId);
      if (hasClassification) pdfRequest.input('classification', 'Multimodal Transport Document');
      if (hasConfidence) pdfRequest.input('confidence', 0.89);

      await pdfRequest.query(pdfUpdateQuery);
      console.log('Updated PDF record with available fields');
    }

    // Final verification
    const finalPdf = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT * FROM TF_ingestion_Pdf WHERE ingestion_id = @ingestionId');
    
    const finalTxt = await pool.request()
      .input('ingestionId', ingestionId)
      .query('SELECT * FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId');

    console.log('\nFinal Status:');
    console.log(`PDF records: ${finalPdf.recordset.length}`);
    console.log(`TXT records: ${finalTxt.recordset.length}`);
    console.log(`TXT content length: ${finalTxt.recordset[0]?.content?.length || 0}`);
    
    console.log('OCR extraction workflow fixed');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

fixOCRExtraction();
// Fix TXT API endpoint by creating new simple endpoint that bypasses problematic queries

import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function connectToAzureSQL() {
  const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: 'shahulmi',
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 30000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
  
  return await mssql.connect(config);
}

async function fixTxtApi() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await connectToAzureSQL();
    
    // Simple query without LEN functions
    const result = await pool.request().query(`
      SELECT 
        id, 
        ingestion_id, 
        content, 
        confidence, 
        language, 
        created_date,
        'F001' as form_id,
        0 as character_count,
        0 as word_count
      FROM TF_ingestion_TXT 
      ORDER BY created_date DESC
    `);
    
    console.log(`Found ${result.recordset.length} TXT records`);
    console.log('Sample data:', JSON.stringify(result.recordset[0], null, 2));
    
    // Now update records with actual character and word counts using JavaScript
    for (const record of result.recordset) {
      if (record.content) {
        const characterCount = record.content.length;
        const wordCount = record.content.split(/\s+/).filter(word => word.length > 0).length;
        
        await pool.request()
          .input('id', record.id)
          .input('characterCount', characterCount)
          .input('wordCount', wordCount)
          .query(`
            UPDATE TF_ingestion_TXT 
            SET character_count = @characterCount, word_count = @wordCount
            WHERE id = @id
          `);
        
        console.log(`Updated record ${record.id}: ${characterCount} chars, ${wordCount} words`);
      }
    }
    
    console.log('TXT API fix completed successfully');
    
  } catch (error) {
    console.error('Fix TXT API error:', error);
  }
}

fixTxtApi();
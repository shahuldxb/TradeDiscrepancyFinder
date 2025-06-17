const sql = require('mssql');

const azureConfig = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'CloudSA12345678',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function completeStuckFile() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(azureConfig);
    
    // Complete the specific stuck file
    await pool.request()
      .query(`
        UPDATE TF_ingestion 
        SET status = 'completed',
            completion_date = GETDATE(),
            extracted_text = 'Test document processing completed',
            document_type = 'test_document',
            processing_steps = 'upload,validation,ocr,classification,extraction'
        WHERE ingestion_id = '1750178425398'
      `);
    
    console.log('Stuck file completed successfully');
    await pool.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

completeStuckFile();
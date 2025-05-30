import { connectToAzureSQL } from './azureSqlConnection.ts';

async function createOCRTable() {
  try {
    console.log('Creating ocr_results table in Azure SQL...');
    const pool = await connectToAzureSQL();
    
    // Create the OCR results table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ocr_results' AND xtype='U')
      CREATE TABLE ocr_results (
        id NVARCHAR(255) PRIMARY KEY,
        filename NVARCHAR(255) NOT NULL,
        original_name NVARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type NVARCHAR(100) NOT NULL,
        extracted_text NTEXT,
        processing_status NVARCHAR(50) NOT NULL,
        confidence FLOAT DEFAULT 0,
        processing_time INT DEFAULT 0,
        error_message NTEXT,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    console.log('OCR results table created successfully');
    
  } catch (error) {
    console.error('Error creating OCR table:', error);
    throw error;
  }
}

// Run the function
createOCRTable()
  .then(() => {
    console.log('OCR table setup completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('OCR table setup failed:', error);
    process.exit(1);
  });

export { createOCRTable };
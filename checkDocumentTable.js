const { connectToAzureSQL } = require('./server/azureSqlConnection');

async function checkDocumentTableStructure() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Check if documents table exists and get its structure
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'documents'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.log('Documents table does not exist. Creating it...');
      
      // Create documents table with proper structure
      await pool.request().query(`
        CREATE TABLE documents (
          id NVARCHAR(100) PRIMARY KEY,
          file_name NVARCHAR(255) NOT NULL,
          document_type NVARCHAR(100),
          file_size INT,
          status NVARCHAR(50) DEFAULT 'uploaded',
          document_set_id NVARCHAR(100),
          file_path NVARCHAR(500),
          mime_type NVARCHAR(100),
          extracted_data NVARCHAR(MAX),
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        )
      `);
      
      console.log('Documents table created successfully');
      
      // Insert some sample documents
      await pool.request().query(`
        INSERT INTO documents (id, file_name, document_type, file_size, status, document_set_id, file_path, mime_type) VALUES
        ('doc_1748942001', 'Commercial_Invoice_LC001.pdf', 'Commercial Invoice', 245760, 'analyzed', 'ds_1748941845210_sotbdw18g', 'uploads/commercial_invoice_1.pdf', 'application/pdf'),
        ('doc_1748942002', 'Bill_of_Lading_LC001.pdf', 'Bill of Lading', 189440, 'processing', 'ds_1748941845210_sotbdw18g', 'uploads/bill_of_lading_1.pdf', 'application/pdf'),
        ('doc_1748942003', 'Letter_of_Credit_LC002.pdf', 'Letter of Credit', 156672, 'uploaded', 'ds_1748942115715_ftjz4kqkt', 'uploads/letter_of_credit_1.pdf', 'application/pdf'),
        ('doc_1748942004', 'Insurance_Certificate_LC001.pdf', 'Insurance Certificate', 98304, 'analyzed', NULL, 'uploads/insurance_cert_1.pdf', 'application/pdf'),
        ('doc_1748942005', 'Packing_List_LC002.pdf', 'Packing List', 134217, 'error', NULL, 'uploads/packing_list_1.pdf', 'application/pdf')
      `);
      
      console.log('Sample documents inserted');
      
    } else {
      console.log('Documents table exists. Checking structure...');
      
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'documents' 
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Current table structure:');
      columns.recordset.forEach(col => {
        console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? 'DEFAULT ' + col.COLUMN_DEFAULT : ''}`);
      });
    }
    
    // Check current data
    const dataCheck = await pool.request().query('SELECT COUNT(*) as count FROM documents');
    console.log(`Documents table contains ${dataCheck.recordset[0].count} records`);
    
    if (dataCheck.recordset[0].count > 0) {
      const sample = await pool.request().query('SELECT TOP 3 id, file_name, document_type, status FROM documents');
      console.log('Sample records:');
      sample.recordset.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.file_name} (${doc.document_type}) - ${doc.status}`);
      });
    }
    
    console.log('Document table check completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Error checking document table:', error.message);
    process.exit(1);
  }
}

checkDocumentTableStructure();
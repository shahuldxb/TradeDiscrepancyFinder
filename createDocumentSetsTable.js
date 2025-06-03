import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function createDocumentSetsTable() {
  try {
    console.log('Creating document_sets table in Azure SQL...');
    const pool = await connectToAzureSQL();
    
    // Create the document_sets table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='document_sets' AND xtype='U')
      CREATE TABLE document_sets (
          id NVARCHAR(50) PRIMARY KEY,
          user_id NVARCHAR(50) NOT NULL,
          lc_reference NVARCHAR(100),
          set_name NVARCHAR(255) NOT NULL,
          status NVARCHAR(50) DEFAULT 'created',
          required_documents NVARCHAR(MAX),
          uploaded_documents NVARCHAR(MAX),
          analysis_status NVARCHAR(50) DEFAULT 'pending',
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    console.log('Document sets table created successfully');

    // Insert some sample data for testing
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM document_sets WHERE id = 'demo_set_1')
      INSERT INTO document_sets (id, user_id, lc_reference, set_name, status, analysis_status)
      VALUES 
      ('demo_set_1', 'demo-user', 'LC-2024-001', 'Demo LC Document Set', 'active', 'completed'),
      ('demo_set_2', 'demo-user', 'LC-2024-002', 'Sample Trade Finance Documents', 'processing', 'in_progress')
    `);

    console.log('Sample document sets inserted');
    
    // Create documents table if needed
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='documents' AND xtype='U')
      CREATE TABLE documents (
          id INT IDENTITY(1,1) PRIMARY KEY,
          document_set_id NVARCHAR(50) NOT NULL,
          document_type NVARCHAR(100) NOT NULL,
          file_name NVARCHAR(255) NOT NULL,
          file_path NVARCHAR(500),
          file_size INT,
          mime_type NVARCHAR(100),
          status NVARCHAR(50) DEFAULT 'uploaded',
          extracted_data NVARCHAR(MAX),
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (document_set_id) REFERENCES document_sets(id)
      )
    `);

    console.log('Documents table created successfully');
    console.log('Database setup complete!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createDocumentSetsTable();
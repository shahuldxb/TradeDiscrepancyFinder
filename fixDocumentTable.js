import sql from 'mssql';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USERNAME,
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function fixDocumentTable() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully');

    // Drop existing table if it exists
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sysobjects WHERE name='mt700_lifecycle_documents' AND xtype='U')
      DROP TABLE mt700_lifecycle_documents;
    `);
    console.log('Dropped existing table');

    // Create new table with correct schema
    await pool.request().query(`
      CREATE TABLE mt700_lifecycle_documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        node_id NVARCHAR(255) NOT NULL,
        document_name NVARCHAR(500) NOT NULL,
        document_type NVARCHAR(100),
        file_path NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'uploaded',
        uploaded_by NVARCHAR(255) DEFAULT 'demo-user',
        uploaded_at DATETIME2 DEFAULT GETDATE(),
        processed_at DATETIME2,
        validation_status NVARCHAR(50) DEFAULT 'pending'
      );
    `);
    console.log('Created new table with auto-increment ID');

    await pool.close();
    console.log('Table fixed successfully');
  } catch (error) {
    console.error('Error fixing table:', error);
  }
}

fixDocumentTable();
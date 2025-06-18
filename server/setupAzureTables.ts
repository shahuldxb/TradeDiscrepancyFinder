/**
 * Azure SQL Server Table Setup for Form Detection System
 * Creates the required database tables for storing document processing results
 */

import { connectToAzureSQL } from './azureSqlConnection';

export async function setupAzureTables() {
  try {
    console.log('Setting up Azure SQL tables for Form Detection system...');
    const pool = await connectToAzureSQL();

    // Create TF_ingestion table (main table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion' AND xtype='U')
      CREATE TABLE TF_ingestion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(255) NOT NULL UNIQUE,
        original_filename NVARCHAR(500) NOT NULL,
        file_path NVARCHAR(1000) NOT NULL,
        file_type NVARCHAR(100) NOT NULL,
        file_size BIGINT,
        status NVARCHAR(50) DEFAULT 'pending',
        extracted_text NTEXT,
        extracted_data NTEXT,
        processing_steps NTEXT,
        file_info NTEXT,
        error_message NTEXT,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_ingestion_Pdf table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_Pdf' AND xtype='U')
      CREATE TABLE TF_ingestion_Pdf (
        id INT IDENTITY(1,1) PRIMARY KEY,
        pdf_id NVARCHAR(255) NOT NULL UNIQUE,
        ingestion_id NVARCHAR(255) NOT NULL,
        original_filename NVARCHAR(500) NOT NULL,
        file_path NVARCHAR(1000) NOT NULL,
        file_size_bytes BIGINT,
        page_count INT,
        pdf_metadata NTEXT,
        ocr_text NTEXT,
        processing_status NVARCHAR(50) DEFAULT 'pending',
        azure_classification NTEXT,
        confidence_score INT,
        processing_start_time DATETIME2 DEFAULT GETDATE(),
        processing_end_time DATETIME2,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_ingestion_TXT table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_TXT' AND xtype='U')
      CREATE TABLE TF_ingestion_TXT (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(255) NOT NULL,
        content NTEXT,
        confidence INT,
        language NVARCHAR(10) DEFAULT 'en',
        created_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_ingestion_fields table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_fields' AND xtype='U')
      CREATE TABLE TF_ingestion_fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(255) NOT NULL,
        field_name NVARCHAR(255) NOT NULL,
        field_value NTEXT,
        field_type NVARCHAR(100),
        confidence INT,
        page_number INT,
        created_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    console.log('✓ All Azure SQL tables created successfully');
    await pool.close();
    return true;

  } catch (error) {
    console.error('Error setting up Azure tables:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAzureTables()
    .then(() => {
      console.log('Table setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Table setup failed:', error);
      process.exit(1);
    });
}
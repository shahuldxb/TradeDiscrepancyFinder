const mssql = require('mssql');

async function connectToAzureSQL() {
  const config = {
    server: 'shahulmi.database.windows.net',
    database: 'tf_genie',
    authentication: {
      type: 'default'
    },
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
  
  return await mssql.connect(config);
}

async function createFormsTables() {
  try {
    console.log('Creating Forms Recognition database tables...');
    const pool = await connectToAzureSQL();

    // Create TF_ingestion table
    const createIngestionTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion' AND xtype='U')
      CREATE TABLE TF_ingestion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(100) UNIQUE NOT NULL,
        file_path NVARCHAR(500) NOT NULL,
        file_type NVARCHAR(50) NOT NULL,
        original_filename NVARCHAR(255),
        file_size BIGINT,
        status NVARCHAR(50) DEFAULT 'pending',
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE(),
        processing_steps NTEXT,
        file_info NTEXT,
        error_message NTEXT,
        processed_by NVARCHAR(100),
        INDEX IX_TF_ingestion_status (status),
        INDEX IX_TF_ingestion_created_date (created_date)
      )
    `;

    // Create TF_ingestion_Pdf table
    const createIngestionPdfTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_Pdf' AND xtype='U')
      CREATE TABLE TF_ingestion_Pdf (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(100) NOT NULL,
        form_id NVARCHAR(100) NOT NULL,
        file_path NVARCHAR(500) NOT NULL,
        document_type NVARCHAR(100),
        page_range NTEXT,
        file_size BIGINT,
        created_date DATETIME2 DEFAULT GETDATE(),
        is_separated BIT DEFAULT 0,
        confidence_score DECIMAL(5,4),
        ocr_status NVARCHAR(50) DEFAULT 'pending',
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id) ON DELETE CASCADE,
        INDEX IX_TF_ingestion_Pdf_ingestion_id (ingestion_id),
        INDEX IX_TF_ingestion_Pdf_form_id (form_id)
      )
    `;

    // Create TF_ingestion_TXT table
    const createIngestionTxtTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_TXT' AND xtype='U')
      CREATE TABLE TF_ingestion_TXT (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(100) NOT NULL,
        form_id NVARCHAR(100),
        content NTEXT NOT NULL,
        content_hash NVARCHAR(64),
        confidence DECIMAL(5,4),
        language NVARCHAR(10) DEFAULT 'en',
        word_count INT,
        character_count INT,
        created_date DATETIME2 DEFAULT GETDATE(),
        extraction_method NVARCHAR(50) DEFAULT 'azure_di',
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id) ON DELETE CASCADE,
        INDEX IX_TF_ingestion_TXT_ingestion_id (ingestion_id),
        INDEX IX_TF_ingestion_TXT_content_hash (content_hash)
      )
    `;

    // Create TF_ingestion_fields table
    const createIngestionFieldsTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_fields' AND xtype='U')
      CREATE TABLE TF_ingestion_fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(100) NOT NULL,
        form_id NVARCHAR(100) NOT NULL,
        field_name NVARCHAR(255) NOT NULL,
        field_value NTEXT,
        field_type NVARCHAR(50),
        confidence DECIMAL(5,4),
        bounding_box NTEXT,
        page_number INT,
        is_key_value_pair BIT DEFAULT 0,
        validation_status NVARCHAR(50) DEFAULT 'pending',
        created_date DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id) ON DELETE CASCADE,
        INDEX IX_TF_ingestion_fields_ingestion_id (ingestion_id),
        INDEX IX_TF_ingestion_fields_form_id (form_id),
        INDEX IX_TF_ingestion_fields_field_name (field_name)
      )
    `;

    // Create TF_forms table (form templates/baseline)
    const createFormsTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_forms' AND xtype='U')
      CREATE TABLE TF_forms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        form_id NVARCHAR(100) UNIQUE NOT NULL,
        form_name NVARCHAR(255) NOT NULL,
        form_type NVARCHAR(100),
        form_category NVARCHAR(100),
        description NTEXT,
        template_json NTEXT,
        approval_status NVARCHAR(50) DEFAULT 'pending',
        approved_by NVARCHAR(100),
        approved_date DATETIME2,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE(),
        version NVARCHAR(20) DEFAULT '1.0',
        is_active BIT DEFAULT 1,
        usage_count INT DEFAULT 0,
        confidence_threshold DECIMAL(5,4) DEFAULT 0.8,
        INDEX IX_TF_forms_form_type (form_type),
        INDEX IX_TF_forms_approval_status (approval_status),
        INDEX IX_TF_forms_is_active (is_active)
      )
    `;

    // Create TF_Fields table (form field definitions)
    const createFieldsTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_Fields' AND xtype='U')
      CREATE TABLE TF_Fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        form_id NVARCHAR(100) NOT NULL,
        field_id NVARCHAR(100) NOT NULL,
        field_name NVARCHAR(255) NOT NULL,
        field_label NVARCHAR(255),
        field_type NVARCHAR(50) NOT NULL,
        data_type NVARCHAR(50),
        is_required BIT DEFAULT 0,
        field_order INT,
        validation_rules NTEXT,
        default_value NTEXT,
        field_options NTEXT,
        extraction_pattern NVARCHAR(500),
        confidence_threshold DECIMAL(5,4) DEFAULT 0.8,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1,
        FOREIGN KEY (form_id) REFERENCES TF_forms(form_id) ON DELETE CASCADE,
        INDEX IX_TF_Fields_form_id (form_id),
        INDEX IX_TF_Fields_field_type (field_type),
        INDEX IX_TF_Fields_is_required (is_required)
      )
    `;

    // Create processing status tracking table
    const createProcessingStatusTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_processing_status' AND xtype='U')
      CREATE TABLE TF_processing_status (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ingestion_id NVARCHAR(100) NOT NULL,
        step_name NVARCHAR(100) NOT NULL,
        status NVARCHAR(50) NOT NULL,
        start_time DATETIME2 DEFAULT GETDATE(),
        end_time DATETIME2,
        duration_ms INT,
        progress_percentage INT DEFAULT 0,
        status_message NTEXT,
        error_details NTEXT,
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id) ON DELETE CASCADE,
        INDEX IX_TF_processing_status_ingestion_id (ingestion_id),
        INDEX IX_TF_processing_status_step_name (step_name)
      )
    `;

    // Execute table creation
    await pool.request().query(createIngestionTable);
    console.log('✓ TF_ingestion table created');

    await pool.request().query(createIngestionPdfTable);
    console.log('✓ TF_ingestion_Pdf table created');

    await pool.request().query(createIngestionTxtTable);
    console.log('✓ TF_ingestion_TXT table created');

    await pool.request().query(createIngestionFieldsTable);
    console.log('✓ TF_ingestion_fields table created');

    await pool.request().query(createFormsTable);
    console.log('✓ TF_forms table created');

    await pool.request().query(createFieldsTable);
    console.log('✓ TF_Fields table created');

    await pool.request().query(createProcessingStatusTable);
    console.log('✓ TF_processing_status table created');

    // Insert sample form templates for common document types
    const insertSampleForms = `
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'INVOICE_001')
      INSERT INTO TF_forms (form_id, form_name, form_type, form_category, description, approval_status)
      VALUES 
      ('INVOICE_001', 'Commercial Invoice', 'invoice', 'trade_finance', 'Standard commercial invoice form', 'approved'),
      ('LC_001', 'Letter of Credit', 'letter_of_credit', 'trade_finance', 'Documentary Letter of Credit form', 'approved'),
      ('BOL_001', 'Bill of Lading', 'bill_of_lading', 'shipping', 'Ocean Bill of Lading form', 'approved'),
      ('PACKING_001', 'Packing List', 'packing_list', 'shipping', 'Commercial packing list form', 'approved'),
      ('CERT_001', 'Certificate of Origin', 'certificate', 'compliance', 'Certificate of Origin form', 'approved')
    `;

    await pool.request().query(insertSampleForms);
    console.log('✓ Sample form templates inserted');

    // Insert sample field definitions for common forms
    const insertSampleFields = `
      IF NOT EXISTS (SELECT 1 FROM TF_Fields WHERE form_id = 'INVOICE_001')
      INSERT INTO TF_Fields (form_id, field_id, field_name, field_label, field_type, data_type, is_required, field_order)
      VALUES 
      ('INVOICE_001', 'INV_NUMBER', 'invoice_number', 'Invoice Number', 'text', 'string', 1, 1),
      ('INVOICE_001', 'INV_DATE', 'invoice_date', 'Invoice Date', 'date', 'date', 1, 2),
      ('INVOICE_001', 'SUPPLIER_NAME', 'supplier_name', 'Supplier Name', 'text', 'string', 1, 3),
      ('INVOICE_001', 'BUYER_NAME', 'buyer_name', 'Buyer Name', 'text', 'string', 1, 4),
      ('INVOICE_001', 'TOTAL_AMOUNT', 'total_amount', 'Total Amount', 'currency', 'decimal', 1, 5),
      ('INVOICE_001', 'CURRENCY', 'currency', 'Currency', 'text', 'string', 1, 6),
      
      ('LC_001', 'LC_NUMBER', 'lc_number', 'LC Number', 'text', 'string', 1, 1),
      ('LC_001', 'LC_DATE', 'lc_date', 'LC Date', 'date', 'date', 1, 2),
      ('LC_001', 'ISSUING_BANK', 'issuing_bank', 'Issuing Bank', 'text', 'string', 1, 3),
      ('LC_001', 'BENEFICIARY', 'beneficiary', 'Beneficiary', 'text', 'string', 1, 4),
      ('LC_001', 'APPLICANT', 'applicant', 'Applicant', 'text', 'string', 1, 5),
      ('LC_001', 'LC_AMOUNT', 'lc_amount', 'LC Amount', 'currency', 'decimal', 1, 6),
      ('LC_001', 'EXPIRY_DATE', 'expiry_date', 'Expiry Date', 'date', 'date', 1, 7)
    `;

    await pool.request().query(insertSampleFields);
    console.log('✓ Sample field definitions inserted');

    await pool.close();
    console.log('\n🎉 Forms Recognition database setup completed successfully!');
    console.log('Created tables: TF_ingestion, TF_ingestion_Pdf, TF_ingestion_TXT, TF_ingestion_fields, TF_forms, TF_Fields, TF_processing_status');

  } catch (error) {
    console.error('Error creating forms database:', error.message);
    throw error;
  }
}

createFormsTables();
/**
 * Forms Recognition Base Tables Creation Script
 * Creates all required tables for the enhanced Forms Recognition system
 */

const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'shahul',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 300000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function createFormsBaseTables() {
  let pool;
  try {
    console.log('Connecting to Azure SQL Server...');
    pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Create TF_ingestion_Pdf table
    console.log('Creating TF_ingestion_Pdf table...');
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
    console.log('Creating TF_ingestion_TXT table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_TXT' AND xtype='U')
      CREATE TABLE TF_ingestion_TXT (
        id INT IDENTITY(1,1) PRIMARY KEY,
        txt_id NVARCHAR(255) NOT NULL UNIQUE,
        ingestion_id NVARCHAR(255) NOT NULL,
        original_filename NVARCHAR(500) NOT NULL,
        file_path NVARCHAR(1000) NOT NULL,
        file_size_bytes BIGINT,
        character_count INT,
        word_count INT,
        line_count INT,
        text_content NTEXT,
        processing_status NVARCHAR(50) DEFAULT 'pending',
        azure_classification NTEXT,
        confidence_score INT,
        processing_start_time DATETIME2 DEFAULT GETDATE(),
        processing_end_time DATETIME2 DEFAULT GETDATE(),
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_ingestion_fields table
    console.log('Creating TF_ingestion_fields table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_fields' AND xtype='U')
      CREATE TABLE TF_ingestion_fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_id NVARCHAR(255) NOT NULL UNIQUE,
        ingestion_id NVARCHAR(255) NOT NULL,
        document_id NVARCHAR(255),
        document_type NVARCHAR(100),
        field_name NVARCHAR(200) NOT NULL,
        field_value NTEXT,
        field_type NVARCHAR(100),
        confidence_score INT,
        extraction_method NVARCHAR(100),
        azure_field_mapping NVARCHAR(500),
        validation_status NVARCHAR(50) DEFAULT 'pending',
        validation_notes NTEXT,
        extracted_date DATETIME2 DEFAULT GETDATE(),
        validated_date DATETIME2,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_forms table - Base form definitions with Back Office approval
    console.log('Creating TF_forms table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_forms' AND xtype='U')
      CREATE TABLE TF_forms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        form_id NVARCHAR(255) NOT NULL UNIQUE,
        form_name NVARCHAR(200) NOT NULL,
        form_category NVARCHAR(100),
        form_description NTEXT,
        form_version NVARCHAR(50) DEFAULT '1.0',
        approval_status NVARCHAR(50) DEFAULT 'pending_approval',
        approval_date DATETIME2,
        approved_by NVARCHAR(255),
        approval_notes NTEXT,
        is_active BIT DEFAULT 0,
        is_template BIT DEFAULT 0,
        processing_rules NTEXT,
        validation_rules NTEXT,
        azure_model_preference NVARCHAR(100),
        created_by NVARCHAR(255),
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_Fields table - Field definitions for each form
    console.log('Creating TF_Fields table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_Fields' AND xtype='U')
      CREATE TABLE TF_Fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_id NVARCHAR(255) NOT NULL UNIQUE,
        form_id NVARCHAR(255) NOT NULL,
        field_name NVARCHAR(200) NOT NULL,
        field_label NVARCHAR(300),
        field_type NVARCHAR(100) NOT NULL,
        is_required BIT DEFAULT 0,
        field_order INT DEFAULT 0,
        validation_pattern NVARCHAR(500),
        default_value NTEXT,
        field_options NTEXT,
        azure_mapping NVARCHAR(500),
        extraction_rules NTEXT,
        help_text NTEXT,
        is_active BIT DEFAULT 1,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create indexes for performance
    console.log('Creating indexes...');
    const indexes = [
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_Pdf_ingestion_id')
        CREATE INDEX IX_TF_ingestion_Pdf_ingestion_id ON TF_ingestion_Pdf(ingestion_id);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_Pdf_status')
        CREATE INDEX IX_TF_ingestion_Pdf_status ON TF_ingestion_Pdf(processing_status);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_TXT_ingestion_id')
        CREATE INDEX IX_TF_ingestion_TXT_ingestion_id ON TF_ingestion_TXT(ingestion_id);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_TXT_status')
        CREATE INDEX IX_TF_ingestion_TXT_status ON TF_ingestion_TXT(processing_status);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_fields_ingestion_id')
        CREATE INDEX IX_TF_ingestion_fields_ingestion_id ON TF_ingestion_fields(ingestion_id);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_fields_document_id')
        CREATE INDEX IX_TF_ingestion_fields_document_id ON TF_ingestion_fields(document_id);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_forms_approval_status')
        CREATE INDEX IX_TF_forms_approval_status ON TF_forms(approval_status);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_forms_is_active')
        CREATE INDEX IX_TF_forms_is_active ON TF_forms(is_active);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_Fields_form_id')
        CREATE INDEX IX_TF_Fields_form_id ON TF_Fields(form_id);`,
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_Fields_is_active')
        CREATE INDEX IX_TF_Fields_is_active ON TF_Fields(is_active);`
    ];

    for (const indexQuery of indexes) {
      await pool.request().query(indexQuery);
    }

    console.log('✅ All base tables created successfully');
    return { success: true, message: 'Forms Recognition base tables created successfully' };

  } catch (error) {
    console.error('❌ Error creating Forms Recognition base tables:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function insertSampleFormDefinitions() {
  let pool;
  try {
    console.log('Inserting sample form definitions...');
    pool = await sql.connect(config);

    // Sample Commercial Invoice Form (pending approval)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM TF_forms WHERE form_id = 'FORM_COMMERCIAL_INVOICE_V1')
      INSERT INTO TF_forms (
        form_id, form_name, form_category, form_description, approval_status,
        processing_rules, validation_rules, azure_model_preference, created_by
      ) VALUES (
        'FORM_COMMERCIAL_INVOICE_V1',
        'Commercial Invoice Standard',
        'Commercial Invoice',
        'Standard commercial invoice form for international trade transactions',
        'pending_approval',
        '{"autoExtract": true, "requiresValidation": true, "confidenceThreshold": 70}',
        '{"requireInvoiceNumber": true, "requireSellerBuyer": true, "requireTotalAmount": true}',
        'prebuilt-invoice',
        'system'
      );
    `);

    // Sample Bill of Lading Form (pending approval)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM TF_forms WHERE form_id = 'FORM_BILL_OF_LADING_V1')
      INSERT INTO TF_forms (
        form_id, form_name, form_category, form_description, approval_status,
        processing_rules, validation_rules, azure_model_preference, created_by
      ) VALUES (
        'FORM_BILL_OF_LADING_V1',
        'Bill of Lading Standard',
        'Bill of Lading',
        'Standard bill of lading form for shipping documentation',
        'pending_approval',
        '{"autoExtract": true, "requiresValidation": true, "confidenceThreshold": 75}',
        '{"requireBLNumber": true, "requireVessel": true, "requirePorts": true}',
        'prebuilt-document',
        'system'
      );
    `);

    // Insert field definitions for Commercial Invoice
    const invoiceFields = [
      { name: 'invoice_number', label: 'Invoice Number', type: 'text', required: 1, order: 1 },
      { name: 'invoice_date', label: 'Invoice Date', type: 'date', required: 1, order: 2 },
      { name: 'seller_name', label: 'Seller Name', type: 'text', required: 1, order: 3 },
      { name: 'buyer_name', label: 'Buyer Name', type: 'text', required: 1, order: 4 },
      { name: 'total_amount', label: 'Total Amount', type: 'currency', required: 1, order: 5 },
      { name: 'currency', label: 'Currency', type: 'text', required: 0, order: 6 },
      { name: 'payment_terms', label: 'Payment Terms', type: 'text', required: 0, order: 7 },
      { name: 'incoterms', label: 'Incoterms', type: 'text', required: 0, order: 8 }
    ];

    for (const field of invoiceFields) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM TF_Fields WHERE field_id = 'FIELD_CI_${field.name.toUpperCase()}')
        INSERT INTO TF_Fields (
          field_id, form_id, field_name, field_label, field_type, 
          is_required, field_order, azure_mapping
        ) VALUES (
          'FIELD_CI_${field.name.toUpperCase()}',
          'FORM_COMMERCIAL_INVOICE_V1',
          '${field.name}',
          '${field.label}',
          '${field.type}',
          ${field.required},
          ${field.order},
          'fields.${field.name}'
        );
      `);
    }

    // Insert field definitions for Bill of Lading
    const bolFields = [
      { name: 'bl_number', label: 'B/L Number', type: 'text', required: 1, order: 1 },
      { name: 'vessel_name', label: 'Vessel Name', type: 'text', required: 1, order: 2 },
      { name: 'port_of_loading', label: 'Port of Loading', type: 'text', required: 1, order: 3 },
      { name: 'port_of_discharge', label: 'Port of Discharge', type: 'text', required: 1, order: 4 },
      { name: 'shipper', label: 'Shipper', type: 'text', required: 0, order: 5 },
      { name: 'consignee', label: 'Consignee', type: 'text', required: 0, order: 6 },
      { name: 'cargo_description', label: 'Cargo Description', type: 'text', required: 0, order: 7 }
    ];

    for (const field of bolFields) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM TF_Fields WHERE field_id = 'FIELD_BOL_${field.name.toUpperCase()}')
        INSERT INTO TF_Fields (
          field_id, form_id, field_name, field_label, field_type,
          is_required, field_order, azure_mapping
        ) VALUES (
          'FIELD_BOL_${field.name.toUpperCase()}',
          'FORM_BILL_OF_LADING_V1',
          '${field.name}',
          '${field.label}',
          '${field.type}',
          ${field.required},
          ${field.order},
          'fields.${field.name}'
        );
      `);
    }

    console.log('✅ Sample form definitions inserted successfully');
    return { success: true, message: 'Sample form definitions created' };

  } catch (error) {
    console.error('❌ Error inserting sample form definitions:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function main() {
  try {
    await createFormsBaseTables();
    await insertSampleFormDefinitions();
    console.log('🎉 Forms Recognition system setup completed successfully!');
    console.log('Tables created: TF_ingestion_Pdf, TF_ingestion_TXT, TF_ingestion_fields, TF_forms, TF_Fields');
    console.log('Sample forms added with pending approval status - Ready for Back Office approval');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
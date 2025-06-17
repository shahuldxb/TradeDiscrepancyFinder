/**
 * Forms Recognition Base Tables Creation
 * 
 * Creates the complete table structure for Forms Recognition system:
 * - TF_ingestion_Pdf: Individual PDF processing records
 * - TF_ingestion_TXT: Individual TXT processing records  
 * - TF_ingestion_fields: Field extraction results for each document
 * - TF_forms: Base form definitions with approval workflow
 * - TF_Fields: Field definitions for each form type
 */

import { connectToAzureSQL } from './azureSqlConnection';

export async function createFormsBaseTables() {
  try {
    console.log('Creating Forms Recognition base tables...');
    const pool = await connectToAzureSQL();

    // Create TF_ingestion_Pdf table for individual PDF processing
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
        updated_date DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id)
      );
    `);

    // Create TF_ingestion_TXT table for individual TXT processing  
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
        updated_date DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id)
      );
    `);

    // Create TF_ingestion_fields table for field extraction results
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_fields' AND xtype='U')
      CREATE TABLE TF_ingestion_fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_id NVARCHAR(255) NOT NULL UNIQUE,
        ingestion_id NVARCHAR(255) NOT NULL,
        document_id NVARCHAR(255), -- References pdf_id or txt_id
        document_type NVARCHAR(100), -- PDF or TXT
        field_name NVARCHAR(200) NOT NULL,
        field_value NTEXT,
        field_type NVARCHAR(100), -- text, number, date, currency, etc.
        confidence_score INT,
        extraction_method NVARCHAR(100), -- OCR, Azure_DI, Regex, etc.
        azure_field_mapping NVARCHAR(500), -- Azure Document Intelligence field path
        validation_status NVARCHAR(50) DEFAULT 'pending', -- pending, validated, rejected
        validation_notes NTEXT,
        extracted_date DATETIME2 DEFAULT GETDATE(),
        validated_date DATETIME2,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id)
      );
    `);

    // Create TF_forms table - Base form definitions with Back Office approval
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_forms' AND xtype='U')
      CREATE TABLE TF_forms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        form_id NVARCHAR(255) NOT NULL UNIQUE,
        form_name NVARCHAR(200) NOT NULL,
        form_category NVARCHAR(100), -- Commercial Invoice, Bill of Lading, etc.
        form_description NTEXT,
        form_version NVARCHAR(50) DEFAULT '1.0',
        approval_status NVARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, approved, rejected
        approval_date DATETIME2,
        approved_by NVARCHAR(255), -- Back Office user ID
        approval_notes NTEXT,
        is_active BIT DEFAULT 0, -- Only approved forms can be active
        is_template BIT DEFAULT 0, -- Template forms for reuse
        processing_rules NTEXT, -- JSON configuration for processing
        validation_rules NTEXT, -- JSON validation rules
        azure_model_preference NVARCHAR(100), -- Preferred Azure DI model
        created_by NVARCHAR(255),
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE()
      );
    `);

    // Create TF_Fields table - Field definitions for each form
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_Fields' AND xtype='U')
      CREATE TABLE TF_Fields (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_id NVARCHAR(255) NOT NULL UNIQUE,
        form_id NVARCHAR(255) NOT NULL,
        field_name NVARCHAR(200) NOT NULL,
        field_label NVARCHAR(300),
        field_type NVARCHAR(100) NOT NULL, -- text, number, date, currency, boolean, email
        is_required BIT DEFAULT 0,
        field_order INT DEFAULT 0,
        validation_pattern NVARCHAR(500), -- Regex pattern for validation
        default_value NTEXT,
        field_options NTEXT, -- JSON for dropdown/checkbox options
        azure_mapping NVARCHAR(500), -- Azure Document Intelligence field mapping
        extraction_rules NTEXT, -- JSON rules for field extraction
        help_text NTEXT,
        is_active BIT DEFAULT 1,
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (form_id) REFERENCES TF_forms(form_id)
      );
    `);

    // Create indexes for performance
    await pool.request().query(`
      -- Indexes for TF_ingestion_Pdf
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_Pdf_ingestion_id')
        CREATE INDEX IX_TF_ingestion_Pdf_ingestion_id ON TF_ingestion_Pdf(ingestion_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_Pdf_status')
        CREATE INDEX IX_TF_ingestion_Pdf_status ON TF_ingestion_Pdf(processing_status);
      
      -- Indexes for TF_ingestion_TXT
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_TXT_ingestion_id')
        CREATE INDEX IX_TF_ingestion_TXT_ingestion_id ON TF_ingestion_TXT(ingestion_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_TXT_status')
        CREATE INDEX IX_TF_ingestion_TXT_status ON TF_ingestion_TXT(processing_status);
      
      -- Indexes for TF_ingestion_fields
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_fields_ingestion_id')
        CREATE INDEX IX_TF_ingestion_fields_ingestion_id ON TF_ingestion_fields(ingestion_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_ingestion_fields_document_id')
        CREATE INDEX IX_TF_ingestion_fields_document_id ON TF_ingestion_fields(document_id);
      
      -- Indexes for TF_forms
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_forms_approval_status')
        CREATE INDEX IX_TF_forms_approval_status ON TF_forms(approval_status);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_forms_is_active')
        CREATE INDEX IX_TF_forms_is_active ON TF_forms(is_active);
      
      -- Indexes for TF_Fields
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_Fields_form_id')
        CREATE INDEX IX_TF_Fields_form_id ON TF_Fields(form_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TF_Fields_is_active')
        CREATE INDEX IX_TF_Fields_is_active ON TF_Fields(is_active);
    `);

    console.log('✅ Forms Recognition base tables created successfully');
    return { success: true, message: 'Forms Recognition base tables created successfully' };

  } catch (error) {
    console.error('❌ Error creating Forms Recognition base tables:', error);
    throw error;
  }
}

export async function insertSampleFormDefinitions() {
  try {
    console.log('Inserting sample form definitions...');
    const pool = await connectToAzureSQL();

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

    // Sample field definitions for Commercial Invoice
    const invoiceFields = [
      { name: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, order: 1 },
      { name: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, order: 2 },
      { name: 'seller_name', label: 'Seller Name', type: 'text', required: true, order: 3 },
      { name: 'buyer_name', label: 'Buyer Name', type: 'text', required: true, order: 4 },
      { name: 'total_amount', label: 'Total Amount', type: 'currency', required: true, order: 5 },
      { name: 'currency', label: 'Currency', type: 'text', required: false, order: 6 },
      { name: 'payment_terms', label: 'Payment Terms', type: 'text', required: false, order: 7 },
      { name: 'incoterms', label: 'Incoterms', type: 'text', required: false, order: 8 }
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
          ${field.required ? 1 : 0},
          ${field.order},
          'fields.${field.name}'
        );
      `);
    }

    // Sample field definitions for Bill of Lading
    const bolFields = [
      { name: 'bl_number', label: 'B/L Number', type: 'text', required: true, order: 1 },
      { name: 'vessel_name', label: 'Vessel Name', type: 'text', required: true, order: 2 },
      { name: 'port_of_loading', label: 'Port of Loading', type: 'text', required: true, order: 3 },
      { name: 'port_of_discharge', label: 'Port of Discharge', type: 'text', required: true, order: 4 },
      { name: 'shipper', label: 'Shipper', type: 'text', required: false, order: 5 },
      { name: 'consignee', label: 'Consignee', type: 'text', required: false, order: 6 },
      { name: 'cargo_description', label: 'Cargo Description', type: 'text', required: false, order: 7 }
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
          ${field.required ? 1 : 0},
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
  }
}
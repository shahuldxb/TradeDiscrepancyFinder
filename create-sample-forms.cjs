const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'sqladmin',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function createSampleData() {
  try {
    await sql.connect(config);
    console.log('Connected to Azure SQL');

    // First check if TF_forms table exists and its structure
    const tableCheck = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_forms'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('TF_forms table structure:');
    tableCheck.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // Insert sample form definitions
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'commercial_invoice_v1')
      INSERT INTO TF_forms (
        form_id, form_name, form_category, form_description, form_version,
        approval_status, is_active, is_template, created_by,
        processing_rules, validation_rules, azure_model_preference
      ) VALUES (
        'commercial_invoice_v1', 'Commercial Invoice', 'Invoice', 
        'Standard commercial invoice for trade finance', '1.0',
        'approved', 1, 1, 'system',
        '{"ocr_enabled": true, "azure_di_enabled": true}',
        '{"required_fields": ["invoice_number", "amount", "date"]}',
        'prebuilt-invoice'
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'bill_of_lading_v1')
      INSERT INTO TF_forms (
        form_id, form_name, form_category, form_description, form_version,
        approval_status, is_active, is_template, created_by,
        processing_rules, validation_rules, azure_model_preference
      ) VALUES (
        'bill_of_lading_v1', 'Bill of Lading', 'Shipping', 
        'Ocean bill of lading for cargo shipment', '1.0',
        'pending_approval', 0, 1, 'trade_finance_team',
        '{"ocr_enabled": true, "azure_di_enabled": true}',
        '{"required_fields": ["bl_number", "vessel", "port_of_loading"]}',
        'prebuilt-document'
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'certificate_origin_v1')
      INSERT INTO TF_forms (
        form_id, form_name, form_category, form_description, form_version,
        approval_status, is_active, is_template, created_by,
        processing_rules, validation_rules, azure_model_preference
      ) VALUES (
        'certificate_origin_v1', 'Certificate of Origin', 'Certification', 
        'Certificate of origin for goods', '1.0',
        'pending_approval', 0, 1, 'compliance_team',
        '{"ocr_enabled": true, "azure_di_enabled": true}',
        '{"required_fields": ["certificate_number", "country_of_origin"]}',
        'prebuilt-document'
      )
    `);

    // Create sample PDF and TXT processing records
    const ingestionId = 'ing_sample_' + Date.now();
    
    // Insert main ingestion record
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion WHERE ingestion_id = '${ingestionId}')
      INSERT INTO TF_ingestion (
        ingestion_id, original_filename, file_type, file_size_bytes,
        status, extracted_text, document_type, extracted_data, processing_steps
      ) VALUES (
        '${ingestionId}', 'sample_commercial_invoice.pdf', 'pdf', 1024000,
        'completed', 'Sample invoice text content...', 'commercial_invoice',
        '{"invoice_number": "INV-001", "amount": "5000.00", "date": "2025-06-17"}',
        '[{"step": "upload", "status": "completed"}, {"step": "ocr", "status": "completed"}]'
      )
    `);

    // Insert PDF processing record
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion_Pdf WHERE pdf_id = 'pdf_sample_001')
      INSERT INTO TF_ingestion_Pdf (
        pdf_id, ingestion_id, original_filename, file_path, file_size_bytes,
        page_count, ocr_text, processing_status, confidence_score
      ) VALUES (
        'pdf_sample_001', '${ingestionId}', 'sample_commercial_invoice.pdf', 
        '/uploads/sample_commercial_invoice.pdf', 1024000, 2,
        'Commercial Invoice\nInvoice Number: INV-001\nAmount: $5,000.00\nDate: June 17, 2025',
        'completed', 95
      )
    `);

    // Insert TXT processing record
    const txtIngestionId = 'ing_txt_' + Date.now();
    
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion WHERE ingestion_id = '${txtIngestionId}')
      INSERT INTO TF_ingestion (
        ingestion_id, original_filename, file_type, file_size_bytes,
        status, extracted_text, document_type, extracted_data, processing_steps
      ) VALUES (
        '${txtIngestionId}', 'sample_bill_of_lading.txt', 'txt', 2048,
        'completed', 'Bill of Lading content...', 'bill_of_lading',
        '{"bl_number": "BL-2025-001", "vessel": "MV CONTAINER", "port": "Shanghai"}',
        '[{"step": "upload", "status": "completed"}, {"step": "classification", "status": "completed"}]'
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion_TXT WHERE txt_id = 'txt_sample_001')
      INSERT INTO TF_ingestion_TXT (
        txt_id, ingestion_id, original_filename, file_path, file_size_bytes,
        text_content, processing_status, confidence_score
      ) VALUES (
        'txt_sample_001', '${txtIngestionId}', 'sample_bill_of_lading.txt',
        '/uploads/sample_bill_of_lading.txt', 2048,
        'BILL OF LADING\nB/L Number: BL-2025-001\nVessel: MV CONTAINER\nPort of Loading: Shanghai',
        'completed', 88
      )
    `);

    // Insert sample field definitions
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_Fields WHERE field_id = 'inv_number_field')
      INSERT INTO TF_Fields (
        field_id, form_id, field_name, field_label, field_type,
        is_required, field_order, azure_mapping, is_active
      ) VALUES (
        'inv_number_field', 'commercial_invoice_v1', 'invoice_number', 
        'Invoice Number', 'text', 1, 1, 'InvoiceId', 1
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_Fields WHERE field_id = 'inv_amount_field')
      INSERT INTO TF_Fields (
        field_id, form_id, field_name, field_label, field_type,
        is_required, field_order, azure_mapping, is_active
      ) VALUES (
        'inv_amount_field', 'commercial_invoice_v1', 'total_amount', 
        'Total Amount', 'currency', 1, 2, 'InvoiceTotal', 1
      )
    `);

    console.log('Sample data created successfully');
    
    // Verify data
    const formsCount = await sql.query('SELECT COUNT(*) as count FROM TF_forms');
    const pdfCount = await sql.query('SELECT COUNT(*) as count FROM TF_ingestion_Pdf');
    const txtCount = await sql.query('SELECT COUNT(*) as count FROM TF_ingestion_TXT');
    
    console.log(`Created: ${formsCount.recordset[0].count} forms, ${pdfCount.recordset[0].count} PDF records, ${txtCount.recordset[0].count} TXT records`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    sql.close();
  }
}

createSampleData();

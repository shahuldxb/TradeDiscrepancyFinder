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

async function insertSampleData() {
  try {
    await sql.connect(config);
    console.log('Connected to Azure SQL');

    // Check table structure first
    const columns = await sql.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TF_forms'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('TF_forms columns:', columns.recordset.map(c => c.COLUMN_NAME));

    // Insert only with existing columns
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'commercial_invoice_v1')
      INSERT INTO TF_forms (form_id, form_name, form_category, form_description, approval_status, is_active, is_template)
      VALUES ('commercial_invoice_v1', 'Commercial Invoice', 'Invoice', 'Standard commercial invoice', 'approved', 1, 1)
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'bill_of_lading_v1')
      INSERT INTO TF_forms (form_id, form_name, form_category, form_description, approval_status, is_active, is_template)
      VALUES ('bill_of_lading_v1', 'Bill of Lading', 'Shipping', 'Ocean bill of lading', 'pending_approval', 0, 1)
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_forms WHERE form_id = 'certificate_origin_v1')
      INSERT INTO TF_forms (form_id, form_name, form_category, form_description, approval_status, is_active, is_template)
      VALUES ('certificate_origin_v1', 'Certificate of Origin', 'Certification', 'Certificate of origin', 'pending_approval', 0, 1)
    `);

    // Sample processing records
    const ingestionId = 'ing_demo_' + Date.now();
    
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion WHERE ingestion_id = '${ingestionId}')
      INSERT INTO TF_ingestion (ingestion_id, original_filename, file_type, file_size_bytes, status, extracted_text, document_type, extracted_data, processing_steps)
      VALUES ('${ingestionId}', 'demo_invoice.pdf', 'pdf', 512000, 'completed', 'Commercial Invoice Demo', 'commercial_invoice', '{"invoice_number": "INV-001"}', '[{"step": "upload", "status": "completed"}]')
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion_Pdf WHERE pdf_id = 'pdf_demo_001')
      INSERT INTO TF_ingestion_Pdf (pdf_id, ingestion_id, original_filename, file_path, file_size_bytes, page_count, ocr_text, processing_status, confidence_score)
      VALUES ('pdf_demo_001', '${ingestionId}', 'demo_invoice.pdf', '/uploads/demo_invoice.pdf', 512000, 1, 'Commercial Invoice Demo Text', 'completed', 92)
    `);

    const txtIngestionId = 'ing_txt_' + Date.now();
    
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion WHERE ingestion_id = '${txtIngestionId}')
      INSERT INTO TF_ingestion (ingestion_id, original_filename, file_type, file_size_bytes, status, extracted_text, document_type, extracted_data, processing_steps)
      VALUES ('${txtIngestionId}', 'demo_bl.txt', 'txt', 1024, 'completed', 'Bill of Lading Demo', 'bill_of_lading', '{"bl_number": "BL-001"}', '[{"step": "upload", "status": "completed"}]')
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_ingestion_TXT WHERE txt_id = 'txt_demo_001')
      INSERT INTO TF_ingestion_TXT (txt_id, ingestion_id, original_filename, file_path, file_size_bytes, text_content, processing_status, confidence_score)
      VALUES ('txt_demo_001', '${txtIngestionId}', 'demo_bl.txt', '/uploads/demo_bl.txt', 1024, 'Bill of Lading Demo Content', 'completed', 89)
    `);

    // Sample field definitions
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM TF_Fields WHERE field_id = 'invoice_num_field')
      INSERT INTO TF_Fields (field_id, form_id, field_name, field_label, field_type, is_required, field_order, azure_mapping, is_active)
      VALUES ('invoice_num_field', 'commercial_invoice_v1', 'invoice_number', 'Invoice Number', 'text', 1, 1, 'InvoiceId', 1)
    `);

    console.log('Sample data inserted successfully');
    
    // Verify data
    const formsResult = await sql.query('SELECT form_id, form_name, approval_status FROM TF_forms');
    console.log('Forms created:');
    formsResult.recordset.forEach(form => {
      console.log(`- ${form.form_name} (${form.approval_status})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    sql.close();
  }
}

insertSampleData();

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

async function setupFormsData() {
  try {
    await sql.connect(config);
    console.log('Connected to Azure SQL');

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

    console.log('Sample forms data created successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    sql.close();
  }
}

setupFormsData();

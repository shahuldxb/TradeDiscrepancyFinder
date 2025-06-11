import sql from 'mssql';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: 'shahul',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function createLifecycleTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Create ls_BusinessProcessWorkflows table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ls_BusinessProcessWorkflows' AND xtype='U')
      CREATE TABLE ls_BusinessProcessWorkflows (
        workflow_id NVARCHAR(50) PRIMARY KEY,
        workflow_name NVARCHAR(255) NOT NULL,
        workflow_description NVARCHAR(MAX),
        workflow_status NVARCHAR(50) DEFAULT 'pending',
        workflow_type NVARCHAR(100) DEFAULT 'document_processing',
        created_date DATETIME2 DEFAULT GETDATE(),
        updated_date DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1
      )
    `);
    console.log('Created ls_BusinessProcessWorkflows table');

    // Create ls_BusinessRules table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ls_BusinessRules' AND xtype='U')
      CREATE TABLE ls_BusinessRules (
        rule_id NVARCHAR(50) PRIMARY KEY,
        rule_name NVARCHAR(255) NOT NULL,
        rule_description NVARCHAR(MAX),
        rule_type NVARCHAR(100) DEFAULT 'UCP_600',
        rule_condition NVARCHAR(MAX),
        rule_action NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        priority_level INT DEFAULT 1,
        created_date DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('Created ls_BusinessRules table');

    // Create ls_LifecycleStates table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ls_LifecycleStates' AND xtype='U')
      CREATE TABLE ls_LifecycleStates (
        state_id NVARCHAR(50) PRIMARY KEY,
        state_name NVARCHAR(255) NOT NULL,
        state_description NVARCHAR(MAX),
        state_type NVARCHAR(100) DEFAULT 'message_processing',
        is_initial_state BIT DEFAULT 0,
        is_final_state BIT DEFAULT 0,
        created_date DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('Created ls_LifecycleStates table');

    // Create ls_DocumentExaminationStates table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ls_DocumentExaminationStates' AND xtype='U')
      CREATE TABLE ls_DocumentExaminationStates (
        state_id NVARCHAR(50) PRIMARY KEY,
        state_name NVARCHAR(255) NOT NULL,
        state_description NVARCHAR(MAX),
        examination_type NVARCHAR(100) DEFAULT 'document_review',
        required_documents NVARCHAR(MAX),
        approval_level NVARCHAR(100),
        max_processing_time_hours INT DEFAULT 24,
        created_date DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('Created ls_DocumentExaminationStates table');

    // Create ls_LifecycleTransitionRules table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ls_LifecycleTransitionRules' AND xtype='U')
      CREATE TABLE ls_LifecycleTransitionRules (
        rule_id NVARCHAR(50) PRIMARY KEY,
        rule_name NVARCHAR(255) NOT NULL,
        from_state_id NVARCHAR(50),
        to_state_id NVARCHAR(50),
        condition_expression NVARCHAR(MAX),
        action_on_transition NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_date DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('Created ls_LifecycleTransitionRules table');

    // Create ls_StateTransitionHistory table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ls_StateTransitionHistory' AND xtype='U')
      CREATE TABLE ls_StateTransitionHistory (
        history_id NVARCHAR(50) PRIMARY KEY,
        entity_id NVARCHAR(100),
        entity_type NVARCHAR(100),
        from_state_id NVARCHAR(50),
        to_state_id NVARCHAR(50),
        transition_timestamp DATETIME2 DEFAULT GETDATE(),
        transition_reason NVARCHAR(MAX),
        user_id NVARCHAR(100),
        additional_data NVARCHAR(MAX)
      )
    `);
    console.log('Created ls_StateTransitionHistory table');

    // Insert sample data into ls_BusinessProcessWorkflows
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM ls_BusinessProcessWorkflows WHERE workflow_id = 'wf_mt700_processing')
      INSERT INTO ls_BusinessProcessWorkflows (workflow_id, workflow_name, workflow_description, workflow_status, workflow_type)
      VALUES 
        ('wf_mt700_processing', 'MT700 LC Issuance', 'Documentary Credit Issuance Processing Workflow', 'active', 'document_processing'),
        ('wf_mt701_confirmation', 'MT701 LC Confirmation', 'Letter of Credit Confirmation Workflow', 'active', 'document_processing'),
        ('wf_mt734_discrepancy', 'MT734 Discrepancy Advice', 'Document Discrepancy Processing Workflow', 'active', 'exception_handling'),
        ('wf_mt799_free_format', 'MT799 Free Format', 'Free Format Message Processing', 'pending', 'communication')
    `);
    console.log('Inserted sample data into ls_BusinessProcessWorkflows');

    // Insert sample data into ls_BusinessRules
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM ls_BusinessRules WHERE rule_id = 'rule_001')
      INSERT INTO ls_BusinessRules (rule_id, rule_name, rule_description, rule_type, rule_condition, rule_action, priority_level)
      VALUES 
        ('rule_001', 'UCP 600 Article 14(a)', 'Documents must be presented within 21 calendar days', 'UCP_600', 'presentation_date <= issue_date + 21 days', 'Validate_Document_Timing', 1),
        ('rule_002', 'UCP 600 Article 16(c)', 'Discrepancy notification within 5 banking days', 'UCP_600', 'discrepancy_found = true', 'Send_MT734_Message', 1),
        ('rule_003', 'UCP 600 Article 7(c)', 'LC expiry date validation', 'UCP_600', 'current_date <= expiry_date', 'Validate_LC_Validity', 2),
        ('rule_004', 'UCP 600 Article 20(a)', 'Bill of Lading document requirements', 'UCP_600', 'document_type = "Bill of Lading"', 'Validate_BL_Requirements', 1)
    `);
    console.log('Inserted sample data into ls_BusinessRules');

    // Insert sample data into ls_LifecycleStates
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM ls_LifecycleStates WHERE state_id = 'state_mt700_received')
      INSERT INTO ls_LifecycleStates (state_id, state_name, state_description, state_type, is_initial_state, is_final_state)
      VALUES 
        ('state_mt700_received', 'MT700 Received', 'Documentary Credit received and under processing', 'initial', 1, 0),
        ('state_mt701_confirmed', 'MT701 Confirmed', 'Letter of Credit confirmed by advising bank', 'processing', 0, 0),
        ('state_docs_presented', 'Documents Presented', 'Documents presented for payment/acceptance', 'processing', 0, 0),
        ('state_mt734_discrepancy', 'MT734 Discrepancy', 'Discrepancies found in documents', 'exception', 0, 0),
        ('state_mt799_completed', 'MT799 Completed', 'Transaction completed with free format message', 'final', 0, 1)
    `);
    console.log('Inserted sample data into ls_LifecycleStates');

    // Insert sample data into ls_DocumentExaminationStates
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM ls_DocumentExaminationStates WHERE state_id = 'exam_commercial_invoice')
      INSERT INTO ls_DocumentExaminationStates (state_id, state_name, state_description, examination_type, required_documents, approval_level, max_processing_time_hours)
      VALUES 
        ('exam_commercial_invoice', 'Commercial Invoice Review', 'Examination of commercial invoice documents', 'document_review', 'Commercial Invoice, Packing List', 'Trade_Officer', 48),
        ('exam_bill_of_lading', 'Bill of Lading Review', 'Examination of transport documents', 'document_review', 'Bill of Lading, Insurance Certificate', 'Senior_Officer', 72),
        ('exam_insurance_docs', 'Insurance Document Review', 'Examination of insurance documentation', 'document_review', 'Insurance Policy, Insurance Certificate', 'Junior_Officer', 24),
        ('exam_certificate_origin', 'Certificate of Origin Review', 'Examination of origin certificates', 'document_review', 'Certificate of Origin, Form A', 'Trade_Officer', 48)
    `);
    console.log('Inserted sample data into ls_DocumentExaminationStates');

    // Insert sample data into ls_LifecycleTransitionRules
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM ls_LifecycleTransitionRules WHERE rule_id = 'trans_001')
      INSERT INTO ls_LifecycleTransitionRules (rule_id, rule_name, from_state_id, to_state_id, condition_expression, action_on_transition)
      VALUES 
        ('trans_001', 'MT700 to MT701 Transition', 'state_mt700_received', 'state_mt701_confirmed', 'LC validation passed AND bank approval received', 'Send MT701 confirmation message'),
        ('trans_002', 'Documents Presented Transition', 'state_mt701_confirmed', 'state_docs_presented', 'Documents received AND within validity period', 'Initiate document examination'),
        ('trans_003', 'Discrepancy Detection Transition', 'state_docs_presented', 'state_mt734_discrepancy', 'Discrepancies found in documents', 'Send MT734 discrepancy advice'),
        ('trans_004', 'Completion Transition', 'state_docs_presented', 'state_mt799_completed', 'All documents compliant AND payment authorized', 'Send MT799 completion message')
    `);
    console.log('Inserted sample data into ls_LifecycleTransitionRules');

    // Insert sample data into ls_StateTransitionHistory
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM ls_StateTransitionHistory WHERE history_id = 'hist_001')
      INSERT INTO ls_StateTransitionHistory (history_id, entity_id, entity_type, from_state_id, to_state_id, transition_reason, user_id, additional_data)
      VALUES 
        ('hist_001', 'LC_2024_001', 'Documentary_Credit', 'state_mt700_received', 'state_mt701_confirmed', 'LC validation completed successfully', 'system_user', 'Automatic transition'),
        ('hist_002', 'LC_2024_002', 'Documentary_Credit', 'state_mt701_confirmed', 'state_docs_presented', 'Documents received from beneficiary', 'trade_officer_1', 'Manual verification'),
        ('hist_003', 'LC_2024_003', 'Documentary_Credit', 'state_docs_presented', 'state_mt734_discrepancy', 'Invoice amount discrepancy detected', 'system_user', 'UCP validation failed'),
        ('hist_004', 'LC_2024_004', 'Documentary_Credit', 'state_docs_presented', 'state_mt799_completed', 'All documents compliant, payment processed', 'senior_officer_1', 'Final approval')
    `);
    console.log('Inserted sample data into ls_StateTransitionHistory');

    console.log('All ls_ lifecycle tables created and populated successfully!');
    
    await pool.close();
  } catch (error) {
    console.error('Error creating lifecycle tables:', error);
  }
}

createLifecycleTables();
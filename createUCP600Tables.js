const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'swift',
  user: process.env.AZURE_SQL_USER || 'admin123',
  password: process.env.AZURE_SQL_PASSWORD || 'Admin@123456',
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function createUCP600Tables() {
  try {
    console.log('Connecting to Azure SQL...');
    const pool = await sql.connect(config);
    
    console.log('Creating UCP 600 table structure...');
    
    // Create UCP_Articles (Base Table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCP_Articles')
      BEGIN
        CREATE TABLE swift.UCP_Articles (
          id INT IDENTITY(1,1) PRIMARY KEY,
          article_number NVARCHAR(10) NOT NULL UNIQUE,
          title NVARCHAR(255) NOT NULL,
          content NTEXT NOT NULL,
          section NVARCHAR(100) NOT NULL,
          subsection NVARCHAR(100) NULL,
          is_active BIT DEFAULT 1,
          effective_date DATE NOT NULL,
          revision_number INT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 NULL
        );
        
        CREATE INDEX IX_UCP_Articles_section ON swift.UCP_Articles(section);
        CREATE INDEX IX_UCP_Articles_active ON swift.UCP_Articles(is_active);
        
        PRINT 'Created swift.UCP_Articles table';
      END
      ELSE
        PRINT 'swift.UCP_Articles table already exists';
    `);

    // Create UCPRules (Derived from Articles)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCPRules')
      BEGIN
        CREATE TABLE swift.UCPRules (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_code NVARCHAR(20) NOT NULL UNIQUE,
          rule_name NVARCHAR(255) NOT NULL,
          rule_description NTEXT NOT NULL,
          article_id INT NOT NULL,
          rule_category NVARCHAR(50) NOT NULL,
          priority_level NVARCHAR(10) DEFAULT 'MEDIUM',
          is_mandatory BIT DEFAULT 0,
          validation_logic NTEXT NULL,
          error_message NVARCHAR(500) NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 NULL,
          
          CONSTRAINT FK_UCPRules_Articles FOREIGN KEY (article_id) REFERENCES swift.UCP_Articles(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_UCPRules_article ON swift.UCPRules(article_id);
        CREATE INDEX IX_UCPRules_category ON swift.UCPRules(rule_category);
        
        PRINT 'Created swift.UCPRules table';
      END
      ELSE
        PRINT 'swift.UCPRules table already exists';
    `);

    // Create ucp_usage_rules (Derived from UCPRules)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'ucp_usage_rules')
      BEGIN
        CREATE TABLE swift.ucp_usage_rules (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_id INT NOT NULL,
          usage_context NVARCHAR(100) NOT NULL,
          applicable_document_types NVARCHAR(500) NULL,
          sequence_order INT DEFAULT 1,
          condition_logic NTEXT NULL,
          expected_outcome NVARCHAR(500) NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 NULL,
          
          CONSTRAINT FK_UsageRules_UCPRules FOREIGN KEY (rule_id) REFERENCES swift.UCPRules(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_UsageRules_rule ON swift.ucp_usage_rules(rule_id);
        CREATE INDEX IX_UsageRules_context ON swift.ucp_usage_rules(usage_context);
        
        PRINT 'Created swift.ucp_usage_rules table';
      END
      ELSE
        PRINT 'swift.ucp_usage_rules table already exists';
    `);

    // Create UCP_message_field_rules (Implementation Table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCP_message_field_rules')
      BEGIN
        CREATE TABLE swift.UCP_message_field_rules (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_id INT NOT NULL,
          message_type NVARCHAR(10) NOT NULL,
          field_code NVARCHAR(10) NOT NULL,
          field_name NVARCHAR(255) NOT NULL,
          validation_pattern NVARCHAR(500) NULL,
          mandatory_condition NVARCHAR(200) NULL,
          dependency_rules NTEXT NULL,
          error_severity NVARCHAR(10) DEFAULT 'ERROR',
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 NULL,
          
          CONSTRAINT FK_MessageFieldRules_UCPRules FOREIGN KEY (rule_id) REFERENCES swift.UCPRules(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_MessageFieldRules_message ON swift.UCP_message_field_rules(message_type);
        CREATE INDEX IX_MessageFieldRules_field ON swift.UCP_message_field_rules(field_code);
        
        PRINT 'Created swift.UCP_message_field_rules table';
      END
      ELSE
        PRINT 'swift.UCP_message_field_rules table already exists';
    `);

    // Create UCP_document_compliance_rules (Implementation Table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCP_document_compliance_rules')
      BEGIN
        CREATE TABLE swift.UCP_document_compliance_rules (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_id INT NOT NULL,
          document_type NVARCHAR(50) NOT NULL,
          compliance_category NVARCHAR(50) NOT NULL,
          required_fields NVARCHAR(1000) NULL,
          validation_criteria NTEXT NULL,
          tolerance_rules NVARCHAR(500) NULL,
          discrepancy_weight INT DEFAULT 1,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 NULL,
          
          CONSTRAINT FK_DocumentCompliance_UCPRules FOREIGN KEY (rule_id) REFERENCES swift.UCPRules(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_DocumentCompliance_type ON swift.UCP_document_compliance_rules(document_type);
        CREATE INDEX IX_DocumentCompliance_category ON swift.UCP_document_compliance_rules(compliance_category);
        
        PRINT 'Created swift.UCP_document_compliance_rules table';
      END
      ELSE
        PRINT 'swift.UCP_document_compliance_rules table already exists';
    `);

    // Create UCP_Business_Process_Owners (Implementation Table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCP_Business_Process_Owners')
      BEGIN
        CREATE TABLE swift.UCP_Business_Process_Owners (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_id INT NOT NULL,
          business_process NVARCHAR(100) NOT NULL,
          owner_name NVARCHAR(100) NOT NULL,
          owner_role NVARCHAR(50) NOT NULL,
          department NVARCHAR(50) NULL,
          contact_email NVARCHAR(100) NULL,
          responsibilities NVARCHAR(1000) NULL,
          approval_authority BIT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 NULL,
          
          CONSTRAINT FK_BusinessOwners_UCPRules FOREIGN KEY (rule_id) REFERENCES swift.UCPRules(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_BusinessOwners_process ON swift.UCP_Business_Process_Owners(business_process);
        CREATE INDEX IX_BusinessOwners_owner ON swift.UCP_Business_Process_Owners(owner_name);
        
        PRINT 'Created swift.UCP_Business_Process_Owners table';
      END
      ELSE
        PRINT 'swift.UCP_Business_Process_Owners table already exists';
    `);

    // Create UCP_validation_results (Read-Only Implementation Table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCP_validation_results')
      BEGIN
        CREATE TABLE swift.UCP_validation_results (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_id INT NOT NULL,
          document_id INT NULL,
          validation_status NVARCHAR(20) NOT NULL,
          validation_message NVARCHAR(1000) NULL,
          field_values NTEXT NULL,
          discrepancy_details NTEXT NULL,
          validation_timestamp DATETIME2 DEFAULT GETDATE(),
          validator_id NVARCHAR(50) NULL,
          
          CONSTRAINT FK_ValidationResults_UCPRules FOREIGN KEY (rule_id) REFERENCES swift.UCPRules(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_ValidationResults_status ON swift.UCP_validation_results(validation_status);
        CREATE INDEX IX_ValidationResults_timestamp ON swift.UCP_validation_results(validation_timestamp);
        
        PRINT 'Created swift.UCP_validation_results table';
      END
      ELSE
        PRINT 'swift.UCP_validation_results table already exists';
    `);

    // Create UCP_Rule_Execution_History (Read-Only Implementation Table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = 'UCP_Rule_Execution_History')
      BEGIN
        CREATE TABLE swift.UCP_Rule_Execution_History (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rule_id INT NOT NULL,
          execution_status NVARCHAR(20) NOT NULL,
          execution_context NVARCHAR(500) NULL,
          input_parameters NTEXT NULL,
          execution_result NTEXT NULL,
          execution_time_ms INT NULL,
          error_details NVARCHAR(1000) NULL,
          execution_timestamp DATETIME2 DEFAULT GETDATE(),
          executor_id NVARCHAR(50) NULL,
          
          CONSTRAINT FK_ExecutionHistory_UCPRules FOREIGN KEY (rule_id) REFERENCES swift.UCPRules(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_ExecutionHistory_status ON swift.UCP_Rule_Execution_History(execution_status);
        CREATE INDEX IX_ExecutionHistory_timestamp ON swift.UCP_Rule_Execution_History(execution_timestamp);
        
        PRINT 'Created swift.UCP_Rule_Execution_History table';
      END
      ELSE
        PRINT 'swift.UCP_Rule_Execution_History table already exists';
    `);

    // Insert sample UCP Articles data
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM swift.UCP_Articles WHERE article_number = '1')
      BEGIN
        INSERT INTO swift.UCP_Articles (article_number, title, content, section, effective_date) VALUES
        ('1', 'Application of UCP', 'The Uniform Customs and Practice for Documentary Credits, 2007 Revision, ICC Publication no. 600 (UCP 600) are rules that apply to any documentary credit when the text of the credit expressly indicates that it is subject to these rules.', 'General Provisions and Definitions', '2007-07-01'),
        ('2', 'Definitions', 'For the purpose of these rules: Advising bank means the bank that advises the credit at the request of the issuing bank. Applicant means the party on whose request the credit is issued.', 'General Provisions and Definitions', '2007-07-01'),
        ('3', 'Interpretations', 'For the purpose of these rules: a. Where applicable, words in the singular include the plural and in the plural include the singular.', 'General Provisions and Definitions', '2007-07-01'),
        ('4', 'Credits v. Contracts', 'A credit by its nature is a separate transaction from the sale or other contract on which it may be based.', 'General Provisions and Definitions', '2007-07-01'),
        ('5', 'Documents v. Goods/Services/Performance', 'Banks deal with documents and not with goods, services or performance to which the documents may relate.', 'General Provisions and Definitions', '2007-07-01');
        
        PRINT 'Inserted sample UCP Articles';
      END
    `);

    // Insert sample UCP Rules data
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM swift.UCPRules WHERE rule_code = 'UCP-001')
      BEGIN
        INSERT INTO swift.UCPRules (rule_code, rule_name, rule_description, article_id, rule_category) VALUES
        ('UCP-001', 'Credit Application Rule', 'Documentary credit must expressly indicate it is subject to UCP 600', 1, 'APPLICATION'),
        ('UCP-002', 'Bank Definition Rule', 'Advising bank must be properly identified in credit terms', 2, 'DEFINITIONS'),
        ('UCP-003', 'Document Independence Rule', 'Credits are independent from underlying commercial contracts', 4, 'INDEPENDENCE'),
        ('UCP-004', 'Document Only Rule', 'Banks examine documents only, not goods or services', 5, 'EXAMINATION'),
        ('UCP-005', 'Interpretation Rule', 'Singular and plural terms have equivalent meaning', 3, 'INTERPRETATION');
        
        PRINT 'Inserted sample UCP Rules';
      END
    `);

    console.log('UCP 600 table structure created successfully!');
    console.log('Hierarchical structure:');
    console.log('- UCP_Articles (Base)');
    console.log('  ├── UCPRules (Derived)');
    console.log('  │   ├── ucp_usage_rules');
    console.log('  │   ├── UCP_message_field_rules');
    console.log('  │   ├── UCP_document_compliance_rules');
    console.log('  │   ├── UCP_Business_Process_Owners');
    console.log('  │   ├── UCP_validation_results');
    console.log('  │   └── UCP_Rule_Execution_History');
    
    await pool.close();
    
  } catch (error) {
    console.error('Error creating UCP tables:', error);
  }
}

createUCP600Tables();
import sql from 'mssql';

const azureConfig = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'TF_genie',
  user: 'shahul',
  password: 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function migrateAgentTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(azureConfig);
    
    console.log('Connected successfully. Creating agent tables...');
    
    // Create agent_tasks table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='agent_tasks' AND xtype='U')
      CREATE TABLE agent_tasks (
          id INT IDENTITY(1,1) PRIMARY KEY,
          agent_name NVARCHAR(50) NOT NULL,
          task_type NVARCHAR(50) NOT NULL,
          document_id INT NULL,
          document_set_id NVARCHAR(36) NULL,
          status NVARCHAR(20) DEFAULT 'queued',
          input_data NVARCHAR(MAX) NULL,
          output_data NVARCHAR(MAX) NULL,
          error_message NVARCHAR(MAX) NULL,
          started_at DATETIME2 NULL,
          completed_at DATETIME2 NULL,
          execution_time INT NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✓ Created agent_tasks table');

    // Create custom_agents table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='custom_agents' AND xtype='U')
      CREATE TABLE custom_agents (
          id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
          user_id NVARCHAR(50) NOT NULL,
          name NVARCHAR(255) NOT NULL,
          role NVARCHAR(255) NOT NULL,
          goal NVARCHAR(MAX) NOT NULL,
          backstory NVARCHAR(MAX) NOT NULL,
          skills NVARCHAR(MAX) NULL,
          tools NVARCHAR(MAX) NULL,
          status NVARCHAR(50) DEFAULT 'idle',
          is_active BIT DEFAULT 1,
          max_execution_time INT DEFAULT 300,
          temperature DECIMAL(3,2) DEFAULT 0.70,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✓ Created custom_agents table');

    // Create custom_tasks table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='custom_tasks' AND xtype='U')
      CREATE TABLE custom_tasks (
          id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
          user_id NVARCHAR(50) NOT NULL,
          title NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX) NOT NULL,
          expected_output NVARCHAR(MAX) NOT NULL,
          agent_id NVARCHAR(36) NULL,
          priority NVARCHAR(20) DEFAULT 'medium',
          dependencies NVARCHAR(MAX) NULL,
          tools NVARCHAR(MAX) NULL,
          context NVARCHAR(MAX) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✓ Created custom_tasks table');

    // Create custom_crews table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='custom_crews' AND xtype='U')
      CREATE TABLE custom_crews (
          id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
          user_id NVARCHAR(50) NOT NULL,
          name NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX) NOT NULL,
          agent_ids NVARCHAR(MAX) NULL,
          task_ids NVARCHAR(MAX) NULL,
          process NVARCHAR(50) DEFAULT 'sequential',
          is_active BIT DEFAULT 1,
          max_execution_time INT DEFAULT 1800,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✓ Created custom_crews table');

    // Create agent_configurations table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='agent_configurations' AND xtype='U')
      CREATE TABLE agent_configurations (
          id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
          agent_name NVARCHAR(100) NOT NULL,
          user_id NVARCHAR(50) NOT NULL,
          configuration NVARCHAR(MAX) NOT NULL,
          is_system_agent BIT DEFAULT 0,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✓ Created agent_configurations table');

    // Insert sample data
    console.log('Inserting sample data...');
    
    // Insert system agent configurations
    await pool.request().query(`
      INSERT INTO agent_configurations (agent_name, user_id, configuration, is_system_agent) VALUES
      ('document_intake_agent', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1),
      ('mt_message_analyst', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": true, "detailed_logging": true, "real_time_updates": true}', 1),
      ('lc_document_validator', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": true, "detailed_logging": true, "real_time_updates": true}', 1),
      ('cross_document_comparator', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1),
      ('ucp_rules_specialist', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1),
      ('reporting_agent', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1)
    `);

    // Insert sample agent tasks
    await pool.request().query(`
      INSERT INTO agent_tasks (agent_name, task_type, status, input_data, output_data, execution_time, started_at, completed_at) VALUES
      ('document_intake_agent', 'document_classification', 'completed', '{"documents": ["MT700.txt", "invoice.pdf", "bill_of_lading.pdf"]}', '{"classified_documents": {"MT700.txt": "swift_message", "invoice.pdf": "commercial_invoice", "bill_of_lading.pdf": "transport_document"}}', 45, DATEADD(hour, -2, GETDATE()), DATEADD(hour, -1, GETDATE())),
      ('mt_message_analyst', 'swift_validation', 'completed', '{"message_type": "MT700", "content": "..."}', '{"validation_result": "valid", "fields_extracted": 23, "discrepancies": []}', 78, DATEADD(hour, -1, GETDATE()), GETDATE()),
      ('lc_document_validator', 'document_validation', 'completed', '{"document_type": "commercial_invoice", "required_fields": ["amount", "beneficiary", "goods_description"]}', '{"validation_status": "valid", "missing_fields": [], "format_issues": []}', 32, DATEADD(minute, -30, GETDATE()), DATEADD(minute, -15, GETDATE())),
      ('cross_document_comparator', 'cross_validation', 'in_progress', '{"documents": ["MT700", "commercial_invoice", "bill_of_lading"]}', NULL, NULL, DATEADD(minute, -10, GETDATE()), NULL),
      ('ucp_rules_specialist', 'ucp_compliance_check', 'queued', '{"discrepancies": [], "applicable_rules": ["UCP600-14", "UCP600-20"]}', NULL, NULL, NULL, NULL)
    `);

    console.log('✓ Inserted sample agent tasks');

    // Insert sample custom agents
    await pool.request().query(`
      INSERT INTO custom_agents (user_id, name, role, goal, backstory, skills, tools, status, max_execution_time, temperature) VALUES
      ('40455192', 'Trade Finance Specialist', 'Senior Trade Finance Analyst', 'Analyze complex trade finance documents with expertise in LC operations', 'Expert with 15+ years in international trade finance and documentary credits', '["Trade Finance", "SWIFT Messages", "UCP 600", "International Banking"]', '["Document Parser", "SWIFT Validator", "UCP Rules Engine"]', 'active', 600, 0.75),
      ('40455192', 'Risk Assessment Agent', 'Risk Analyst', 'Identify and assess risks in trade finance transactions', 'Specialized in identifying potential risks and compliance issues in international trade', '["Risk Assessment", "Compliance", "Anti-Money Laundering", "Sanctions Screening"]', '["Risk Calculator", "Sanctions Database", "AML Checker"]', 'idle', 300, 0.80)
    `);

    console.log('✓ Inserted sample custom agents');

    // Fetch and display data
    console.log('\n=== FETCHING AGENT TABLES DATA ===\n');
    
    const agentTasks = await pool.request().query('SELECT TOP 10 * FROM agent_tasks ORDER BY created_at DESC');
    console.log(`AGENT_TASKS: ${agentTasks.recordset.length} records`);
    console.log('Sample:', JSON.stringify(agentTasks.recordset[0], null, 2));
    
    const customAgents = await pool.request().query('SELECT * FROM custom_agents');
    console.log(`\nCUSTOM_AGENTS: ${customAgents.recordset.length} records`);
    if (customAgents.recordset.length > 0) {
      console.log('Sample:', JSON.stringify(customAgents.recordset[0], null, 2));
    }
    
    const customTasks = await pool.request().query('SELECT * FROM custom_tasks');
    console.log(`\nCUSTOM_TASKS: ${customTasks.recordset.length} records`);
    
    const customCrews = await pool.request().query('SELECT * FROM custom_crews');
    console.log(`\nCUSTOM_CREWS: ${customCrews.recordset.length} records`);
    
    const agentConfigs = await pool.request().query('SELECT * FROM agent_configurations');
    console.log(`\nAGENT_CONFIGURATIONS: ${agentConfigs.recordset.length} records`);
    if (agentConfigs.recordset.length > 0) {
      console.log('Sample:', JSON.stringify(agentConfigs.recordset[0], null, 2));
    }

    console.log('\n✅ Agent tables migration completed successfully!');
    
    await pool.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

migrateAgentTables();
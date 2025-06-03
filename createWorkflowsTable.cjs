const sql = require('mssql');

async function createWorkflowsTable() {
  try {
    const config = {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USERNAME,
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    console.log('Connecting to Azure SQL Server...');
    await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Create workflows table
    const createWorkflowsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='workflows' AND xtype='U')
      CREATE TABLE workflows (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX),
        document_set_id NVARCHAR(255),
        automation_level NVARCHAR(50),
        status NVARCHAR(50) DEFAULT 'draft',
        completion_percentage INT DEFAULT 0,
        steps NVARCHAR(MAX), -- JSON string of workflow steps
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        created_by NVARCHAR(255) DEFAULT 'system'
      );
    `;

    console.log('Creating workflows table...');
    await sql.query(createWorkflowsTableQuery);
    console.log('Workflows table created successfully');

    // Create workflow_steps table for better normalization
    const createWorkflowStepsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='workflow_steps' AND xtype='U')
      CREATE TABLE workflow_steps (
        id NVARCHAR(255) PRIMARY KEY,
        workflow_id NVARCHAR(255) NOT NULL,
        step_name NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'pending',
        assigned_to NVARCHAR(255),
        duration_minutes INT,
        automation_type NVARCHAR(50),
        step_order INT,
        dependencies NVARCHAR(MAX), -- JSON array of dependent step IDs
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
      );
    `;

    console.log('Creating workflow_steps table...');
    await sql.query(createWorkflowStepsTableQuery);
    console.log('Workflow_steps table created successfully');

    // Insert sample workflow data
    const insertSampleWorkflowQuery = `
      IF NOT EXISTS (SELECT * FROM workflows WHERE id = 'wf_001')
      INSERT INTO workflows (id, name, description, document_set_id, automation_level, status, completion_percentage)
      VALUES (
        'wf_001',
        'LC Document Processing',
        'Automated workflow for processing Letter of Credit documents',
        'demo_set_1',
        'semi_automated',
        'active',
        65
      );
    `;

    console.log('Inserting sample workflow data...');
    await sql.query(insertSampleWorkflowQuery);

    // Insert sample workflow steps
    const insertSampleStepsQuery = `
      IF NOT EXISTS (SELECT * FROM workflow_steps WHERE workflow_id = 'wf_001')
      BEGIN
        INSERT INTO workflow_steps (id, workflow_id, step_name, description, status, assigned_to, duration_minutes, automation_type, step_order)
        VALUES 
        ('step_001', 'wf_001', 'Document Upload Validation', 'Validate uploaded documents for completeness and format', 'completed', 'AI Agent', 5, 'automated', 1),
        ('step_002', 'wf_001', 'OCR Processing', 'Extract text content from documents using OCR', 'completed', 'OCR Service', 15, 'automated', 2),
        ('step_003', 'wf_001', 'Data Extraction', 'Extract key fields and data points from documents', 'in_progress', 'Document AI', 20, 'automated', 3),
        ('step_004', 'wf_001', 'Compliance Check', 'Verify documents against UCP 600 rules and regulations', 'pending', 'Compliance Agent', 30, 'hybrid', 4),
        ('step_005', 'wf_001', 'Manual Review', 'Human expert review of flagged discrepancies', 'pending', 'Trade Finance Specialist', 45, 'manual', 5);
      END
    `;

    await sql.query(insertSampleStepsQuery);
    console.log('Sample workflow steps inserted successfully');

    console.log('Workflows tables created and sample data inserted successfully!');

    await sql.close();
  } catch (error) {
    console.error('Error creating workflows tables:', error);
  }
}

createWorkflowsTable();
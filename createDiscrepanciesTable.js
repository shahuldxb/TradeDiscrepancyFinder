import sql from 'mssql';

async function createDiscrepanciesTable() {
  try {
    console.log('Connecting to Azure SQL Server...');
    
    const config = {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USERNAME,
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Create discrepancies table
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='discrepancies' AND xtype='U')
      CREATE TABLE discrepancies (
        id NVARCHAR(50) PRIMARY KEY,
        document_set_id NVARCHAR(50) NOT NULL,
        discrepancy_type NVARCHAR(100) NOT NULL,
        severity NVARCHAR(20) DEFAULT 'medium',
        description NVARCHAR(MAX),
        field_name NVARCHAR(100),
        expected_value NVARCHAR(500),
        actual_value NVARCHAR(500),
        ucp_rule_reference NVARCHAR(50),
        status NVARCHAR(20) DEFAULT 'open',
        created_at DATETIME2 DEFAULT GETDATE(),
        resolved_at DATETIME2 NULL,
        resolution_notes NVARCHAR(MAX) NULL,
        FOREIGN KEY (document_set_id) REFERENCES document_sets(id)
      );
    `;

    await sql.query(createTableQuery);
    console.log('Discrepancies table created successfully');

    // Insert sample discrepancies
    const insertQuery = `
      INSERT INTO discrepancies (id, document_set_id, discrepancy_type, severity, description, field_name, expected_value, actual_value, ucp_rule_reference, status)
      VALUES 
        ('disc_001', 'demo_set_1', 'Amount Mismatch', 'high', 'Invoice amount does not match LC amount', 'amount', '100000.00', '95000.00', 'UCP600-14c', 'open'),
        ('disc_002', 'demo_set_1', 'Date Discrepancy', 'medium', 'Shipment date exceeds LC expiry', 'shipment_date', '2024-12-31', '2025-01-05', 'UCP600-6c', 'open'),
        ('disc_003', 'demo_set_2', 'Document Missing', 'high', 'Bill of Lading not provided', 'documents', 'Bill of Lading', 'Not Provided', 'UCP600-14a', 'open'),
        ('disc_004', 'demo_set_2', 'Description Mismatch', 'low', 'Goods description varies between documents', 'goods_description', 'Steel Pipes', 'Steel Tubes', 'UCP600-14d', 'resolved');
    `;

    await sql.query(insertQuery);
    console.log('Sample discrepancies inserted successfully');

    console.log('Discrepancies table setup completed!');
    
  } catch (error) {
    console.error('Error creating discrepancies table:', error);
  } finally {
    sql.close();
  }
}

createDiscrepanciesTable();
import sql from 'mssql';

async function setupMatrix() {
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
    const pool = await sql.connect(config);
    
    // Create table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='incoterms_responsibility_matrix' AND xtype='U')
      CREATE TABLE incoterms_responsibility_matrix (
        id INT IDENTITY(1,1) PRIMARY KEY,
        incoterm_code NVARCHAR(10) NOT NULL,
        responsibility_category NVARCHAR(100) NOT NULL,
        seller_responsibility NVARCHAR(500) NOT NULL,
        buyer_responsibility NVARCHAR(500) NOT NULL,
        cost_bearer NVARCHAR(20) NOT NULL,
        risk_bearer NVARCHAR(20) NOT NULL
      )
    `);
    
    // Clear and insert sample data
    await pool.request().query('DELETE FROM incoterms_responsibility_matrix');
    
    const sampleData = [
      ['EXW', 'Export Licensing', 'Not required', 'All export permits and licenses', 'Buyer', 'Buyer'],
      ['EXW', 'Transport', 'Not required', 'Arrange and pay for all transport', 'Buyer', 'Buyer'],
      ['FCA', 'Export Licensing', 'All export permits and licenses', 'Import permits only', 'Seller', 'Seller'],
      ['FCA', 'Transport to Carrier', 'Deliver to named place/carrier', 'Main carriage from named place', 'Seller', 'Seller'],
      ['FOB', 'Export Licensing', 'All export permits and licenses', 'Import permits only', 'Seller', 'Seller'],
      ['FOB', 'Loading on Ship', 'Load goods on board ship', 'Main carriage from ship', 'Seller', 'Seller'],
      ['CIF', 'Export Licensing', 'All export permits and licenses', 'Import permits only', 'Seller', 'Seller'],
      ['CIF', 'Marine Insurance', 'Minimum coverage required', 'Additional coverage optional', 'Seller', 'Buyer']
    ];
    
    for (const [code, category, seller, buyer, cost, risk] of sampleData) {
      await pool.request()
        .input('code', sql.NVarChar, code)
        .input('category', sql.NVarChar, category)
        .input('seller', sql.NVarChar, seller)
        .input('buyer', sql.NVarChar, buyer)
        .input('cost', sql.NVarChar, cost)
        .input('risk', sql.NVarChar, risk)
        .query(`
          INSERT INTO incoterms_responsibility_matrix 
          (incoterm_code, responsibility_category, seller_responsibility, buyer_responsibility, cost_bearer, risk_bearer)
          VALUES (@code, @category, @seller, @buyer, @cost, @risk)
        `);
    }
    
    console.log('Responsibility matrix setup complete');
    await pool.close();
    
  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

setupMatrix();
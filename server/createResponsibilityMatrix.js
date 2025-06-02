import sql from 'mssql';

async function createResponsibilityMatrix() {
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
    console.log('Connected successfully!');

    // Create the responsibility matrix table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='incoterms_responsibility_matrix' AND xtype='U')
      CREATE TABLE incoterms_responsibility_matrix (
        id INT IDENTITY(1,1) PRIMARY KEY,
        incoterm_code NVARCHAR(10) NOT NULL,
        responsibility_category NVARCHAR(100) NOT NULL,
        seller_responsibility NVARCHAR(500) NOT NULL,
        buyer_responsibility NVARCHAR(500) NOT NULL,
        cost_bearer NVARCHAR(20) NOT NULL,
        risk_bearer NVARCHAR(20) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    console.log('Table created successfully');

    // Clear existing data
    await pool.request().query('DELETE FROM incoterms_responsibility_matrix');

    // Insert authentic Incoterms 2020 responsibility data
    const responsibilities = [
      // EXW - Ex Works
      { code: 'EXW', category: 'Export Licensing', seller: 'Not required', buyer: 'All export permits and licenses', cost: 'Buyer', risk: 'Buyer' },
      { code: 'EXW', category: 'Transport to Port', seller: 'Not required', buyer: 'Arrange and pay for all transport', cost: 'Buyer', risk: 'Buyer' },
      { code: 'EXW', category: 'Loading at Origin', seller: 'Make goods available', buyer: 'Load goods at seller premises', cost: 'Buyer', risk: 'Buyer' },
      { code: 'EXW', category: 'Insurance', seller: 'Not required', buyer: 'Optional but recommended', cost: 'Buyer', risk: 'Buyer' },
      
      // FCA - Free Carrier
      { code: 'FCA', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'FCA', category: 'Transport to Carrier', seller: 'Deliver to named place/carrier', buyer: 'Main carriage from named place', cost: 'Seller', risk: 'Seller' },
      { code: 'FCA', category: 'Loading Operations', seller: 'Load if at seller premises', buyer: 'Unload if at terminal', cost: 'Seller', risk: 'Seller' },
      { code: 'FCA', category: 'Insurance', seller: 'Not required', buyer: 'Optional but recommended', cost: 'Buyer', risk: 'Buyer' },
      
      // CPT - Carriage Paid To
      { code: 'CPT', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'CPT', category: 'Main Carriage', seller: 'Pay for transport to destination', buyer: 'Risk during transport', cost: 'Seller', risk: 'Buyer' },
      { code: 'CPT', category: 'Risk Transfer', seller: 'Until delivery to carrier', buyer: 'From delivery to carrier', cost: 'Seller', risk: 'Buyer' },
      { code: 'CPT', category: 'Insurance', seller: 'Not required', buyer: 'Recommended for own risk', cost: 'Buyer', risk: 'Buyer' },
      
      // CIP - Carriage and Insurance Paid To
      { code: 'CIP', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'CIP', category: 'Main Carriage', seller: 'Pay for transport to destination', buyer: 'Risk during transport', cost: 'Seller', risk: 'Buyer' },
      { code: 'CIP', category: 'Insurance', seller: 'Minimum coverage required', buyer: 'Additional coverage optional', cost: 'Seller', risk: 'Buyer' },
      { code: 'CIP', category: 'Risk Transfer', seller: 'Until delivery to carrier', buyer: 'From delivery to carrier', cost: 'Seller', risk: 'Buyer' },
      
      // DAP - Delivered at Place
      { code: 'DAP', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits and duties', cost: 'Seller', risk: 'Seller' },
      { code: 'DAP', category: 'Transport', seller: 'All transport to named place', buyer: 'Unloading at destination', cost: 'Seller', risk: 'Seller' },
      { code: 'DAP', category: 'Import Duties', seller: 'Not responsible', buyer: 'All import duties and taxes', cost: 'Buyer', risk: 'Buyer' },
      { code: 'DAP', category: 'Insurance', seller: 'Not required', buyer: 'Optional but recommended', cost: 'Buyer', risk: 'Buyer' },
      
      // DPU - Delivered at Place Unloaded
      { code: 'DPU', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits and duties', cost: 'Seller', risk: 'Seller' },
      { code: 'DPU', category: 'Transport', seller: 'All transport to named place', buyer: 'From unloaded goods', cost: 'Seller', risk: 'Seller' },
      { code: 'DPU', category: 'Unloading', seller: 'Unload at named place', buyer: 'Take delivery of unloaded goods', cost: 'Seller', risk: 'Seller' },
      { code: 'DPU', category: 'Import Duties', seller: 'Not responsible', buyer: 'All import duties and taxes', cost: 'Buyer', risk: 'Buyer' },
      
      // DDP - Delivered Duty Paid
      { code: 'DDP', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Take delivery only', cost: 'Seller', risk: 'Seller' },
      { code: 'DDP', category: 'Transport', seller: 'All transport to destination', buyer: 'From delivered goods', cost: 'Seller', risk: 'Seller' },
      { code: 'DDP', category: 'Import Duties', seller: 'All import duties and taxes', buyer: 'None', cost: 'Seller', risk: 'Seller' },
      { code: 'DDP', category: 'Insurance', seller: 'Not required', buyer: 'Not required', cost: 'Seller', risk: 'Seller' },
      
      // FAS - Free Alongside Ship
      { code: 'FAS', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'FAS', category: 'Transport to Port', seller: 'Deliver alongside ship', buyer: 'Main carriage from port', cost: 'Seller', risk: 'Seller' },
      { code: 'FAS', category: 'Loading on Ship', seller: 'Not responsible', buyer: 'Load goods on ship', cost: 'Buyer', risk: 'Buyer' },
      { code: 'FAS', category: 'Insurance', seller: 'Not required', buyer: 'Optional but recommended', cost: 'Buyer', risk: 'Buyer' },
      
      // FOB - Free on Board
      { code: 'FOB', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'FOB', category: 'Loading on Ship', seller: 'Load goods on board ship', buyer: 'Main carriage from ship', cost: 'Seller', risk: 'Seller' },
      { code: 'FOB', category: 'Ocean Freight', seller: 'Not responsible', buyer: 'Pay for ocean transport', cost: 'Buyer', risk: 'Buyer' },
      { code: 'FOB', category: 'Insurance', seller: 'Not required', buyer: 'Optional but recommended', cost: 'Buyer', risk: 'Buyer' },
      
      // CFR - Cost and Freight
      { code: 'CFR', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'CFR', category: 'Ocean Freight', seller: 'Pay for ocean transport', buyer: 'Risk during ocean transport', cost: 'Seller', risk: 'Buyer' },
      { code: 'CFR', category: 'Risk Transfer', seller: 'Until goods on board ship', buyer: 'From goods on board ship', cost: 'Seller', risk: 'Buyer' },
      { code: 'CFR', category: 'Insurance', seller: 'Not required', buyer: 'Recommended for own risk', cost: 'Buyer', risk: 'Buyer' },
      
      // CIF - Cost, Insurance and Freight
      { code: 'CIF', category: 'Export Licensing', seller: 'All export permits and licenses', buyer: 'Import permits only', cost: 'Seller', risk: 'Seller' },
      { code: 'CIF', category: 'Ocean Freight', seller: 'Pay for ocean transport', buyer: 'Risk during ocean transport', cost: 'Seller', risk: 'Buyer' },
      { code: 'CIF', category: 'Marine Insurance', seller: 'Minimum coverage required', buyer: 'Additional coverage optional', cost: 'Seller', risk: 'Buyer' },
      { code: 'CIF', category: 'Risk Transfer', seller: 'Until goods on board ship', buyer: 'From goods on board ship', cost: 'Seller', risk: 'Buyer' }
    ];

    // Insert all responsibility data
    for (const resp of responsibilities) {
      await pool.request()
        .input('incoterm_code', sql.NVarChar, resp.code)
        .input('responsibility_category', sql.NVarChar, resp.category)
        .input('seller_responsibility', sql.NVarChar, resp.seller)
        .input('buyer_responsibility', sql.NVarChar, resp.buyer)
        .input('cost_bearer', sql.NVarChar, resp.cost)
        .input('risk_bearer', sql.NVarChar, resp.risk)
        .query(`
          INSERT INTO incoterms_responsibility_matrix 
          (incoterm_code, responsibility_category, seller_responsibility, buyer_responsibility, cost_bearer, risk_bearer)
          VALUES (@incoterm_code, @responsibility_category, @seller_responsibility, @buyer_responsibility, @cost_bearer, @risk_bearer)
        `);
    }

    console.log(`Inserted ${responsibilities.length} responsibility matrix records`);

    // Verify the data
    const count = await pool.request().query('SELECT COUNT(*) as total FROM incoterms_responsibility_matrix');
    console.log(`Total records in responsibility matrix: ${count.recordset[0].total}`);

    await pool.close();
    console.log('Responsibility matrix creation completed successfully!');

  } catch (error) {
    console.error('Error creating responsibility matrix:', error);
  }
}

createResponsibilityMatrix();
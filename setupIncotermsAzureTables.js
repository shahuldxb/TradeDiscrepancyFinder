const sql = require('mssql');

const config = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'tf_genie',
  user: 'shahul',
  password: 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function setupIncotermsAzureTables() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Check if tables exist and create them if not
    console.log('Setting up Incoterms tables...');

    // Drop and recreate MObligations with auto-increment ID
    await pool.request().query(`
      IF OBJECT_ID('MObligations', 'U') IS NOT NULL
        DROP TABLE MObligations
    `);

    await pool.request().query(`
      CREATE TABLE MObligations (
        obligation_id INT IDENTITY(1,1) PRIMARY KEY,
        obligation_name VARCHAR(100) NOT NULL
      )
    `);

    // Drop and recreate MIncotermObligationResponsibility
    await pool.request().query(`
      IF OBJECT_ID('MIncotermObligationResponsibility', 'U') IS NOT NULL
        DROP TABLE MIncotermObligationResponsibility
    `);

    await pool.request().query(`
      CREATE TABLE MIncotermObligationResponsibility (
        incoterm_code VARCHAR(10),
        obligation_id INT,
        responsibility VARCHAR(20) NOT NULL,
        FOREIGN KEY (incoterm_code) REFERENCES MIncoterms(incoterm_code),
        FOREIGN KEY (obligation_id) REFERENCES MObligations(obligation_id)
      )
    `);

    console.log('Tables created successfully');

    // Insert obligations data
    console.log('Inserting obligations data...');
    const obligations = [
      'Export Packaging',
      'Loading Charges',
      'Delivery to Port/Place',
      'Export Duty, Taxes & Customs Clearance',
      'Origin Terminal Charges',
      'Loading on Carriage',
      'Carriage Charges',
      'Insurance',
      'Destination Terminal Charges',
      'Delivery to Destination',
      'Unloading at Destination',
      'Import Duty, Taxes & Customs Clearance'
    ];

    for (const obligation of obligations) {
      await pool.request()
        .input('obligation_name', sql.VarChar, obligation)
        .query('INSERT INTO MObligations (obligation_name) VALUES (@obligation_name)');
    }

    console.log('Obligations inserted successfully');

    // Insert responsibility matrix data
    console.log('Inserting responsibility matrix data...');
    
    const responsibilityData = [
      // EXW
      { incoterm: 'EXW', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'EXW', obligation: 'Loading Charges', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Delivery to Port/Place', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Origin Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Loading on Carriage', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Carriage Charges', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'EXW', obligation: 'Destination Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'EXW', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // FCA
      { incoterm: 'FCA', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'FCA', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'FCA', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'FCA', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'FCA', obligation: 'Origin Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'FCA', obligation: 'Loading on Carriage', responsibility: 'Buyer' },
      { incoterm: 'FCA', obligation: 'Carriage Charges', responsibility: 'Buyer' },
      { incoterm: 'FCA', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'FCA', obligation: 'Destination Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'FCA', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'FCA', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'FCA', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // FAS
      { incoterm: 'FAS', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'FAS', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'FAS', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'FAS', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'FAS', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'FAS', obligation: 'Loading on Carriage', responsibility: 'Buyer' },
      { incoterm: 'FAS', obligation: 'Carriage Charges', responsibility: 'Buyer' },
      { incoterm: 'FAS', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'FAS', obligation: 'Destination Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'FAS', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'FAS', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'FAS', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // FOB
      { incoterm: 'FOB', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'FOB', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'FOB', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'FOB', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'FOB', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'FOB', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'FOB', obligation: 'Carriage Charges', responsibility: 'Buyer' },
      { incoterm: 'FOB', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'FOB', obligation: 'Destination Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'FOB', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'FOB', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'FOB', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // CFR
      { incoterm: 'CFR', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'CFR', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'CFR', obligation: 'Destination Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'CFR', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'CFR', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'CFR', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // CIF
      { incoterm: 'CIF', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'CIF', obligation: 'Insurance', responsibility: '*Seller' },
      { incoterm: 'CIF', obligation: 'Destination Terminal Charges', responsibility: 'Buyer' },
      { incoterm: 'CIF', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'CIF', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'CIF', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // CPT
      { incoterm: 'CPT', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'CPT', obligation: 'Destination Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'CPT', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'CPT', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'CPT', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // CIP
      { incoterm: 'CIP', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Insurance', responsibility: '**Seller' },
      { incoterm: 'CIP', obligation: 'Destination Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'CIP', obligation: 'Delivery to Destination', responsibility: 'Buyer' },
      { incoterm: 'CIP', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'CIP', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // DAP
      { incoterm: 'DAP', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'DAP', obligation: 'Destination Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Delivery to Destination', responsibility: 'Seller' },
      { incoterm: 'DAP', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'DAP', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // DPU
      { incoterm: 'DPU', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'DPU', obligation: 'Destination Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Delivery to Destination', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Unloading at Destination', responsibility: 'Seller' },
      { incoterm: 'DPU', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Buyer' },

      // DDP
      { incoterm: 'DDP', obligation: 'Export Packaging', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Loading Charges', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Delivery to Port/Place', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Export Duty, Taxes & Customs Clearance', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Origin Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Loading on Carriage', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Carriage Charges', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Insurance', responsibility: 'Negotiable' },
      { incoterm: 'DDP', obligation: 'Destination Terminal Charges', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Delivery to Destination', responsibility: 'Seller' },
      { incoterm: 'DDP', obligation: 'Unloading at Destination', responsibility: 'Buyer' },
      { incoterm: 'DDP', obligation: 'Import Duty, Taxes & Customs Clearance', responsibility: 'Seller' }
    ];

    for (const entry of responsibilityData) {
      await pool.request()
        .input('incoterm_code', sql.VarChar, entry.incoterm)
        .input('obligation_name', sql.VarChar, entry.obligation)
        .input('responsibility', sql.VarChar, entry.responsibility)
        .query(`
          INSERT INTO MIncotermObligationResponsibility (incoterm_code, obligation_id, responsibility)
          SELECT @incoterm_code, obligation_id, @responsibility
          FROM MObligations
          WHERE obligation_name = @obligation_name
        `);
    }

    console.log('Responsibility matrix inserted successfully');

    // Verify data
    const incotermCount = await pool.request().query('SELECT COUNT(*) as count FROM MIncoterms');
    const obligationCount = await pool.request().query('SELECT COUNT(*) as count FROM MObligations');
    const matrixCount = await pool.request().query('SELECT COUNT(*) as count FROM MIncotermObligationResponsibility');

    console.log(`\nData verification:`);
    console.log(`- Incoterms: ${incotermCount.recordset[0].count}`);
    console.log(`- Obligations: ${obligationCount.recordset[0].count}`);
    console.log(`- Matrix entries: ${matrixCount.recordset[0].count}`);

    console.log('\nIncoterms matrix setup completed successfully!');

  } catch (error) {
    console.error('Error setting up Incoterms tables:', error);
  } finally {
    if (sql.connectionPool) {
      await sql.close();
    }
  }
}

setupIncotermsAzureTables();
import sql from 'mssql';

const config = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'tf_genie',
  user: process.env.AZURE_SQL_USER || 'shahulmi',
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

const responsibilityData = [
  // EXW (Ex Works)
  { incoterm_code: 'EXW', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'EXW', obligation_id: 2, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 3, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 4, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 5, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'EXW', obligation_id: 10, responsibility: 'Buyer' },

  // FCA (Free Carrier)
  { incoterm_code: 'FCA', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'FCA', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'FCA', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'FCA', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'FCA', obligation_id: 5, responsibility: 'Buyer' },
  { incoterm_code: 'FCA', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'FCA', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'FCA', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'FCA', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'FCA', obligation_id: 10, responsibility: 'Buyer' },

  // CPT (Carriage Paid To)
  { incoterm_code: 'CPT', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'CPT', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'CPT', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'CPT', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'CPT', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'CPT', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'CPT', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'CPT', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'CPT', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'CPT', obligation_id: 10, responsibility: 'Buyer' },

  // CIP (Carriage and Insurance Paid To)
  { incoterm_code: 'CIP', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'CIP', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'CIP', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'CIP', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'CIP', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'CIP', obligation_id: 6, responsibility: '**Seller' },
  { incoterm_code: 'CIP', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'CIP', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'CIP', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'CIP', obligation_id: 10, responsibility: 'Buyer' },

  // DAP (Delivered at Place)
  { incoterm_code: 'DAP', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'DAP', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'DAP', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'DAP', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'DAP', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'DAP', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'DAP', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'DAP', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'DAP', obligation_id: 9, responsibility: 'Seller' },
  { incoterm_code: 'DAP', obligation_id: 10, responsibility: 'Buyer' },

  // DPU (Delivered at Place Unloaded)
  { incoterm_code: 'DPU', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'DPU', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'DPU', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'DPU', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'DPU', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'DPU', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'DPU', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'DPU', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'DPU', obligation_id: 9, responsibility: 'Seller' },
  { incoterm_code: 'DPU', obligation_id: 10, responsibility: 'Seller' },

  // DDP (Delivered Duty Paid)
  { incoterm_code: 'DDP', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'DDP', obligation_id: 7, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 8, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 9, responsibility: 'Seller' },
  { incoterm_code: 'DDP', obligation_id: 10, responsibility: 'Seller' },

  // FAS (Free Alongside Ship)
  { incoterm_code: 'FAS', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'FAS', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'FAS', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'FAS', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'FAS', obligation_id: 5, responsibility: 'Buyer' },
  { incoterm_code: 'FAS', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'FAS', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'FAS', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'FAS', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'FAS', obligation_id: 10, responsibility: 'Buyer' },

  // FOB (Free on Board)
  { incoterm_code: 'FOB', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'FOB', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'FOB', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'FOB', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'FOB', obligation_id: 5, responsibility: 'Buyer' },
  { incoterm_code: 'FOB', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'FOB', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'FOB', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'FOB', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'FOB', obligation_id: 10, responsibility: 'Buyer' },

  // CFR (Cost and Freight)
  { incoterm_code: 'CFR', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'CFR', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'CFR', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'CFR', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'CFR', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'CFR', obligation_id: 6, responsibility: 'Buyer' },
  { incoterm_code: 'CFR', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'CFR', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'CFR', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'CFR', obligation_id: 10, responsibility: 'Buyer' },

  // CIF (Cost, Insurance and Freight)
  { incoterm_code: 'CIF', obligation_id: 1, responsibility: 'Seller' },
  { incoterm_code: 'CIF', obligation_id: 2, responsibility: 'Seller' },
  { incoterm_code: 'CIF', obligation_id: 3, responsibility: 'Seller' },
  { incoterm_code: 'CIF', obligation_id: 4, responsibility: 'Seller' },
  { incoterm_code: 'CIF', obligation_id: 5, responsibility: 'Seller' },
  { incoterm_code: 'CIF', obligation_id: 6, responsibility: '*Seller' },
  { incoterm_code: 'CIF', obligation_id: 7, responsibility: 'Buyer' },
  { incoterm_code: 'CIF', obligation_id: 8, responsibility: 'Buyer' },
  { incoterm_code: 'CIF', obligation_id: 9, responsibility: 'Buyer' },
  { incoterm_code: 'CIF', obligation_id: 10, responsibility: 'Buyer' }
];

async function populateResponsibilityMatrix() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Clear existing data
    console.log('Clearing existing responsibility matrix data...');
    await pool.request().query('DELETE FROM MIncotermObligationResponsibility');

    // Insert new data
    console.log('Inserting responsibility matrix data...');
    
    for (const item of responsibilityData) {
      await pool.request()
        .input('incoterm_code', sql.VarChar(10), item.incoterm_code)
        .input('obligation_id', sql.Int, item.obligation_id)
        .input('responsibility', sql.VarChar(20), item.responsibility)
        .query(`
          INSERT INTO MIncotermObligationResponsibility 
          (incoterm_code, obligation_id, responsibility) 
          VALUES (@incoterm_code, @obligation_id, @responsibility)
        `);
    }

    console.log(`Successfully inserted ${responsibilityData.length} responsibility matrix entries`);

    // Verify the data
    const result = await pool.request().query('SELECT COUNT(*) as count FROM MIncotermObligationResponsibility');
    console.log(`Total records in responsibility matrix: ${result.recordset[0].count}`);

    await pool.close();
    console.log('Connection closed successfully');
    
  } catch (error) {
    console.error('Error populating responsibility matrix:', error);
  }
}

populateResponsibilityMatrix();
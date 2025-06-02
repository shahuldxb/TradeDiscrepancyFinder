import sql from 'mssql';

const serverWithPort = process.env.AZURE_SQL_SERVER || 'shahulmi.database.windows.net';
const [server, portStr] = serverWithPort.includes(',') ? serverWithPort.split(',') : [serverWithPort, '1433'];
const port = parseInt(portStr) || 1433;

const config = {
  server: server,
  port: port,
  database: process.env.AZURE_SQL_DATABASE || 'TF_genie',
  user: process.env.AZURE_SQL_USERNAME || 'shahul',
  password: process.env.AZURE_SQL_PASSWORD || 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function createIncotermsTablesAndData() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');

    // Create Incoterms 2020 table
    console.log('Creating Incoterms 2020 table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'incoterms_2020')
      BEGIN
        CREATE TABLE incoterms_2020 (
          id INT IDENTITY(1,1) PRIMARY KEY,
          code NVARCHAR(3) NOT NULL UNIQUE,
          name NVARCHAR(100) NOT NULL,
          description NVARCHAR(MAX),
          transport_mode NVARCHAR(50),
          seller_risk_level INT,
          buyer_risk_level INT,
          cost_responsibility NVARCHAR(MAX),
          risk_transfer_point NVARCHAR(MAX),
          seller_obligations NVARCHAR(MAX),
          buyer_obligations NVARCHAR(MAX),
          is_active BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // Create responsibility matrix table
    console.log('Creating responsibility matrix table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'incoterms_responsibility_matrix')
      BEGIN
        CREATE TABLE incoterms_responsibility_matrix (
          id INT IDENTITY(1,1) PRIMARY KEY,
          incoterm_code NVARCHAR(3),
          responsibility_category NVARCHAR(100),
          seller_responsibility NVARCHAR(MAX),
          buyer_responsibility NVARCHAR(MAX),
          critical_point BIT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (incoterm_code) REFERENCES incoterms_2020(code)
        )
      END
    `);

    // Clear existing data
    console.log('Clearing existing data...');
    await pool.request().query('DELETE FROM incoterms_responsibility_matrix');
    await pool.request().query('DELETE FROM incoterms_2020');

    // Insert all 11 Incoterms 2020 terms
    console.log('Inserting Incoterms data...');
    const incotermsData = [
      ['FOB', 'Free on Board', 'Seller delivers when goods pass the ship\'s rail at the named port of shipment', 'Sea/Inland waterway', 2, 3, 'Seller pays all costs until goods pass ship\'s rail', 'When goods pass ship\'s rail at port of shipment', 'Load goods on board vessel, export clearance, provide commercial invoice', 'Arrange main carriage, marine insurance, import clearance, unload at destination'],
      ['CIF', 'Cost, Insurance and Freight', 'Seller pays costs, freight and marine insurance to bring goods to named destination port', 'Sea/Inland waterway', 3, 2, 'Seller pays freight and minimum marine insurance to destination', 'When goods pass ship\'s rail at port of shipment', 'Arrange freight, minimum marine insurance, export clearance', 'Take delivery at destination port, import clearance, additional insurance'],
      ['CFR', 'Cost and Freight', 'Seller pays costs and freight to bring goods to named destination port', 'Sea/Inland waterway', 3, 3, 'Seller pays freight to destination port', 'When goods pass ship\'s rail at port of shipment', 'Arrange and pay freight to destination, export clearance', 'Marine insurance, import clearance, take delivery at destination'],
      ['FCA', 'Free Carrier', 'Seller delivers goods to carrier nominated by buyer at seller\'s premises or named place', 'Any mode of transport', 1, 4, 'Seller pays until delivery to carrier', 'When goods delivered to first carrier', 'Deliver to carrier, export clearance if at seller\'s premises', 'Nominate carrier, arrange main carriage, import clearance'],
      ['CPT', 'Carriage Paid To', 'Seller pays for carriage of goods up to named destination', 'Any mode of transport', 2, 3, 'Seller pays carriage to named destination', 'When goods handed to first carrier', 'Arrange and pay carriage to destination, export clearance', 'Insurance for main carriage, import clearance, take delivery'],
      ['CIP', 'Carriage and Insurance Paid To', 'Seller pays carriage and insurance of goods up to named destination', 'Any mode of transport', 3, 2, 'Seller pays carriage and minimum insurance to destination', 'When goods handed to first carrier', 'Arrange carriage and minimum insurance, export clearance', 'Additional insurance if required, import clearance, take delivery'],
      ['DAP', 'Delivered at Place', 'Seller delivers when goods are placed at buyer\'s disposal at named destination', 'Any mode of transport', 4, 1, 'Seller pays all costs to named destination', 'At named place of destination', 'Deliver to named place ready for unloading, export clearance', 'Unload goods, import clearance and duties'],
      ['DPU', 'Delivered at Place Unloaded', 'Seller delivers when goods are unloaded from arriving means of transport', 'Any mode of transport', 5, 1, 'Seller pays all costs including unloading', 'When goods unloaded at named place', 'Deliver and unload at named place, export clearance', 'Import clearance and duties, take delivery after unloading'],
      ['DDP', 'Delivered Duty Paid', 'Seller delivers when goods are made available cleared for import at named destination', 'Any mode of transport', 5, 1, 'Seller pays all costs including import duties', 'At named place of destination', 'Deliver cleared for import, pay all duties and taxes', 'Take delivery of cleared goods, minimal obligations'],
      ['EXW', 'Ex Works', 'Seller delivers when goods are placed at disposal of buyer at seller\'s premises', 'Any mode of transport', 1, 5, 'Buyer bears all costs from seller\'s premises', 'At seller\'s premises when goods available', 'Make goods available at premises, provide commercial invoice', 'Collect goods, all transport, insurance, export/import clearance'],
      ['FAS', 'Free Alongside Ship', 'Seller delivers when goods are placed alongside vessel at named port', 'Sea/Inland waterway', 2, 4, 'Seller pays costs to alongside ship', 'When goods placed alongside ship', 'Deliver goods alongside ship, export clearance', 'Load goods, arrange sea transport, marine insurance, import clearance']
    ];

    for (const incoterm of incotermsData) {
      await pool.request()
        .input('code', sql.NVarChar, incoterm[0])
        .input('name', sql.NVarChar, incoterm[1])
        .input('description', sql.NVarChar, incoterm[2])
        .input('transport_mode', sql.NVarChar, incoterm[3])
        .input('seller_risk_level', sql.Int, incoterm[4])
        .input('buyer_risk_level', sql.Int, incoterm[5])
        .input('cost_responsibility', sql.NVarChar, incoterm[6])
        .input('risk_transfer_point', sql.NVarChar, incoterm[7])
        .input('seller_obligations', sql.NVarChar, incoterm[8])
        .input('buyer_obligations', sql.NVarChar, incoterm[9])
        .query(`
          INSERT INTO incoterms_2020 
          (code, name, description, transport_mode, seller_risk_level, buyer_risk_level, 
           cost_responsibility, risk_transfer_point, seller_obligations, buyer_obligations)
          VALUES 
          (@code, @name, @description, @transport_mode, @seller_risk_level, @buyer_risk_level,
           @cost_responsibility, @risk_transfer_point, @seller_obligations, @buyer_obligations)
        `);
    }

    // Insert responsibility matrix data
    console.log('Inserting responsibility matrix data...');
    const matrixData = [
      ['FOB', 'Export Clearance', 'Obtain export license, complete customs formalities', 'Provide assistance if requested', 1],
      ['FOB', 'Loading for Export', 'Load goods on board vessel at named port', 'Bear costs and risks', 1],
      ['FOB', 'Main Carriage', 'No obligation', 'Arrange and pay for sea freight', 1],
      ['FOB', 'Insurance', 'No obligation (unless agreed)', 'Arrange marine insurance', 0],
      ['FOB', 'Import Clearance', 'No obligation', 'Complete import formalities, pay duties', 1],
      ['CIF', 'Export Clearance', 'Obtain export license, complete customs formalities', 'Provide assistance if requested', 1],
      ['CIF', 'Loading for Export', 'Load goods on board vessel', 'No obligation', 0],
      ['CIF', 'Main Carriage', 'Arrange and pay sea freight to destination', 'No obligation', 1],
      ['CIF', 'Insurance', 'Minimum marine insurance (110% CIF value)', 'Additional insurance if required', 1],
      ['CIF', 'Import Clearance', 'No obligation', 'Complete import formalities, pay duties', 1],
      ['FCA', 'Export Clearance', 'Complete if delivery at seller premises', 'Complete if delivery elsewhere', 1],
      ['FCA', 'Loading for Export', 'Load if at seller premises, otherwise make available', 'Arrange loading if not at seller premises', 1],
      ['FCA', 'Main Carriage', 'No obligation', 'Nominate carrier, arrange main transport', 1],
      ['FCA', 'Insurance', 'No obligation', 'Arrange insurance for main carriage', 0],
      ['FCA', 'Import Clearance', 'No obligation', 'Complete import formalities', 1],
      ['DDP', 'Export Clearance', 'Obtain export license, complete formalities', 'Provide assistance if requested', 0],
      ['DDP', 'Main Carriage', 'Arrange and pay all transport to destination', 'No obligation', 1],
      ['DDP', 'Insurance', 'Arrange insurance (recommended)', 'No obligation', 0],
      ['DDP', 'Import Clearance', 'Complete all import formalities, pay duties', 'Provide assistance with documents', 1],
      ['DDP', 'Delivery', 'Deliver to named place, ready for unloading', 'Unload goods and take delivery', 1]
    ];

    for (const matrix of matrixData) {
      await pool.request()
        .input('incoterm_code', sql.NVarChar, matrix[0])
        .input('responsibility_category', sql.NVarChar, matrix[1])
        .input('seller_responsibility', sql.NVarChar, matrix[2])
        .input('buyer_responsibility', sql.NVarChar, matrix[3])
        .input('critical_point', sql.Bit, matrix[4])
        .query(`
          INSERT INTO incoterms_responsibility_matrix 
          (incoterm_code, responsibility_category, seller_responsibility, buyer_responsibility, critical_point)
          VALUES 
          (@incoterm_code, @responsibility_category, @seller_responsibility, @buyer_responsibility, @critical_point)
        `);
    }

    console.log('✅ Successfully created Incoterms tables and inserted all data');
    console.log('✅ Total Incoterms: 11');
    console.log('✅ Responsibility matrix entries: 20');

    await pool.close();
  } catch (error) {
    console.error('❌ Error creating Incoterms data:', error);
    throw error;
  }
}

createIncotermsTablesAndData();
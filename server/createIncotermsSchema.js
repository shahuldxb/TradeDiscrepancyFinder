import { connectToAzureSQL } from './azureSqlConnection.ts';

async function createIncotermsSchema() {
  let pool;
  try {
    pool = await connectToAzureSQL();
    console.log('Creating Incoterms schema...');

    // Create Incoterms table with all 11 terms and their comprehensive data
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Incoterms' AND xtype='U')
      CREATE TABLE Incoterms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        term_code VARCHAR(3) NOT NULL UNIQUE,
        term_name VARCHAR(100) NOT NULL,
        full_description TEXT,
        transport_mode VARCHAR(50), -- 'Any Mode' or 'Sea and Inland Waterway'
        risk_transfer_point TEXT,
        cost_responsibility_seller TEXT,
        cost_responsibility_buyer TEXT,
        insurance_requirement VARCHAR(20), -- 'Required', 'Optional', 'Not Required'
        delivery_location VARCHAR(100),
        applicable_documents TEXT,
        compliance_requirements TEXT,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1
      )
    `);

    // Create Responsibility Matrix table for detailed seller/buyer obligations
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncotermsResponsibilityMatrix' AND xtype='U')
      CREATE TABLE IncotermsResponsibilityMatrix (
        id INT IDENTITY(1,1) PRIMARY KEY,
        incoterm_id INT NOT NULL,
        responsibility_category VARCHAR(100) NOT NULL,
        seller_responsibility VARCHAR(20) NOT NULL, -- 'Full', 'Partial', 'None'
        buyer_responsibility VARCHAR(20) NOT NULL, -- 'Full', 'Partial', 'None'
        detailed_description TEXT,
        cost_bearer VARCHAR(20), -- 'Seller', 'Buyer', 'Shared'
        risk_bearer VARCHAR(20), -- 'Seller', 'Buyer'
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (incoterm_id) REFERENCES Incoterms(id)
      )
    `);

    // Create Incoterms Validation Rules for AI agents
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncotermsValidationRules' AND xtype='U')
      CREATE TABLE IncotermsValidationRules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        incoterm_id INT NOT NULL,
        rule_type VARCHAR(50) NOT NULL, -- 'Document', 'Transport', 'Insurance', 'Payment'
        rule_description TEXT NOT NULL,
        validation_logic TEXT,
        error_message TEXT,
        severity_level VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (incoterm_id) REFERENCES Incoterms(id)
      )
    `);

    // Create LC Incoterms Mapping for trade finance validation
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LCIncotermsMapping' AND xtype='U')
      CREATE TABLE LCIncotermsMapping (
        id INT IDENTITY(1,1) PRIMARY KEY,
        lc_number VARCHAR(50) NOT NULL,
        incoterm_id INT NOT NULL,
        mapped_by VARCHAR(100),
        mapping_date DATETIME2 DEFAULT GETDATE(),
        validation_status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Validated', 'Failed'
        validation_notes TEXT,
        ai_agent_analysis TEXT,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (incoterm_id) REFERENCES Incoterms(id)
      )
    `);

    console.log('✓ Incoterms schema created successfully');

    // Insert the 11 Incoterms 2020 terms with comprehensive data
    console.log('Inserting Incoterms 2020 data...');

    const incotermsData = [
      {
        code: 'EXW',
        name: 'Ex Works',
        description: 'The seller makes the goods available at their premises. The buyer bears all costs and risks involved in taking the goods.',
        transport: 'Any Mode',
        risk_transfer: 'At seller\'s premises when goods are placed at buyer\'s disposal',
        seller_costs: 'Provide goods, commercial invoice, export packaging',
        buyer_costs: 'All transport costs, export/import clearance, duties, insurance',
        insurance: 'Not Required'
      },
      {
        code: 'FCA',
        name: 'Free Carrier',
        description: 'The seller delivers goods to a carrier nominated by the buyer at a named place.',
        transport: 'Any Mode',
        risk_transfer: 'When goods are delivered to the first carrier',
        seller_costs: 'Goods, export clearance, delivery to carrier',
        buyer_costs: 'Main carriage, import clearance, duties, insurance',
        insurance: 'Not Required'
      },
      {
        code: 'CPT',
        name: 'Carriage Paid To',
        description: 'The seller pays for carriage to the named destination but risk transfers to buyer upon delivery to first carrier.',
        transport: 'Any Mode',
        risk_transfer: 'When goods are delivered to the first carrier',
        seller_costs: 'Goods, export clearance, main carriage to destination',
        buyer_costs: 'Import clearance, duties, insurance, delivery from terminal',
        insurance: 'Not Required'
      },
      {
        code: 'CIP',
        name: 'Carriage and Insurance Paid To',
        description: 'The seller pays for carriage and insurance to destination but risk transfers upon delivery to first carrier.',
        transport: 'Any Mode',
        risk_transfer: 'When goods are delivered to the first carrier',
        seller_costs: 'Goods, export clearance, main carriage, minimum insurance',
        buyer_costs: 'Import clearance, duties, delivery from terminal',
        insurance: 'Required (Seller - Minimum Coverage)'
      },
      {
        code: 'DAP',
        name: 'Delivered At Place',
        description: 'The seller delivers when goods are placed at buyer\'s disposal at the named destination.',
        transport: 'Any Mode',
        risk_transfer: 'At named place of destination when goods are ready for unloading',
        seller_costs: 'Goods, export clearance, main carriage, delivery to destination',
        buyer_costs: 'Import clearance, duties, unloading',
        insurance: 'Not Required'
      },
      {
        code: 'DPU',
        name: 'Delivered at Place Unloaded',
        description: 'The seller delivers when goods are unloaded from the arriving means of transport at the named place.',
        transport: 'Any Mode',
        risk_transfer: 'When goods are unloaded at the named place of destination',
        seller_costs: 'Goods, export clearance, main carriage, delivery and unloading',
        buyer_costs: 'Import clearance, duties',
        insurance: 'Not Required'
      },
      {
        code: 'DDP',
        name: 'Delivered Duty Paid',
        description: 'The seller delivers when goods are placed at buyer\'s disposal, cleared for import.',
        transport: 'Any Mode',
        risk_transfer: 'At named place of destination when goods are ready for unloading',
        seller_costs: 'All costs including import duties and clearance',
        buyer_costs: 'Unloading (unless agreed otherwise)',
        insurance: 'Not Required'
      },
      {
        code: 'FAS',
        name: 'Free Alongside Ship',
        description: 'The seller delivers when goods are placed alongside the nominated vessel at the port of shipment.',
        transport: 'Sea and Inland Waterway',
        risk_transfer: 'When goods are placed alongside the ship at port of shipment',
        seller_costs: 'Goods, export clearance, delivery alongside ship',
        buyer_costs: 'Loading, main carriage, import clearance, duties, insurance',
        insurance: 'Not Required'
      },
      {
        code: 'FOB',
        name: 'Free On Board',
        description: 'The seller delivers when goods pass the ship\'s rail at the port of shipment.',
        transport: 'Sea and Inland Waterway',
        risk_transfer: 'When goods pass the ship\'s rail at port of shipment',
        seller_costs: 'Goods, export clearance, delivery and loading on board',
        buyer_costs: 'Main carriage, import clearance, duties, insurance',
        insurance: 'Not Required'
      },
      {
        code: 'CFR',
        name: 'Cost and Freight',
        description: 'The seller pays costs and freight to destination but risk transfers when goods pass ship\'s rail.',
        transport: 'Sea and Inland Waterway',
        risk_transfer: 'When goods pass the ship\'s rail at port of shipment',
        seller_costs: 'Goods, export clearance, loading, main carriage',
        buyer_costs: 'Import clearance, duties, insurance, delivery from port',
        insurance: 'Not Required'
      },
      {
        code: 'CIF',
        name: 'Cost, Insurance and Freight',
        description: 'The seller pays costs, insurance and freight but risk transfers when goods pass ship\'s rail.',
        transport: 'Sea and Inland Waterway',
        risk_transfer: 'When goods pass the ship\'s rail at port of shipment',
        seller_costs: 'Goods, export clearance, loading, main carriage, minimum insurance',
        buyer_costs: 'Import clearance, duties, delivery from port',
        insurance: 'Required (Seller - Minimum Coverage)'
      }
    ];

    for (const term of incotermsData) {
      await pool.request()
        .input('code', term.code)
        .input('name', term.name)
        .input('description', term.description)
        .input('transport', term.transport)
        .input('risk_transfer', term.risk_transfer)
        .input('seller_costs', term.seller_costs)
        .input('buyer_costs', term.buyer_costs)
        .input('insurance', term.insurance)
        .query(`
          INSERT INTO Incoterms (
            term_code, term_name, full_description, transport_mode,
            risk_transfer_point, cost_responsibility_seller, cost_responsibility_buyer,
            insurance_requirement
          ) VALUES (
            @code, @name, @description, @transport,
            @risk_transfer, @seller_costs, @buyer_costs, @insurance
          )
        `);
    }

    console.log('✓ Incoterms 2020 data inserted successfully');
    console.log('Incoterms schema setup completed!');

  } catch (error) {
    console.error('Error creating Incoterms schema:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

export { createIncotermsSchema };
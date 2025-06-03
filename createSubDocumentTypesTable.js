import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function createSubDocumentTypesTable() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Create SubDocumentTypes table
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SubDocumentTypes' AND xtype='U')
      CREATE TABLE SubDocumentTypes (
        SubDocumentID INT IDENTITY(1,1) PRIMARY KEY,
        ParentDocumentID INT NOT NULL,
        SubDocumentCode VARCHAR(20) NOT NULL,
        SubDocumentName VARCHAR(255) NOT NULL,
        Description TEXT,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE(),
        UpdatedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ParentDocumentID) REFERENCES MasterDocuments(DocumentID)
      );
    `;
    
    await pool.request().query(createTableQuery);
    console.log('SubDocumentTypes table created successfully');
    
    // Get Bill of Lading DocumentID from MasterDocuments
    const getBOLQuery = `
      SELECT DocumentID FROM MasterDocuments 
      WHERE DocumentName LIKE '%Bill of Lading%' OR DocumentCode = 'DOC002'
    `;
    
    const bolResult = await pool.request().query(getBOLQuery);
    
    if (bolResult.recordset.length === 0) {
      console.log('Bill of Lading not found in MasterDocuments');
      return;
    }
    
    const parentDocumentID = bolResult.recordset[0].DocumentID;
    console.log(`Found Bill of Lading with DocumentID: ${parentDocumentID}`);
    
    // Insert Bill of Lading sub-document types
    const subDocumentTypes = [
      {
        code: 'BOL001',
        name: 'Shipped Bill of Lading',
        description: 'Evidence that goods have been shipped on board in good condition.'
      },
      {
        code: 'BOL002',
        name: 'Through Bill of Lading',
        description: 'Allows multiple modes of transport across borders with different carriers.'
      },
      {
        code: 'BOL003',
        name: 'Ocean Bill of Lading',
        description: 'Used for sea shipments; can be negotiable or non-negotiable.'
      },
      {
        code: 'BOL004',
        name: 'Inland Bill of Lading',
        description: 'Used for land transportation (truck or rail) to ports.'
      },
      {
        code: 'BOL005',
        name: 'Received Bill of Lading',
        description: 'Confirms that goods have been received by the carrier, not necessarily shipped.'
      },
      {
        code: 'BOL006',
        name: 'Claused Bill of Lading',
        description: 'Indicates goods were damaged or quantity/quality issues noted (foul/dirty BOL).'
      },
      {
        code: 'BOL007',
        name: 'Uniform Bill of Lading',
        description: 'Standard agreement between carrier and exporter with shipment terms.'
      },
      {
        code: 'BOL008',
        name: 'Clean Bill of Lading',
        description: 'Confirms goods were received in perfect condition by the carrier.'
      }
    ];
    
    // Check if data already exists
    const checkExisting = `
      SELECT COUNT(*) as count FROM SubDocumentTypes 
      WHERE ParentDocumentID = @parentDocumentID
    `;
    
    const existingResult = await pool.request()
      .input('parentDocumentID', parentDocumentID)
      .query(checkExisting);
    
    if (existingResult.recordset[0].count > 0) {
      console.log('Sub-document types already exist for Bill of Lading');
      return;
    }
    
    // Insert sub-document types
    for (const subDoc of subDocumentTypes) {
      const insertQuery = `
        INSERT INTO SubDocumentTypes (ParentDocumentID, SubDocumentCode, SubDocumentName, Description)
        VALUES (@parentDocumentID, @code, @name, @description)
      `;
      
      await pool.request()
        .input('parentDocumentID', parentDocumentID)
        .input('code', subDoc.code)
        .input('name', subDoc.name)
        .input('description', subDoc.description)
        .query(insertQuery);
      
      console.log(`Inserted: ${subDoc.name}`);
    }
    
    console.log('All Bill of Lading sub-document types inserted successfully');
    
    // Verify insertion
    const verifyQuery = `
      SELECT 
        sd.SubDocumentID,
        sd.SubDocumentCode,
        sd.SubDocumentName,
        sd.Description,
        md.DocumentName as ParentDocumentName
      FROM SubDocumentTypes sd
      JOIN MasterDocuments md ON sd.ParentDocumentID = md.DocumentID
      WHERE sd.ParentDocumentID = @parentDocumentID
      ORDER BY sd.SubDocumentCode
    `;
    
    const verifyResult = await pool.request()
      .input('parentDocumentID', parentDocumentID)
      .query(verifyQuery);
    
    console.log('\nInserted Sub-Document Types:');
    verifyResult.recordset.forEach(row => {
      console.log(`${row.SubDocumentCode}: ${row.SubDocumentName}`);
    });
    
    await pool.close();
    console.log('\nSubDocumentTypes table setup completed successfully');
    
  } catch (error) {
    console.error('Error creating SubDocumentTypes table:', error);
    throw error;
  }
}

// Run the function
createSubDocumentTypesTable()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
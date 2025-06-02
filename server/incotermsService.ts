import { connectToAzureSQL } from './azureSqlConnection.ts';

export class IncotermsService {
  async getAllIncoterms() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT 
          id,
          term_code,
          term_name,
          full_description,
          transport_mode,
          risk_transfer_point,
          cost_responsibility_seller,
          cost_responsibility_buyer,
          insurance_requirement,
          delivery_location,
          applicable_documents,
          compliance_requirements,
          created_at,
          updated_at,
          is_active
        FROM Incoterms 
        WHERE is_active = 1
        ORDER BY term_code
      `);
      await pool.close();
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Incoterms:', error);
      throw error;
    }
  }

  async getIncoterm(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query(`
          SELECT 
            id,
            term_code,
            term_name,
            full_description,
            transport_mode,
            risk_transfer_point,
            cost_responsibility_seller,
            cost_responsibility_buyer,
            insurance_requirement,
            delivery_location,
            applicable_documents,
            compliance_requirements,
            created_at,
            updated_at,
            is_active
          FROM Incoterms 
          WHERE id = @id AND is_active = 1
        `);
      await pool.close();
      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching Incoterm:', error);
      throw error;
    }
  }

  async getIncotermByCode(code: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('code', code)
        .query(`
          SELECT 
            id,
            term_code,
            term_name,
            full_description,
            transport_mode,
            risk_transfer_point,
            cost_responsibility_seller,
            cost_responsibility_buyer,
            insurance_requirement,
            delivery_location,
            applicable_documents,
            compliance_requirements,
            created_at,
            updated_at,
            is_active
          FROM Incoterms 
          WHERE term_code = @code AND is_active = 1
        `);
      await pool.close();
      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching Incoterm by code:', error);
      throw error;
    }
  }

  async updateIncoterm(id: number, data: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('term_name', data.term_name)
        .input('full_description', data.full_description)
        .input('transport_mode', data.transport_mode)
        .input('risk_transfer_point', data.risk_transfer_point)
        .input('cost_responsibility_seller', data.cost_responsibility_seller)
        .input('cost_responsibility_buyer', data.cost_responsibility_buyer)
        .input('insurance_requirement', data.insurance_requirement)
        .input('delivery_location', data.delivery_location)
        .input('applicable_documents', data.applicable_documents)
        .input('compliance_requirements', data.compliance_requirements)
        .query(`
          UPDATE Incoterms 
          SET 
            term_name = @term_name,
            full_description = @full_description,
            transport_mode = @transport_mode,
            risk_transfer_point = @risk_transfer_point,
            cost_responsibility_seller = @cost_responsibility_seller,
            cost_responsibility_buyer = @cost_responsibility_buyer,
            insurance_requirement = @insurance_requirement,
            delivery_location = @delivery_location,
            applicable_documents = @applicable_documents,
            compliance_requirements = @compliance_requirements,
            updated_at = GETDATE()
          WHERE id = @id
        `);
      await pool.close();
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error updating Incoterm:', error);
      throw error;
    }
  }

  async getResponsibilityMatrix(incotermId: number) {
    try {
      const pool = await connectToAzureSQL();
      
      // First check if responsibility matrix table exists, if not create it
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncotermsResponsibilityMatrix' AND xtype='U')
        CREATE TABLE IncotermsResponsibilityMatrix (
          id INT IDENTITY(1,1) PRIMARY KEY,
          incoterm_id INT NOT NULL,
          responsibility_category VARCHAR(100) NOT NULL,
          seller_responsibility VARCHAR(20) NOT NULL,
          buyer_responsibility VARCHAR(20) NOT NULL,
          detailed_description TEXT,
          cost_bearer VARCHAR(20),
          risk_bearer VARCHAR(20),
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (incoterm_id) REFERENCES Incoterms(id)
        )
      `);

      // Get existing data or insert default responsibility matrix
      let result = await pool.request()
        .input('incotermId', incotermId)
        .query(`
          SELECT * FROM IncotermsResponsibilityMatrix 
          WHERE incoterm_id = @incotermId
          ORDER BY responsibility_category
        `);

      // If no data exists, create default responsibility matrix
      if (result.recordset.length === 0) {
        await this.createDefaultResponsibilityMatrix(pool, incotermId);
        result = await pool.request()
          .input('incotermId', incotermId)
          .query(`
            SELECT * FROM IncotermsResponsibilityMatrix 
            WHERE incoterm_id = @incotermId
            ORDER BY responsibility_category
          `);
      }

      await pool.close();
      return result.recordset;
    } catch (error) {
      console.error('Error fetching responsibility matrix:', error);
      throw error;
    }
  }

  private async createDefaultResponsibilityMatrix(pool: any, incotermId: number) {
    const responsibilities = [
      'Export Packaging',
      'Loading Charges',
      'Delivery to Port/Place',
      'Export Duties and Customs Clearance',
      'Origin Terminal Charges',
      'Loading on Carriage',
      'Carriage Charges',
      'Insurance',
      'Destination Terminal Charges',
      'Delivery to Destination',
      'Unloading at Destination',
      'Import Duties and Customs Clearance'
    ];

    for (const category of responsibilities) {
      await pool.request()
        .input('incotermId', incotermId)
        .input('category', category)
        .input('sellerResp', 'Partial')
        .input('buyerResp', 'Partial')
        .input('costBearer', 'Shared')
        .input('riskBearer', 'Shared')
        .query(`
          INSERT INTO IncotermsResponsibilityMatrix 
          (incoterm_id, responsibility_category, seller_responsibility, buyer_responsibility, cost_bearer, risk_bearer)
          VALUES (@incotermId, @category, @sellerResp, @buyerResp, @costBearer, @riskBearer)
        `);
    }
  }

  async validateLCIncoterms(lcNumber: string, incotermCode: string) {
    try {
      const pool = await connectToAzureSQL();
      
      // Create LC Incoterms mapping table if it doesn't exist
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LCIncotermsMapping' AND xtype='U')
        CREATE TABLE LCIncotermsMapping (
          id INT IDENTITY(1,1) PRIMARY KEY,
          lc_number VARCHAR(50) NOT NULL,
          incoterm_id INT NOT NULL,
          mapped_by VARCHAR(100),
          mapping_date DATETIME2 DEFAULT GETDATE(),
          validation_status VARCHAR(20) DEFAULT 'Pending',
          validation_notes TEXT,
          ai_agent_analysis TEXT,
          created_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (incoterm_id) REFERENCES Incoterms(id)
        )
      `);

      // Get incoterm details
      const incotermResult = await pool.request()
        .input('code', incotermCode)
        .query('SELECT * FROM Incoterms WHERE term_code = @code');

      if (incotermResult.recordset.length === 0) {
        throw new Error(`Incoterm ${incotermCode} not found`);
      }

      const incoterm = incotermResult.recordset[0];

      // Create or update LC mapping
      await pool.request()
        .input('lcNumber', lcNumber)
        .input('incotermId', incoterm.id)
        .input('mappedBy', 'System')
        .input('validationStatus', 'Validated')
        .input('validationNotes', `LC ${lcNumber} mapped to ${incotermCode} - ${incoterm.term_name}`)
        .query(`
          MERGE LCIncotermsMapping AS target
          USING (SELECT @lcNumber as lc_number, @incotermId as incoterm_id) AS source
          ON target.lc_number = source.lc_number
          WHEN MATCHED THEN
            UPDATE SET 
              incoterm_id = @incotermId,
              validation_status = @validationStatus,
              validation_notes = @validationNotes,
              mapping_date = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (lc_number, incoterm_id, mapped_by, validation_status, validation_notes)
            VALUES (@lcNumber, @incotermId, @mappedBy, @validationStatus, @validationNotes);
        `);

      await pool.close();

      return {
        lcNumber,
        incoterm: incoterm,
        validationStatus: 'Validated',
        validationDate: new Date(),
        notes: `LC successfully mapped to ${incotermCode}`
      };
    } catch (error) {
      console.error('Error validating LC Incoterms:', error);
      throw error;
    }
  }

  async getIncotermsStatistics() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT 
          transport_mode,
          COUNT(*) as count,
          STRING_AGG(term_code, ', ') as terms
        FROM Incoterms 
        WHERE is_active = 1
        GROUP BY transport_mode
        ORDER BY transport_mode
      `);
      await pool.close();
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Incoterms statistics:', error);
      throw error;
    }
  }
}

export const incotermsService = new IncotermsService();
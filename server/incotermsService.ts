import { connectToAzureSQL } from './azureSqlConnection';
import sql from 'mssql';

export interface Incoterm {
  id: number;
  code: string;
  name: string;
  description: string;
  transport_mode: string;
  seller_risk_level: number;
  buyer_risk_level: number;
  cost_responsibility: string;
  risk_transfer_point: string;
  seller_obligations: string;
  buyer_obligations: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResponsibilityMatrix {
  id: number;
  incoterm_code: string;
  responsibility_category: string;
  seller_responsibility: string;
  buyer_responsibility: string;
  critical_point: boolean;
}

export interface IncotermsStatistics {
  totalIncoterms: number;
  activeIncoterms: number;
  seaTransport: number;
  anyMode: number;
  validationRate: number;
  complianceScore: number;
}

export class IncotermsService {
  async getAllIncoterms(): Promise<Incoterm[]> {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT 
          id,
          code,
          name,
          description,
          transport_mode,
          seller_risk_level,
          buyer_risk_level,
          cost_responsibility,
          risk_transfer_point,
          seller_obligations,
          buyer_obligations,
          is_active,
          FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
          FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at
        FROM incoterms_2020 
        ORDER BY seller_risk_level ASC, buyer_risk_level DESC, code
      `);
      
      return result.recordset as Incoterm[];
    } catch (error) {
      console.error('Error fetching Incoterms:', error);
      throw new Error('Failed to fetch Incoterms data');
    }
  }

  async getIncoterm(code: string): Promise<Incoterm | null> {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('code', sql.NVarChar, code)
        .query(`
          SELECT 
            id,
            code,
            name,
            description,
            transport_mode,
            seller_risk_level,
            buyer_risk_level,
            cost_responsibility,
            risk_transfer_point,
            seller_obligations,
            buyer_obligations,
            is_active,
            FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
            FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at
          FROM incoterms_2020 
          WHERE code = @code
        `);
      
      return result.recordset[0] as Incoterm || null;
    } catch (error) {
      console.error('Error fetching Incoterm by code:', error);
      throw new Error('Failed to fetch Incoterm');
    }
  }

  async updateIncoterm(code: string, updates: Partial<Incoterm>): Promise<Incoterm> {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('code', sql.NVarChar, code)
        .input('name', sql.NVarChar, updates.name)
        .input('description', sql.NVarChar, updates.description)
        .input('transport_mode', sql.NVarChar, updates.transport_mode)
        .input('seller_risk_level', sql.Int, updates.seller_risk_level)
        .input('buyer_risk_level', sql.Int, updates.buyer_risk_level)
        .input('cost_responsibility', sql.NVarChar, updates.cost_responsibility)
        .input('risk_transfer_point', sql.NVarChar, updates.risk_transfer_point)
        .input('seller_obligations', sql.NVarChar, updates.seller_obligations)
        .input('buyer_obligations', sql.NVarChar, updates.buyer_obligations)
        .input('is_active', sql.Bit, updates.is_active)
        .query(`
          UPDATE incoterms_2020 
          SET 
            name = COALESCE(@name, name),
            description = COALESCE(@description, description),
            transport_mode = COALESCE(@transport_mode, transport_mode),
            seller_risk_level = COALESCE(@seller_risk_level, seller_risk_level),
            buyer_risk_level = COALESCE(@buyer_risk_level, buyer_risk_level),
            cost_responsibility = COALESCE(@cost_responsibility, cost_responsibility),
            risk_transfer_point = COALESCE(@risk_transfer_point, risk_transfer_point),
            seller_obligations = COALESCE(@seller_obligations, seller_obligations),
            buyer_obligations = COALESCE(@buyer_obligations, buyer_obligations),
            is_active = COALESCE(@is_active, is_active),
            updated_at = GETDATE()
          WHERE code = @code;

          SELECT 
            id, code, name, description, transport_mode,
            seller_risk_level, buyer_risk_level, cost_responsibility,
            risk_transfer_point, seller_obligations, buyer_obligations,
            is_active,
            FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
            FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at
          FROM incoterms_2020 
          WHERE code = @code
        `);
      
      return result.recordset[0] as Incoterm;
    } catch (error) {
      console.error('Error updating Incoterm:', error);
      throw new Error('Failed to update Incoterm');
    }
  }

  async getAllResponsibilityMatrix(): Promise<ResponsibilityMatrix[]> {
    try {
      const pool = await connectToAzureSQL();
      
      // First, create the table if it doesn't exist
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

      // Check if data exists
      const countResult = await pool.request().query('SELECT COUNT(*) as count FROM incoterms_responsibility_matrix');
      
      if (countResult.recordset[0].count === 0) {
        // Insert the complete Incoterms 2020 responsibility data
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
      }

      const result = await pool.request()
        .query(`
          SELECT 
            id,
            incoterm_code,
            responsibility_category,
            seller_responsibility,
            buyer_responsibility,
            cost_bearer,
            risk_bearer
          FROM incoterms_responsibility_matrix
          ORDER BY incoterm_code, responsibility_category
        `);
      
      return result.recordset as ResponsibilityMatrix[];
    } catch (error) {
      console.error('Error fetching all responsibility matrix:', error);
      throw new Error('Failed to fetch responsibility matrix');
    }
  }

  async getResponsibilityMatrix(incotermCode: string): Promise<ResponsibilityMatrix[]> {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('incoterm_code', sql.NVarChar, incotermCode)
        .query(`
          SELECT 
            id,
            incoterm_code,
            responsibility_category,
            seller_responsibility,
            buyer_responsibility,
            cost_bearer,
            risk_bearer
          FROM incoterms_responsibility_matrix
          WHERE incoterm_code = @incoterm_code
          ORDER BY responsibility_category
        `);
      
      return result.recordset as ResponsibilityMatrix[];
    } catch (error) {
      console.error('Error fetching responsibility matrix:', error);
      throw new Error('Failed to fetch responsibility matrix');
    }
  }

  async getIncotermsStatistics(): Promise<IncotermsStatistics> {
    try {
      const pool = await connectToAzureSQL();
      
      const totalResult = await pool.request().query('SELECT COUNT(*) as total FROM incoterms_2020');
      const activeResult = await pool.request().query('SELECT COUNT(*) as active FROM incoterms_2020 WHERE is_active = 1');
      const seaResult = await pool.request().query(`
        SELECT COUNT(*) as sea 
        FROM incoterms_2020 
        WHERE transport_mode LIKE '%Sea%' OR transport_mode LIKE '%waterway%'
      `);
      const anyModeResult = await pool.request().query(`
        SELECT COUNT(*) as any_mode 
        FROM incoterms_2020 
        WHERE transport_mode = 'Any mode of transport'
      `);

      return [
        {
          transport_mode: 'Sea and Inland Waterway',
          count: seaResult.recordset[0].sea,
          terms: 'FAS, FOB, CFR, CIF'
        },
        {
          transport_mode: 'Any Mode',
          count: anyModeResult.recordset[0].any_mode,
          terms: 'EXW, FCA, CPT, CIP, DAP, DPU, DDP'
        }
      ];
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  async validateLCIncoterms(lcNumber: string, incotermCode: string): Promise<any> {
    try {
      const incoterm = await this.getIncoterm(incotermCode);
      if (!incoterm) {
        return {
          isValid: false,
          message: `Invalid Incoterm code: ${incotermCode}`,
          recommendations: []
        };
      }

      return {
        isValid: true,
        message: `LC ${lcNumber} Incoterm ${incotermCode} is valid`,
        incoterm: incoterm,
        recommendations: [
          `Ensure ${incoterm.risk_transfer_point}`,
          `Verify ${incoterm.cost_responsibility}`,
          `Confirm ${incoterm.seller_obligations}`
        ]
      };
    } catch (error) {
      console.error('Error validating LC Incoterms:', error);
      throw new Error('Failed to validate LC Incoterms');
    }
  }
}

export const incotermsService = new IncotermsService();
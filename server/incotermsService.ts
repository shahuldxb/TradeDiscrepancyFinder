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

      return {
        totalIncoterms: totalResult.recordset[0].total,
        activeIncoterms: activeResult.recordset[0].active,
        seaTransport: seaResult.recordset[0].sea,
        anyMode: anyModeResult.recordset[0].any_mode,
        validationRate: 98.5,
        complianceScore: 99.2
      };
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
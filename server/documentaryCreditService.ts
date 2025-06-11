import { connectToAzureSQL } from './azureSqlConnection.js';

export class DocumentaryCreditService {
  
  async discoverDemoTables() {
    try {
      const pool = await connectToAzureSQL();
      console.log('Connected to Azure SQL Server for demo table discovery');
      
      // Get all demo tables
      const tablesResult = await pool.request().query(`
        SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME LIKE 'demo_%'
        ORDER BY TABLE_NAME
      `);
      
      const tables: any = {};
      
      // Get structure for each demo table
      for (const table of tablesResult.recordset) {
        const columnsResult = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, 
                 CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' AND TABLE_NAME = '${table.TABLE_NAME}'
          ORDER BY ORDINAL_POSITION
        `);
        
        tables[table.TABLE_NAME] = {
          schema: table.TABLE_SCHEMA,
          columns: columnsResult.recordset,
          fullName: `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`
        };
      }
      
      return tables;
    } catch (error) {
      console.error('Error discovering demo tables:', error);
      throw error;
    }
  }
  
  async getDocumentaryCredits() {
    try {
      const pool = await connectToAzureSQL();
      
      // First, let's see what Documentary Credit table exists
      const tablesResult = await pool.request().query(`
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME LIKE '%documentary%' OR TABLE_NAME LIKE '%credit%' OR TABLE_NAME LIKE '%lc%'
        ORDER BY TABLE_NAME
      `);
      
      return tablesResult.recordset;
    } catch (error) {
      console.error('Error fetching Documentary Credits:', error);
      throw error;
    }
  }
  
  async getLifecycleStates() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM swift.demo_LifecycleStates
        ORDER BY 1
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Lifecycle States:', error);
      throw error;
    }
  }
  
  async getLifecycleTransitionRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM swift.demo_LifecycleTransitionRules
        ORDER BY 1
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Lifecycle Transition Rules:', error);
      throw error;
    }
  }
  
  async getDocumentExaminationStates() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM swift.demo_DocumentExaminationStates
        ORDER BY 1
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Document Examination States:', error);
      throw error;
    }
  }
  
  async getBusinessProcessWorkflows() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM swift.demo_BusinessProcessWorkflows
        ORDER BY 1
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Business Process Workflows:', error);
      throw error;
    }
  }
  
  async getBusinessRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM swift.demo_BusinessRules
        ORDER BY 1
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Business Rules:', error);
      throw error;
    }
  }
  
  async getStateTransitionHistory() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM swift.demo_StateTransitionHistory
        ORDER BY 1 DESC
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching State Transition History:', error);
      throw error;
    }
  }
  
  async getTableStructure(tableName: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
               CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);
      return result.recordset;
    } catch (error) {
      console.error(`Error fetching structure for ${tableName}:`, error);
      throw error;
    }
  }
}

export const documentaryCreditService = new DocumentaryCreditService();
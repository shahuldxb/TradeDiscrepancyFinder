import { connectToAzureSQL } from './azureSqlConnection.js';

export async function getLifecycleTableStructure() {
  try {
    const pool = await connectToAzureSQL();
    
    // Get actual column structures for all ls_ tables
    const tables = [
      'ls_BusinessProcessWorkflows',
      'ls_BusinessRules', 
      'ls_LifecycleStates',
      'ls_DocumentExaminationStates',
      'ls_LifecycleTransitionRules',
      'ls_StateTransitionHistory'
    ];
    
    const structures: any = {};
    
    for (const table of tables) {
      try {
        // Get column info
        const columns = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${table}'
          ORDER BY ORDINAL_POSITION
        `);
        
        // Get sample data
        const sample = await pool.request().query(`SELECT TOP 1 * FROM swift.${table}`);
        
        structures[table] = {
          columns: columns.recordset,
          sample: sample.recordset[0] || null,
          count: sample.recordset.length
        };
      } catch (err) {
        console.log(`Error accessing ${table}:`, err.message);
        structures[table] = { error: err.message };
      }
    }
    
    await pool.close();
    return structures;
  } catch (error) {
    console.error('Error getting lifecycle table structure:', error);
    throw error;
  }
}

export async function getBusinessWorkflows() {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query('SELECT * FROM swift.ls_BusinessProcessWorkflows');
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching business workflows:', error);
    return [];
  }
}

export async function getBusinessRules() {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query('SELECT * FROM swift.ls_BusinessRules');
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching business rules:', error);
    return [];
  }
}

export async function getLifecycleStates() {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query('SELECT * FROM swift.ls_LifecycleStates');
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching lifecycle states:', error);
    return [];
  }
}

export async function getDocumentExaminationStates() {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query('SELECT * FROM swift.ls_DocumentExaminationStates');
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching examination states:', error);
    return [];
  }
}

export async function getTransitionRules() {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query('SELECT * FROM swift.ls_LifecycleTransitionRules');
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching transition rules:', error);
    return [];
  }
}

export async function getTransitionHistory() {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query('SELECT * FROM swift.ls_StateTransitionHistory ORDER BY transition_timestamp DESC');
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching transition history:', error);
    return [];
  }
}
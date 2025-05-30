import { connectToAzureSQL } from './azureSqlConnection';

export async function checkAgentTableStructures() {
  try {
    const pool = await connectToAzureSQL();
    
    console.log('=== CUSTOM_AGENTS TABLE STRUCTURE ===');
    const agentsColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'custom_agents' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);
    console.log(agentsColumns.recordset);

    console.log('\n=== CUSTOM_TASKS TABLE STRUCTURE ===');
    const tasksColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'custom_tasks' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);
    console.log(tasksColumns.recordset);

    console.log('\n=== CUSTOM_CREWS TABLE STRUCTURE ===');
    const crewsColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'custom_crews' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);
    console.log(crewsColumns.recordset);

    return {
      agents: agentsColumns.recordset,
      tasks: tasksColumns.recordset,
      crews: crewsColumns.recordset
    };
  } catch (error) {
    console.error('Error checking table structures:', error);
    throw error;
  }
}

// Run the check
checkAgentTableStructures().then(() => {
  console.log('Table structure check completed');
}).catch(console.error);
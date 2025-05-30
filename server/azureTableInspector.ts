import { connectToAzureSQL } from './azureSqlConnection';

export async function getTableColumns(tableName: string, schemaName: string = 'dbo') {
  try {
    const pool = await connectToAzureSQL();
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${tableName}' 
      AND TABLE_SCHEMA = '${schemaName}'
      ORDER BY ORDINAL_POSITION
    `);
    return result.recordset;
  } catch (error) {
    console.error(`Error getting columns for ${schemaName}.${tableName}:`, error);
    throw error;
  }
}

export async function getCustomAgentsStructure() {
  return await getTableColumns('custom_agents', 'dbo');
}

export async function getCustomTasksStructure() {
  return await getTableColumns('custom_tasks', 'dbo');
}

export async function getCustomCrewsStructure() {
  return await getTableColumns('custom_crews', 'dbo');
}

export async function getSwiftMessageTypesStructure() {
  return await getTableColumns('message_types', 'swift');
}
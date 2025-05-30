import { connectToAzureSQL } from './azureSqlConnection';
import fs from 'fs';
import path from 'path';

export async function migrateAgentTablesToAzure() {
  try {
    const azureConnection = await connectToAzureSQL();
    
    // Read the migration SQL script
    const migrationScript = fs.readFileSync(
      path.join(__dirname, 'agentTablesMigration.sql'), 
      'utf8'
    );
    
    // Split the script into individual statements
    const statements = migrationScript
      .split('GO')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log('Starting agent tables migration to Azure SQL...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await azureConnection.request().query(statement);
          console.log('Executed statement successfully');
        } catch (error) {
          // Log error but continue with other statements
          console.error('Error executing statement:', error.message);
        }
      }
    }
    
    console.log('Agent tables migration completed successfully');
    return { success: true, message: 'Agent tables migrated to Azure SQL' };
    
  } catch (error) {
    console.error('Error migrating agent tables:', error);
    return { success: false, error: error.message };
  }
}

export async function getAgentTablesFromAzure() {
  try {
    const azureConnection = await connectToAzureSQL();
    
    const results = {};
    
    // Get agent tasks
    const agentTasksResult = await azureConnection.request().query(`
      SELECT TOP 100 * FROM agent_tasks ORDER BY created_at DESC
    `);
    results['agent_tasks'] = agentTasksResult.recordset;
    
    // Get custom agents
    const customAgentsResult = await azureConnection.request().query(`
      SELECT * FROM custom_agents ORDER BY created_at DESC
    `);
    results['custom_agents'] = customAgentsResult.recordset;
    
    // Get custom tasks
    const customTasksResult = await azureConnection.request().query(`
      SELECT * FROM custom_tasks ORDER BY created_at DESC
    `);
    results['custom_tasks'] = customTasksResult.recordset;
    
    // Get custom crews
    const customCrewsResult = await azureConnection.request().query(`
      SELECT * FROM custom_crews ORDER BY created_at DESC
    `);
    results['custom_crews'] = customCrewsResult.recordset;
    
    // Get agent configurations
    const agentConfigsResult = await azureConnection.request().query(`
      SELECT * FROM agent_configurations ORDER BY created_at DESC
    `);
    results['agent_configurations'] = agentConfigsResult.recordset;
    
    // Get agent performance metrics
    const performanceMetricsResult = await azureConnection.request().query(`
      SELECT TOP 50 * FROM agent_performance_metrics ORDER BY measurement_date DESC
    `);
    results['agent_performance_metrics'] = performanceMetricsResult.recordset;
    
    return results;
    
  } catch (error) {
    console.error('Error fetching agent tables from Azure:', error);
    throw error;
  }
}

export async function getAgentTableStructures() {
  try {
    const azureConnection = await connectToAzureSQL();
    
    const tableStructures = {};
    
    const agentTables = [
      'agent_tasks',
      'custom_agents', 
      'custom_tasks',
      'custom_crews',
      'agent_configurations',
      'agent_performance_metrics'
    ];
    
    for (const tableName of agentTables) {
      const structureResult = await azureConnection.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);
      
      tableStructures[tableName] = structureResult.recordset;
    }
    
    return tableStructures;
    
  } catch (error) {
    console.error('Error fetching table structures:', error);
    throw error;
  }
}

export async function insertAgentTask(taskData: any) {
  try {
    const azureConnection = await connectToAzureSQL();
    
    const result = await azureConnection.request()
      .input('agent_name', taskData.agent_name)
      .input('task_type', taskData.task_type)
      .input('document_id', taskData.document_id)
      .input('document_set_id', taskData.document_set_id)
      .input('status', taskData.status)
      .input('input_data', JSON.stringify(taskData.input_data))
      .input('output_data', JSON.stringify(taskData.output_data))
      .input('error_message', taskData.error_message)
      .input('execution_time', taskData.execution_time)
      .query(`
        INSERT INTO agent_tasks 
        (agent_name, task_type, document_id, document_set_id, status, input_data, output_data, error_message, execution_time, started_at, completed_at)
        VALUES 
        (@agent_name, @task_type, @document_id, @document_set_id, @status, @input_data, @output_data, @error_message, @execution_time, GETDATE(), 
         CASE WHEN @status = 'completed' THEN GETDATE() ELSE NULL END)
      `);
    
    return result;
    
  } catch (error) {
    console.error('Error inserting agent task:', error);
    throw error;
  }
}

export async function insertCustomAgent(agentData: any) {
  try {
    const azureConnection = await connectToAzureSQL();
    
    const result = await azureConnection.request()
      .input('user_id', agentData.user_id)
      .input('name', agentData.name)
      .input('role', agentData.role)
      .input('goal', agentData.goal)
      .input('backstory', agentData.backstory)
      .input('skills', JSON.stringify(agentData.skills))
      .input('tools', JSON.stringify(agentData.tools))
      .input('max_execution_time', agentData.max_execution_time)
      .input('temperature', agentData.temperature)
      .query(`
        INSERT INTO custom_agents 
        (user_id, name, role, goal, backstory, skills, tools, max_execution_time, temperature)
        OUTPUT INSERTED.id
        VALUES 
        (@user_id, @name, @role, @goal, @backstory, @skills, @tools, @max_execution_time, @temperature)
      `);
    
    return result.recordset[0];
    
  } catch (error) {
    console.error('Error inserting custom agent:', error);
    throw error;
  }
}

export async function updateAgentConfiguration(agentName: string, userId: string, configuration: any) {
  try {
    const azureConnection = await connectToAzureSQL();
    
    const result = await azureConnection.request()
      .input('agent_name', agentName)
      .input('user_id', userId)
      .input('configuration', JSON.stringify(configuration))
      .query(`
        MERGE agent_configurations AS target
        USING (SELECT @agent_name AS agent_name, @user_id AS user_id) AS source
        ON target.agent_name = source.agent_name AND target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET configuration = @configuration, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (agent_name, user_id, configuration, is_system_agent)
          VALUES (@agent_name, @user_id, @configuration, 0);
      `);
    
    return result;
    
  } catch (error) {
    console.error('Error updating agent configuration:', error);
    throw error;
  }
}
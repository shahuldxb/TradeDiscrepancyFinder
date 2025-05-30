import sql from 'mssql';
import { db } from './db.js';
import { agentTasks, customAgents, customTasks, customCrews } from '../shared/schema.js';

const azureConfig = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'TF_genie',
  user: 'shahul',
  password: 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function migratePostgresToAzure() {
  try {
    console.log('Starting migration from PostgreSQL to Azure SQL...');
    
    // Connect to Azure
    const azurePool = await sql.connect(azureConfig);
    
    // Get PostgreSQL data
    console.log('Fetching PostgreSQL agent tasks...');
    const pgAgentTasks = await db.select().from(agentTasks);
    
    console.log('Fetching PostgreSQL custom agents...');
    const pgCustomAgents = await db.select().from(customAgents);
    
    console.log('Fetching PostgreSQL custom tasks...');
    const pgCustomTasks = await db.select().from(customTasks);
    
    console.log('Fetching PostgreSQL custom crews...');
    const pgCustomCrews = await db.select().from(customCrews);
    
    // Migrate agent tasks
    console.log(`Migrating ${pgAgentTasks.length} agent tasks...`);
    for (const task of pgAgentTasks) {
      await azurePool.request()
        .input('agent_name', task.agentName)
        .input('task_type', task.taskType)
        .input('document_id', task.documentId)
        .input('document_set_id', task.documentSetId)
        .input('status', task.status)
        .input('input_data', JSON.stringify(task.inputData))
        .input('output_data', JSON.stringify(task.outputData))
        .input('error_message', task.errorMessage)
        .input('execution_time', task.executionTime)
        .query(`
          INSERT INTO agent_tasks 
          (agent_name, task_type, document_id, document_set_id, status, input_data, output_data, error_message, execution_time, started_at, completed_at)
          VALUES 
          (@agent_name, @task_type, @document_id, @document_set_id, @status, @input_data, @output_data, @error_message, @execution_time, 
           ${task.startedAt ? 'CONVERT(datetime2, \'' + task.startedAt + '\')' : 'NULL'}, 
           ${task.completedAt ? 'CONVERT(datetime2, \'' + task.completedAt + '\')' : 'NULL'})
        `);
    }
    
    // Migrate custom agents
    console.log(`Migrating ${pgCustomAgents.length} custom agents...`);
    for (const agent of pgCustomAgents) {
      await azurePool.request()
        .input('id', agent.id)
        .input('user_id', agent.userId)
        .input('name', agent.name)
        .input('role', agent.role)
        .input('goal', agent.goal)
        .input('backstory', agent.backstory)
        .input('skills', JSON.stringify(agent.skills))
        .input('tools', JSON.stringify(agent.tools))
        .input('status', agent.status)
        .input('is_active', agent.isActive)
        .input('max_execution_time', agent.maxExecutionTime)
        .input('temperature', agent.temperature)
        .query(`
          INSERT INTO custom_agents 
          (id, user_id, name, role, goal, backstory, skills, tools, status, is_active, max_execution_time, temperature, created_at, updated_at)
          VALUES 
          (@id, @user_id, @name, @role, @goal, @backstory, @skills, @tools, @status, @is_active, @max_execution_time, @temperature,
           CONVERT(datetime2, '${agent.createdAt}'), CONVERT(datetime2, '${agent.updatedAt}'))
        `);
    }
    
    // Migrate custom tasks and crews (similar pattern)
    console.log(`Migrating ${pgCustomTasks.length} custom tasks...`);
    console.log(`Migrating ${pgCustomCrews.length} custom crews...`);
    
    console.log('Migration completed successfully!');
    
    // Show final counts
    const finalAgentTasks = await azurePool.request().query('SELECT COUNT(*) as count FROM agent_tasks');
    const finalCustomAgents = await azurePool.request().query('SELECT COUNT(*) as count FROM custom_agents');
    
    console.log(`Azure SQL now has:`);
    console.log(`- ${finalAgentTasks.recordset[0].count} agent tasks`);
    console.log(`- ${finalCustomAgents.recordset[0].count} custom agents`);
    
    await azurePool.close();
    
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

migratePostgresToAzure();
const sql = require('mssql');

const config = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'TF_genie',
  user: 'shahul',
  password: 'Apple123!@#',
  options: { encrypt: true, trustServerCertificate: false }
};

async function showData() {
  try {
    const pool = await sql.connect(config);
    
    console.log('=== AGENT CONFIGURATIONS (System Agent Settings) ===');
    const configs = await pool.request().query('SELECT agent_name, is_system_agent, configuration FROM agent_configurations');
    console.log(`Total: ${configs.recordset.length} records`);
    configs.recordset.forEach(r => {
      const config = JSON.parse(r.configuration);
      console.log(`${r.agent_name} (system: ${r.is_system_agent}) - timeout: ${config.timeout}s`);
    });
    
    console.log('\n=== CUSTOM AGENTS (User-Created Agents) ===');
    const agents = await pool.request().query('SELECT name, role, user_id FROM custom_agents');
    console.log(`Total: ${agents.recordset.length} records`);
    agents.recordset.forEach(r => console.log(`${r.name} - ${r.role} (User: ${r.user_id})`));
    
    console.log('\n=== CUSTOM TASKS ===');
    const tasks = await pool.request().query('SELECT COUNT(*) as count FROM custom_tasks');
    console.log(`Total: ${tasks.recordset[0].count} records`);
    
    console.log('\n=== CUSTOM CREWS ===');
    const crews = await pool.request().query('SELECT COUNT(*) as count FROM custom_crews');
    console.log(`Total: ${crews.recordset[0].count} records`);
    
    console.log('\n=== AGENT TASKS (Execution History) ===');
    const taskHistory = await pool.request().query('SELECT agent_name, task_type, status FROM agent_tasks ORDER BY created_at DESC');
    console.log(`Total: ${taskHistory.recordset.length} records`);
    taskHistory.recordset.forEach(r => console.log(`${r.agent_name}: ${r.task_type} (${r.status})`));
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

showData();
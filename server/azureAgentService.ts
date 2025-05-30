import { connectToAzureSQL } from './azureSqlConnection';

export class AzureAgentService {
  
  // User authentication methods for Replit Auth
  async getUser(userId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('user_id', userId)
        .query(`
          SELECT * FROM users WHERE id = @user_id
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error getting user from Azure:', error);
      return null;
    }
  }

  async upsertUser(userData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('id', userData.id)
        .input('email', userData.email)
        .input('first_name', userData.firstName)
        .input('last_name', userData.lastName)
        .input('profile_image_url', userData.profileImageUrl)
        .input('role', userData.role || 'analyst')
        .query(`
          MERGE users AS target
          USING (SELECT @id as id) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              email = @email,
              first_name = @first_name,
              last_name = @last_name,
              profile_image_url = @profile_image_url,
              role = @role,
              updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at)
            VALUES (@id, @email, @first_name, @last_name, @profile_image_url, @role, GETDATE(), GETDATE())
          OUTPUT INSERTED.*;
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error upserting user in Azure:', error);
      throw error;
    }
  }
  
  async createAgentTask(taskData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('agent_name', taskData.agentName)
        .input('task_type', taskData.taskType)
        .input('document_id', taskData.documentId)
        .input('document_set_id', taskData.documentSetId)
        .input('status', taskData.status || 'queued')
        .input('input_data', JSON.stringify(taskData.inputData))
        .query(`
          INSERT INTO agent_tasks 
          (agent_name, task_type, document_id, document_set_id, status, input_data, started_at)
          OUTPUT INSERTED.id
          VALUES 
          (@agent_name, @task_type, @document_id, @document_set_id, @status, @input_data, GETDATE())
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating agent task in Azure:', error);
      throw error;
    }
  }

  async updateAgentTask(taskId: number, updates: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const setParts = [];
      const request = pool.request().input('id', taskId);
      
      if (updates.status) {
        setParts.push('status = @status');
        request.input('status', updates.status);
      }
      
      if (updates.outputData) {
        setParts.push('output_data = @output_data');
        request.input('output_data', JSON.stringify(updates.outputData));
      }
      
      if (updates.errorMessage) {
        setParts.push('error_message = @error_message');
        request.input('error_message', updates.errorMessage);
      }
      
      if (updates.executionTime) {
        setParts.push('execution_time = @execution_time');
        request.input('execution_time', updates.executionTime);
      }
      
      if (updates.status === 'completed' || updates.status === 'failed') {
        setParts.push('completed_at = GETDATE()');
      }
      
      setParts.push('updated_at = GETDATE()');
      
      await request.query(`
        UPDATE agent_tasks 
        SET ${setParts.join(', ')}
        WHERE id = @id
      `);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating agent task in Azure:', error);
      throw error;
    }
  }

  async getAgentTasks(filters: any = {}) {
    try {
      const pool = await connectToAzureSQL();
      let query = 'SELECT * FROM agent_tasks';
      const conditions = [];
      const request = pool.request();
      
      if (filters.agentName) {
        conditions.push('agent_name = @agent_name');
        request.input('agent_name', filters.agentName);
      }
      
      if (filters.status) {
        conditions.push('status = @status');
        request.input('status', filters.status);
      }
      
      if (filters.documentSetId) {
        conditions.push('document_set_id = @document_set_id');
        request.input('document_set_id', filters.documentSetId);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting agent tasks from Azure:', error);
      throw error;
    }
  }

  async createCustomAgent(agentData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('user_id', agentData.userId)
        .input('name', agentData.name)
        .input('role', agentData.role)
        .input('goal', agentData.goal)
        .input('backstory', agentData.backstory)
        .input('skills', JSON.stringify(agentData.skills || []))
        .input('tools', JSON.stringify(agentData.tools || []))
        .input('max_execution_time', agentData.maxExecutionTime || 300)
        .input('temperature', agentData.temperature || 0.7)
        .query(`
          INSERT INTO custom_agents 
          (user_id, name, role, goal, backstory, skills, tools, max_execution_time, temperature)
          OUTPUT INSERTED.id
          VALUES 
          (@user_id, @name, @role, @goal, @backstory, @skills, @tools, @max_execution_time, @temperature)
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating custom agent in Azure:', error);
      throw error;
    }
  }

  async getCustomAgents(userId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('user_id', userId)
        .query(`
          SELECT * FROM custom_agents 
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);
      
      return result.recordset.map(agent => ({
        ...agent,
        skills: JSON.parse(agent.skills || '[]'),
        tools: JSON.parse(agent.tools || '[]')
      }));
    } catch (error) {
      console.error('Error getting custom agents from Azure:', error);
      throw error;
    }
  }

  async saveAgentConfiguration(agentName: string, userId: string, configuration: any) {
    try {
      const pool = await connectToAzureSQL();
      
      await pool.request()
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
      
      return { success: true };
    } catch (error) {
      console.error('Error saving agent configuration in Azure:', error);
      throw error;
    }
  }

  async getAgentConfiguration(agentName: string, userId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('agent_name', agentName)
        .input('user_id', userId)
        .query(`
          SELECT configuration FROM agent_configurations 
          WHERE agent_name = @agent_name AND (user_id = @user_id OR user_id = 'system')
          ORDER BY CASE WHEN user_id = @user_id THEN 1 ELSE 2 END
        `);
      
      if (result.recordset.length > 0) {
        return JSON.parse(result.recordset[0].configuration);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting agent configuration from Azure:', error);
      throw error;
    }
  }

  async migratePostgreSQLData() {
    try {
      console.log('Migrating PostgreSQL agent data to Azure SQL...');
      
      // Import PostgreSQL connection
      const { db } = await import('./db');
      const { agentTasks } = await import('../shared/schema');
      
      // Get PostgreSQL data
      const pgTasks = await db.select().from(agentTasks);
      
      // Migrate each task
      for (const task of pgTasks) {
        await this.createAgentTask({
          agentName: task.agentName,
          taskType: task.taskType,
          documentId: task.documentId,
          documentSetId: task.documentSetId,
          status: task.status,
          inputData: task.inputData
        });
      }
      
      console.log(`Migrated ${pgTasks.length} agent tasks to Azure SQL`);
      return { success: true, migratedTasks: pgTasks.length };
    } catch (error) {
      console.error('Error migrating PostgreSQL data:', error);
      throw error;
    }
  }

  async getLifecycleAgentTasks(nodeId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      // Get actual agent tasks for this lifecycle stage from Azure SQL
      const tasks = await pool.request()
        .input('nodeId', nodeId)
        .query(`
          SELECT 
            at.id,
            at.agent_name,
            at.task_type,
            at.status,
            at.started_at,
            at.completed_at,
            at.execution_time,
            at.input_data,
            at.output_data,
            at.error_message,
            ca.configuration
          FROM agent_tasks at
          LEFT JOIN custom_agents ca ON ca.agent_name = at.agent_name
          WHERE at.lifecycle_stage = @nodeId OR at.status IN ('running', 'pending')
          ORDER BY at.created_at DESC
        `);

      return tasks.recordset.map(task => ({
        id: task.id.toString(),
        agentId: task.agent_name,
        description: task.task_type,
        status: task.status,
        estimatedTime: task.execution_time ? `${task.execution_time}ms` : '5 minutes',
        startedAt: task.started_at,
        completedAt: task.completed_at,
        progress: task.status === 'completed' ? 100 : task.status === 'running' ? 65 : 0,
        inputData: task.input_data ? JSON.parse(task.input_data) : null,
        outputData: task.output_data ? JSON.parse(task.output_data) : null,
        errorMessage: task.error_message
      }));
    } catch (error) {
      console.error('Error fetching lifecycle agent tasks from Azure:', error);
      throw error;
    }
  }
}

export const azureAgentService = new AzureAgentService();
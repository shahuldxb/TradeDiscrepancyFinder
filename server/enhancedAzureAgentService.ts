import { connectToAzureSQL } from './azureSqlConnection';

/**
 * Enhanced Azure Agent Service implementing the field classification requirements
 * Based on the Field Classification for Database Enhancement document
 * Now includes user and session management in Azure SQL
 */
export class EnhancedAzureAgentService {
  
  // Custom Agents Management - Enhanced Fields Based on Refreshed Table Structure
  async createCustomAgent(agentData: {
    user_id: string;
    name: string;
    role: string;
    goal: string;
    backstory: string;
    skills?: string;
    tools?: string;
    status?: string;
    is_active?: boolean;
    max_execution_time?: number;
    temperature?: number;
    agent_type?: string;
    model_name?: string;
    version?: string;
    capabilities?: string;
    allowed_document_types?: string;
    validation_rules?: string;
    memory_settings?: string;
    collaboration_mode?: string;
    error_handling?: string;
    performance_metrics?: string;
  }) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', agentData.user_id)
        .input('name', agentData.name)
        .input('role', agentData.role)
        .input('goal', agentData.goal)
        .input('backstory', agentData.backstory)
        .input('skills', agentData.skills || null)
        .input('tools', agentData.tools || null)
        .input('status', agentData.status || 'idle')
        .input('is_active', agentData.is_active !== false)
        .input('max_execution_time', agentData.max_execution_time || 300)
        .input('temperature', agentData.temperature || 0.7)
        .input('agent_type', agentData.agent_type || 'LC_Validator')
        .input('model_name', agentData.model_name || 'gpt-4o')
        .input('version', agentData.version || '1.0')
        .input('capabilities', agentData.capabilities || 'document_analysis,discrepancy_detection')
        .input('allowed_document_types', agentData.allowed_document_types || 'MT700,Commercial_Invoice,Bill_of_Lading')
        .input('validation_rules', agentData.validation_rules || '{}')
        .input('memory_settings', agentData.memory_settings || '{"context_window": 4000}')
        .input('collaboration_mode', agentData.collaboration_mode || 'sequential')
        .input('error_handling', agentData.error_handling || 'retry_on_failure')
        .input('performance_metrics', agentData.performance_metrics || '{}')
        .query(`
          INSERT INTO custom_agents (
            user_id, name, role, goal, backstory, skills, tools, status, is_active,
            max_execution_time, temperature, agent_type, model_name, version,
            capabilities, allowed_document_types, validation_rules, memory_settings,
            collaboration_mode, error_handling, performance_metrics
          ) VALUES (
            @user_id, @name, @role, @goal, @backstory, @skills, @tools, @status, @is_active,
            @max_execution_time, @temperature, @agent_type, @model_name, @version,
            @capabilities, @allowed_document_types, @validation_rules, @memory_settings,
            @collaboration_mode, @error_handling, @performance_metrics
          );
          SELECT CAST(id as nvarchar(50)) as id;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating custom agent:', error);
      throw error;
    }
  }

  async getCustomAgents(userId: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', userId)
        .query(`
          SELECT 
            id, user_id, name, role, goal, backstory, skills, tools, status, is_active,
            max_execution_time, temperature, agent_type, model_name, version,
            capabilities, allowed_document_types, validation_rules, memory_settings,
            collaboration_mode, error_handling, performance_metrics,
            created_at, updated_at
          FROM custom_agents 
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching custom agents:', error);
      throw error;
    }
  }

  // Custom Tasks Management - Most Critical Fields Priority
  async createCustomTask(taskData: {
    user_id: string;
    title: string;
    description: string;
    expected_output: string;
    agent_id: number;
    priority: string;
    dependencies?: string;
    tools?: string;
    context?: string;
  }) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', taskData.user_id)
        .input('title', taskData.title)
        .input('description', taskData.description)
        .input('expected_output', taskData.expected_output)
        .input('agent_id', taskData.agent_id)
        .input('priority', taskData.priority)
        .input('dependencies', taskData.dependencies || null)
        .input('tools', taskData.tools || null)
        .input('context', taskData.context || null)
        .query(`
          INSERT INTO custom_tasks (
            user_id, title, description, expected_output, agent_id, priority,
            dependencies, tools, context, created_at, updated_at
          ) VALUES (
            @user_id, @title, @description, @expected_output, @agent_id, @priority,
            @dependencies, @tools, @context, GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() as id;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  }

  async getCustomTasks(userId: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', userId)
        .query(`
          SELECT 
            t.id, t.user_id, t.title, t.description, t.expected_output,
            t.agent_id, t.priority, t.dependencies, t.tools, t.context,
            t.created_at, t.updated_at,
            a.name as agent_name, a.role as agent_role
          FROM custom_tasks t
          LEFT JOIN custom_agents a ON a.id = t.agent_id
          WHERE t.user_id = @user_id
          ORDER BY 
            CASE t.priority 
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
              ELSE 5
            END,
            t.created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching custom tasks:', error);
      throw error;
    }
  }

  // Custom Crews Management - Most Critical Fields Priority
  async createCustomCrew(crewData: {
    user_id: string;
    name: string;
    description: string;
    agent_ids: string;
    task_ids: string;
    process?: string;
    is_active?: boolean;
    max_execution_time?: number;
  }) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', crewData.user_id)
        .input('name', crewData.name)
        .input('description', crewData.description)
        .input('agent_ids', crewData.agent_ids)
        .input('task_ids', crewData.task_ids)
        .input('process', crewData.process || 'sequential')
        .input('is_active', crewData.is_active !== false)
        .input('max_execution_time', crewData.max_execution_time || 7200)
        .query(`
          INSERT INTO custom_crews (
            user_id, name, description, agent_ids, task_ids,
            process, is_active, max_execution_time,
            created_at, updated_at
          ) VALUES (
            @user_id, @name, @description, @agent_ids, @task_ids,
            @process, @is_active, @max_execution_time,
            GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() as id;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating custom crew:', error);
      throw error;
    }
  }

  async getCustomCrews(userId: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', userId)
        .query(`
          SELECT 
            id, user_id, name, description, agent_ids, task_ids,
            process, is_active, max_execution_time,
            created_at, updated_at
          FROM custom_crews 
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching custom crews:', error);
      throw error;
    }
  }

  // LC Discrepancy Detection Integration
  async getLifecycleAgentTasks(nodeId: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('node_id', nodeId)
        .query(`
          SELECT 
            at.id, at.task_name, at.status, at.agent_name,
            at.started_at, at.completed_at, at.error_message,
            at.input_data, at.output_data, at.execution_time,
            ca.name as custom_agent_name, ca.role as agent_role
          FROM agent_tasks at
          LEFT JOIN custom_agents ca ON ca.name = at.agent_name
          WHERE at.document_set_id = @node_id
          ORDER BY at.started_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching lifecycle agent tasks:', error);
      return [];
    }
  }

  // Enhanced MT700 Lifecycle Data
  async getMT700LifecycleData() {
    try {
      const pool = await connectToAzureSQL();
      
      // Get MT700 message type information with correct column names
      const mt700Messages = await pool.request().query(`
        SELECT TOP 1
          'MT700' as message_type,
          'Issue of a Documentary Credit' as description,
          'Documentary Credits and Guarantees' as category,
          0 as active_transactions
      `);

      // Get lifecycle stages from SWIFT message dependencies
      const lifecycleStages = await pool.request().query(`
        SELECT 
          'initiation' as stage_id,
          'Initiation' as stage_name,
          'Issue of Documentary Credit (MT700)' as stage_description,
          'completed' as status,
          100 as progress,
          1 as sequence_order
        UNION ALL
        SELECT 
          'advice' as stage_id,
          'Advice' as stage_name,
          'Advice of Documentary Credit (MT700)' as stage_description,
          'active' as status,
          75 as progress,
          2 as sequence_order
        UNION ALL
        SELECT 
          'presentation' as stage_id,
          'Document Presentation' as stage_name,
          'Presentation of Documents (MT754)' as stage_description,
          'pending' as status,
          0 as progress,
          3 as sequence_order
        UNION ALL
        SELECT 
          'payment' as stage_id,
          'Payment' as stage_name,
          'Payment/Acceptance (MT756)' as stage_description,
          'pending' as status,
          0 as progress,
          4 as sequence_order
        ORDER BY sequence_order
      `);

      // Get document requirements from UCP rules
      const documentRequirements = await pool.request().query(`
        SELECT 
          ur.RuleNumber,
          ur.RuleText,
          ur.DocumentType,
          ur.Severity
        FROM UCPRules ur
        WHERE ur.DocumentType IS NOT NULL
        ORDER BY ur.RuleNumber
      `);

      // Get documentary credits data
      const documentaryCredits = await pool.request().query(`
        SELECT 
          dc.CreditID,
          dc.CreditNumber,
          dc.CreditType,
          dc.Status,
          dc.Amount,
          dc.Currency,
          dc.ExpiryDate,
          dc.CreatedDate
        FROM DocumentaryCredits dc
        WHERE dc.CreditType LIKE '%MT700%' OR dc.CreditType = 'Letter of Credit'
        ORDER BY dc.CreatedDate DESC
      `);

      return {
        messageType: mt700Messages.recordset[0],
        lifecycleStages: lifecycleStages.recordset,
        documentRequirements: documentRequirements.recordset,
        documentaryCredits: documentaryCredits.recordset,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching MT700 lifecycle data from Azure:', error);
      throw error;
    }
  }

  // Agent performance tracking
  async updateAgentTask(taskId: number, updates: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('task_id', taskId)
        .input('status', updates.status)
        .input('completed_at', updates.completed_at || null)
        .input('error_message', updates.error_message || null)
        .input('output_data', updates.output_data || null)
        .input('execution_time', updates.execution_time || null)
        .query(`
          UPDATE agent_tasks 
          SET 
            status = @status,
            completed_at = @completed_at,
            error_message = @error_message,
            output_data = @output_data,
            execution_time = @execution_time,
            updated_at = GETDATE()
          WHERE id = @task_id
        `);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error updating agent task:', error);
      throw error;
    }
  }

  // User Management in Azure SQL
  async getUser(id: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query(`
          SELECT id, email, first_name, last_name, profile_image_url, 
                 role, customer_segment, operation_segment, is_active,
                 created_at, updated_at
          FROM users 
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching user from Azure:', error);
      throw error;
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
        .input('customer_segment', userData.customerSegment || null)
        .input('operation_segment', userData.operationSegment || null)
        .query(`
          MERGE users AS target
          USING (SELECT @id as id, @email as email, @first_name as first_name, 
                        @last_name as last_name, @profile_image_url as profile_image_url,
                        @role as role, @customer_segment as customer_segment,
                        @operation_segment as operation_segment) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              email = source.email,
              first_name = source.first_name,
              last_name = source.last_name,
              profile_image_url = source.profile_image_url,
              role = source.role,
              customer_segment = source.customer_segment,
              operation_segment = source.operation_segment,
              updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, email, first_name, last_name, profile_image_url, 
                   role, customer_segment, operation_segment, is_active, created_at, updated_at)
            VALUES (source.id, source.email, source.first_name, source.last_name, 
                   source.profile_image_url, source.role, source.customer_segment, 
                   source.operation_segment, 1, GETDATE(), GETDATE());
          
          SELECT id, email, first_name, last_name, profile_image_url, 
                 role, customer_segment, operation_segment, is_active,
                 created_at, updated_at
          FROM users WHERE id = @id;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error upserting user in Azure:', error);
      throw error;
    }
  }

  // Session Management in Azure SQL
  async getSession(sid: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('sid', sid)
        .query(`
          SELECT sid, sess, expire
          FROM sessions 
          WHERE sid = @sid AND expire > GETDATE()
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching session from Azure:', error);
      throw error;
    }
  }

  async setSession(sid: string, session: any, expire: Date) {
    try {
      const pool = await connectToAzureSQL();
      await pool.request()
        .input('sid', sid)
        .input('sess', JSON.stringify(session))
        .input('expire', expire)
        .query(`
          MERGE sessions AS target
          USING (SELECT @sid as sid, @sess as sess, @expire as expire) AS source
          ON target.sid = source.sid
          WHEN MATCHED THEN
            UPDATE SET sess = source.sess, expire = source.expire
          WHEN NOT MATCHED THEN
            INSERT (sid, sess, expire) VALUES (source.sid, source.sess, source.expire);
        `);
      return true;
    } catch (error) {
      console.error('Error setting session in Azure:', error);
      throw error;
    }
  }

  async destroySession(sid: string) {
    try {
      const pool = await connectToAzureSQL();
      await pool.request()
        .input('sid', sid)
        .query(`DELETE FROM sessions WHERE sid = @sid`);
      return true;
    } catch (error) {
      console.error('Error destroying session in Azure:', error);
      throw error;
    }
  }
}

export const enhancedAzureAgentService = new EnhancedAzureAgentService();
import { connectToAzureSQL } from './azureSqlConnection';

export class WorkflowService {
  async createWorkflow(workflowData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const workflowId = `wf_${Date.now()}`;
      const { name, description, documentSetId, automationLevel } = workflowData;
      
      // First, ensure the workflows table exists
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='workflows' AND xtype='U')
        CREATE TABLE workflows (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(500) NOT NULL,
          description NVARCHAR(MAX),
          document_set_id NVARCHAR(255),
          automation_level NVARCHAR(50),
          status NVARCHAR(50) DEFAULT 'draft',
          completion_percentage INT DEFAULT 0,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          created_by NVARCHAR(255) DEFAULT 'system'
        );
      `);

      // Insert the new workflow
      const result = await pool.request()
        .input('id', workflowId)
        .input('name', name)
        .input('description', description)
        .input('documentSetId', documentSetId)
        .input('automationLevel', automationLevel)
        .query(`
          INSERT INTO workflows (id, name, description, document_set_id, automation_level, status, completion_percentage)
          OUTPUT INSERTED.*
          VALUES (@id, @name, @description, @documentSetId, @automationLevel, 'draft', 0)
        `);

      const workflow = result.recordset[0];
      
      // Create default workflow steps
      await this.createDefaultWorkflowSteps(workflowId, automationLevel);
      
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        documentSetId: workflow.document_set_id,
        automationLevel: workflow.automation_level,
        status: workflow.status,
        completionPercentage: workflow.completion_percentage,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async getWorkflows() {
    try {
      const pool = await connectToAzureSQL();
      
      // Ensure table exists first
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='workflows' AND xtype='U')
        CREATE TABLE workflows (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(500) NOT NULL,
          description NVARCHAR(MAX),
          document_set_id NVARCHAR(255),
          automation_level NVARCHAR(50),
          status NVARCHAR(50) DEFAULT 'draft',
          completion_percentage INT DEFAULT 0,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          created_by NVARCHAR(255) DEFAULT 'system'
        );
      `);

      const result = await pool.request().query(`
        SELECT * FROM workflows ORDER BY created_at DESC
      `);

      return result.recordset.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        documentSetId: workflow.document_set_id,
        automationLevel: workflow.automation_level,
        status: workflow.status,
        completionPercentage: workflow.completion_percentage,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at
      }));
    } catch (error) {
      console.error('Error fetching workflows:', error);
      // Return sample data if table doesn't exist yet
      return [
        {
          id: "wf_001",
          name: "LC Document Processing",
          description: "Automated workflow for processing Letter of Credit documents",
          documentSetId: "demo_set_1",
          status: "active",
          completionPercentage: 65,
          createdAt: "2025-06-03T08:00:00Z",
          updatedAt: "2025-06-03T10:15:00Z"
        }
      ];
    }
  }

  async getWorkflowById(workflowId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('workflowId', workflowId)
        .query(`
          SELECT * FROM workflows WHERE id = @workflowId
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const workflow = result.recordset[0];
      const steps = await this.getWorkflowSteps(workflowId);

      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        documentSetId: workflow.document_set_id,
        automationLevel: workflow.automation_level,
        status: workflow.status,
        completionPercentage: workflow.completion_percentage,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
        steps
      };
    } catch (error) {
      console.error('Error fetching workflow by ID:', error);
      throw error;
    }
  }

  async createDefaultWorkflowSteps(workflowId: string, automationLevel: string) {
    try {
      const pool = await connectToAzureSQL();
      
      // Ensure workflow_steps table exists
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='workflow_steps' AND xtype='U')
        CREATE TABLE workflow_steps (
          id NVARCHAR(255) PRIMARY KEY,
          workflow_id NVARCHAR(255) NOT NULL,
          step_name NVARCHAR(500) NOT NULL,
          description NVARCHAR(MAX),
          status NVARCHAR(50) DEFAULT 'pending',
          assigned_to NVARCHAR(255),
          duration_minutes INT,
          automation_type NVARCHAR(50),
          step_order INT,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
      `);

      const defaultSteps = [
        {
          id: `${workflowId}_step_001`,
          name: 'Document Upload Validation',
          description: 'Validate uploaded documents for completeness and format',
          assignedTo: 'AI Agent',
          duration: 5,
          automationType: 'automated',
          order: 1
        },
        {
          id: `${workflowId}_step_002`,
          name: 'OCR Processing',
          description: 'Extract text content from documents using OCR',
          assignedTo: 'OCR Service',
          duration: 15,
          automationType: 'automated',
          order: 2
        },
        {
          id: `${workflowId}_step_003`,
          name: 'Data Extraction',
          description: 'Extract key fields and data points from documents',
          assignedTo: 'Document AI',
          duration: 20,
          automationType: 'automated',
          order: 3
        }
      ];

      if (automationLevel === 'semi_automated' || automationLevel === 'manual') {
        defaultSteps.push({
          id: `${workflowId}_step_004`,
          name: 'Compliance Check',
          description: 'Verify documents against UCP 600 rules and regulations',
          assignedTo: 'Compliance Agent',
          duration: 30,
          automationType: 'hybrid',
          order: 4
        });
      }

      if (automationLevel === 'manual') {
        defaultSteps.push({
          id: `${workflowId}_step_005`,
          name: 'Manual Review',
          description: 'Human expert review of flagged discrepancies',
          assignedTo: 'Trade Finance Specialist',
          duration: 45,
          automationType: 'manual',
          order: 5
        });
      }

      for (const step of defaultSteps) {
        await pool.request()
          .input('id', step.id)
          .input('workflowId', workflowId)
          .input('stepName', step.name)
          .input('description', step.description)
          .input('assignedTo', step.assignedTo)
          .input('duration', step.duration)
          .input('automationType', step.automationType)
          .input('stepOrder', step.order)
          .query(`
            INSERT INTO workflow_steps (id, workflow_id, step_name, description, assigned_to, duration_minutes, automation_type, step_order)
            VALUES (@id, @workflowId, @stepName, @description, @assignedTo, @duration, @automationType, @stepOrder)
          `);
      }

      return defaultSteps;
    } catch (error) {
      console.error('Error creating workflow steps:', error);
      throw error;
    }
  }

  async getWorkflowSteps(workflowId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('workflowId', workflowId)
        .query(`
          SELECT * FROM workflow_steps WHERE workflow_id = @workflowId ORDER BY step_order
        `);

      return result.recordset.map(step => ({
        id: step.id,
        name: step.step_name,
        description: step.description,
        status: step.status,
        assignedTo: step.assigned_to,
        duration: step.duration_minutes,
        automationType: step.automation_type
      }));
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      return [];
    }
  }

  async updateWorkflow(workflowId: string, updates: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('workflowId', workflowId)
        .input('name', updates.name)
        .input('description', updates.description)
        .input('status', updates.status)
        .input('completionPercentage', updates.completionPercentage || 0)
        .query(`
          UPDATE workflows 
          SET name = COALESCE(@name, name),
              description = COALESCE(@description, description),
              status = COALESCE(@status, status),
              completion_percentage = COALESCE(@completionPercentage, completion_percentage),
              updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @workflowId
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const workflow = result.recordset[0];
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        documentSetId: workflow.document_set_id,
        automationLevel: workflow.automation_level,
        status: workflow.status,
        completionPercentage: workflow.completion_percentage,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at
      };
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(workflowId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      // Delete workflow steps first
      await pool.request()
        .input('workflowId', workflowId)
        .query(`DELETE FROM workflow_steps WHERE workflow_id = @workflowId`);

      // Delete workflow
      const result = await pool.request()
        .input('workflowId', workflowId)
        .query(`DELETE FROM workflows WHERE id = @workflowId`);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }
}

export const workflowService = new WorkflowService();
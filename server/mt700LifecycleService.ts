import { connectToAzureSQL } from './azureSqlConnection';
import * as sql from 'mssql';

export class MT700LifecycleService {
  async initializeTables() {
    try {
      const pool = await connectToAzureSQL();
      
      // Create MT700 lifecycle nodes table
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='mt700_lifecycle_nodes' AND xtype='U')
        CREATE TABLE mt700_lifecycle_nodes (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(500) NOT NULL,
          description NVARCHAR(MAX),
          node_type NVARCHAR(100) NOT NULL,
          status NVARCHAR(50) DEFAULT 'pending',
          position_x INT DEFAULT 0,
          position_y INT DEFAULT 0,
          parent_id NVARCHAR(255),
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
      `);

      // Create MT700 lifecycle documents table
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='mt700_lifecycle_documents' AND xtype='U')
        CREATE TABLE mt700_lifecycle_documents (
          id NVARCHAR(255) PRIMARY KEY,
          node_id NVARCHAR(255) NOT NULL,
          document_name NVARCHAR(500) NOT NULL,
          document_type NVARCHAR(100),
          file_path NVARCHAR(MAX),
          status NVARCHAR(50) DEFAULT 'uploaded',
          uploaded_by NVARCHAR(255) DEFAULT 'demo-user',
          uploaded_at DATETIME2 DEFAULT GETDATE(),
          processed_at DATETIME2,
          validation_status NVARCHAR(50) DEFAULT 'pending'
        );
      `);

      // Create MT700 agent tasks table
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='mt700_agent_tasks' AND xtype='U')
        CREATE TABLE mt700_agent_tasks (
          id NVARCHAR(255) PRIMARY KEY,
          node_id NVARCHAR(255) NOT NULL,
          agent_name NVARCHAR(255) NOT NULL,
          task_type NVARCHAR(100) NOT NULL,
          task_description NVARCHAR(MAX),
          status NVARCHAR(50) DEFAULT 'pending',
          priority NVARCHAR(20) DEFAULT 'medium',
          assigned_at DATETIME2 DEFAULT GETDATE(),
          completed_at DATETIME2,
          result_data NVARCHAR(MAX)
        );
      `);

      console.log('MT700 lifecycle tables initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing MT700 lifecycle tables:', error);
      return false;
    }
  }

  async seedSampleData() {
    try {
      const pool = await connectToAzureSQL();
      
      // Check if data already exists
      const existingNodes = await pool.request().query(`
        SELECT COUNT(*) as count FROM mt700_lifecycle_nodes
      `);

      if (existingNodes.recordset[0].count > 0) {
        console.log('MT700 lifecycle data already exists');
        return;
      }

      // Insert sample lifecycle nodes
      const nodes = [
        {
          id: 'node_lc_issuance',
          name: 'LC Issuance',
          description: 'Initial Letter of Credit issuance process',
          type: 'process',
          status: 'completed',
          x: 100,
          y: 100
        },
        {
          id: 'node_document_submission',
          name: 'Document Submission',
          description: 'Beneficiary submits required documents',
          type: 'document',
          status: 'in_progress',
          x: 300,
          y: 100
        },
        {
          id: 'node_document_examination',
          name: 'Document Examination',
          description: 'Bank examines documents for compliance',
          type: 'validation',
          status: 'pending',
          x: 500,
          y: 100
        },
        {
          id: 'node_payment_processing',
          name: 'Payment Processing',
          description: 'Process payment upon document acceptance',
          type: 'payment',
          status: 'pending',
          x: 700,
          y: 100
        }
      ];

      for (const node of nodes) {
        await pool.request()
          .input('id', node.id)
          .input('name', node.name)
          .input('description', node.description)
          .input('nodeType', node.type)
          .input('status', node.status)
          .input('positionX', node.x)
          .input('positionY', node.y)
          .query(`
            INSERT INTO mt700_lifecycle_nodes 
            (id, name, description, node_type, status, position_x, position_y)
            VALUES (@id, @name, @description, @nodeType, @status, @positionX, @positionY)
          `);
      }

      // Insert sample documents
      const documents = [
        {
          id: 'doc_commercial_invoice',
          nodeId: 'node_document_submission',
          name: 'Commercial Invoice',
          type: 'invoice',
          path: '/uploads/commercial_invoice.pdf',
          status: 'validated'
        },
        {
          id: 'doc_bill_of_lading',
          nodeId: 'node_document_submission',
          name: 'Bill of Lading',
          type: 'transport',
          path: '/uploads/bill_of_lading.pdf',
          status: 'validated'
        },
        {
          id: 'doc_packing_list',
          nodeId: 'node_document_submission',
          name: 'Packing List',
          type: 'logistics',
          path: '/uploads/packing_list.pdf',
          status: 'pending'
        }
      ];

      for (const doc of documents) {
        await pool.request()
          .input('id', doc.id)
          .input('nodeId', doc.nodeId)
          .input('name', doc.name)
          .input('type', doc.type)
          .input('path', doc.path)
          .input('status', doc.status)
          .query(`
            INSERT INTO mt700_lifecycle_documents 
            (id, node_id, document_name, document_type, file_path, status)
            VALUES (@id, @nodeId, @name, @type, @path, @status)
          `);
      }

      // Insert sample agent tasks
      const agentTasks = [
        {
          id: 'task_doc_validation',
          nodeId: 'node_document_examination',
          agentName: 'Document Validation Agent',
          taskType: 'validation',
          description: 'Validate submitted documents against LC requirements',
          status: 'in_progress',
          priority: 'high'
        },
        {
          id: 'task_compliance_check',
          nodeId: 'node_document_examination',
          agentName: 'Compliance Agent',
          taskType: 'compliance',
          description: 'Check documents for UCP 600 compliance',
          status: 'pending',
          priority: 'high'
        },
        {
          id: 'task_payment_calc',
          nodeId: 'node_payment_processing',
          agentName: 'Payment Calculation Agent',
          taskType: 'calculation',
          description: 'Calculate payment amounts based on validated documents',
          status: 'pending',
          priority: 'medium'
        }
      ];

      for (const task of agentTasks) {
        await pool.request()
          .input('id', task.id)
          .input('nodeId', task.nodeId)
          .input('agentName', task.agentName)
          .input('taskType', task.taskType)
          .input('description', task.description)
          .input('status', task.status)
          .input('priority', task.priority)
          .query(`
            INSERT INTO mt700_agent_tasks 
            (id, node_id, agent_name, task_type, task_description, status, priority)
            VALUES (@id, @nodeId, @agentName, @taskType, @description, @status, @priority)
          `);
      }

      console.log('MT700 lifecycle sample data seeded successfully');
    } catch (error) {
      console.error('Error seeding MT700 lifecycle data:', error);
    }
  }

  async getLifecycleData() {
    try {
      const pool = await connectToAzureSQL();
      
      // Get lifecycle nodes
      const nodesResult = await pool.request().query(`
        SELECT * FROM mt700_lifecycle_nodes ORDER BY created_at
      `);

      // Get documents count for each node
      const documentsResult = await pool.request().query(`
        SELECT node_id, COUNT(*) as document_count 
        FROM mt700_lifecycle_documents 
        GROUP BY node_id
      `);

      // Get agent tasks count for each node
      const tasksResult = await pool.request().query(`
        SELECT node_id, COUNT(*) as task_count 
        FROM mt700_agent_tasks 
        GROUP BY node_id
      `);

      const documentCounts = {};
      documentsResult.recordset.forEach(row => {
        documentCounts[row.node_id] = row.document_count;
      });

      const taskCounts = {};
      tasksResult.recordset.forEach(row => {
        taskCounts[row.node_id] = row.task_count;
      });

      const nodes = nodesResult.recordset.map(node => ({
        id: node.id,
        name: node.name,
        description: node.description,
        type: node.node_type,
        status: node.status,
        position: {
          x: node.position_x,
          y: node.position_y
        },
        documentCount: documentCounts[node.id] || 0,
        taskCount: taskCounts[node.id] || 0,
        createdAt: node.created_at,
        updatedAt: node.updated_at
      }));

      return {
        nodes,
        connections: [
          { from: 'node_lc_issuance', to: 'node_document_submission' },
          { from: 'node_document_submission', to: 'node_document_examination' },
          { from: 'node_document_examination', to: 'node_payment_processing' }
        ]
      };
    } catch (error) {
      console.error('Error fetching MT700 lifecycle data:', error);
      throw error;
    }
  }

  async getLifecycleDocuments(nodeId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('nodeId', nodeId)
        .query(`
          SELECT * FROM mt700_lifecycle_documents 
          WHERE node_id = @nodeId 
          ORDER BY uploaded_at DESC
        `);

      return result.recordset.map(doc => ({
        id: doc.id,
        nodeId: doc.node_id,
        name: doc.document_name,
        type: doc.document_type,
        filePath: doc.file_path,
        status: doc.status,
        uploadedBy: doc.uploaded_by,
        uploadedAt: doc.uploaded_at,
        processedAt: doc.processed_at,
        validationStatus: doc.validation_status
      }));
    } catch (error) {
      console.error('Error fetching lifecycle documents:', error);
      return [];
    }
  }

  async getLifecycleAgentTasks(nodeId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('nodeId', nodeId)
        .query(`
          SELECT * FROM mt700_agent_tasks 
          WHERE node_id = @nodeId 
          ORDER BY assigned_at DESC
        `);

      return result.recordset.map(task => ({
        id: task.id,
        nodeId: task.node_id,
        agentName: task.agent_name,
        taskType: task.task_type,
        description: task.task_description,
        status: task.status,
        priority: task.priority,
        assignedAt: task.assigned_at,
        completedAt: task.completed_at,
        resultData: task.result_data ? JSON.parse(task.result_data) : null
      }));
    } catch (error) {
      console.error('Error fetching lifecycle agent tasks:', error);
      return [];
    }
  }

  async storeDocumentUpload(documentData: any) {
    try {
      const pool = await connectToAzureSQL();
      const request = pool.request();
      
      const query = `
        INSERT INTO mt700_lifecycle_documents 
        (node_id, document_name, document_type, status, uploaded_at, validation_status)
        VALUES (@nodeId, @documentName, @documentType, @status, @uploadedAt, @validationStatus);
        SELECT SCOPE_IDENTITY() as id;
      `;
      
      request.input('nodeId', documentData.nodeId);
      request.input('documentName', documentData.documentName);
      request.input('documentType', documentData.documentType);
      request.input('status', documentData.status);
      request.input('uploadedAt', new Date(documentData.uploadedAt));
      request.input('validationStatus', documentData.validationStatus);
      
      const result = await request.query(query);
      
      return {
        id: result.recordset[0].id,
        ...documentData
      };
    } catch (error) {
      console.error('Error storing document upload:', error);
      throw error;
    }
  }

  async uploadDocument(nodeId: string, documentData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const documentId = `doc_${Date.now()}`;
      
      await pool.request()
        .input('id', documentId)
        .input('nodeId', nodeId)
        .input('name', documentData.name)
        .input('type', documentData.type || 'unknown')
        .input('path', documentData.filePath)
        .input('uploadedBy', documentData.uploadedBy || 'demo-user')
        .query(`
          INSERT INTO mt700_lifecycle_documents 
          (id, node_id, document_name, document_type, file_path, uploaded_by, status)
          VALUES (@id, @nodeId, @name, @type, @path, @uploadedBy, 'uploaded')
        `);

      return {
        id: documentId,
        nodeId,
        name: documentData.name,
        type: documentData.type || 'unknown',
        filePath: documentData.filePath,
        status: 'uploaded',
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async createAgentTask(nodeId: string, taskData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const taskId = `task_${Date.now()}`;
      
      await pool.request()
        .input('id', taskId)
        .input('nodeId', nodeId)
        .input('agentName', taskData.agentName)
        .input('taskType', taskData.taskType)
        .input('description', taskData.description)
        .input('priority', taskData.priority || 'medium')
        .query(`
          INSERT INTO mt700_agent_tasks 
          (id, node_id, agent_name, task_type, task_description, priority, status)
          VALUES (@id, @nodeId, @agentName, @taskType, @description, @priority, 'pending')
        `);

      return {
        id: taskId,
        nodeId,
        agentName: taskData.agentName,
        taskType: taskData.taskType,
        description: taskData.description,
        priority: taskData.priority || 'medium',
        status: 'pending',
        assignedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating agent task:', error);
      throw error;
    }
  }
}

export const mt700LifecycleService = new MT700LifecycleService();
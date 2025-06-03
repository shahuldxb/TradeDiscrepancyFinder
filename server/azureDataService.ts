import { connectToAzureSQL } from './azureSqlConnection';
import * as sql from 'mssql';

export class AzureDataService {
  
  // UCP Rules Engine - Replace PostgreSQL
  async getUCPArticles() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM ucp_articles ORDER BY article_number
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching UCP articles from Azure:', error);
      throw error;
    }
  }

  async getUCPRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM ucprules ORDER BY rule_number
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching UCP rules from Azure:', error);
      throw error;
    }
  }

  async createUCPRule(ruleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('rule_number', ruleData.rule_number)
        .input('rule_title', ruleData.rule_title)
        .input('rule_text', ruleData.rule_text)
        .input('article_id', ruleData.article_id)
        .input('category_id', ruleData.category_id)
        .query(`
          INSERT INTO ucprules (rule_number, rule_title, rule_text, article_id, category_id, created_at)
          OUTPUT INSERTED.*
          VALUES (@rule_number, @rule_title, @rule_text, @article_id, @category_id, GETDATE())
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating UCP rule in Azure:', error);
      throw error;
    }
  }

  // SWIFT Message Definitions - Replace PostgreSQL
  async getSwiftMessageTypes() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM SwiftMessageTypes ORDER BY message_type_code
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching SWIFT message types from Azure:', error);
      throw error;
    }
  }

  async getSwiftFields() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM SwiftFields ORDER BY field_code
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching SWIFT fields from Azure:', error);
      throw error;
    }
  }

  async getSwiftFieldsByMessageType(messageTypeCode: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('messageTypeCode', messageTypeCode)
        .query(`
          SELECT sf.* FROM SwiftFields sf
          INNER JOIN MessageTypeFields mtf ON sf.field_code = mtf.field_code
          WHERE mtf.message_type_code = @messageTypeCode
          ORDER BY mtf.field_order, sf.field_code
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching SWIFT fields by message type from Azure:', error);
      throw error;
    }
  }

  // Discrepancy Tracking - Replace PostgreSQL
  async getDiscrepancies(filters: any = {}) {
    try {
      const pool = await connectToAzureSQL();
      let query = 'SELECT * FROM discrepancies';
      const conditions = [];
      const request = pool.request();
      
      if (filters.documentSetId) {
        conditions.push('document_set_id = @document_set_id');
        request.input('document_set_id', filters.documentSetId);
      }
      
      if (filters.severity) {
        conditions.push('severity = @severity');
        request.input('severity', filters.severity);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching discrepancies from Azure:', error);
      throw error;
    }
  }

  async createDiscrepancy(discrepancyData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('document_set_id', discrepancyData.document_set_id)
        .input('discrepancy_type', discrepancyData.discrepancy_type)
        .input('field_name', discrepancyData.field_name)
        .input('severity', discrepancyData.severity)
        .input('ucp_reference', discrepancyData.ucp_reference)
        .input('description', discrepancyData.description)
        .input('rule_explanation', discrepancyData.rule_explanation)
        .input('advice', discrepancyData.advice)
        .query(`
          INSERT INTO discrepancies 
          (document_set_id, discrepancy_type, field_name, severity, ucp_reference, description, rule_explanation, advice, created_at)
          OUTPUT INSERTED.*
          VALUES 
          (@document_set_id, @discrepancy_type, @field_name, @severity, @ucp_reference, @description, @rule_explanation, @advice, GETDATE())
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating discrepancy in Azure:', error);
      throw error;
    }
  }

  async getDiscrepancyTypes() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT * FROM discrepancytypes ORDER BY type_name
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching discrepancy types from Azure:', error);
      throw error;
    }
  }

  // Document Operations - Replace PostgreSQL
  async getDocumentSets(userId: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('user_id', userId)
        .query(`
          SELECT * FROM document_sets 
          WHERE user_id = @user_id 
          ORDER BY created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching document sets from Azure:', error);
      
      // If table doesn't exist, return empty array for demo
      if (error.message?.includes('Invalid object name') || error.message?.includes('document_sets')) {
        console.log('Document sets table not found, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async createDocumentSet(documentSetData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      // Generate a unique ID if not provided
      const documentSetId = documentSetData.id || `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await pool.request()
        .input('id', documentSetId)
        .input('user_id', documentSetData.user_id || 'demo-user')
        .input('lc_reference', documentSetData.lcReference || documentSetData.lc_reference || `LC-${Date.now()}`)
        .input('set_name', documentSetData.setName || documentSetData.set_name || `Document Set ${new Date().toLocaleDateString()}`)
        .input('status', documentSetData.status || 'created')
        .query(`
          INSERT INTO document_sets 
          (id, user_id, lc_reference, set_name, status, created_at)
          OUTPUT INSERTED.*
          VALUES 
          (@id, @user_id, @lc_reference, @set_name, @status, GETDATE())
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating document set in Azure:', error);
      
      // If table doesn't exist, create a mock response for demo purposes
      if (error.message?.includes('Invalid object name') || error.message?.includes('document_sets')) {
        const mockDocumentSet = {
          id: documentSetData.id || `ds_${Date.now()}`,
          user_id: documentSetData.user_id || 'demo-user',
          lc_reference: documentSetData.lcReference || documentSetData.lc_reference || `LC-${Date.now()}`,
          set_name: documentSetData.setName || documentSetData.set_name || `Document Set ${new Date().toLocaleDateString()}`,
          status: 'created',
          created_at: new Date(),
          uploadedDocuments: [],
          analysisStatus: 'pending'
        };
        console.log('Using demo document set data (table not found):', mockDocumentSet);
        return mockDocumentSet;
      }
      throw error;
    }
  }

  // Statistics and Analytics
  async getDashboardMetrics() {
    try {
      const pool = await connectToAzureSQL();
      
      const documentsResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM documents WHERE created_at >= DATEADD(day, -30, GETDATE())
      `);
      
      const discrepanciesResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM discrepancies WHERE created_at >= DATEADD(day, -30, GETDATE())
      `);
      
      const agentTasksResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM agent_tasks WHERE created_at >= DATEADD(day, -30, GETDATE())
      `);
      
      return {
        documentsProcessed: documentsResult.recordset[0].total,
        discrepanciesFound: discrepanciesResult.recordset[0].total,
        agentTasksExecuted: agentTasksResult.recordset[0].total,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics from Azure:', error);
      throw error;
    }
  }

  async getMT700LifecycleData() {
    try {
      const pool = await connectToAzureSQL();
      
      // Get actual MT700 message data from Azure SQL using correct schema
      const mt700Messages = await pool.request().query(`
        SELECT 
          mt.message_type,
          mt.description,
          mt.category,
          COUNT(DISTINCT mi.id) as active_transactions
        FROM swift.message_types mt
        LEFT JOIN swift.message_instances mi ON mi.message_type = mt.message_type
        WHERE mt.message_type = 'MT700'
        GROUP BY mt.message_type, mt.description, mt.category
      `);

      // Get lifecycle stages from actual SWIFT message dependencies
      const lifecycleStages = await pool.request().query(`
        SELECT DISTINCT
          md.parent_message_type,
          md.child_message_type,
          md.dependency_type,
          md.sequence_order,
          mt.description as stage_description
        FROM swift.message_dependencies md
        JOIN swift.message_types mt ON mt.message_type = md.child_message_type
        WHERE md.parent_message_type = 'MT700' OR md.child_message_type = 'MT700'
        ORDER BY md.sequence_order
      `);

      // Get document requirements from actual UCP rules
      const documentRequirements = await pool.request().query(`
        SELECT 
          ur.RuleNumber,
          ur.RuleText,
          ur.DocumentType,
          ur.Severity,
          COUNT(rdm.DocumentTypeID) as documents_mapped
        FROM UCPRules ur
        LEFT JOIN RuleDocumentMapping rdm ON rdm.RuleID = ur.RuleID
        WHERE ur.DocumentType IS NOT NULL
        GROUP BY ur.RuleNumber, ur.RuleText, ur.DocumentType, ur.Severity
      `);

      // Get actual documentary credits data
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
        messageType: mt700Messages.recordset[0] || {
          message_type: 'MT700',
          description: 'Issue of a Documentary Credit',
          category: 'Documentary Credits and Guarantees',
          active_transactions: 0
        },
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

  async getLifecycleDocuments(nodeId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      // Get actual documents from the MasterDocuments and DocumentRequirements tables
      const documents = await pool.request()
        .input('nodeId', nodeId)
        .query(`
          SELECT 
            md.DocumentID,
            md.DocumentName,
            md.DocumentType,
            md.Status,
            md.CreatedDate,
            md.UpdatedDate,
            dr.RequirementType,
            dr.IsMandatory,
            ur.DocumentType as UCPDocumentType,
            ur.RuleText
          FROM MasterDocuments md
          LEFT JOIN DocumentRequirements dr ON dr.DocumentType = md.DocumentType
          LEFT JOIN UCPRules ur ON ur.DocumentType = md.DocumentType
          WHERE md.Status IS NOT NULL
          ORDER BY md.CreatedDate DESC
        `);

      // Get actual documentary credits documents
      const creditDocuments = await pool.request()
        .input('nodeId', nodeId)
        .query(`
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
          WHERE dc.Status IN ('Active', 'Processing', 'Pending')
          ORDER BY dc.CreatedDate DESC
        `);

      const documentResults = documents.recordset.map(doc => ({
        id: doc.DocumentID?.toString() || 'doc_' + Date.now(),
        name: doc.DocumentName || 'Document',
        type: doc.DocumentType || 'general',
        status: this.mapDocumentStatus(doc.Status),
        required: doc.IsMandatory === 1 || doc.RequirementType === 'Mandatory',
        uploadedAt: doc.CreatedDate,
        validatedBy: doc.Status === 'Validated' ? 'Document Validator Agent' : null,
        ucpRule: doc.RuleText || null
      }));

      const creditResults = creditDocuments.recordset.map(credit => ({
        id: 'credit_' + credit.CreditID,
        name: credit.CreditNumber || `LC-${credit.CreditID}`,
        type: 'letter_of_credit',
        status: this.mapDocumentStatus(credit.Status),
        required: true,
        uploadedAt: credit.CreatedDate,
        validatedBy: credit.Status === 'Active' ? 'Credit Officer Agent' : null,
        amount: credit.Amount,
        currency: credit.Currency,
        expiryDate: credit.ExpiryDate
      }));

      return [...documentResults, ...creditResults];
    } catch (error) {
      console.error('Error fetching lifecycle documents from Azure:', error);
      throw error;
    }
  }

  private mapDocumentStatus(status: string): string {
    if (!status) return 'missing';
    
    const statusMap: { [key: string]: string } = {
      'Active': 'approved',
      'Validated': 'validated',
      'Processing': 'uploaded',
      'Pending': 'uploaded',
      'Draft': 'missing',
      'Rejected': 'missing',
      'Completed': 'approved'
    };
    
    return statusMap[status] || 'missing';
  }

  async getLibraryDocuments(userId: string = 'demo-user') {
    try {
      const pool = await connectToAzureSQL();
      
      // Get table structure first to understand existing columns
      const tableStructure = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'documents' AND TABLE_SCHEMA = 'dbo'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Documents table structure:', tableStructure.recordset);
      
      // Check if table is empty and add sample documents
      const result = await pool.request().query('SELECT * FROM dbo.documents');
      
      if (result.recordset.length === 0) {
        console.log('Adding sample documents to empty table...');
        
        // Insert sample documents using the correct column structure with document_set_id
        await pool.request().query(`
          INSERT INTO dbo.documents (document_set_id, document_type, file_name, file_path, file_size, mime_type, status, created_at)
          VALUES 
          ('ds_1748941845210_sotbdw18g', 'Commercial Invoice', 'Commercial_Invoice_LC001.pdf', 'uploads/commercial_invoice_1.pdf', 245760, 'application/pdf', 'analyzed', GETDATE()),
          ('ds_1748941845210_sotbdw18g', 'Bill of Lading', 'Bill_of_Lading_LC001.pdf', 'uploads/bill_of_lading_1.pdf', 189440, 'application/pdf', 'processing', GETDATE()),
          ('ds_1748942115715_ftjz4kqkt', 'Letter of Credit', 'Letter_of_Credit_LC002.pdf', 'uploads/letter_of_credit_1.pdf', 156672, 'application/pdf', 'uploaded', GETDATE()),
          ('demo_set_1', 'Insurance Certificate', 'Insurance_Certificate_LC001.pdf', 'uploads/insurance_cert_1.pdf', 98304, 'application/pdf', 'analyzed', GETDATE()),
          ('demo_set_1', 'Packing List', 'Packing_List_LC002.pdf', 'uploads/packing_list_1.pdf', 134217, 'application/pdf', 'error', GETDATE())
        `);
        
        console.log('Sample documents inserted successfully');
        
        // Re-fetch the data
        const updatedResult = await pool.request().query('SELECT * FROM dbo.documents');
        console.log(`Found ${updatedResult.recordset.length} documents in Azure SQL`);
        
        return updatedResult.recordset.map((doc: any) => ({
          id: doc.id,
          fileName: doc.file_name,
          documentType: doc.document_type,
          fileSize: doc.file_size,
          uploadDate: doc.created_at,
          status: doc.status || 'uploaded',
          documentSetId: doc.document_set_id,
          filePath: doc.file_path,
          mimeType: doc.mime_type,
          extractedData: doc.extracted_data
        }));
      }
      
      console.log(`Found ${result.recordset.length} documents in Azure SQL`);
      
      return result.recordset.map((doc: any) => ({
        id: doc.id || doc.ID,
        fileName: doc.file_name || doc.fileName || doc.name || doc.Name,
        documentType: doc.document_type || doc.documentType || doc.type || doc.Type,
        fileSize: doc.file_size || doc.fileSize || doc.size || doc.Size,
        uploadDate: doc.created_at || doc.createdAt || doc.upload_date || doc.uploadDate,
        status: doc.status || doc.Status || 'uploaded',
        documentSetId: doc.document_set_id || doc.documentSetId || doc.setId,
        filePath: doc.file_path || doc.filePath || doc.path || doc.Path,
        mimeType: doc.mime_type || doc.mimeType || doc.type,
        extractedData: doc.extracted_data || doc.extractedData
      }));
    } catch (error) {
      console.error('Error fetching library documents from Azure SQL:', error);
      throw error;
    }
  }

  async createLibraryDocument(documentData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      // Handle document_set_id - use default if none provided
      const documentSetId = documentData.documentSetId === 'none' || !documentData.documentSetId 
        ? 'demo_set_1' 
        : documentData.documentSetId;
      
      const result = await pool.request()
        .input('fileName', documentData.fileName)
        .input('documentType', documentData.documentType)
        .input('fileSize', documentData.fileSize)
        .input('status', documentData.status || 'uploaded')
        .input('documentSetId', documentSetId)
        .input('filePath', documentData.filePath)
        .input('mimeType', documentData.mimeType)
        .query(`
          INSERT INTO dbo.documents (
            document_set_id, document_type, file_name, file_path, file_size, 
            mime_type, status, created_at
          ) 
          OUTPUT INSERTED.id
          VALUES (
            @documentSetId, @documentType, @fileName, @filePath, @fileSize, 
            @mimeType, @status, GETDATE()
          )
        `);
      
      return {
        id: result.recordset[0].id,
        fileName: documentData.fileName,
        documentType: documentData.documentType,
        fileSize: documentData.fileSize,
        uploadDate: new Date(),
        status: documentData.status || 'uploaded',
        documentSetId: documentSetId,
        filePath: documentData.filePath,
        mimeType: documentData.mimeType
      };
    } catch (error) {
      console.error('Error creating library document in Azure SQL:', error);
      throw error;
    }
  }

  async deleteLibraryDocument(documentId: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const getResult = await pool.request()
        .input('documentId', documentId)
        .query('SELECT file_path FROM dbo.documents WHERE id = @documentId');
      
      if (getResult.recordset.length === 0) {
        throw new Error('Document not found');
      }
      
      await pool.request()
        .input('documentId', documentId)
        .query('DELETE FROM dbo.documents WHERE id = @documentId');
      
      return { 
        success: true, 
        filePath: getResult.recordset[0].file_path 
      };
    } catch (error) {
      console.error('Error deleting library document from Azure SQL:', error);
      throw error;
    }
  }

  async getDocumentById(documentId: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('documentId', documentId)
        .query(`
          SELECT 
            id, file_name, document_type, file_size, created_at,
            status, document_set_id, file_path, mime_type, extracted_data
          FROM dbo.documents 
          WHERE id = @documentId
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      const doc = result.recordset[0];
      return {
        id: doc.id,
        fileName: doc.file_name,
        documentType: doc.document_type,
        fileSize: doc.file_size,
        uploadDate: doc.created_at,
        status: doc.status,
        documentSetId: doc.document_set_id,
        filePath: doc.file_path,
        mimeType: doc.mime_type,
        extractedData: doc.extracted_data
      };
    } catch (error) {
      console.error('Error fetching document by ID from Azure SQL:', error);
      throw error;
    }
  }
}

export const azureDataService = new AzureDataService();
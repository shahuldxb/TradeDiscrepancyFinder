import { connectToAzureSQL } from './azureSqlConnection';

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
      throw error;
    }
  }

  async createDocumentSet(documentSetData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', documentSetData.id)
        .input('user_id', documentSetData.user_id)
        .input('lc_reference', documentSetData.lc_reference)
        .input('set_name', documentSetData.set_name)
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
}

export const azureDataService = new AzureDataService();
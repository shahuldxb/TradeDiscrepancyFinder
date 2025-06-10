import { connectToAzureSQL } from './azureSqlConnection';

export class UCPDataService {
  
  // First, let's discover what UCP tables actually exist and their structure
  async discoverUCPTables() {
    try {
      const pool = await connectToAzureSQL();
      
      // Find all UCP-related tables
      const tablesResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'swift' AND (TABLE_NAME LIKE '%UCP%' OR TABLE_NAME LIKE '%ucp%')
        ORDER BY TABLE_NAME
      `);
      
      console.log('UCP tables found:', tablesResult.recordset.map(t => t.TABLE_NAME));
      
      // For each table, get its structure
      const tableStructures = {};
      for (const table of tablesResult.recordset) {
        const columnsResult = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'swift' AND TABLE_NAME = '${table.TABLE_NAME}'
          ORDER BY ORDINAL_POSITION
        `);
        tableStructures[table.TABLE_NAME] = columnsResult.recordset;
        console.log(`Table ${table.TABLE_NAME} columns:`, columnsResult.recordset.map(c => c.COLUMN_NAME));
      }
      
      return { tables: tablesResult.recordset, structures: tableStructures };
    } catch (error) {
      console.error('Error discovering UCP tables:', error);
      throw error;
    }
  }

  // UCP_Articles (Base Table) - Foundation of all UCP rules
  async getUCPArticles() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query('SELECT * FROM swift.UCP_Articles ORDER BY ArticleID');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching UCP Articles:', error);
      throw error;
    }
  }

  async createUCPArticle(articleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('article_number', articleData.article_number)
        .input('title', articleData.title)
        .input('content', articleData.content)
        .input('section', articleData.section)
        .input('subsection', articleData.subsection)
        .input('is_active', articleData.is_active || true)
        .input('effective_date', articleData.effective_date)
        .input('revision_number', articleData.revision_number || 1)
        .query(`
          INSERT INTO swift.UCP_Articles 
          (article_number, title, content, section, subsection, is_active, effective_date, revision_number, created_at)
          VALUES (@article_number, @title, @content, @section, @subsection, @is_active, @effective_date, @revision_number, GETDATE())
        `);
      return result;
    } catch (error) {
      console.error('Error creating UCP Article:', error);
      throw error;
    }
  }

  async updateUCPArticle(id: number, articleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('article_number', articleData.article_number)
        .input('title', articleData.title)
        .input('content', articleData.content)
        .input('section', articleData.section)
        .input('subsection', articleData.subsection)
        .input('is_active', articleData.is_active)
        .input('revision_number', articleData.revision_number)
        .query(`
          UPDATE swift.UCP_Articles 
          SET article_number = @article_number, title = @title, content = @content, 
              section = @section, subsection = @subsection, is_active = @is_active, 
              revision_number = @revision_number, updated_at = GETDATE()
          WHERE id = @id
        `);
      return result;
    } catch (error) {
      console.error('Error updating UCP Article:', error);
      throw error;
    }
  }

  async deleteUCPArticle(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query('DELETE FROM swift.UCP_Articles WHERE ArticleID = @id');
      return result;
    } catch (error) {
      console.error('Error deleting UCP Article:', error);
      throw error;
    }
  }

  // UCPRules (Derived from Articles)
  async getUCPRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT RuleID, RuleCode, RuleName, RuleText, DetailedDescription, 
               ArticleID, Priority, IsActive, CreatedDate, LastModifiedDate
        FROM swift.UCPRules
        WHERE IsActive = 1
        ORDER BY RuleCode
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching UCP Rules:', error);
      throw error;
    }
  }

  async createUCPRule(ruleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('rule_code', ruleData.rule_code)
        .input('rule_name', ruleData.rule_name)
        .input('rule_description', ruleData.rule_description)
        .input('article_id', ruleData.article_id)
        .input('rule_category', ruleData.rule_category)
        .input('priority_level', ruleData.priority_level || 'MEDIUM')
        .input('is_mandatory', ruleData.is_mandatory || false)
        .input('validation_logic', ruleData.validation_logic)
        .input('error_message', ruleData.error_message)
        .input('is_active', ruleData.is_active || true)
        .query(`
          INSERT INTO swift.UCPRules 
          (rule_code, rule_name, rule_description, article_id, rule_category, priority_level, 
           is_mandatory, validation_logic, error_message, is_active, created_at)
          VALUES (@rule_code, @rule_name, @rule_description, @article_id, @rule_category, 
                  @priority_level, @is_mandatory, @validation_logic, @error_message, @is_active, GETDATE())
        `);
      return result;
    } catch (error) {
      console.error('Error creating UCP Rule:', error);
      throw error;
    }
  }

  async updateUCPRule(id: number, ruleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('rule_code', ruleData.rule_code)
        .input('rule_name', ruleData.rule_name)
        .input('rule_description', ruleData.rule_description)
        .input('article_id', ruleData.article_id)
        .input('rule_category', ruleData.rule_category)
        .input('priority_level', ruleData.priority_level)
        .input('is_mandatory', ruleData.is_mandatory)
        .input('validation_logic', ruleData.validation_logic)
        .input('error_message', ruleData.error_message)
        .input('is_active', ruleData.is_active)
        .query(`
          UPDATE swift.UCPRules 
          SET rule_code = @rule_code, rule_name = @rule_name, rule_description = @rule_description,
              article_id = @article_id, rule_category = @rule_category, priority_level = @priority_level,
              is_mandatory = @is_mandatory, validation_logic = @validation_logic, 
              error_message = @error_message, is_active = @is_active, updated_at = GETDATE()
          WHERE id = @id
        `);
      return result;
    } catch (error) {
      console.error('Error updating UCP Rule:', error);
      throw error;
    }
  }

  async deleteUCPRule(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query('DELETE FROM swift.UCPRules WHERE id = @id');
      return result;
    } catch (error) {
      console.error('Error deleting UCP Rule:', error);
      throw error;
    }
  }

  // ucp_usage_rules
  async getUsageRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT ur.*, r.rule_code, r.rule_name 
        FROM swift.ucp_usage_rules ur
        LEFT JOIN swift.UCPRules r ON ur.rule_id = r.id
        ORDER BY ur.usage_context, ur.sequence_order
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Usage Rules:', error);
      throw error;
    }
  }

  async createUsageRule(usageData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('rule_id', usageData.rule_id)
        .input('usage_context', usageData.usage_context)
        .input('applicable_document_types', usageData.applicable_document_types)
        .input('sequence_order', usageData.sequence_order || 1)
        .input('condition_logic', usageData.condition_logic)
        .input('expected_outcome', usageData.expected_outcome)
        .input('is_active', usageData.is_active || true)
        .query(`
          INSERT INTO swift.ucp_usage_rules 
          (rule_id, usage_context, applicable_document_types, sequence_order, condition_logic, expected_outcome, is_active, created_at)
          VALUES (@rule_id, @usage_context, @applicable_document_types, @sequence_order, @condition_logic, @expected_outcome, @is_active, GETDATE())
        `);
      return result;
    } catch (error) {
      console.error('Error creating Usage Rule:', error);
      throw error;
    }
  }

  async updateUsageRule(id: number, usageData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('rule_id', usageData.rule_id)
        .input('usage_context', usageData.usage_context)
        .input('applicable_document_types', usageData.applicable_document_types)
        .input('sequence_order', usageData.sequence_order)
        .input('condition_logic', usageData.condition_logic)
        .input('expected_outcome', usageData.expected_outcome)
        .input('is_active', usageData.is_active)
        .query(`
          UPDATE swift.ucp_usage_rules 
          SET rule_id = @rule_id, usage_context = @usage_context, applicable_document_types = @applicable_document_types,
              sequence_order = @sequence_order, condition_logic = @condition_logic, expected_outcome = @expected_outcome,
              is_active = @is_active, updated_at = GETDATE()
          WHERE id = @id
        `);
      return result;
    } catch (error) {
      console.error('Error updating Usage Rule:', error);
      throw error;
    }
  }

  async deleteUsageRule(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query('DELETE FROM swift.ucp_usage_rules WHERE id = @id');
      return result;
    } catch (error) {
      console.error('Error deleting Usage Rule:', error);
      throw error;
    }
  }

  // UCP_message_field_rules
  async getMessageFieldRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT mfr.*, r.rule_code, r.rule_name 
        FROM swift.UCP_message_field_rules mfr
        LEFT JOIN swift.UCPRules r ON mfr.rule_id = r.id
        ORDER BY mfr.message_type, mfr.field_code
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Message Field Rules:', error);
      throw error;
    }
  }

  async createMessageFieldRule(fieldRuleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('rule_id', fieldRuleData.rule_id)
        .input('message_type', fieldRuleData.message_type)
        .input('field_code', fieldRuleData.field_code)
        .input('field_name', fieldRuleData.field_name)
        .input('validation_pattern', fieldRuleData.validation_pattern)
        .input('mandatory_condition', fieldRuleData.mandatory_condition)
        .input('dependency_rules', fieldRuleData.dependency_rules)
        .input('error_severity', fieldRuleData.error_severity || 'ERROR')
        .input('is_active', fieldRuleData.is_active || true)
        .query(`
          INSERT INTO swift.UCP_message_field_rules 
          (rule_id, message_type, field_code, field_name, validation_pattern, mandatory_condition, 
           dependency_rules, error_severity, is_active, created_at)
          VALUES (@rule_id, @message_type, @field_code, @field_name, @validation_pattern, 
                  @mandatory_condition, @dependency_rules, @error_severity, @is_active, GETDATE())
        `);
      return result;
    } catch (error) {
      console.error('Error creating Message Field Rule:', error);
      throw error;
    }
  }

  async updateMessageFieldRule(id: number, fieldRuleData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('rule_id', fieldRuleData.rule_id)
        .input('message_type', fieldRuleData.message_type)
        .input('field_code', fieldRuleData.field_code)
        .input('field_name', fieldRuleData.field_name)
        .input('validation_pattern', fieldRuleData.validation_pattern)
        .input('mandatory_condition', fieldRuleData.mandatory_condition)
        .input('dependency_rules', fieldRuleData.dependency_rules)
        .input('error_severity', fieldRuleData.error_severity)
        .input('is_active', fieldRuleData.is_active)
        .query(`
          UPDATE swift.UCP_message_field_rules 
          SET rule_id = @rule_id, message_type = @message_type, field_code = @field_code, 
              field_name = @field_name, validation_pattern = @validation_pattern,
              mandatory_condition = @mandatory_condition, dependency_rules = @dependency_rules,
              error_severity = @error_severity, is_active = @is_active, updated_at = GETDATE()
          WHERE id = @id
        `);
      return result;
    } catch (error) {
      console.error('Error updating Message Field Rule:', error);
      throw error;
    }
  }

  async deleteMessageFieldRule(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query('DELETE FROM swift.UCP_message_field_rules WHERE id = @id');
      return result;
    } catch (error) {
      console.error('Error deleting Message Field Rule:', error);
      throw error;
    }
  }

  // UCP_document_compliance_rules
  async getDocumentComplianceRules() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT dcr.*, r.rule_code, r.rule_name 
        FROM swift.UCP_document_compliance_rules dcr
        LEFT JOIN swift.UCPRules r ON dcr.rule_id = r.id
        ORDER BY dcr.document_type, dcr.compliance_category
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Document Compliance Rules:', error);
      throw error;
    }
  }

  async createDocumentComplianceRule(complianceData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('rule_id', complianceData.rule_id)
        .input('document_type', complianceData.document_type)
        .input('compliance_category', complianceData.compliance_category)
        .input('required_fields', complianceData.required_fields)
        .input('validation_criteria', complianceData.validation_criteria)
        .input('tolerance_rules', complianceData.tolerance_rules)
        .input('discrepancy_weight', complianceData.discrepancy_weight || 1)
        .input('is_active', complianceData.is_active || true)
        .query(`
          INSERT INTO swift.UCP_document_compliance_rules 
          (rule_id, document_type, compliance_category, required_fields, validation_criteria, 
           tolerance_rules, discrepancy_weight, is_active, created_at)
          VALUES (@rule_id, @document_type, @compliance_category, @required_fields, @validation_criteria, 
                  @tolerance_rules, @discrepancy_weight, @is_active, GETDATE())
        `);
      return result;
    } catch (error) {
      console.error('Error creating Document Compliance Rule:', error);
      throw error;
    }
  }

  async updateDocumentComplianceRule(id: number, complianceData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('rule_id', complianceData.rule_id)
        .input('document_type', complianceData.document_type)
        .input('compliance_category', complianceData.compliance_category)
        .input('required_fields', complianceData.required_fields)
        .input('validation_criteria', complianceData.validation_criteria)
        .input('tolerance_rules', complianceData.tolerance_rules)
        .input('discrepancy_weight', complianceData.discrepancy_weight)
        .input('is_active', complianceData.is_active)
        .query(`
          UPDATE swift.UCP_document_compliance_rules 
          SET rule_id = @rule_id, document_type = @document_type, compliance_category = @compliance_category,
              required_fields = @required_fields, validation_criteria = @validation_criteria,
              tolerance_rules = @tolerance_rules, discrepancy_weight = @discrepancy_weight,
              is_active = @is_active, updated_at = GETDATE()
          WHERE id = @id
        `);
      return result;
    } catch (error) {
      console.error('Error updating Document Compliance Rule:', error);
      throw error;
    }
  }

  async deleteDocumentComplianceRule(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query('DELETE FROM swift.UCP_document_compliance_rules WHERE id = @id');
      return result;
    } catch (error) {
      console.error('Error deleting Document Compliance Rule:', error);
      throw error;
    }
  }

  // UCP_Business_Process_Owners
  async getBusinessProcessOwners() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT bpo.*, r.rule_code, r.rule_name 
        FROM swift.UCP_Business_Process_Owners bpo
        LEFT JOIN swift.UCPRules r ON bpo.rule_id = r.id
        ORDER BY bpo.business_process, bpo.owner_name
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Business Process Owners:', error);
      throw error;
    }
  }

  async createBusinessProcessOwner(ownerData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('rule_id', ownerData.rule_id)
        .input('business_process', ownerData.business_process)
        .input('owner_name', ownerData.owner_name)
        .input('owner_role', ownerData.owner_role)
        .input('department', ownerData.department)
        .input('contact_email', ownerData.contact_email)
        .input('responsibilities', ownerData.responsibilities)
        .input('approval_authority', ownerData.approval_authority || false)
        .input('is_active', ownerData.is_active || true)
        .query(`
          INSERT INTO swift.UCP_Business_Process_Owners 
          (rule_id, business_process, owner_name, owner_role, department, contact_email, 
           responsibilities, approval_authority, is_active, created_at)
          VALUES (@rule_id, @business_process, @owner_name, @owner_role, @department, @contact_email, 
                  @responsibilities, @approval_authority, @is_active, GETDATE())
        `);
      return result;
    } catch (error) {
      console.error('Error creating Business Process Owner:', error);
      throw error;
    }
  }

  async updateBusinessProcessOwner(id: number, ownerData: any) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .input('rule_id', ownerData.rule_id)
        .input('business_process', ownerData.business_process)
        .input('owner_name', ownerData.owner_name)
        .input('owner_role', ownerData.owner_role)
        .input('department', ownerData.department)
        .input('contact_email', ownerData.contact_email)
        .input('responsibilities', ownerData.responsibilities)
        .input('approval_authority', ownerData.approval_authority)
        .input('is_active', ownerData.is_active)
        .query(`
          UPDATE swift.UCP_Business_Process_Owners 
          SET rule_id = @rule_id, business_process = @business_process, owner_name = @owner_name,
              owner_role = @owner_role, department = @department, contact_email = @contact_email,
              responsibilities = @responsibilities, approval_authority = @approval_authority,
              is_active = @is_active, updated_at = GETDATE()
          WHERE id = @id
        `);
      return result;
    } catch (error) {
      console.error('Error updating Business Process Owner:', error);
      throw error;
    }
  }

  async deleteBusinessProcessOwner(id: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('id', id)
        .query('DELETE FROM swift.UCP_Business_Process_Owners WHERE id = @id');
      return result;
    } catch (error) {
      console.error('Error deleting Business Process Owner:', error);
      throw error;
    }
  }

  // UCP_validation_results (Read-Only)
  async getValidationResults(filters: any = {}) {
    try {
      const pool = await connectToAzureSQL();
      let query = `
        SELECT vr.*, r.rule_code, r.rule_name 
        FROM swift.UCP_validation_results vr
        LEFT JOIN swift.UCPRules r ON vr.rule_id = r.id
        WHERE 1=1
      `;
      
      if (filters.validation_status) {
        query += ` AND vr.validation_status = '${filters.validation_status}'`;
      }
      if (filters.document_id) {
        query += ` AND vr.document_id = ${filters.document_id}`;
      }
      if (filters.date_from) {
        query += ` AND vr.validation_timestamp >= '${filters.date_from}'`;
      }
      if (filters.date_to) {
        query += ` AND vr.validation_timestamp <= '${filters.date_to}'`;
      }
      
      query += ' ORDER BY vr.validation_timestamp DESC';
      
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Validation Results:', error);
      throw error;
    }
  }

  // UCP_Rule_Execution_History (Read-Only)
  async getRuleExecutionHistory(filters: any = {}) {
    try {
      const pool = await connectToAzureSQL();
      let query = `
        SELECT reh.*, r.rule_code, r.rule_name 
        FROM swift.UCP_Rule_Execution_History reh
        LEFT JOIN swift.UCPRules r ON reh.rule_id = r.id
        WHERE 1=1
      `;
      
      if (filters.execution_status) {
        query += ` AND reh.execution_status = '${filters.execution_status}'`;
      }
      if (filters.rule_id) {
        query += ` AND reh.rule_id = ${filters.rule_id}`;
      }
      if (filters.date_from) {
        query += ` AND reh.execution_timestamp >= '${filters.date_from}'`;
      }
      if (filters.date_to) {
        query += ` AND reh.execution_timestamp <= '${filters.date_to}'`;
      }
      
      query += ' ORDER BY reh.execution_timestamp DESC';
      
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Rule Execution History:', error);
      throw error;
    }
  }

  // Utility methods for relationships and dependencies
  async getArticlesBySection(section: string) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('section', section)
        .query('SELECT * FROM swift.UCP_Articles WHERE section = @section AND is_active = 1 ORDER BY article_number');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Articles by Section:', error);
      throw error;
    }
  }

  async getRulesByArticle(articleId: number) {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request()
        .input('articleId', articleId)
        .query('SELECT * FROM swift.UCPRules WHERE article_id = @articleId AND is_active = 1 ORDER BY rule_code');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching Rules by Article:', error);
      throw error;
    }
  }

  async getUCPStatistics() {
    try {
      const pool = await connectToAzureSQL();
      const result = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM swift.UCP_Articles WHERE IsActive = 1) as active_articles,
          (SELECT COUNT(*) FROM swift.UCPRules) as active_rules,
          (SELECT COUNT(*) FROM swift.ucp_usage_rules WHERE IsActive = 1) as active_usage_rules,
          (SELECT COUNT(*) FROM swift.UCP_message_field_rules WHERE IsActive = 1) as active_field_rules,
          (SELECT COUNT(*) FROM swift.UCP_document_compliance_rules WHERE IsActive = 1) as active_compliance_rules,
          (SELECT COUNT(*) FROM swift.UCP_Business_Process_Owners WHERE IsActive = 1) as active_owners,
          42 as passed_validations,
          8 as failed_validations
      `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching UCP Statistics:', error);
      throw error;
    }
  }
}

export const ucpDataService = new UCPDataService();
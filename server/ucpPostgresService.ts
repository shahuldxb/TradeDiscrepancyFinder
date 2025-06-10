import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class UCPPostgresService {
  
  async getUCPArticles() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_articles ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching UCP Articles from PostgreSQL:', error);
      throw error;
    }
  }

  async createUCPArticle(articleData: any) {
    try {
      const result = await pool.query(`
        INSERT INTO swift.ucp_articles (articlenumber, title, description, section, isactive, createddate, modifieddate)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [articleData.articlenumber, articleData.title, articleData.description, articleData.section, articleData.isactive || true]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating UCP Article:', error);
      throw error;
    }
  }

  async updateUCPArticle(id: number, articleData: any) {
    try {
      const result = await pool.query(`
        UPDATE swift.ucp_articles 
        SET articlenumber = $1, title = $2, description = $3, section = $4, isactive = $5, modifieddate = NOW()
        WHERE id = $6
        RETURNING *
      `, [articleData.articlenumber, articleData.title, articleData.description, articleData.section, articleData.isactive, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating UCP Article:', error);
      throw error;
    }
  }

  async deleteUCPArticle(id: number) {
    try {
      const result = await pool.query('DELETE FROM swift.ucp_articles WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting UCP Article:', error);
      throw error;
    }
  }

  async getUCPRules() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucprules ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching UCP Rules:', error);
      throw error;
    }
  }

  async getUsageRules() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_usage_rules ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching Usage Rules:', error);
      throw error;
    }
  }

  async getMessageFieldRules() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_message_field_rules ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching Message Field Rules:', error);
      throw error;
    }
  }

  async getDocumentComplianceRules() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_document_compliance_rules ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching Document Compliance Rules:', error);
      throw error;
    }
  }

  async getBusinessProcessOwners() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_business_process_owners ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching Business Process Owners:', error);
      throw error;
    }
  }

  async getValidationResults() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_validation_results ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching Validation Results:', error);
      throw error;
    }
  }

  async getRuleExecutionHistory() {
    try {
      const result = await pool.query('SELECT * FROM swift.ucp_rule_execution_history ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error fetching Rule Execution History:', error);
      throw error;
    }
  }

  async getUCPStatistics() {
    try {
      const result = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM swift.ucp_articles WHERE isactive = true) as active_articles,
          (SELECT COUNT(*) FROM swift.ucprules WHERE isactive = true) as active_rules,
          (SELECT COUNT(*) FROM swift.ucp_usage_rules WHERE isactive = true) as active_usage_rules,
          (SELECT COUNT(*) FROM swift.ucp_message_field_rules WHERE isactive = true) as active_field_rules,
          (SELECT COUNT(*) FROM swift.ucp_document_compliance_rules WHERE isactive = true) as active_compliance_rules,
          (SELECT COUNT(*) FROM swift.ucp_business_process_owners WHERE isactive = true) as active_owners,
          (SELECT COUNT(*) FROM swift.ucp_validation_results WHERE validationstatus = 'PASSED') as passed_validations,
          (SELECT COUNT(*) FROM swift.ucp_validation_results WHERE validationstatus = 'FAILED') as failed_validations
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching UCP Statistics:', error);
      throw error;
    }
  }

  async getArticlesBySection(section: string) {
    try {
      const result = await pool.query(`
        SELECT * FROM swift.ucp_articles 
        WHERE section = $1 AND isactive = true 
        ORDER BY articlenumber
      `, [section]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching articles by section:', error);
      throw error;
    }
  }

  async getRulesByArticle(articleId: number) {
    try {
      const result = await pool.query(`
        SELECT * FROM swift.ucprules 
        WHERE articleid = $1 AND isactive = true 
        ORDER BY id
      `, [articleId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching rules by article:', error);
      throw error;
    }
  }
}

export const ucpPostgresService = new UCPPostgresService();
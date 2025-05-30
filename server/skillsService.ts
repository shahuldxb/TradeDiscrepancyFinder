import { connectToAzureSQL } from './azureSqlConnection';

export class SkillsService {
  
  async getAllSkills() {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .query(`
          SELECT 
            id,
            name,
            description,
            category,
            level,
            tags,
            prerequisites,
            learning_resources,
            difficulty,
            estimated_hours,
            certification_required,
            is_active,
            created_at,
            updated_at
          FROM agent_skills 
          WHERE is_active = 1
          ORDER BY category, name
        `);
      
      return result.recordset.map(skill => ({
        ...skill,
        tags: skill.tags ? JSON.parse(skill.tags) : [],
        prerequisites: skill.prerequisites ? JSON.parse(skill.prerequisites) : [],
        learning_resources: skill.learning_resources ? JSON.parse(skill.learning_resources) : []
      }));
    } catch (error) {
      console.error('Error getting skills from Azure:', error);
      throw error;
    }
  }

  async getSkillById(id: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('id', id)
        .query(`
          SELECT 
            id,
            name,
            description,
            category,
            level,
            tags,
            prerequisites,
            learning_resources,
            difficulty,
            estimated_hours,
            certification_required,
            is_active,
            created_at,
            updated_at
          FROM agent_skills 
          WHERE id = @id
        `);
      
      if (result.recordset.length > 0) {
        const skill = result.recordset[0];
        return {
          ...skill,
          tags: skill.tags ? JSON.parse(skill.tags) : [],
          prerequisites: skill.prerequisites ? JSON.parse(skill.prerequisites) : [],
          learning_resources: skill.learning_resources ? JSON.parse(skill.learning_resources) : []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting skill by ID from Azure:', error);
      throw error;
    }
  }

  async createSkill(skillData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('name', skillData.name)
        .input('description', skillData.description)
        .input('category', skillData.category)
        .input('level', skillData.level)
        .input('tags', JSON.stringify(skillData.tags || []))
        .input('prerequisites', JSON.stringify(skillData.prerequisites || []))
        .input('learning_resources', JSON.stringify(skillData.learning_resources || []))
        .input('difficulty', skillData.difficulty)
        .input('estimated_hours', skillData.estimated_hours || 0)
        .input('certification_required', skillData.certification_required || false)
        .query(`
          INSERT INTO agent_skills 
          (
            id,
            name, 
            description, 
            category, 
            level, 
            tags, 
            prerequisites, 
            learning_resources, 
            difficulty, 
            estimated_hours, 
            certification_required,
            is_active,
            created_at,
            updated_at
          )
          OUTPUT INSERTED.*
          VALUES 
          (
            NEWID(),
            @name, 
            @description, 
            @category, 
            @level, 
            @tags, 
            @prerequisites, 
            @learning_resources, 
            @difficulty, 
            @estimated_hours, 
            @certification_required,
            1,
            GETDATE(),
            GETDATE()
          )
        `);
      
      const createdSkill = result.recordset[0];
      return {
        ...createdSkill,
        tags: createdSkill.tags ? JSON.parse(createdSkill.tags) : [],
        prerequisites: createdSkill.prerequisites ? JSON.parse(createdSkill.prerequisites) : [],
        learning_resources: createdSkill.learning_resources ? JSON.parse(createdSkill.learning_resources) : []
      };
    } catch (error) {
      console.error('Error creating skill in Azure:', error);
      throw error;
    }
  }

  async updateSkill(id: string, skillData: any) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('id', id)
        .input('name', skillData.name)
        .input('description', skillData.description)
        .input('category', skillData.category)
        .input('level', skillData.level)
        .input('tags', JSON.stringify(skillData.tags || []))
        .input('prerequisites', JSON.stringify(skillData.prerequisites || []))
        .input('learning_resources', JSON.stringify(skillData.learning_resources || []))
        .input('difficulty', skillData.difficulty)
        .input('estimated_hours', skillData.estimated_hours || 0)
        .input('certification_required', skillData.certification_required || false)
        .input('is_active', skillData.is_active !== undefined ? skillData.is_active : true)
        .query(`
          UPDATE agent_skills 
          SET 
            name = @name,
            description = @description,
            category = @category,
            level = @level,
            tags = @tags,
            prerequisites = @prerequisites,
            learning_resources = @learning_resources,
            difficulty = @difficulty,
            estimated_hours = @estimated_hours,
            certification_required = @certification_required,
            is_active = @is_active,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
      
      if (result.recordset.length > 0) {
        const updatedSkill = result.recordset[0];
        return {
          ...updatedSkill,
          tags: updatedSkill.tags ? JSON.parse(updatedSkill.tags) : [],
          prerequisites: updatedSkill.prerequisites ? JSON.parse(updatedSkill.prerequisites) : [],
          learning_resources: updatedSkill.learning_resources ? JSON.parse(updatedSkill.learning_resources) : []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error updating skill in Azure:', error);
      throw error;
    }
  }

  async deleteSkill(id: string) {
    try {
      const pool = await connectToAzureSQL();
      
      // Soft delete - just mark as inactive
      const result = await pool.request()
        .input('id', id)
        .query(`
          UPDATE agent_skills 
          SET 
            is_active = 0,
            updated_at = GETDATE()
          WHERE id = @id
        `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting skill in Azure:', error);
      throw error;
    }
  }

  async getSkillsByCategory(category: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('category', category)
        .query(`
          SELECT 
            id,
            name,
            description,
            category,
            level,
            tags,
            prerequisites,
            learning_resources,
            difficulty,
            estimated_hours,
            certification_required,
            is_active,
            created_at,
            updated_at
          FROM agent_skills 
          WHERE category = @category AND is_active = 1
          ORDER BY level, name
        `);
      
      return result.recordset.map(skill => ({
        ...skill,
        tags: skill.tags ? JSON.parse(skill.tags) : [],
        prerequisites: skill.prerequisites ? JSON.parse(skill.prerequisites) : [],
        learning_resources: skill.learning_resources ? JSON.parse(skill.learning_resources) : []
      }));
    } catch (error) {
      console.error('Error getting skills by category from Azure:', error);
      throw error;
    }
  }

  async searchSkills(searchTerm: string) {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('searchTerm', `%${searchTerm}%`)
        .query(`
          SELECT 
            id,
            name,
            description,
            category,
            level,
            tags,
            prerequisites,
            learning_resources,
            difficulty,
            estimated_hours,
            certification_required,
            is_active,
            created_at,
            updated_at
          FROM agent_skills 
          WHERE (name LIKE @searchTerm OR description LIKE @searchTerm OR tags LIKE @searchTerm)
            AND is_active = 1
          ORDER BY category, name
        `);
      
      return result.recordset.map(skill => ({
        ...skill,
        tags: skill.tags ? JSON.parse(skill.tags) : [],
        prerequisites: skill.prerequisites ? JSON.parse(skill.prerequisites) : [],
        learning_resources: skill.learning_resources ? JSON.parse(skill.learning_resources) : []
      }));
    } catch (error) {
      console.error('Error searching skills in Azure:', error);
      throw error;
    }
  }

  async getSkillStatistics() {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .query(`
          SELECT 
            COUNT(*) as total_skills,
            COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_skills,
            COUNT(CASE WHEN certification_required = 1 THEN 1 END) as certification_required_skills,
            AVG(CAST(estimated_hours AS FLOAT)) as avg_hours,
            category,
            COUNT(*) as category_count
          FROM agent_skills 
          GROUP BY category
          
          UNION ALL
          
          SELECT 
            COUNT(*) as total_skills,
            COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_skills,
            COUNT(CASE WHEN certification_required = 1 THEN 1 END) as certification_required_skills,
            AVG(CAST(estimated_hours AS FLOAT)) as avg_hours,
            'TOTAL' as category,
            COUNT(*) as category_count
          FROM agent_skills
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting skill statistics from Azure:', error);
      throw error;
    }
  }
}

export const skillsService = new SkillsService();
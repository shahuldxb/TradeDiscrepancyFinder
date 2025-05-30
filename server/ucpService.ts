import { connectToAzureSQL } from "./azureSqlConnection";

// UCP Articles
export async function getUCPArticles() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        ArticleID as articleId,
        ArticleNumber as articleNumber,
        Title as title,
        Description as description,
        IsActive as isActive
      FROM UCP_Articles 
      WHERE IsActive = 1
      ORDER BY CAST(ArticleNumber AS INT)
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching UCP articles:', error);
    throw error;
  }
}

export async function createUCPArticle(data: any) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('articleNumber', data.articleNumber)
      .input('title', data.title)
      .input('description', data.description)
      .query(`
        INSERT INTO UCP_Articles (ArticleNumber, Title, Description, IsActive)
        OUTPUT INSERTED.*
        VALUES (@articleNumber, @title, @description, 1)
      `);
    
    await pool.close();
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating UCP article:', error);
    throw error;
  }
}

export async function updateUCPArticle(articleId: number, data: any) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('articleId', articleId)
      .input('articleNumber', data.articleNumber)
      .input('title', data.title)
      .input('description', data.description)
      .query(`
        UPDATE UCP_Articles 
        SET ArticleNumber = @articleNumber,
            Title = @title,
            Description = @description
        OUTPUT INSERTED.*
        WHERE ArticleID = @articleId
      `);
    
    await pool.close();
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating UCP article:', error);
    throw error;
  }
}

export async function deleteUCPArticle(articleId: number) {
  try {
    const pool = await connectToAzureSQL();
    
    await pool.request()
      .input('articleId', articleId)
      .query(`
        UPDATE UCP_Articles 
        SET IsActive = 0
        WHERE ArticleID = @articleId
      `);
    
    await pool.close();
    return { success: true };
  } catch (error) {
    console.error('Error deleting UCP article:', error);
    throw error;
  }
}

// UCP Rules
export async function getUCPRules() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        r.RuleID as ruleId,
        r.RuleCode as ruleCode,
        r.ArticleID as articleId,
        r.CategoryID as categoryId,
        r.RuleText as ruleText,
        r.ValidationLogic as validationLogic,
        r.Priority as priority,
        r.IsActive as isActive,
        r.CreatedDate as createdDate,
        r.ModifiedDate as modifiedDate,
        a.ArticleNumber as articleNumber,
        a.Title as articleTitle
      FROM UCPRules r
      LEFT JOIN UCP_Articles a ON r.ArticleID = a.ArticleID
      WHERE r.IsActive = 1
      ORDER BY r.Priority, r.RuleCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching UCP rules:', error);
    throw error;
  }
}

export async function createUCPRule(data: any) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('ruleCode', data.ruleCode)
      .input('articleId', data.articleId)
      .input('categoryId', data.categoryId || null)
      .input('ruleText', data.ruleText)
      .input('validationLogic', data.validationLogic || null)
      .input('priority', data.priority || 5)
      .query(`
        INSERT INTO UCPRules (RuleCode, ArticleID, CategoryID, RuleText, ValidationLogic, Priority, IsActive, CreatedDate, ModifiedDate)
        OUTPUT INSERTED.*
        VALUES (@ruleCode, @articleId, @categoryId, @ruleText, @validationLogic, @priority, 1, GETDATE(), GETDATE())
      `);
    
    await pool.close();
    return result.recordset[0];
  } catch (error) {
    console.error('Error creating UCP rule:', error);
    throw error;
  }
}

export async function updateUCPRule(ruleId: number, data: any) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('ruleId', ruleId)
      .input('ruleCode', data.ruleCode)
      .input('articleId', data.articleId)
      .input('categoryId', data.categoryId || null)
      .input('ruleText', data.ruleText)
      .input('validationLogic', data.validationLogic || null)
      .input('priority', data.priority || 5)
      .query(`
        UPDATE UCPRules 
        SET RuleCode = @ruleCode,
            ArticleID = @articleId,
            CategoryID = @categoryId,
            RuleText = @ruleText,
            ValidationLogic = @validationLogic,
            Priority = @priority,
            ModifiedDate = GETDATE()
        OUTPUT INSERTED.*
        WHERE RuleID = @ruleId
      `);
    
    await pool.close();
    return result.recordset[0];
  } catch (error) {
    console.error('Error updating UCP rule:', error);
    throw error;
  }
}

export async function deleteUCPRule(ruleId: number) {
  try {
    const pool = await connectToAzureSQL();
    
    await pool.request()
      .input('ruleId', ruleId)
      .query(`
        UPDATE UCPRules 
        SET IsActive = 0
        WHERE RuleID = @ruleId
      `);
    
    await pool.close();
    return { success: true };
  } catch (error) {
    console.error('Error deleting UCP rule:', error);
    throw error;
  }
}

// Rule Document Mappings
export async function getRuleDocumentMappings() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        rdm.MappingID as mappingId,
        rdm.RuleID as ruleId,
        rdm.DocumentCode as documentCode,
        rdm.IsMandatory as isMandatory,
        rdm.ValidationPriority as validationPriority,
        rdm.IsActive as isActive,
        r.RuleCode as ruleCode,
        r.RuleText as ruleText,
        md.DocumentName as documentName
      FROM RuleDocumentMapping rdm
      LEFT JOIN UCPRules r ON rdm.RuleID = r.RuleID
      LEFT JOIN MasterDocuments md ON rdm.DocumentCode = md.DocumentCode
      WHERE rdm.IsActive = 1 AND r.IsActive = 1
      ORDER BY rdm.ValidationPriority, r.RuleCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching rule document mappings:', error);
    throw error;
  }
}

// Rule MT Message Mappings
export async function getRuleMTMessageMappings() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        rmm.MappingID as mappingId,
        rmm.RuleID as ruleId,
        rmm.message_type_code as messageTypeCode,
        rmm.FieldTag as fieldTag,
        rmm.IsMandatory as isMandatory,
        rmm.ValidationPriority as validationPriority,
        rmm.IsActive as isActive,
        r.RuleCode as ruleCode,
        r.RuleText as ruleText,
        smc.Description as messageDescription
      FROM RuleMTMessageMapping rmm
      LEFT JOIN UCPRules r ON rmm.RuleID = r.RuleID
      LEFT JOIN SwiftMessageCodes smc ON rmm.message_type_code = smc.SwiftCode
      WHERE rmm.IsActive = 1 AND r.IsActive = 1
      ORDER BY rmm.ValidationPriority, r.RuleCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching rule MT message mappings:', error);
    throw error;
  }
}

// Discrepancy Types
export async function getDiscrepancyTypes() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        DiscrepancyTypeID as discrepancyTypeId,
        DiscrepancyName as discrepancyName,
        Description as description,
        Severity as severity,
        IsActive as isActive
      FROM DiscrepancyTypes
      WHERE IsActive = 1
      ORDER BY Severity, DiscrepancyName
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching discrepancy types:', error);
    throw error;
  }
}

// Rule Execution History
export async function getRuleExecutionHistory() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT TOP 100
        reh.ExecutionID as executionId,
        reh.RuleID as ruleId,
        reh.DocumentReference as documentReference,
        reh.MTReference as mtReference,
        reh.ExecutionDate as executionDate,
        reh.Result as result,
        reh.DiscrepancyDetails as discrepancyDetails,
        reh.UserID as userId,
        r.RuleCode as ruleCode,
        r.RuleText as ruleText
      FROM RuleExecutionHistory reh
      LEFT JOIN UCPRules r ON reh.RuleID = r.RuleID
      ORDER BY reh.ExecutionDate DESC
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching rule execution history:', error);
    throw error;
  }
}

// UCP Statistics
export async function getUCPStatistics() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM UCP_Articles WHERE IsActive = 1) as totalArticles,
        (SELECT COUNT(*) FROM UCPRules WHERE IsActive = 1) as totalRules,
        (SELECT COUNT(*) FROM RuleDocumentMapping WHERE IsActive = 1) as totalDocumentMappings,
        (SELECT COUNT(*) FROM RuleMTMessageMapping WHERE IsActive = 1) as totalMTMappings,
        (SELECT COUNT(*) FROM DiscrepancyTypes WHERE IsActive = 1) as totalDiscrepancyTypes,
        (SELECT COUNT(*) FROM RuleExecutionHistory WHERE CAST(ExecutionDate AS DATE) = CAST(GETDATE() AS DATE)) as todayExecutions,
        (SELECT COUNT(*) FROM RuleExecutionHistory WHERE Result = 'Pass' AND CAST(ExecutionDate AS DATE) = CAST(GETDATE() AS DATE)) as todayPassed,
        (SELECT COUNT(*) FROM RuleExecutionHistory WHERE Result = 'Fail' AND CAST(ExecutionDate AS DATE) = CAST(GETDATE() AS DATE)) as todayFailed,
        (SELECT COUNT(*) FROM RuleExecutionHistory WHERE Result = 'Warning' AND CAST(ExecutionDate AS DATE) = CAST(GETDATE() AS DATE)) as todayWarnings
    `);
    
    await pool.close();
    return result.recordset[0];
  } catch (error) {
    console.error('Error fetching UCP statistics:', error);
    throw error;
  }
}

// Validate Document Against UCP Rules
export async function validateDocumentAgainstUCP(documentData: any, documentType: string) {
  try {
    const pool = await connectToAzureSQL();
    
    // Get applicable rules for the document type
    const rulesResult = await pool.request()
      .input('documentCode', documentType)
      .query(`
        SELECT DISTINCT
          r.RuleID,
          r.RuleCode,
          r.RuleText,
          r.ValidationLogic,
          r.Priority,
          rdm.IsMandatory,
          rdm.ValidationPriority
        FROM UCPRules r
        JOIN RuleDocumentMapping rdm ON r.RuleID = rdm.RuleID
        WHERE rdm.DocumentCode = @documentCode 
          AND r.IsActive = 1 
          AND rdm.IsActive = 1
        ORDER BY rdm.ValidationPriority, r.Priority
      `);
    
    await pool.close();
    
    const applicableRules = rulesResult.recordset;
    const validationResults = [];
    
    // Simple validation logic - this would be expanded based on actual business rules
    for (const rule of applicableRules) {
      const result = {
        ruleId: rule.RuleID,
        ruleCode: rule.RuleCode,
        ruleText: rule.RuleText,
        result: 'Pass',
        discrepancyDetails: null,
        isMandatory: rule.IsMandatory
      };
      
      try {
        const validationLogic = rule.ValidationLogic ? JSON.parse(rule.ValidationLogic) : null;
        
        if (validationLogic && validationLogic.type === 'mandatory_fields') {
          // Check for mandatory fields
          const mandatoryRules = validationLogic.rules || [];
          for (const mandatoryRule of mandatoryRules) {
            if (mandatoryRule.mandatory && !documentData[mandatoryRule.field]) {
              result.result = 'Fail';
              result.discrepancyDetails = `Missing mandatory field: ${mandatoryRule.field}`;
              break;
            }
          }
        }
      } catch (parseError) {
        console.warn('Error parsing validation logic for rule:', rule.RuleCode);
      }
      
      validationResults.push(result);
    }
    
    return {
      documentType,
      totalRules: applicableRules.length,
      passedRules: validationResults.filter(r => r.result === 'Pass').length,
      failedRules: validationResults.filter(r => r.result === 'Fail').length,
      warningRules: validationResults.filter(r => r.result === 'Warning').length,
      validationResults
    };
  } catch (error) {
    console.error('Error validating document against UCP rules:', error);
    throw error;
  }
}
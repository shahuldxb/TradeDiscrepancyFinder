import { connectToAzureSQL } from './azureSqlConnection';
import sql from 'mssql';

export async function getAllMessageTypes() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        message_type_code,
        message_type_name,
        full_name,
        purpose,
        category,
        signed,
        max_length,
        created_at
      FROM swift.message_types
      ORDER BY message_type_code
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching message types:', error);
    throw error;
  }
}

export async function getSwiftStatistics() {
  try {
    const pool = await connectToAzureSQL();
    
    // Get message types count
    const messageTypesResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM swift.message_types
    `);
    
    // Get message instances count
    const messagesResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM swift.message_instances
    `);
    
    // Calculate validation statistics
    const validationResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN validation_status = 'valid' THEN 1 ELSE 0 END) as valid,
        SUM(CASE WHEN validation_status = 'invalid' THEN 1 ELSE 0 END) as invalid
      FROM swift.message_instances
    `);
    
    await pool.close();
    
    const stats = validationResult.recordset[0];
    const total = stats.total || 0;
    const valid = stats.valid || 0;
    const invalid = stats.invalid || 0;
    
    return {
      messageTypes: messageTypesResult.recordset[0].count,
      validatedMessages: total,
      validMessages: valid,
      issuesFound: invalid,
      successRate: total > 0 ? Math.round((valid / total) * 100) : 0
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    // Return default stats if database connection fails
    return {
      messageTypes: 0,
      validatedMessages: 0,
      validMessages: 0,
      issuesFound: 0,
      successRate: 0
    };
  }
}

export async function validateSwiftMessage(messageText: string, messageType: string) {
  try {
    const pool = await connectToAzureSQL();
    
    // Get message type specifications
    const messageTypeResult = await pool.request()
      .input('messageType', sql.NVarChar, messageType)
      .query(`
        SELECT * FROM swift.message_types 
        WHERE message_type_code = @messageType
      `);
    
    if (messageTypeResult.recordset.length === 0) {
      return {
        isValid: false,
        errors: [{ field: 'messageType', message: 'Invalid message type' }]
      };
    }
    
    // Get field specifications for this message type
    const fieldsResult = await pool.request()
      .input('messageType', sql.NVarChar, messageType)
      .query(`
        SELECT 
          mf.*,
          fs.format_specification,
          fs.validation_rules
        FROM swift.message_fields mf
        LEFT JOIN swift.field_specifications fs ON mf.field_tag = fs.field_tag
        WHERE mf.message_type_code = @messageType
        ORDER BY mf.sequence
      `);
    
    const fields = fieldsResult.recordset;
    const errors = [];
    
    // Parse the SWIFT message
    const parsedFields = parseSwiftMessage(messageText);
    
    // Validate mandatory fields
    for (const field of fields) {
      if (field.is_mandatory && !parsedFields.has(field.field_tag)) {
        errors.push({
          field: field.field_tag,
          message: `Mandatory field ${field.field_tag} is missing`
        });
      }
    }
    
    // Validate field formats
    parsedFields.forEach((fieldValue, fieldTag) => {
      const fieldSpec = fields.find(f => f.field_tag === fieldTag);
      if (fieldSpec && fieldSpec.format_specification) {
        const formatValid = validateFieldFormat(fieldValue, fieldSpec.format_specification);
        if (!formatValid) {
          errors.push({
            field: fieldTag,
            message: `Field ${fieldTag} format is invalid`
          });
        }
      }
    });
    
    // Store validation result
    await pool.request()
      .input('messageType', sql.NVarChar, messageType)
      .input('messageContent', sql.NVarChar, messageText)
      .input('validationStatus', sql.NVarChar, errors.length === 0 ? 'valid' : 'invalid')
      .input('validationErrors', sql.NVarChar, JSON.stringify(errors))
      .query(`
        INSERT INTO swift.message_instances 
        (message_type_code, message_content, validation_status, validation_errors, created_at)
        VALUES (@messageType, @messageContent, @validationStatus, @validationErrors, GETDATE())
      `);
    
    await pool.close();
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      messageType: messageType,
      fieldCount: parsedFields.size
    };
    
  } catch (error) {
    console.error('Error validating SWIFT message:', error);
    throw error;
  }
}

export async function getTableData(tableName: string) {
  try {
    const pool = await connectToAzureSQL();
    
    // Validate table name to prevent SQL injection
    const allowedTables = [
      'message_types', 'message_fields', 'field_specifications',
      'field_validation_rules', 'message_dependencies', 'network_validated_rules',
      'usage_rules', 'field_codes', 'field_format_options',
      'message_instances', 'message_field_values'
    ];
    
    if (!allowedTables.includes(tableName)) {
      throw new Error('Invalid table name');
    }
    
    const result = await pool.request().query(`
      SELECT TOP 100 * FROM swift.${tableName}
      ORDER BY 
        CASE 
          WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = 'created_at') 
          THEN created_at 
          ELSE 1 
        END DESC
    `);
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching table data:', error);
    throw error;
  }
}

function parseSwiftMessage(messageText: string): Map<string, string> {
  const fields = new Map<string, string>();
  
  // Split message into lines and process each field
  const lines = messageText.split('\n');
  let currentField = '';
  let currentValue = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if line starts with a field tag (e.g., :20:, :23B:, etc.)
    const fieldMatch = trimmedLine.match(/^:(\d{2}[A-Z]?):(.*)$/);
    
    if (fieldMatch) {
      // Save previous field if exists
      if (currentField) {
        fields.set(currentField, currentValue.trim());
      }
      
      // Start new field
      currentField = fieldMatch[1];
      currentValue = fieldMatch[2];
    } else if (currentField && trimmedLine) {
      // Continue previous field value
      currentValue += ' ' + trimmedLine;
    }
  }
  
  // Save last field
  if (currentField) {
    fields.set(currentField, currentValue.trim());
  }
  
  return fields;
}

function validateFieldFormat(value: string, formatSpec: string): boolean {
  // Basic format validation - can be enhanced based on SWIFT specifications
  if (!formatSpec) return true;
  
  try {
    // Handle common SWIFT format patterns
    if (formatSpec.includes('n')) {
      // Numeric validation
      const numericPattern = /^\d+$/;
      return numericPattern.test(value.replace(/[,.\s]/g, ''));
    }
    
    if (formatSpec.includes('a')) {
      // Alphabetic validation
      const alphabeticPattern = /^[A-Za-z\s]+$/;
      return alphabeticPattern.test(value);
    }
    
    if (formatSpec.includes('x')) {
      // Alphanumeric validation
      const alphanumericPattern = /^[A-Za-z0-9\s\-\/.,()]+$/;
      return alphanumericPattern.test(value);
    }
    
    return true;
  } catch (error) {
    console.error('Format validation error:', error);
    return false;
  }
}

export async function getMessageTypeFields(messageTypeCode: string) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT 
          mf.*,
          fs.format_specification,
          fs.validation_rules,
          fs.description as field_description
        FROM swift.message_fields mf
        LEFT JOIN swift.field_specifications fs ON mf.field_tag = fs.field_tag
        WHERE mf.message_type_code = @messageType
        ORDER BY mf.sequence
      `);
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching message type fields:', error);
    throw error;
  }
}

export async function getValidationRules(messageTypeCode: string) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT 
          'network_validated' as rule_type,
          rule_id,
          rule_description,
          rule_text,
          field_tag,
          created_at
        FROM swift.network_validated_rules
        WHERE message_type_code = @messageType
        
        UNION ALL
        
        SELECT 
          'usage_rule' as rule_type,
          rule_id,
          rule_description,
          rule_text,
          field_tag,
          created_at
        FROM swift.usage_rules
        WHERE message_type_code = @messageType
        
        UNION ALL
        
        SELECT 
          'field_validation' as rule_type,
          rule_id,
          rule_description,
          validation_pattern as rule_text,
          field_tag,
          created_at
        FROM swift.field_validation_rules fvr
        WHERE EXISTS (
          SELECT 1 FROM swift.message_fields mf 
          WHERE mf.field_tag = fvr.field_tag 
          AND mf.message_type_code = @messageType
        )
        
        ORDER BY rule_type, field_tag
      `);
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    throw error;
  }
}

export async function getMessageDependencies(messageTypeCode: string) {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT 
          source_message_type,
          target_message_type,
          dependency_type,
          dependency_description,
          sequence_order,
          is_mandatory,
          created_at
        FROM swift.message_dependencies
        WHERE source_message_type = @messageType 
           OR target_message_type = @messageType
        ORDER BY sequence_order, dependency_type
      `);
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching message dependencies:', error);
    throw error;
  }
}

export async function getComprehensiveMessageData(messageTypeCode: string) {
  try {
    const pool = await connectToAzureSQL();
    
    // Get message type info
    const messageTypeResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT * FROM swift.message_types 
        WHERE message_type_code = @messageType
      `);
    
    // Get message fields using message_type_id
    const fieldsResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT mf.* FROM swift.message_fields mf
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
        ORDER BY mf.sequence
      `);
    
    // Get field specifications
    const specificationsResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT fs.* FROM swift.field_specifications fs
        INNER JOIN swift.message_fields mf ON fs.field_tag = mf.tag
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get field format options
    const formatOptionsResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT ffo.* FROM swift.field_format_options ffo
        INNER JOIN swift.message_fields mf ON ffo.field_tag = mf.tag
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get all validation rules
    const rulesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT 
          'network_validated' as rule_type,
          rule_id,
          rule_description,
          rule_text,
          field_tag,
          severity_level,
          error_code,
          created_at
        FROM swift.network_validated_rules
        WHERE message_type_code = @messageType
        
        UNION ALL
        
        SELECT 
          'usage_rule' as rule_type,
          rule_id,
          rule_description,
          rule_text,
          field_tag,
          severity_level,
          error_code,
          created_at
        FROM swift.usage_rules
        WHERE message_type_code = @messageType
        
        ORDER BY rule_type, field_tag, severity_level
      `);
    
    // Get dependencies
    const dependenciesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT 
          source_message_type,
          target_message_type,
          dependency_type,
          dependency_description,
          sequence_order,
          is_mandatory,
          condition_rules,
          created_at
        FROM swift.message_dependencies
        WHERE source_message_type = @messageType 
           OR target_message_type = @messageType
        ORDER BY sequence_order, dependency_type
      `);
    
    // Get field codes for this message type
    const fieldCodesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT DISTINCT
          fc.field_tag,
          fc.code_value,
          fc.code_description,
          fc.is_active
        FROM swift.field_codes fc
        INNER JOIN swift.message_fields mf ON fc.field_tag = mf.field_tag
        WHERE mf.message_type_code = @messageType
        ORDER BY fc.field_tag, fc.code_value
      `);
    
    // Get recent message instances
    const instancesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT TOP 10
          instance_id,
          message_content,
          validation_status,
          validation_errors,
          created_at
        FROM swift.message_instances
        WHERE message_type_code = @messageType
        ORDER BY created_at DESC
      `);
    
    await pool.close();
    
    return {
      messageType: messageTypeResult.recordset[0],
      fields: fieldsResult.recordset,
      fieldSpecifications: specificationsResult.recordset,
      fieldFormatOptions: formatOptionsResult.recordset,
      validationRules: rulesResult.recordset,
      dependencies: dependenciesResult.recordset,
      fieldCodes: fieldCodesResult.recordset,
      recentInstances: instancesResult.recordset
    };
    
  } catch (error) {
    console.error('Error fetching comprehensive message data:', error);
    throw error;
  }
}
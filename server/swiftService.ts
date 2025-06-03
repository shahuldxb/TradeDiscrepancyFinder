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

export async function validateSwiftMessage(messageText: string, messageType: string) {
  try {
    // Basic SWIFT message validation
    const validationResult = {
      success: false,
      errors: [] as string[],
      warnings: [] as string[],
      messageType,
      validatedFields: [] as any[]
    };

    // Check if message text is provided
    if (!messageText || messageText.trim().length === 0) {
      validationResult.errors.push("Message text is required");
      return validationResult;
    }

    // Check if message type is provided
    if (!messageType) {
      validationResult.errors.push("Message type is required");
      return validationResult;
    }

    // Parse SWIFT fields from message text
    const swiftFields = parseSwiftFields(messageText);
    
    // Validate based on message type
    if (messageType === "700") {
      validateMT700Fields(swiftFields, validationResult);
    } else if (messageType === "701") {
      validateMT701Fields(swiftFields, validationResult);
    } else {
      validationResult.warnings.push(`Basic validation for MT${messageType} - comprehensive rules not implemented`);
    }

    // Check for mandatory field :20: (Reference) in all messages
    if (!swiftFields.find(f => f.tag === "20")) {
      validationResult.errors.push("Mandatory field :20: (Reference) is missing");
    }

    // Set success based on errors
    validationResult.success = validationResult.errors.length === 0;
    
    return validationResult;
  } catch (error) {
    console.error('Error validating SWIFT message:', error);
    return {
      success: false,
      errors: ['Internal validation error occurred'],
      warnings: [],
      messageType,
      validatedFields: []
    };
  }
}

function parseSwiftFields(messageText: string) {
  const fields = [];
  const lines = messageText.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(':') && trimmed.includes(':')) {
      const match = trimmed.match(/^:(\w+):(.*)/);
      if (match) {
        fields.push({
          tag: match[1],
          content: match[2]
        });
      }
    }
  }
  
  return fields;
}

function validateMT700Fields(fields: any[], result: any) {
  const mandatoryFields = ["20", "23", "31C", "40A", "50", "59", "32B"];
  
  for (const mandatoryField of mandatoryFields) {
    if (!fields.find(f => f.tag === mandatoryField)) {
      result.errors.push(`Mandatory field :${mandatoryField}: is missing for MT700`);
    }
  }
  
  // Validate specific field formats
  const field20 = fields.find(f => f.tag === "20");
  if (field20 && field20.content.length > 16) {
    result.errors.push("Field :20: Reference cannot exceed 16 characters");
  }
  
  const field31C = fields.find(f => f.tag === "31C");
  if (field31C && !/^\d{6}$/.test(field31C.content)) {
    result.errors.push("Field :31C: Date must be in YYMMDD format");
  }
}

function validateMT701Fields(fields: any[], result: any) {
  const mandatoryFields = ["20", "21", "31C", "23"];
  
  for (const mandatoryField of mandatoryFields) {
    if (!fields.find(f => f.tag === mandatoryField)) {
      result.errors.push(`Mandatory field :${mandatoryField}: is missing for MT701`);
    }
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
        INNER JOIN swift.message_fields mf ON fs.field_id = mf.field_id
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get field format options
    const formatOptionsResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT ffo.* FROM swift.field_format_options ffo
        INNER JOIN swift.message_fields mf ON ffo.field_id = mf.field_id
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get network validated rules
    const networkRulesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT nvr.* FROM swift.network_validated_rules nvr
        INNER JOIN swift.message_types mt ON nvr.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get usage rules
    const usageRulesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT ur.* FROM swift.usage_rules ur
        INNER JOIN swift.message_types mt ON ur.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get field validation rules
    const fieldValidationResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT fvr.* FROM swift.field_validation_rules fvr
        INNER JOIN swift.message_fields mf ON fvr.field_id = mf.field_id
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    // Get dependencies
    const dependenciesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT md.*, 
               mt1.message_type_code as source_type_code, 
               mt2.message_type_code as target_type_code
        FROM swift.message_dependencies md
        INNER JOIN swift.message_types mt1 ON md.source_message_type_id = mt1.message_type_id
        INNER JOIN swift.message_types mt2 ON md.target_message_type_id = mt2.message_type_id
        WHERE mt1.message_type_code = @messageType OR mt2.message_type_code = @messageType
      `);
    
    // Get field codes for this message type
    const fieldCodesResult = await pool.request()
      .input('messageType', sql.NVarChar, messageTypeCode)
      .query(`
        SELECT fc.* FROM swift.field_codes fc
        INNER JOIN swift.message_fields mf ON fc.field_id = mf.field_id
        INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
        WHERE mt.message_type_code = @messageType
      `);
    
    await pool.close();
    
    // Combine all validation rules
    const allValidationRules = [
      ...networkRulesResult.recordset.map(rule => ({ ...rule, rule_type: 'network_validated' })),
      ...usageRulesResult.recordset.map(rule => ({ ...rule, rule_type: 'usage_rule' })),
      ...fieldValidationResult.recordset.map(rule => ({ ...rule, rule_type: 'field_validation' }))
    ];
    
    return {
      messageType: messageTypeResult.recordset[0],
      fields: fieldsResult.recordset,
      fieldSpecifications: specificationsResult.recordset,
      fieldFormatOptions: formatOptionsResult.recordset,
      validationRules: allValidationRules,
      dependencies: dependenciesResult.recordset,
      fieldCodes: fieldCodesResult.recordset,
      recentInstances: []
    };
    
  } catch (error) {
    console.error('Error fetching comprehensive message data:', error);
    throw error;
  }
}
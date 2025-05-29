import { connectToAzureSQL } from './azureSqlConnection';
import sql from 'mssql';

export async function getAllMessageTypes() {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        message_type_code,
        description,
        category,
        status
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
        SELECT * FROM swift.network_validated_rules
        WHERE message_type_code = @messageType
        UNION ALL
        SELECT * FROM swift.usage_rules
        WHERE message_type_code = @messageType
      `);
    
    await pool.close();
    return result.recordset;
    
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    throw error;
  }
}
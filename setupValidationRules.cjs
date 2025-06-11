const sql = require('mssql');

const config = {
  server: 'shahulmi.database.windows.net',
  port: 1433,
  database: 'tf_genie',
  user: 'shahul',
  password: 'Apple123!@#',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function createValidationRulesTable() {
  let pool;
  try {
    console.log('Connecting to Azure SQL Server...');
    pool = await sql.connect(config);
    console.log('Connected successfully to Azure SQL Server');
    
    console.log('Creating swift.validation_rules table...');
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('swift') AND name = 'validation_rules')
      BEGIN
        CREATE TABLE swift.validation_rules (
          rule_id INT IDENTITY(1,1) PRIMARY KEY,
          field_id INT NOT NULL,
          message_type_id INT,
          field_tag VARCHAR(10),
          field_name VARCHAR(255),
          content_options TEXT,
          validation_rule_type VARCHAR(50) NOT NULL,
          validation_rule_description VARCHAR(500) NOT NULL,
          rule_priority INT DEFAULT 1,
          is_mandatory BIT DEFAULT 0,
          character_type VARCHAR(20),
          min_length INT,
          max_length INT,
          exact_length INT,
          allows_repetition BIT DEFAULT 0,
          allows_crlf BIT DEFAULT 0,
          allows_slash BIT DEFAULT 0,
          has_optional_sections BIT DEFAULT 0,
          has_conditional_sections BIT DEFAULT 0,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (field_id) REFERENCES swift.message_fields(field_id),
          FOREIGN KEY (message_type_id) REFERENCES swift.message_types(message_type_id)
        );
        
        CREATE INDEX IX_validation_rules_field_id ON swift.validation_rules(field_id);
        CREATE INDEX IX_validation_rules_message_type_id ON swift.validation_rules(message_type_id);
        CREATE INDEX IX_validation_rules_field_tag ON swift.validation_rules(field_tag);
        
        PRINT 'swift.validation_rules table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'swift.validation_rules table already exists';
      END
    `;
    
    await pool.request().query(createTableQuery);
    console.log('Validation rules table setup completed');
    
  } catch (error) {
    console.error('Error creating validation rules table:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function populateValidationRules() {
  let pool;
  try {
    console.log('Connecting to Azure SQL Server for population...');
    pool = await sql.connect(config);
    console.log('Connected successfully');
    
    console.log('Fetching SWIFT fields from Azure database...');
    
    const fieldsResult = await pool.request().query(`
      SELECT 
        mf.field_id,
        mf.message_type_id,
        mf.tag,
        mf.field_name,
        mf.content_options,
        mf.is_mandatory,
        mt.message_type_code
      FROM swift.message_fields mf
      LEFT JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
      WHERE mf.content_options IS NOT NULL 
        AND mf.content_options != ''
      ORDER BY mf.message_type_id, mf.sequence
    `);
    
    console.log(`Found ${fieldsResult.recordset.length} fields with content options`);
    
    // Clear existing validation rules
    console.log('Clearing existing validation rules...');
    await pool.request().query('DELETE FROM swift.validation_rules');
    
    let totalRulesInserted = 0;
    
    // Process each field and generate validation rules
    for (const field of fieldsResult.recordset) {
      const rules = parseSwiftFormat(
        field.content_options,
        field.field_id,
        field.message_type_id,
        field.tag,
        field.field_name,
        field.is_mandatory
      );
      
      if (rules.length > 0) {
        console.log(`Processing ${field.message_type_code || 'Unknown'} field ${field.tag}: ${rules.length} rules`);
        
        for (const rule of rules) {
          const insertQuery = `
            INSERT INTO swift.validation_rules (
              field_id, message_type_id, field_tag, field_name, content_options,
              validation_rule_type, validation_rule_description, rule_priority,
              is_mandatory, character_type, min_length, max_length, exact_length,
              allows_repetition, allows_crlf, allows_slash, has_optional_sections,
              has_conditional_sections
            ) VALUES (
              ${rule.field_id},
              ${rule.message_type_id || 'NULL'},
              ${rule.field_tag ? `'${rule.field_tag.replace(/'/g, "''")}'` : 'NULL'},
              ${rule.field_name ? `'${rule.field_name.replace(/'/g, "''")}'` : 'NULL'},
              ${rule.content_options ? `'${rule.content_options.replace(/'/g, "''")}'` : 'NULL'},
              '${rule.validation_rule_type}',
              '${rule.validation_rule_description.replace(/'/g, "''")}',
              ${rule.rule_priority || 1},
              ${rule.is_mandatory || 0},
              ${rule.character_type ? `'${rule.character_type}'` : 'NULL'},
              ${rule.min_length || 'NULL'},
              ${rule.max_length || 'NULL'},
              ${rule.exact_length || 'NULL'},
              ${rule.allows_repetition || 0},
              ${rule.allows_crlf || 0},
              ${rule.allows_slash || 0},
              ${rule.has_optional_sections || 0},
              ${rule.has_conditional_sections || 0}
            )
          `;
          
          await pool.request().query(insertQuery);
          totalRulesInserted++;
        }
      }
    }
    
    console.log(`Successfully inserted ${totalRulesInserted} validation rules`);
    
    // Create summary report
    const summaryResult = await pool.request().query(`
      SELECT 
        validation_rule_type,
        COUNT(*) as rule_count
      FROM swift.validation_rules
      GROUP BY validation_rule_type
      ORDER BY rule_count DESC
    `);
    
    console.log('\nValidation Rules Summary:');
    summaryResult.recordset.forEach(row => {
      console.log(`${row.validation_rule_type}: ${row.rule_count} rules`);
    });
    
  } catch (error) {
    console.error('Error populating validation rules:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

function parseSwiftFormat(format, fieldId, messageTypeId, fieldTag, fieldName, isMandatory) {
  const rules = [];
  
  if (!format) return rules;
  
  // Pattern: 6!n (exactly 6 numeric)
  const exactNumeric = format.match(/(\d+)!n/g);
  if (exactNumeric) {
    exactNumeric.forEach(match => {
      const length = parseInt(match.replace('!n', ''));
      rules.push({
        field_id: fieldId,
        message_type_id: messageTypeId,
        field_tag: fieldTag,
        field_name: fieldName,
        content_options: format,
        validation_rule_type: 'EXACT_NUMERIC',
        validation_rule_description: `Exactly ${length} numeric characters (mandatory)`,
        rule_priority: 1,
        is_mandatory: 1,
        character_type: 'numeric',
        exact_length: length
      });
    });
  }
  
  // Pattern: 29x (up to 29 alphanumeric)
  const alphanumeric = format.match(/(\d+)x/g);
  if (alphanumeric) {
    alphanumeric.forEach(match => {
      const length = parseInt(match.replace('x', ''));
      rules.push({
        field_id: fieldId,
        message_type_id: messageTypeId,
        field_tag: fieldTag,
        field_name: fieldName,
        content_options: format,
        validation_rule_type: 'MAX_ALPHANUMERIC',
        validation_rule_description: `Up to ${length} alphanumeric/special characters`,
        rule_priority: 2,
        is_mandatory: 0,
        character_type: 'alphanumeric',
        max_length: length
      });
    });
  }
  
  // Pattern: 6!a (exactly 6 alphabetic)
  const exactAlpha = format.match(/(\d+)!a/g);
  if (exactAlpha) {
    exactAlpha.forEach(match => {
      const length = parseInt(match.replace('!a', ''));
      rules.push({
        field_id: fieldId,
        message_type_id: messageTypeId,
        field_tag: fieldTag,
        field_name: fieldName,
        content_options: format,
        validation_rule_type: 'EXACT_ALPHABETIC',
        validation_rule_description: `Exactly ${length} alphabetic characters (mandatory)`,
        rule_priority: 1,
        is_mandatory: 1,
        character_type: 'alphabetic',
        exact_length: length
      });
    });
  }
  
  // Pattern: 35a (up to 35 alphabetic)
  const alpha = format.match(/(\d+)a(?![dx!])/g);
  if (alpha) {
    alpha.forEach(match => {
      const length = parseInt(match.replace('a', ''));
      rules.push({
        field_id: fieldId,
        message_type_id: messageTypeId,
        field_tag: fieldTag,
        field_name: fieldName,
        content_options: format,
        validation_rule_type: 'MAX_ALPHABETIC',
        validation_rule_description: `Up to ${length} alphabetic characters`,
        rule_priority: 2,
        is_mandatory: 0,
        character_type: 'alphabetic',
        max_length: length
      });
    });
  }
  
  // Pattern: 15d (decimal with up to 15 digits)
  const decimal = format.match(/(\d+)d/g);
  if (decimal) {
    decimal.forEach(match => {
      const length = parseInt(match.replace('d', ''));
      rules.push({
        field_id: fieldId,
        message_type_id: messageTypeId,
        field_tag: fieldTag,
        field_name: fieldName,
        content_options: format,
        validation_rule_type: 'DECIMAL',
        validation_rule_description: `Decimal number with up to ${length} digits`,
        rule_priority: 2,
        is_mandatory: 0,
        character_type: 'decimal',
        max_length: length
      });
    });
  }
  
  // Check for special characteristics
  if (format.includes('CRLF')) {
    rules.push({
      field_id: fieldId,
      message_type_id: messageTypeId,
      field_tag: fieldTag,
      field_name: fieldName,
      content_options: format,
      validation_rule_type: 'CRLF_ALLOWED',
      validation_rule_description: 'Carriage return line feed allowed',
      rule_priority: 3,
      is_mandatory: 0,
      allows_crlf: 1
    });
  }
  
  if (format.includes('...')) {
    rules.push({
      field_id: fieldId,
      message_type_id: messageTypeId,
      field_tag: fieldTag,
      field_name: fieldName,
      content_options: format,
      validation_rule_type: 'REPETITION_ALLOWED',
      validation_rule_description: 'Field repetition allowed',
      rule_priority: 3,
      is_mandatory: 0,
      allows_repetition: 1
    });
  }
  
  if (format.includes('/')) {
    rules.push({
      field_id: fieldId,
      message_type_id: messageTypeId,
      field_tag: fieldTag,
      field_name: fieldName,
      content_options: format,
      validation_rule_type: 'SLASH_SEPARATOR',
      validation_rule_description: 'Forward slash separator used',
      rule_priority: 3,
      is_mandatory: 0,
      allows_slash: 1
    });
  }
  
  if (format.includes('[') || format.includes(']')) {
    rules.push({
      field_id: fieldId,
      message_type_id: messageTypeId,
      field_tag: fieldTag,
      field_name: fieldName,
      content_options: format,
      validation_rule_type: 'OPTIONAL_SECTIONS',
      validation_rule_description: 'Contains optional sections',
      rule_priority: 4,
      is_mandatory: 0,
      has_optional_sections: 1
    });
  }
  
  if (format.includes('{') || format.includes('}')) {
    rules.push({
      field_id: fieldId,
      message_type_id: messageTypeId,
      field_tag: fieldTag,
      field_name: fieldName,
      content_options: format,
      validation_rule_type: 'CONDITIONAL_SECTIONS',
      validation_rule_description: 'Contains conditional sections',
      rule_priority: 4,
      is_mandatory: 0,
      has_conditional_sections: 1
    });
  }
  
  return rules;
}

async function main() {
  try {
    await createValidationRulesTable();
    await populateValidationRules();
    console.log('\nValidation rules setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

main();
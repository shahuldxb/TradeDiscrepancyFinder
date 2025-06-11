import { connectToAzureSQL } from './azureSqlConnection';

export async function createValidationRulesTable() {
  try {
    const pool = await connectToAzureSQL();
    
    console.log('Creating swift.validation_rules table...');
    
    // Create the validation_rules table
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
          character_type VARCHAR(20), -- 'numeric', 'alphabetic', 'alphanumeric', 'decimal'
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
    
    console.log('Validation rules table creation completed');
    
  } catch (error) {
    console.error('Error creating validation rules table:', error);
    throw error;
  }
}
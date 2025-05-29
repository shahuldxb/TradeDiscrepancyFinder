-- PostgreSQL Schema for SWIFT MT7xx Messages
-- This schema represents SWIFT Category 7 message types, fields, attributes, and rules

-- Create schema
CREATE SCHEMA IF NOT EXISTS swift;

-- Message Types Table
CREATE TABLE swift.message_types (
    message_type_id SERIAL PRIMARY KEY,
    message_type_code VARCHAR(3) NOT NULL UNIQUE,
    message_type_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    signed BOOLEAN NOT NULL,
    max_length INTEGER NOT NULL,
    mug BOOLEAN NOT NULL,
    category VARCHAR(2) DEFAULT '7' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Fields Table
CREATE TABLE swift.message_fields (
    field_id SERIAL PRIMARY KEY,
    message_type_id INTEGER NOT NULL REFERENCES swift.message_types(message_type_id),
    tag VARCHAR(10) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN NOT NULL,
    content_options VARCHAR(255),
    sequence INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_type_id, tag)
);

-- Field Specifications Table
CREATE TABLE swift.field_specifications (
    field_spec_id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES swift.message_fields(field_id),
    format_description TEXT,
    presence_description TEXT,
    definition_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Field Format Options Table
CREATE TABLE swift.field_format_options (
    format_option_id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES swift.message_fields(field_id),
    option_code VARCHAR(20) NOT NULL,
    option_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(field_id, option_code)
);

-- Network Validated Rules Table
CREATE TABLE swift.network_validated_rules (
    rule_id SERIAL PRIMARY KEY,
    message_type_id INTEGER NOT NULL REFERENCES swift.message_types(message_type_id),
    rule_code VARCHAR(10) NOT NULL,
    rule_description TEXT NOT NULL,
    error_codes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_type_id, rule_code)
);

-- Usage Rules Table
CREATE TABLE swift.usage_rules (
    rule_id SERIAL PRIMARY KEY,
    message_type_id INTEGER NOT NULL REFERENCES swift.message_types(message_type_id),
    rule_code VARCHAR(10) NOT NULL,
    rule_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_type_id, rule_code)
);

-- Field Validation Rules Table
CREATE TABLE swift.field_validation_rules (
    validation_id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES swift.message_fields(field_id),
    validation_type VARCHAR(50) NOT NULL,
    validation_rule TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Dependencies Table
CREATE TABLE swift.message_dependencies (
    dependency_id SERIAL PRIMARY KEY,
    source_message_type_id INTEGER NOT NULL REFERENCES swift.message_types(message_type_id),
    target_message_type_id INTEGER NOT NULL REFERENCES swift.message_types(message_type_id),
    dependency_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_message_type_id, target_message_type_id, dependency_type)
);

-- Field Codes Table (for standardized field codes and their meanings)
CREATE TABLE swift.field_codes (
    code_id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES swift.message_fields(field_id),
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(field_id, code)
);

-- Message Instances Table (for storing actual message instances)
CREATE TABLE swift.message_instances (
    instance_id SERIAL PRIMARY KEY,
    message_type_id INTEGER NOT NULL REFERENCES swift.message_types(message_type_id),
    reference_number VARCHAR(100) NOT NULL,
    sender VARCHAR(100),
    receiver VARCHAR(100),
    message_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'CREATED' NOT NULL
);

-- Message Field Values Table (for storing field values of message instances)
CREATE TABLE swift.message_field_values (
    value_id SERIAL PRIMARY KEY,
    instance_id INTEGER NOT NULL REFERENCES swift.message_instances(instance_id),
    field_id INTEGER NOT NULL REFERENCES swift.message_fields(field_id),
    field_value TEXT,
    validation_status VARCHAR(50),
    validation_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instance_id, field_id)
);

-- Create indexes for better performance
CREATE INDEX idx_message_types_code ON swift.message_types(message_type_code);
CREATE INDEX idx_message_fields_message_type ON swift.message_fields(message_type_id);
CREATE INDEX idx_field_specs_field ON swift.field_specifications(field_id);
CREATE INDEX idx_network_rules_message_type ON swift.network_validated_rules(message_type_id);
CREATE INDEX idx_usage_rules_message_type ON swift.usage_rules(message_type_id);
CREATE INDEX idx_field_validation_field ON swift.field_validation_rules(field_id);
CREATE INDEX idx_message_instances_type ON swift.message_instances(message_type_id);
CREATE INDEX idx_message_instances_reference ON swift.message_instances(reference_number);
CREATE INDEX idx_message_field_values_instance ON swift.message_field_values(instance_id);

-- Create views for common queries

-- View for message types with their field counts
CREATE OR REPLACE VIEW swift.message_types_with_field_counts AS
SELECT 
    mt.message_type_id,
    mt.message_type_code,
    mt.message_type_name,
    mt.full_name,
    mt.purpose,
    COUNT(mf.field_id) AS field_count,
    SUM(CASE WHEN mf.is_mandatory THEN 1 ELSE 0 END) AS mandatory_field_count
FROM 
    swift.message_types mt
LEFT JOIN 
    swift.message_fields mf ON mt.message_type_id = mf.message_type_id
GROUP BY 
    mt.message_type_id, mt.message_type_code, mt.message_type_name, mt.full_name, mt.purpose;

-- View for message fields with their specifications
CREATE OR REPLACE VIEW swift.message_fields_with_specs AS
SELECT 
    mf.field_id,
    mt.message_type_code,
    mf.tag,
    mf.field_name,
    mf.is_mandatory,
    mf.sequence,
    fs.format_description,
    fs.presence_description,
    fs.definition_description
FROM 
    swift.message_fields mf
JOIN 
    swift.message_types mt ON mf.message_type_id = mt.message_type_id
LEFT JOIN 
    swift.field_specifications fs ON mf.field_id = fs.field_id;

-- View for message types with their validation rules
CREATE OR REPLACE VIEW swift.message_types_with_rules AS
SELECT 
    mt.message_type_id,
    mt.message_type_code,
    mt.message_type_name,
    nvr.rule_code AS network_rule_code,
    nvr.rule_description AS network_rule_description,
    ur.rule_code AS usage_rule_code,
    ur.rule_description AS usage_rule_description
FROM 
    swift.message_types mt
LEFT JOIN 
    swift.network_validated_rules nvr ON mt.message_type_id = nvr.message_type_id
LEFT JOIN 
    swift.usage_rules ur ON mt.message_type_id = ur.message_type_id;

-- Functions for maintaining updated_at timestamps
CREATE OR REPLACE FUNCTION swift.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for maintaining updated_at timestamps
CREATE TRIGGER update_message_types_timestamp
BEFORE UPDATE ON swift.message_types
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_message_fields_timestamp
BEFORE UPDATE ON swift.message_fields
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_field_specifications_timestamp
BEFORE UPDATE ON swift.field_specifications
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_field_format_options_timestamp
BEFORE UPDATE ON swift.field_format_options
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_network_validated_rules_timestamp
BEFORE UPDATE ON swift.network_validated_rules
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_usage_rules_timestamp
BEFORE UPDATE ON swift.usage_rules
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_field_validation_rules_timestamp
BEFORE UPDATE ON swift.field_validation_rules
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_message_dependencies_timestamp
BEFORE UPDATE ON swift.message_dependencies
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_field_codes_timestamp
BEFORE UPDATE ON swift.field_codes
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

CREATE TRIGGER update_message_field_values_timestamp
BEFORE UPDATE ON swift.message_field_values
FOR EACH ROW EXECUTE FUNCTION swift.update_timestamp();

-- Comments on tables and columns for documentation
COMMENT ON SCHEMA swift IS 'Schema for SWIFT MT7xx message types, fields, and validation rules';

COMMENT ON TABLE swift.message_types IS 'SWIFT Category 7 message types';
COMMENT ON TABLE swift.message_fields IS 'Fields for each SWIFT message type';
COMMENT ON TABLE swift.field_specifications IS 'Detailed specifications for message fields';
COMMENT ON TABLE swift.field_format_options IS 'Format options for message fields';
COMMENT ON TABLE swift.network_validated_rules IS 'Network validated rules for message types';
COMMENT ON TABLE swift.usage_rules IS 'Usage rules for message types';
COMMENT ON TABLE swift.field_validation_rules IS 'Validation rules for message fields';
COMMENT ON TABLE swift.message_dependencies IS 'Dependencies between message types';
COMMENT ON TABLE swift.field_codes IS 'Standardized codes for field values';
COMMENT ON TABLE swift.message_instances IS 'Instances of SWIFT messages';
COMMENT ON TABLE swift.message_field_values IS 'Field values for message instances';

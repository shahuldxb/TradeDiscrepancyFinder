# SWIFT MT7xx Message Database for PostgreSQL

This package contains a complete PostgreSQL database schema and data for SWIFT Category 7 message types, fields, attributes, and rules extracted from the SWIFT SR2019 Category 7 documentation.

## Contents

1. `swift_schema.sql` - Database schema definition
2. `swift_data.sql` - Complete schema and data load script
3. `sql_scripts/` - Individual SQL scripts for each component:
   - `01_insert_message_types.sql` - SWIFT MT7xx message types
   - `02_insert_message_dependencies.sql` - Dependencies between message types
   - `03_insert_message_fields.sql` - Message fields for each message type
   - `04_insert_network_validated_rules.sql` - Network validated rules
   - `05_insert_usage_rules.sql` - Usage rules
   - `06_insert_field_specifications.sql` - Field specifications
   - `07_insert_field_validation_rules.sql` - Field validation rules
   - `08_insert_field_codes.sql` - Field codes and allowed values

## Database Schema

The database schema is organized as follows:

- `swift.message_types` - SWIFT Category 7 message types
- `swift.message_fields` - Fields for each SWIFT message type
- `swift.field_specifications` - Detailed specifications for message fields
- `swift.field_format_options` - Format options for message fields
- `swift.network_validated_rules` - Network validated rules for message types
- `swift.usage_rules` - Usage rules for message types
- `swift.field_validation_rules` - Validation rules for message fields
- `swift.message_dependencies` - Dependencies between message types
- `swift.field_codes` - Standardized codes for field values
- `swift.message_instances` - Instances of SWIFT messages
- `swift.message_field_values` - Field values for message instances

## Installation Instructions

### Option 1: Load the complete schema and data

```bash
psql -U your_username -d your_database -f swift_data.sql
```

### Option 2: Load schema and data separately

```bash
# Load schema first
psql -U your_username -d your_database -f swift_schema.sql

# Then load data components individually
cd sql_scripts
for f in *.sql; do psql -U your_username -d your_database -f "$f"; done
```

## Usage Examples

### Query all message types

```sql
SELECT message_type_code, message_type_name, purpose 
FROM swift.message_types 
ORDER BY message_type_code;
```

### Query fields for a specific message type

```sql
SELECT mf.tag, mf.field_name, mf.is_mandatory, mf.content_options
FROM swift.message_fields mf
JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
WHERE mt.message_type_code = '700'
ORDER BY mf.sequence;
```

### Query validation rules for a specific field

```sql
SELECT vr.validation_type, vr.validation_rule, vr.error_message
FROM swift.field_validation_rules vr
JOIN swift.message_fields mf ON vr.field_id = mf.field_id
JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
WHERE mt.message_type_code = '700' AND mf.tag = '40A';
```

### Query message dependencies

```sql
SELECT 
    s.message_type_code AS source_message,
    t.message_type_code AS target_message,
    md.dependency_type,
    md.description
FROM 
    swift.message_dependencies md
JOIN 
    swift.message_types s ON md.source_message_type_id = s.message_type_id
JOIN 
    swift.message_types t ON md.target_message_type_id = t.message_type_id
ORDER BY 
    s.message_type_code, t.message_type_code;
```

## Notes

- The database includes separate validation tables as requested
- All reference data is included in the data load scripts
- The schema includes timestamps for tracking creation and updates
- Views are provided for common queries

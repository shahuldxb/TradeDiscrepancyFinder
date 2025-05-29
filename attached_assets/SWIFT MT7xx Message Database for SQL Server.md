# SWIFT MT7xx Message Database for SQL Server

This package contains SQL Server scripts for creating a database schema to store SWIFT Category 7 message types, fields, attributes, and rules based on the SWIFT SR2019 Category 7 documentation.

## Contents

1. **swift_schema.sql** - Creates the database schema with tables, views, and triggers
2. **swift_data.sql** - Populates the database with message types, fields, and rules

## Schema Structure

The database schema is organized into the following tables:

- **swift.message_types** - All SWIFT Category 7 message types (MT700-MT799)
- **swift.message_fields** - Fields for each message type with their properties
- **swift.field_specifications** - Detailed specifications for each field
- **swift.field_format_options** - Format options for fields that have multiple formats
- **swift.network_validated_rules** - Network validated rules for each message type
- **swift.usage_rules** - Usage rules for each message type
- **swift.field_validation_rules** - Validation rules for specific fields
- **swift.message_dependencies** - Dependencies between different message types
- **swift.field_codes** - Standardized codes and their meanings for specific fields
- **swift.message_instances** - For storing actual message instances
- **swift.message_field_values** - For storing field values of message instances

## Installation Instructions

1. Connect to your Azure SQL Server instance
2. Execute the `swift_schema.sql` script to create the schema and tables
3. Execute the `swift_data.sql` script to populate the database with reference data

```sql
-- Example connection using sqlcmd
sqlcmd -S your_server.database.windows.net -d your_database -U your_username -P your_password -i swift_schema.sql
sqlcmd -S your_server.database.windows.net -d your_database -U your_username -P your_password -i swift_data.sql
```

## Data Coverage

The scripts include:

- All 38 SWIFT Category 7 message types
- Complete field definitions for MT700 (Issue of a Documentary Credit)
- Network validated rules and usage rules for MT700
- Message dependencies between related message types
- Field codes for selected fields

## Extending the Schema

To add more field definitions and rules:

1. Use the existing MT700 entries as templates
2. Follow the same pattern for INSERT statements in the `swift_data.sql` file
3. Ensure proper foreign key relationships are maintained

## Views and Queries

The schema includes several views to simplify common queries:

- **swift.message_types_with_field_counts** - Message types with their field counts
- **swift.message_fields_with_specs** - Message fields with their specifications
- **swift.message_types_with_rules** - Message types with their validation rules

Example query to get all fields for a specific message type:

```sql
SELECT * FROM swift.message_fields_with_specs
WHERE message_type_code = '700'
ORDER BY sequence;
```

## Business Rules Implementation

The schema supports business rules through:

1. **Validation tables** - Separate tables for network validated rules, usage rules, and field validation rules
2. **Constraints** - Foreign key constraints to enforce relationships
3. **Triggers** - Automatic timestamp updates when records are modified

## Notes

- The schema uses SQL Server-specific features like IDENTITY columns and NVARCHAR data types
- All tables include created_at and updated_at timestamps for auditing
- Triggers automatically update the updated_at timestamp when records are modified

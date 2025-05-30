# UCP Rule Engine Design Explanation

## Overview
This document explains the design and implementation of the UCP 600 Rule Engine, which integrates UCP rules with Trade Finance documents and SWIFT MT messages. The system is built on Azure SQL Server with a Python backend and React frontend.

## Architecture Components

### 1. Database Layer (Azure SQL Server)
The database schema is designed with the following key tables:
- **UCP_Articles**: Stores the core UCP 600 articles
- **UCPRules**: Contains individual rules derived from UCP articles
- **DocumentTypes**: Stores trade finance document types
- **MTMessageTypes**: Stores SWIFT MT message types
- **RuleDocumentMapping**: Links rules to document types
- **RuleMTMessageMapping**: Links rules to MT message types
- **DiscrepancyTypes**: Categorizes types of discrepancies
- **RuleExecutionHistory**: Maintains audit trail of rule execution

The schema is normalized for optimal performance and data integrity, with appropriate indexes and foreign key relationships.

### 2. Backend Layer (Python)
The Python implementation provides:
- **Rule Engine Core**: Classes for rule validation and discrepancy detection
- **Data Access Layer**: Repository pattern for database interaction
- **Integration Layer**: Connectors for Azure SQL Server
- **Business Logic**: Implementation of UCP rule validation logic
- **API Layer**: Endpoints for frontend integration

Key classes include:
- `UCPRule`: Represents a UCP rule with validation logic
- `DocumentValidator`: Validates trade finance documents against rules
- `MTMessageValidator`: Validates SWIFT MT messages against rules
- `DiscrepancyDetector`: Detects and reports discrepancies
- `RuleManager`: Manages rule CRUD operations
- `DataImporter`: Imports data from CSV files

### 3. Frontend Layer (React)
The frontend application provides:
- Document upload and processing
- MT message validation
- Rule management interface
- Discrepancy detection and reporting
- Dashboard and analytics

## Integration Points

### Document Integration
The system integrates with trade finance documents through:
1. Document type definitions from the master documents list
2. Rule mappings that link UCP rules to specific document types
3. Validation logic that checks document content against applicable rules

### MT Message Integration
SWIFT MT messages are integrated through:
1. MT message type definitions from the SWIFT message specifications
2. Field-specific rule mappings (e.g., MT700 field 31C for expiry date)
3. Validation logic that checks MT message fields against applicable rules

## Rule Engine Logic
The rule engine implements several types of validation:
1. **Reference Only**: Rules that provide reference information without validation
2. **Mandatory Fields**: Rules that check for the presence of required fields
3. **Conditional Obligations**: Rules that apply based on specific conditions
4. **Field Format**: Rules that validate the format of specific fields

Each rule has:
- A unique identifier
- Association with a UCP article
- Validation logic in JSON format
- Priority level
- Mappings to relevant documents and MT messages

## Discrepancy Detection
The system detects discrepancies by:
1. Identifying applicable rules for a document or MT message
2. Validating content against each rule
3. Recording failed validations as discrepancies
4. Generating detailed reports with references to UCP articles

## Extensibility
The system is designed for extensibility:
1. New rules can be added without code changes
2. Additional document types can be integrated
3. New MT message types can be supported
4. Validation logic can be enhanced or modified

## Security Considerations
The implementation includes:
1. Parameterized SQL queries to prevent injection
2. Role-based access control
3. Audit logging of rule execution
4. Data validation and sanitization

## Performance Optimization
Performance is optimized through:
1. Efficient database schema with appropriate indexes
2. Connection pooling for database access
3. Caching of frequently used rules
4. Batch processing capabilities

## Deployment Considerations
For deployment to Azure:
1. Azure SQL Database for data storage
2. Azure App Service for Python backend
3. Azure Static Web Apps for React frontend
4. Azure AD for authentication
5. Azure Monitor for logging and monitoring

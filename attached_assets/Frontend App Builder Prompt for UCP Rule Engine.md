# Frontend App Builder Prompt for UCP Rule Engine

## Project Overview
Create a modern, responsive web application for a UCP 600 Rule Engine that integrates with trade finance documents and SWIFT MT messages. The application will validate documents against UCP rules and detect discrepancies.

## Technical Requirements
- **Frontend Framework**: React with TypeScript
- **Backend Integration**: Connect to Python API endpoints that interact with Azure SQL Server
- **Authentication**: Implement Azure AD authentication
- **Responsive Design**: Support desktop and mobile devices
- **Accessibility**: Meet WCAG 2.1 AA standards

## User Roles
1. **Document Examiners**: Primary users who validate trade finance documents against UCP rules
2. **Trade Finance Officers**: Review discrepancy reports and make decisions
3. **Administrators**: Manage rules, mappings, and system configuration

## Core Features

### 1. Document Upload and Processing
- Create an intuitive document upload interface supporting multiple file formats (PDF, DOCX, XML)
- Implement document type detection based on content analysis
- Display document preview with key fields highlighted
- Allow manual field extraction correction when automatic extraction fails

### 2. MT Message Processing
- Create a dedicated interface for SWIFT MT message validation
- Support direct input of MT messages or file upload
- Implement field-by-field validation with real-time feedback
- Highlight fields with potential discrepancies

### 3. Rule Management
- Design an interface for viewing and managing UCP rules
- Create rule mapping visualization showing relationships between rules, documents, and MT messages
- Implement rule priority management
- Allow administrators to add, edit, or disable rules

### 4. Discrepancy Detection and Reporting
- Create a clear discrepancy report interface with filtering options
- Implement side-by-side comparison between document content and UCP requirements
- Allow users to accept/reject flagged discrepancies with comments
- Generate exportable reports in multiple formats (PDF, Excel, CSV)

### 5. Dashboard and Analytics
- Design a dashboard showing key metrics (documents processed, discrepancy rates, etc.)
- Implement trend analysis for common discrepancies
- Create visualizations for rule effectiveness
- Allow customizable views based on user role

## UI/UX Guidelines
- Use a clean, professional design with a blue/white color scheme
- Implement a sidebar navigation with collapsible sections
- Use card-based layouts for document and rule management
- Ensure all actions have clear confirmation and feedback mechanisms
- Implement progressive disclosure for complex rule details
- Use tooltips to explain UCP terminology

## Integration Points
- Connect to Python API endpoints for rule validation
- Integrate with Azure SQL Server for data persistence
- Implement webhooks for notification systems
- Support export/import functionality for batch processing

## Security Requirements
- Implement role-based access control
- Ensure all API calls use proper authentication
- Log all rule changes and validation actions
- Implement data encryption for sensitive information

## Deliverables
1. React application with TypeScript
2. Responsive UI components
3. Integration with backend Python API
4. User documentation
5. Administrator guide

## Development Approach
Use an iterative development approach, focusing first on core document validation functionality, then adding MT message validation, and finally implementing the rule management interfaces. Prioritize user experience and performance throughout the development process.

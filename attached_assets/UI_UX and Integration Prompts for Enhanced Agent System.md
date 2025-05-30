# UI/UX and Integration Prompts for Enhanced Agent System

## UI/UX Prompts for Agent Management

### Agent Creation and Configuration Interface
Design a clean, intuitive interface for creating and configuring agents with the following considerations:
- Use a multi-step wizard approach for creating new agents
- Organize fields by criticality (most critical fields in primary view)
- Implement collapsible sections for medium and least critical fields
- Provide contextual help tooltips for complex fields like "validation_rules" and "memory_settings"
- Use visual indicators for agent status (active/inactive)
- Include a capability selection interface with checkboxes for "allowed_document_types"
- Implement a code/JSON editor for complex fields like "validation_rules" with syntax highlighting
- Create a visual representation of agent performance metrics with charts/graphs
- Design mobile-responsive layouts for all agent management screens

### Agent Monitoring Dashboard
Create a comprehensive dashboard for monitoring agent activities:
- Display real-time status indicators for all agents
- Implement performance metric visualizations (execution time, success rate)
- Design an activity timeline showing recent agent actions
- Create filterable/sortable agent lists by type, status, and capabilities
- Include quick action buttons for common operations (activate/deactivate, edit)
- Design error notification system with severity indicators
- Implement collapsible detail panels for in-depth agent information

## UI/UX Prompts for Task Management

### Task Creation and Assignment Interface
Design an efficient interface for task creation and management:
- Implement a kanban-style board for visualizing task status and workflow
- Create a task priority visualization system using colors and icons
- Design an intuitive interface for setting task dependencies with visual connections
- Implement progress indicators showing completion percentage
- Create a document type selector with preview capabilities
- Design a validation criteria builder with predefined templates
- Include an agent assignment interface with capability matching
- Implement deadline visualization with warning indicators for approaching timeouts
- Design mobile-friendly task creation forms with progressive disclosure

### Task Monitoring and Results View
Create interfaces for monitoring task execution and reviewing results:
- Design a real-time execution log viewer with filtering capabilities
- Implement a split-view interface showing task details and results side-by-side
- Create visual indicators for task status changes
- Design a retry mechanism interface with attempt history
- Implement a comparison view for expected vs. actual outputs
- Create exportable task result reports with customizable formats
- Design notification systems for task completion and failures

## UI/UX Prompts for Crew Management

### Crew Builder Interface
Design an intuitive interface for creating and managing crews:
- Implement a visual crew builder showing agent relationships and communication flows
- Create drag-and-drop interfaces for adding agents to crews
- Design workflow definition tools with branching and conditional logic visualization
- Implement crew templates for common scenarios
- Create visual indicators for crew status and health
- Design interfaces for setting communication protocols between agents
- Implement version control visualization for crew configurations
- Create mobile-responsive crew management dashboards

### Crew Performance and Monitoring Interface
Design comprehensive monitoring tools for crew operations:
- Create a real-time crew activity dashboard with agent status indicators
- Implement performance visualization comparing crews across metrics
- Design workflow execution visualizations showing current step and progress
- Create bottleneck identification tools highlighting performance issues
- Implement crew comparison tools for optimization
- Design error handling visualization showing resolution paths
- Create exportable crew performance reports with actionable insights

## Integration Prompts for React/Node.js Stack

### Frontend Integration (React)
Implement the following integration patterns for the React frontend:
- Create reusable component libraries for agent, task, and crew interfaces
- Implement React Context for managing application state related to agents and crews
- Design custom hooks for common agent/task/crew operations
- Implement real-time updates using WebSockets for agent status changes
- Create form validation schemas matching database constraints
- Design responsive layouts using CSS Grid and Flexbox for all screen sizes
- Implement code-splitting for performance optimization
- Create consistent loading states and error boundaries
- Design accessibility-compliant components following WCAG guidelines
- Implement theme support with light/dark mode

### Backend Integration (Node.js)
Implement the following integration patterns for the Node.js backend:
- Create RESTful API endpoints for all agent, task, and crew operations
- Implement WebSocket servers for real-time status updates
- Design middleware for authentication and authorization
- Create database access layers with connection pooling
- Implement validation middleware matching database constraints
- Design error handling middleware with detailed logging
- Create background job processing for long-running tasks
- Implement rate limiting for API endpoints
- Design caching strategies for frequently accessed data
- Create comprehensive API documentation with Swagger/OpenAPI

### LC Discrepancy Detection Integration
Implement specific integration patterns for LC discrepancy detection:
- Design document type validation interfaces matching database schema
- Create document comparison visualization tools
- Implement rule management interfaces for validation criteria
- Design MT message parsing and visualization components
- Create integration with document storage systems
- Implement notification systems for discrepancy detection
- Design reporting interfaces for compliance requirements

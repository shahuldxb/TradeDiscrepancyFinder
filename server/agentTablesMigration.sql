-- Agent Tables Migration to Azure SQL Server
-- This script creates all agent-related tables in Azure SQL Server

-- 1. Agent Tasks Table
-- Stores tasks executed by CrewAI agents for document processing
CREATE TABLE agent_tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    agent_name NVARCHAR(50) NOT NULL,
    task_type NVARCHAR(50) NOT NULL,
    document_id INT NULL,
    document_set_id NVARCHAR(36) NULL,
    status NVARCHAR(20) DEFAULT 'queued',
    input_data NVARCHAR(MAX) NULL, -- JSON data
    output_data NVARCHAR(MAX) NULL, -- JSON data
    error_message NVARCHAR(MAX) NULL,
    started_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    execution_time INT NULL, -- in seconds
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- 2. Custom Agents Table
-- User-defined agents with specific roles and capabilities
CREATE TABLE custom_agents (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(255) NOT NULL,
    goal NVARCHAR(MAX) NOT NULL,
    backstory NVARCHAR(MAX) NOT NULL,
    skills NVARCHAR(MAX) NULL, -- JSON array
    tools NVARCHAR(MAX) NULL, -- JSON array
    status NVARCHAR(50) DEFAULT 'idle',
    is_active BIT DEFAULT 1,
    max_execution_time INT DEFAULT 300,
    temperature DECIMAL(3,2) DEFAULT 0.70,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- 3. Custom Tasks Table
-- User-defined tasks that can be assigned to agents
CREATE TABLE custom_tasks (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    expected_output NVARCHAR(MAX) NOT NULL,
    agent_id NVARCHAR(36) NULL,
    priority NVARCHAR(20) DEFAULT 'medium',
    dependencies NVARCHAR(MAX) NULL, -- JSON array
    tools NVARCHAR(MAX) NULL, -- JSON array
    context NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (agent_id) REFERENCES custom_agents(id)
);

-- 4. Custom Crews Table
-- Groups of agents working together on complex workflows
CREATE TABLE custom_crews (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    agent_ids NVARCHAR(MAX) NULL, -- JSON array of agent IDs
    task_ids NVARCHAR(MAX) NULL, -- JSON array of task IDs
    process NVARCHAR(50) DEFAULT 'sequential',
    is_active BIT DEFAULT 1,
    max_execution_time INT DEFAULT 1800,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- 5. Agent Configurations Table
-- Stores configuration settings for both system and custom agents
CREATE TABLE agent_configurations (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    agent_name NVARCHAR(100) NOT NULL,
    user_id NVARCHAR(50) NOT NULL,
    configuration NVARCHAR(MAX) NOT NULL, -- JSON configuration data
    is_system_agent BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    UNIQUE(agent_name, user_id)
);

-- 6. Agent Performance Metrics Table
-- Tracks performance metrics for agents
CREATE TABLE agent_performance_metrics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    agent_name NVARCHAR(100) NOT NULL,
    metric_type NVARCHAR(50) NOT NULL, -- 'execution_time', 'success_rate', 'error_count'
    metric_value DECIMAL(10,4) NOT NULL,
    measurement_date DATETIME2 DEFAULT GETDATE(),
    additional_data NVARCHAR(MAX) NULL -- JSON for extra metrics
);

-- Create indexes for better performance
CREATE INDEX IX_agent_tasks_agent_name ON agent_tasks(agent_name);
CREATE INDEX IX_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IX_agent_tasks_document_set_id ON agent_tasks(document_set_id);
CREATE INDEX IX_custom_agents_user_id ON custom_agents(user_id);
CREATE INDEX IX_custom_tasks_user_id ON custom_tasks(user_id);
CREATE INDEX IX_custom_tasks_agent_id ON custom_tasks(agent_id);
CREATE INDEX IX_custom_crews_user_id ON custom_crews(user_id);
CREATE INDEX IX_agent_configurations_agent_name ON agent_configurations(agent_name);
CREATE INDEX IX_agent_configurations_user_id ON agent_configurations(user_id);
CREATE INDEX IX_agent_performance_metrics_agent_name ON agent_performance_metrics(agent_name);

-- Insert default system agent configurations
INSERT INTO agent_configurations (agent_name, user_id, configuration, is_system_agent) VALUES
('document_intake_agent', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1),
('mt_message_analyst', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": true, "detailed_logging": true, "real_time_updates": true}', 1),
('lc_document_validator', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": true, "detailed_logging": true, "real_time_updates": true}', 1),
('cross_document_comparator', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1),
('ucp_rules_specialist', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1),
('reporting_agent', 'system', '{"timeout": 300, "retries": 3, "auto_retry": true, "parallel_processing": false, "detailed_logging": true, "real_time_updates": true}', 1);

-- Insert sample agent tasks for demonstration
INSERT INTO agent_tasks (agent_name, task_type, status, input_data, output_data, execution_time) VALUES
('document_intake_agent', 'document_classification', 'completed', '{"documents": ["MT700.txt", "invoice.pdf", "bill_of_lading.pdf"]}', '{"classified_documents": {"MT700.txt": "swift_message", "invoice.pdf": "commercial_invoice", "bill_of_lading.pdf": "transport_document"}}', 45),
('mt_message_analyst', 'swift_validation', 'completed', '{"message_type": "MT700", "content": "..."}', '{"validation_result": "valid", "fields_extracted": 23, "discrepancies": []}', 78),
('lc_document_validator', 'document_validation', 'completed', '{"document_type": "commercial_invoice", "required_fields": ["amount", "beneficiary", "goods_description"]}', '{"validation_status": "valid", "missing_fields": [], "format_issues": []}', 32),
('cross_document_comparator', 'cross_validation', 'in_progress', '{"documents": ["MT700", "commercial_invoice", "bill_of_lading"]}', NULL, NULL),
('ucp_rules_specialist', 'ucp_compliance_check', 'queued', '{"discrepancies": [], "applicable_rules": ["UCP600-14", "UCP600-20"]}', NULL, NULL);

-- Insert sample custom agents
INSERT INTO custom_agents (id, user_id, name, role, goal, backstory, skills, tools, status, max_execution_time, temperature) VALUES
(NEWID(), '40455192', 'Trade Finance Specialist', 'Senior Trade Finance Analyst', 'Analyze complex trade finance documents with expertise in LC operations', 'Expert with 15+ years in international trade finance and documentary credits', '["Trade Finance", "SWIFT Messages", "UCP 600", "International Banking"]', '["Document Parser", "SWIFT Validator", "UCP Rules Engine"]', 'active', 600, 0.75),
(NEWID(), '40455192', 'Risk Assessment Agent', 'Risk Analyst', 'Identify and assess risks in trade finance transactions', 'Specialized in identifying potential risks and compliance issues in international trade', '["Risk Assessment", "Compliance", "Anti-Money Laundering", "Sanctions Screening"]', '["Risk Calculator", "Sanctions Database", "AML Checker"]', 'idle', 300, 0.80);

-- Insert sample custom tasks
INSERT INTO custom_tasks (id, user_id, title, description, expected_output, priority, dependencies, tools, context) VALUES
(NEWID(), '40455192', 'Complex LC Analysis', 'Perform comprehensive analysis of multi-bank LC transactions', 'Detailed report highlighting all discrepancies and recommendations', 'high', '["document_intake", "swift_validation"]', '["Document Parser", "SWIFT Validator", "Report Generator"]', 'Multi-million dollar LC transaction requiring thorough review'),
(NEWID(), '40455192', 'Compliance Validation', 'Validate all documents against current UCP 600 rules and local regulations', 'Compliance certification with detailed rule references', 'medium', '["document_validation"]', '["UCP Rules Engine", "Regulation Database"]', 'Standard trade finance compliance check');

-- Insert sample custom crew
INSERT INTO custom_crews (id, user_id, name, description, agent_ids, task_ids, process, max_execution_time) VALUES
(NEWID(), '40455192', 'Elite Trade Finance Team', 'High-performance team for complex trade finance analysis', '[]', '[]', 'hierarchical', 3600);
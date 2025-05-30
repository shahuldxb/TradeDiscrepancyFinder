# Field Classification for Database Enhancement

## Custom Agents Table

### Most Critical Fields
- id: Primary identifier for the agent
- user_id: Owner of the agent
- name: Descriptive name for the agent
- role: Specific function the agent performs
- goal: Primary objective of the agent
- backstory: Context that guides agent behavior
- skills: Capabilities the agent possesses
- tools: Resources available to the agent

### Medium Importance Fields
- status: Current operational state
- is_active: Whether the agent is available for use
- max_execution_time: Runtime constraints
- temperature: Controls randomness/creativity in responses

### Least Critical Fields
- created_at: Timestamp for record creation
- updated_at: Timestamp for last modification

## Custom Tasks Table

### Most Critical Fields
- id: Primary identifier for the task
- user_id: Owner of the task
- title: Short description of the task
- description: Detailed explanation of what needs to be done
- expected_output: Definition of successful completion
- agent_id: The agent assigned to the task
- priority: Importance level of the task

### Medium Importance Fields
- dependencies: Other tasks that must be completed first
- tools: Resources needed for task completion
- context: Additional information for task execution

### Least Critical Fields
- created_at: Timestamp for record creation
- updated_at: Timestamp for last modification

## Custom Crews Table

### Most Critical Fields
- id: Primary identifier for the crew
- user_id: Owner of the crew
- name: Descriptive name for the crew
- description: Purpose and function of the crew
- agent_ids: Agents that are part of the crew
- task_ids: Tasks assigned to the crew

### Medium Importance Fields
- process: Workflow methodology used by the crew
- is_active: Whether the crew is available for use
- max_execution_time: Runtime constraints

### Least Critical Fields
- created_at: Timestamp for record creation
- updated_at: Timestamp for last modification

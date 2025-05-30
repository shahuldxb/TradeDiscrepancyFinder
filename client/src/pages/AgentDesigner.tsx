import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Users, Bot, Briefcase, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import AgentDesignerNav from "@/components/AgentDesignerNav";
import type { CustomAgent, CustomTask, CustomCrew } from "@shared/schema";

interface Agent {
  id?: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  skills: string[];
  tools: string[];
  status: 'idle' | 'processing' | 'error';
  isActive: boolean;
  maxExecutionTime?: number;
  temperature?: number;
}

interface Task {
  id?: string;
  title: string;
  description: string;
  expectedOutput: string;
  agentId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  tools: string[];
  context?: string;
}

interface Crew {
  id?: string;
  name: string;
  description: string;
  agentIds: string[];
  taskIds: string[];
  process: 'sequential' | 'hierarchical' | 'parallel';
  isActive: boolean;
  maxExecutionTime?: number;
}

const AVAILABLE_TOOLS = [
  'document_parser',
  'discrepancy_detector',
  'ucp_rule_applier',
  'mt_message_parser',
  'field_validator',
  'cross_document_comparator',
  'report_generator',
  'ocr_processor',
  'pdf_reader',
  'data_extractor'
];

const AGENT_SKILLS = [
  'Document Analysis',
  'UCP 600 Rules',
  'SWIFT Standards',
  'Data Extraction',
  'Pattern Recognition',
  'Financial Regulations',
  'Trade Finance',
  'Risk Assessment',
  'Quality Control',
  'Report Writing'
];

export default function AgentDesigner() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("agents");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch data
  const { data: customAgents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/custom-agents'],
  });

  const { data: systemAgents = [], isLoading: systemAgentsLoading } = useQuery({
    queryKey: ['/api/agents/status'],
    refetchInterval: 5000,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/enhanced-tasks'],
  });

  const { data: crews = [], isLoading: crewsLoading } = useQuery({
    queryKey: ['/api/enhanced-crews'],
  });

  // Combine system and custom agents with proper type handling
  const allAgents = [
    ...(Array.isArray(systemAgents) ? systemAgents.map((agent: any) => ({ 
      ...agent, 
      type: 'system',
      id: agent.name,
      skills: ['System Agent'],
      tools: ['Built-in Tools'],
      isActive: agent.status !== 'error'
    })) : []),
    ...(Array.isArray(customAgents) ? customAgents.map((agent: any) => ({ 
      ...agent, 
      type: 'custom',
      skills: agent.skills ? agent.skills.split(',') : [],
      tools: agent.tools ? agent.tools.split(',') : [],
      isActive: agent.is_active
    })) : [])
  ];

  // Mutations for enhanced agent system
  const createAgentMutation = useMutation({
    mutationFn: async (agent: Agent) => {
      const response = await fetch('/api/enhanced-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agent.name,
          role: agent.role,
          goal: agent.goal,
          backstory: agent.backstory,
          skills: Array.isArray(agent.skills) ? agent.skills.join(',') : agent.skills,
          tools: Array.isArray(agent.tools) ? agent.tools.join(',') : agent.tools,
          agent_type: agent.agentType || 'LC_Validator',
          model_name: agent.modelName || 'gpt-4o',
          capabilities: agent.capabilities || 'document_analysis,discrepancy_detection',
          allowed_document_types: agent.allowedDocumentTypes || 'MT700,Commercial_Invoice,Bill_of_Lading'
        }),
      });
      if (!response.ok) throw new Error('Failed to create agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents'] });
      toast({ title: "Agent created successfully!" });
      setSelectedAgent(null);
      setIsEditMode(false);
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, ...agent }: Agent & { id: string }) => {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      if (!response.ok) throw new Error('Failed to update agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({ title: "Agent updated successfully!" });
      setIsEditMode(false);
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({ title: "Agent deleted successfully!" });
      setSelectedAgent(null);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task created successfully!" });
      setSelectedTask(null);
      setIsEditMode(false);
    },
  });

  const createCrewMutation = useMutation({
    mutationFn: async (crew: Crew) => {
      const response = await fetch('/api/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crew),
      });
      if (!response.ok) throw new Error('Failed to create crew');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crews'] });
      toast({ title: "Crew created successfully!" });
      setSelectedCrew(null);
      setIsEditMode(false);
    },
  });

  const executeCrewMutation = useMutation({
    mutationFn: async (crewId: string) => {
      const response = await fetch(`/api/crews/${crewId}/execute`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to execute crew');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Crew execution started!" });
    },
  });

  // Agent Form Component
  const AgentForm = () => {
    const [formData, setFormData] = useState<Agent>(selectedAgent || {
      name: '',
      role: '',
      goal: '',
      backstory: '',
      skills: [],
      tools: [],
      status: 'idle',
      isActive: true,
      maxExecutionTime: 300,
      temperature: 0.7
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedAgent?.id) {
        updateAgentMutation.mutate({ ...formData, id: selectedAgent.id });
      } else {
        createAgentMutation.mutate(formData);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Document Analyzer"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Senior Trade Finance Analyst"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="goal">Goal</Label>
          <Textarea
            id="goal"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="What is this agent's primary objective?"
            required
          />
        </div>

        <div>
          <Label htmlFor="backstory">Backstory</Label>
          <Textarea
            id="backstory"
            value={formData.backstory}
            onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
            placeholder="Agent's background and expertise..."
            required
          />
        </div>

        <div>
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {AGENT_SKILLS.map((skill) => (
              <Badge
                key={skill}
                variant={formData.skills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const skills = formData.skills.includes(skill)
                    ? formData.skills.filter(s => s !== skill)
                    : [...formData.skills, skill];
                  setFormData({ ...formData, skills });
                }}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Tools</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {AVAILABLE_TOOLS.map((tool) => (
              <Badge
                key={tool}
                variant={formData.tools.includes(tool) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const tools = formData.tools.includes(tool)
                    ? formData.tools.filter(t => t !== tool)
                    : [...formData.tools, tool];
                  setFormData({ ...formData, tools });
                }}
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="maxExecutionTime">Max Execution Time (seconds)</Label>
            <Input
              id="maxExecutionTime"
              type="number"
              value={formData.maxExecutionTime}
              onChange={(e) => setFormData({ ...formData, maxExecutionTime: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="temperature">Temperature (0-1)</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => {
            setSelectedAgent(null);
            setIsEditMode(false);
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={createAgentMutation.isPending || updateAgentMutation.isPending}>
            {selectedAgent?.id ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </form>
    );
  };

  // Task Form Component
  const TaskForm = () => {
    const [formData, setFormData] = useState<Task>(selectedTask || {
      title: '',
      description: '',
      expectedOutput: '',
      agentId: '',
      priority: 'medium',
      dependencies: [],
      tools: [],
      context: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createTaskMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Parse MT700 Message"
              required
            />
          </div>
          <div>
            <Label htmlFor="agentId">Assign to Agent</Label>
            <Select value={formData.agentId} onValueChange={(value) => setFormData({ ...formData, agentId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {allAgents.map((agent: Agent) => (
                  <SelectItem key={agent.id} value={agent.id!}>
                    {agent.name} - {agent.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed task description..."
            required
          />
        </div>

        <div>
          <Label htmlFor="expectedOutput">Expected Output</Label>
          <Textarea
            id="expectedOutput"
            value={formData.expectedOutput}
            onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
            placeholder="What should this task produce?"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Required Tools</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <Badge
                  key={tool}
                  variant={formData.tools.includes(tool) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const tools = formData.tools.includes(tool)
                      ? formData.tools.filter(t => t !== tool)
                      : [...formData.tools, tool];
                    setFormData({ ...formData, tools });
                  }}
                >
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="context">Context (Optional)</Label>
          <Textarea
            id="context"
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
            placeholder="Additional context for this task..."
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => {
            setSelectedTask(null);
            setIsEditMode(false);
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={createTaskMutation.isPending}>
            Create Task
          </Button>
        </div>
      </form>
    );
  };

  // Crew Form Component
  const CrewForm = () => {
    const [formData, setFormData] = useState<Crew>(selectedCrew || {
      name: '',
      description: '',
      agentIds: [],
      taskIds: [],
      process: 'sequential',
      isActive: true,
      maxExecutionTime: 1800
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createCrewMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Crew Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., LC Document Analysis Crew"
              required
            />
          </div>
          <div>
            <Label htmlFor="process">Execution Process</Label>
            <Select value={formData.process} onValueChange={(value: any) => setFormData({ ...formData, process: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this crew accomplish?"
            required
          />
        </div>

        <div>
          <Label>Select Agents</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
            {allAgents.map((agent: Agent) => (
              <div key={agent.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`agent-${agent.id}`}
                  checked={formData.agentIds.includes(agent.id!)}
                  onChange={(e) => {
                    const agentIds = e.target.checked
                      ? [...formData.agentIds, agent.id!]
                      : formData.agentIds.filter(id => id !== agent.id);
                    setFormData({ ...formData, agentIds });
                  }}
                />
                <Label htmlFor={`agent-${agent.id}`} className="text-sm">
                  {agent.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Select Tasks</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
            {tasks.map((task: Task) => (
              <div key={task.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`task-${task.id}`}
                  checked={formData.taskIds.includes(task.id!)}
                  onChange={(e) => {
                    const taskIds = e.target.checked
                      ? [...formData.taskIds, task.id!]
                      : formData.taskIds.filter(id => id !== task.id);
                    setFormData({ ...formData, taskIds });
                  }}
                />
                <Label htmlFor={`task-${task.id}`} className="text-sm">
                  {task.title}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxExecutionTime">Max Execution Time (seconds)</Label>
            <Input
              id="maxExecutionTime"
              type="number"
              value={formData.maxExecutionTime}
              onChange={(e) => setFormData({ ...formData, maxExecutionTime: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => {
            setSelectedCrew(null);
            setIsEditMode(false);
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={createCrewMutation.isPending}>
            Create Crew
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AgentDesignerNav />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Designer</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Design custom agents, create specialized tasks, and orchestrate powerful crews for trade finance operations
              </p>
            </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents" className="flex items-center space-x-2">
            <Bot className="w-4 h-4" />
            <span>Agents</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="crews" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Crews</span>
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Agents</h2>
            <Button onClick={() => {
              setSelectedAgent(null);
              setIsEditMode(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>

          {isEditMode && activeTab === "agents" && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedAgent ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
                <CardDescription>
                  Configure your agent's personality, skills, and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentForm />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAgents.map((agent: Agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.role}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setIsEditMode(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteAgentMutation.mutate(agent.id!)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {agent.goal}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {agent.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {agent.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant={agent.status === 'idle' ? 'default' : agent.status === 'processing' ? 'secondary' : 'destructive'}>
                      {agent.status}
                    </Badge>
                    <Badge variant={agent.isActive ? 'default' : 'outline'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Tasks</h2>
            <Button onClick={() => {
              setSelectedTask(null);
              setIsEditMode(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>

          {isEditMode && activeTab === "tasks" && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Task</CardTitle>
                <CardDescription>
                  Define specific tasks for your agents to execute
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskForm />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task: Task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription>
                        Assigned to: {agents.find((a: Agent) => a.id === task.agentId)?.name || 'Unassigned'}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      task.priority === 'critical' ? 'destructive' :
                      task.priority === 'high' ? 'secondary' :
                      task.priority === 'medium' ? 'default' : 'outline'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {task.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant="outline" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {task.tools.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{task.tools.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Crews Tab */}
        <TabsContent value="crews" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Crews</h2>
            <Button onClick={() => {
              setSelectedCrew(null);
              setIsEditMode(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Crew
            </Button>
          </div>

          {isEditMode && activeTab === "crews" && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Crew</CardTitle>
                <CardDescription>
                  Orchestrate multiple agents to work together on complex workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CrewForm />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crews.map((crew: Crew) => (
              <Card key={crew.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{crew.name}</CardTitle>
                      <CardDescription>{crew.process} execution</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => executeCrewMutation.mutate(crew.id!)}
                        disabled={!crew.isActive}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {crew.description}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium">Agents: </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {crew.agentIds.length} assigned
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium">Tasks: </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {crew.taskIds.length} assigned
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant={crew.isActive ? 'default' : 'outline'}>
                      {crew.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Max: {crew.maxExecutionTime}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
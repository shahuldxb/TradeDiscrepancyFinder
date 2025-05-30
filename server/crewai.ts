interface Agent {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  status: 'idle' | 'processing' | 'error';
  currentTask?: string;
}

interface Task {
  id: string;
  description: string;
  agent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

class CrewAIOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const agentConfigs = [
      {
        name: 'document_intake_agent',
        role: 'Document Intake Specialist',
        goal: 'Efficiently process and classify uploaded documents for LC analysis',
        backstory: 'Expert in document management with deep knowledge of trade finance documentation standards',
        status: 'idle' as const,
      },
      {
        name: 'mt_message_agent',
        role: 'SWIFT MT Message Analyst',
        goal: 'Parse and validate SWIFT MT messages according to standards',
        backstory: 'Specialized in SWIFT messaging standards with focus on MT700, MT707, and related message types',
        status: 'idle' as const,
      },
      {
        name: 'lc_document_agent',
        role: 'LC Document Validator',
        goal: 'Validate LC documents for compliance and completeness',
        backstory: 'Trade finance expert with extensive knowledge of letter of credit documentation requirements',
        status: 'idle' as const,
      },
      {
        name: 'comparison_agent',
        role: 'Cross-Document Comparison Specialist',
        goal: 'Identify discrepancies between documents through detailed comparison',
        backstory: 'Data analysis expert specialized in detecting inconsistencies across multiple document types',
        status: 'idle' as const,
      },
      {
        name: 'ucp_rules_agent',
        role: 'UCP 600 Compliance Officer',
        goal: 'Apply UCP 600 rules and SWIFT MT standards to validate documents',
        backstory: 'Banking regulation expert with comprehensive knowledge of UCP 600 and international banking practices',
        status: 'idle' as const,
      },
      {
        name: 'reporting_agent',
        role: 'Discrepancy Reporting Specialist',
        goal: 'Generate comprehensive discrepancy reports with recommendations',
        backstory: 'Report generation expert focused on clear communication of complex financial discrepancies',
        status: 'idle' as const,
      },
    ];

    agentConfigs.forEach(config => {
      this.agents.set(config.name, config);
    });
  }

  async processDocumentSet(documentSetId: string): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: Task = {
      id: taskId,
      description: `Process document set ${documentSetId} for discrepancy detection`,
      agent: 'document_intake_agent',
      status: 'pending',
    };

    this.tasks.set(taskId, task);
    
    // Start the processing workflow
    this.executeWorkflow(taskId, documentSetId).catch(console.error);
    
    return taskId;
  }

  private async executeWorkflow(taskId: string, documentSetId: string) {
    const { storage } = await import('./storage');
    
    try {
      // Step 1: Document Intake
      await this.executeAgentTask('document_intake_agent', 'classify_documents', { documentSetId });
      
      // Step 2: Parse MT Messages
      await this.executeAgentTask('mt_message_agent', 'parse_mt_messages', { documentSetId });
      
      // Step 3: Validate LC Documents  
      await this.executeAgentTask('lc_document_agent', 'validate_lc_documents', { documentSetId });
      
      // Step 4: Cross-document comparison
      await this.executeAgentTask('comparison_agent', 'compare_documents', { documentSetId });
      
      // Step 5: Apply UCP rules
      await this.executeAgentTask('ucp_rules_agent', 'apply_ucp_rules', { documentSetId });
      
      // Step 6: Generate report
      const reportResult = await this.executeAgentTask('reporting_agent', 'generate_report', { documentSetId });
      
      // Update task status
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'completed';
        task.result = reportResult;
      }

      // Update document set status
      await storage.updateDocumentSetStatus(documentSetId, 'completed');
      
    } catch (error) {
      console.error(`Workflow failed for task ${taskId}:`, error);
      
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';
      }

      await storage.updateDocumentSetStatus(documentSetId, 'failed');
    }
  }

  private async executeAgentTask(agentName: string, taskType: string, params: any): Promise<any> {
    const { storage } = await import('./storage');
    const agent = this.agents.get(agentName);
    
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    // Update agent status
    agent.status = 'processing';
    agent.currentTask = taskType;

    // Log agent task
    const agentTaskId = await storage.createAgentTask({
      agentName,
      taskType,
      documentSetId: params.documentSetId,
      inputData: params,
    });

    try {
      let result;
      
      switch (agentName) {
        case 'document_intake_agent':
          result = await this.documentIntakeTask(params);
          break;
        case 'mt_message_agent':
          result = await this.mtMessageTask(params);
          break;
        case 'lc_document_agent':
          result = await this.lcDocumentTask(params);
          break;
        case 'comparison_agent':
          result = await this.comparisonTask(params);
          break;
        case 'ucp_rules_agent':
          result = await this.ucpRulesTask(params);
          break;
        case 'reporting_agent':
          result = await this.reportingTask(params);
          break;
        default:
          throw new Error(`Unknown agent task: ${agentName}`);
      }

      // Update agent status
      agent.status = 'idle';
      agent.currentTask = undefined;

      // Update agent task record
      await storage.updateAgentTask(agentTaskId, 'completed', result);
      
      return result;
      
    } catch (error) {
      agent.status = 'error';
      await storage.updateAgentTask(agentTaskId, 'failed', null, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async documentIntakeTask(params: any): Promise<any> {
    const { storage } = await import('./storage');
    
    // Get all documents in the set
    const documents = await storage.getDocumentsBySet(params.documentSetId);
    
    // Classify and validate document types
    const classifications = documents.map(doc => ({
      documentId: doc.id,
      detectedType: this.classifyDocument(doc.fileName, doc.mimeType),
      confidence: 0.95,
      isRequired: this.isRequiredDocument(doc.documentType),
    }));

    return {
      documentsProcessed: documents.length,
      classifications,
      completedAt: new Date().toISOString(),
    };
  }

  private async mtMessageTask(params: any): Promise<any> {
    const { storage } = await import('./storage');
    
    // Get MT message documents
    const mtDocuments = await storage.getDocumentsByTypeAndSet(params.documentSetId, 'mt700');
    
    const validationResults = [];
    
    for (const doc of mtDocuments) {
      // Parse MT message structure
      const parseResult = await this.parseMTMessage(doc);
      validationResults.push(parseResult);
    }

    return {
      documentsValidated: mtDocuments.length,
      validationResults,
      completedAt: new Date().toISOString(),
    };
  }

  private async lcDocumentTask(params: any): Promise<any> {
    const { storage } = await import('./storage');
    
    // Get LC documents (excluding MT messages)
    const lcDocuments = await storage.getDocumentsBySet(params.documentSetId);
    const nonMtDocuments = lcDocuments.filter(doc => !doc.documentType.startsWith('mt'));
    
    const validationResults = [];
    
    for (const doc of nonMtDocuments) {
      const validation = await this.validateLCDocument(doc);
      validationResults.push(validation);
    }

    return {
      documentsValidated: nonMtDocuments.length,
      validationResults,
      completedAt: new Date().toISOString(),
    };
  }

  private async comparisonTask(params: any): Promise<any> {
    const { storage } = await import('./storage');
    
    // Get all processed documents and their extracted data
    const documents = await storage.getDocumentsBySet(params.documentSetId);
    
    const discrepancies = [];
    
    // Compare common fields across documents
    const comparisons = await this.performCrossDocumentComparison(documents);
    
    // Store discrepancies found
    for (const discrepancy of comparisons.discrepancies) {
      await storage.createDiscrepancy({
        documentSetId: params.documentSetId,
        discrepancyType: discrepancy.type,
        fieldName: discrepancy.field,
        severity: discrepancy.severity,
        description: discrepancy.description,
        documentValues: discrepancy.values,
      });
      
      discrepancies.push(discrepancy);
    }

    return {
      comparisonsPerformed: comparisons.comparisonsCount,
      discrepanciesFound: discrepancies.length,
      discrepancies,
      completedAt: new Date().toISOString(),
    };
  }

  private async ucpRulesTask(params: any): Promise<any> {
    const { storage } = await import('./storage');
    
    // Get existing discrepancies to apply UCP rules
    const discrepancies = await storage.getDiscrepanciesBySet(params.documentSetId);
    
    const ruleApplications = [];
    
    for (const discrepancy of discrepancies) {
      const ucpValidation = await this.applyUCPRules(discrepancy);
      
      if (ucpValidation.ucpReference || ucpValidation.updatedSeverity) {
        await storage.updateDiscrepancy(discrepancy.id, {
          ucpReference: ucpValidation.ucpReference,
          severity: ucpValidation.updatedSeverity || discrepancy.severity,
          ruleExplanation: ucpValidation.explanation,
          advice: ucpValidation.advice,
        });
      }
      
      ruleApplications.push(ucpValidation);
    }

    return {
      rulesApplied: ruleApplications.length,
      ruleApplications,
      completedAt: new Date().toISOString(),
    };
  }

  private async reportingTask(params: any): Promise<any> {
    const { storage } = await import('./storage');
    
    // Gather all analysis results
    const documentSet = await storage.getDocumentSet(params.documentSetId);
    const documents = await storage.getDocumentsBySet(params.documentSetId);
    const discrepancies = await storage.getDiscrepanciesBySet(params.documentSetId);
    
    const report = {
      documentSetId: params.documentSetId,
      lcReference: documentSet?.lcReference,
      summary: {
        totalDocuments: documents.length,
        totalDiscrepancies: discrepancies.length,
        criticalDiscrepancies: discrepancies.filter(d => d.severity === 'critical').length,
        highDiscrepancies: discrepancies.filter(d => d.severity === 'high').length,
        mediumDiscrepancies: discrepancies.filter(d => d.severity === 'medium').length,
        lowDiscrepancies: discrepancies.filter(d => d.severity === 'low').length,
      },
      discrepancies: discrepancies.map(d => ({
        type: d.discrepancyType,
        field: d.fieldName,
        severity: d.severity,
        ucpReference: d.ucpReference,
        description: d.description,
        advice: d.advice,
      })),
      recommendation: this.generateRecommendation(discrepancies),
      completedAt: new Date().toISOString(),
    };

    return report;
  }

  // Helper methods
  private classifyDocument(fileName: string, mimeType: string): string {
    if (fileName.toLowerCase().includes('mt700') || fileName.toLowerCase().includes('mt-700')) {
      return 'mt700';
    }
    if (fileName.toLowerCase().includes('invoice')) {
      return 'commercial_invoice';
    }
    if (fileName.toLowerCase().includes('bill') && fileName.toLowerCase().includes('lading')) {
      return 'bill_of_lading';
    }
    if (fileName.toLowerCase().includes('insurance')) {
      return 'insurance_certificate';
    }
    if (fileName.toLowerCase().includes('origin')) {
      return 'certificate_of_origin';
    }
    return 'unknown';
  }

  private isRequiredDocument(docType: string): boolean {
    const requiredTypes = ['mt700', 'commercial_invoice', 'bill_of_lading'];
    return requiredTypes.includes(docType);
  }

  private async parseMTMessage(document: any): Promise<any> {
    // Simulate MT message parsing
    return {
      documentId: document.id,
      messageType: 'MT700',
      isValid: true,
      fields: {
        creditNumber: 'LC123456',
        amount: '100000.00',
        currency: 'USD',
        expiryDate: '2024-12-31',
        beneficiary: 'ABC Company Ltd.',
        applicant: 'XYZ Corporation',
      },
      validationErrors: [],
    };
  }

  private async validateLCDocument(document: any): Promise<any> {
    // Simulate LC document validation
    return {
      documentId: document.id,
      documentType: document.documentType,
      isValid: true,
      extractedFields: {
        amount: '100000.00',
        currency: 'USD',
        date: '2024-01-15',
        beneficiary: 'ABC Company Ltd.',
      },
      validationErrors: [],
    };
  }

  private async performCrossDocumentComparison(documents: any[]): Promise<any> {
    const discrepancies = [];
    let comparisonsCount = 0;

    // Example comparison logic
    const mtDoc = documents.find(d => d.documentType === 'mt700');
    const invoiceDoc = documents.find(d => d.documentType === 'commercial_invoice');

    if (mtDoc && invoiceDoc) {
      comparisonsCount++;
      
      // Simulate discrepancy detection
      if (Math.random() > 0.7) {
        discrepancies.push({
          type: 'quantitative',
          field: 'amount',
          severity: 'critical',
          description: 'Invoice amount exceeds LC amount',
          values: {
            mt700_amount: '100000.00',
            invoice_amount: '105000.00',
          },
        });
      }
    }

    return {
      comparisonsCount,
      discrepancies,
    };
  }

  private async applyUCPRules(discrepancy: any): Promise<any> {
    // Simulate UCP rule application
    const ucpRules = {
      'amount': { reference: 'Article 18b', severity: 'critical' },
      'date': { reference: 'Article 14c', severity: 'high' },
      'description': { reference: 'Article 14d', severity: 'medium' },
    };

    const rule = ucpRules[discrepancy.fieldName as keyof typeof ucpRules];
    
    return {
      ucpReference: rule?.reference,
      updatedSeverity: rule?.severity,
      explanation: rule ? `UCP 600 ${rule.reference} requires field consistency` : undefined,
      advice: rule ? 'Review document and ensure compliance with UCP 600 standards' : undefined,
    };
  }

  private generateRecommendation(discrepancies: any[]): string {
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    
    if (criticalCount > 0) {
      return `${criticalCount} critical discrepancies found. Cannot proceed with ILC creation until resolved.`;
    }
    
    const highCount = discrepancies.filter(d => d.severity === 'high').length;
    if (highCount > 0) {
      return `${highCount} high priority discrepancies found. Review recommended before proceeding.`;
    }
    
    return 'No critical discrepancies found. Proceed with ILC creation.';
  }

  // Public methods for external access
  async getAgentStatus(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getTaskStatus(taskId: string): Promise<Task | undefined> {
    return this.tasks.get(taskId);
  }

  startDemoWorkflow(documentSetId: string): void {
    // Immediately update all agents to processing status
    this.agents.forEach((agent, name) => {
      agent.status = 'processing';
      agent.currentTask = `Processing demo document set ${documentSetId}`;
    });

    // Simulate sequential agent processing
    setTimeout(() => {
      const agentNames = Array.from(this.agents.keys());
      let currentAgentIndex = 0;

      const processNextAgent = () => {
        if (currentAgentIndex > 0) {
          // Set previous agent to idle
          const prevAgent = this.agents.get(agentNames[currentAgentIndex - 1]);
          if (prevAgent) {
            prevAgent.status = 'idle';
            prevAgent.currentTask = undefined;
          }
        }

        if (currentAgentIndex < agentNames.length) {
          // Keep current agent processing
          const currentAgent = this.agents.get(agentNames[currentAgentIndex]);
          if (currentAgent) {
            currentAgent.status = 'processing';
            currentAgent.currentTask = `Active processing step ${currentAgentIndex + 1}`;
          }

          currentAgentIndex++;
          setTimeout(processNextAgent, 4000); // 4 seconds per agent
        } else {
          // All agents completed - set all to idle
          this.agents.forEach(agent => {
            agent.status = 'idle';
            agent.currentTask = undefined;
          });
        }
      };

      processNextAgent();
    }, 1000);
  }
}

export const crewAI = new CrewAIOrchestrator();

export async function getAgentStatus() {
  return await crewAI.getAgentStatus();
}

export async function getAgentTasks(userId: string) {
  const { storage } = await import('./storage');
  return await storage.getAgentTasksByUser(userId);
}

export async function processDocumentSetWithAgents(documentSetId: string): Promise<string> {
  return await crewAI.processDocumentSet(documentSetId);
}

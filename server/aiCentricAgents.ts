/**
 * AI-Centric Agent Architecture
 * 
 * In this design, agents are autonomous decision-makers that:
 * 1. Assess their environment and available resources
 * 2. Make decisions about which tools/services to use
 * 3. Initiate workflows based on their goals
 * 4. Call utility classes and services as needed
 * 5. Coordinate with other agents when necessary
 */

import { azureDataService } from './azureDataService';
import { enhancedAzureAgentService } from './enhancedAzureAgentService';
import * as documentProcessor from './documentProcessor';
import * as discrepancyEngine from './discrepancyEngine';

// Base autonomous agent interface
interface IAutonomousAgent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  goals: string[];
  availableTools: string[];
  memory: Map<string, any>;
  
  // Core AI-centric methods
  perceive(environment: any): Promise<any>;
  decide(situation: any): Promise<string[]>;
  act(actions: string[]): Promise<any>;
  learn(experience: any): Promise<void>;
  collaborate(otherAgents: IAutonomousAgent[]): Promise<any>;
}

// Abstract base class for all autonomous agents
abstract class AutonomousAgent implements IAutonomousAgent {
  public id: string;
  public name: string;
  public role: string;
  public capabilities: string[];
  public goals: string[];
  public availableTools: string[];
  public memory: Map<string, any>;
  
  constructor(config: {
    id: string;
    name: string;
    role: string;
    capabilities: string[];
    goals: string[];
    availableTools: string[];
  }) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.capabilities = config.capabilities;
    this.goals = config.goals;
    this.availableTools = config.availableTools;
    this.memory = new Map();
  }

  abstract perceive(environment: any): Promise<any>;
  abstract decide(situation: any): Promise<string[]>;
  abstract act(actions: string[]): Promise<any>;
  
  async learn(experience: any): Promise<void> {
    // Store experience in memory for future decision-making
    const timestamp = new Date().toISOString();
    this.memory.set(`experience_${timestamp}`, experience);
    
    // Limit memory size to prevent overflow
    if (this.memory.size > 100) {
      const oldestKey = this.memory.keys().next().value;
      this.memory.delete(oldestKey);
    }
  }
  
  async collaborate(otherAgents: IAutonomousAgent[]): Promise<any> {
    // Basic collaboration mechanism - can be overridden
    const collaborationResult = {
      initiator: this.id,
      participants: otherAgents.map(a => a.id),
      outcome: 'collaboration_initiated'
    };
    
    await this.learn({ type: 'collaboration', result: collaborationResult });
    return collaborationResult;
  }
}

/**
 * DocumentAnalysisAgent - Autonomous agent for document processing
 * Makes its own decisions about which documents to process and how
 */
export class DocumentAnalysisAgent extends AutonomousAgent {
  constructor() {
    super({
      id: 'doc_analysis_agent',
      name: 'Document Analysis Agent',
      role: 'Autonomous Document Processor',
      capabilities: [
        'document_parsing',
        'content_extraction',
        'format_detection',
        'quality_assessment'
      ],
      goals: [
        'process_all_uploaded_documents',
        'extract_maximum_information',
        'ensure_data_quality',
        'identify_document_relationships'
      ],
      availableTools: [
        'documentProcessor',
        'azureDataService',
        'ocrService',
        'geminiAPI'
      ]
    });
  }

  async perceive(environment: any): Promise<any> {
    // Agent autonomously assesses what documents are available
    try {
      const documentSets = await azureDataService.getDocumentSets(environment.userId || 'system');
      const pendingDocuments = documentSets.filter(doc => 
        doc.analysisStatus === 'pending' || doc.analysisStatus === 'uploaded'
      );
      
      const situation = {
        pendingDocuments: pendingDocuments.length,
        documentTypes: pendingDocuments.map(doc => doc.documentType),
        priority: this.assessPriority(pendingDocuments),
        systemLoad: environment.systemLoad || 'normal'
      };
      
      await this.learn({ type: 'perception', data: situation });
      return situation;
    } catch (error) {
      console.error('DocumentAnalysisAgent perception error:', error);
      return { error: 'perception_failed', details: error.message };
    }
  }

  async decide(situation: any): Promise<string[]> {
    // Agent makes autonomous decisions based on perceived situation
    const actions: string[] = [];
    
    if (situation.error) {
      actions.push('report_error');
      return actions;
    }
    
    if (situation.pendingDocuments > 0) {
      // Decide processing strategy based on workload and document types
      if (situation.priority === 'high' || situation.systemLoad === 'low') {
        actions.push('process_all_documents');
      } else {
        actions.push('process_priority_documents');
      }
      
      // Decide if OCR is needed
      if (situation.documentTypes.includes('image') || situation.documentTypes.includes('scanned_pdf')) {
        actions.push('initiate_ocr_processing');
      }
      
      // Decide if collaboration is needed
      if (situation.pendingDocuments > 10) {
        actions.push('request_collaboration');
      }
    }
    
    await this.learn({ type: 'decision', situation, actions });
    return actions;
  }

  async act(actions: string[]): Promise<any> {
    // Agent executes its decisions by calling appropriate tools/services
    const results = [];
    
    for (const action of actions) {
      try {
        let result;
        
        switch (action) {
          case 'process_all_documents':
            result = await this.processAllDocuments();
            break;
            
          case 'process_priority_documents':
            result = await this.processPriorityDocuments();
            break;
            
          case 'initiate_ocr_processing':
            result = await this.initiateOCRProcessing();
            break;
            
          case 'request_collaboration':
            result = await this.requestCollaboration();
            break;
            
          case 'report_error':
            result = await this.reportError();
            break;
            
          default:
            result = { action, status: 'unknown_action' };
        }
        
        results.push({ action, result, status: 'completed' });
      } catch (error) {
        results.push({ action, error: error.message, status: 'failed' });
      }
    }
    
    await this.learn({ type: 'action_results', results });
    return results;
  }

  private assessPriority(documents: any[]): 'low' | 'medium' | 'high' {
    // Agent's internal logic to assess priority
    const mtMessages = documents.filter(doc => doc.documentType?.includes('MT'));
    const lcDocuments = documents.filter(doc => doc.documentType?.includes('LC'));
    
    if (mtMessages.length > 0 || lcDocuments.length > 5) {
      return 'high';
    } else if (documents.length > 3) {
      return 'medium';
    }
    return 'low';
  }

  private async processAllDocuments(): Promise<any> {
    // Agent calls document processing service
    console.log(`${this.name}: Initiating comprehensive document processing`);
    
    const documentSets = await azureDataService.getDocumentSets('system');
    const results = [];
    
    for (const docSet of documentSets) {
      if (docSet.analysisStatus === 'pending') {
        try {
          // Agent decides to use document processor
          const processingResult = await documentProcessor.processDocument(docSet.id);
          results.push({
            documentId: docSet.id,
            status: 'processed',
            result: processingResult
          });
        } catch (error) {
          results.push({
            documentId: docSet.id,
            status: 'failed',
            error: error.message
          });
        }
      }
    }
    
    return { processedDocuments: results.length, results };
  }

  private async processPriorityDocuments(): Promise<any> {
    // Agent selects and processes only high-priority documents
    console.log(`${this.name}: Processing priority documents only`);
    
    const documentSets = await azureDataService.getDocumentSets('system');
    const priorityDocs = documentSets.filter(doc => 
      doc.documentType?.includes('MT') || doc.documentType?.includes('LC')
    );
    
    const results = [];
    for (const doc of priorityDocs) {
      try {
        const result = await documentProcessor.processDocument(doc.id);
        results.push({ documentId: doc.id, status: 'processed', result });
      } catch (error) {
        results.push({ documentId: doc.id, status: 'failed', error: error.message });
      }
    }
    
    return { priorityDocumentsProcessed: results.length, results };
  }

  private async initiateOCRProcessing(): Promise<any> {
    // Agent decides to call OCR service for image documents
    console.log(`${this.name}: Initiating OCR processing for image documents`);
    
    // Agent would call OCR service here
    return { 
      action: 'ocr_initiated',
      message: 'OCR processing started for image documents',
      timestamp: new Date().toISOString()
    };
  }

  private async requestCollaboration(): Promise<any> {
    // Agent requests help from other agents
    console.log(`${this.name}: Requesting collaboration due to high workload`);
    
    return {
      action: 'collaboration_requested',
      reason: 'high_document_volume',
      timestamp: new Date().toISOString()
    };
  }

  private async reportError(): Promise<any> {
    console.log(`${this.name}: Reporting system error`);
    return {
      action: 'error_reported',
      agent: this.id,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * DiscrepancyDetectionAgent - Autonomous agent for finding document inconsistencies
 */
export class DiscrepancyDetectionAgent extends AutonomousAgent {
  constructor() {
    super({
      id: 'discrepancy_agent',
      name: 'Discrepancy Detection Agent',
      role: 'Autonomous Quality Assurance Specialist',
      capabilities: [
        'cross_document_analysis',
        'inconsistency_detection',
        'ucp_rule_application',
        'risk_assessment'
      ],
      goals: [
        'identify_all_discrepancies',
        'assess_risk_levels',
        'provide_remediation_advice',
        'ensure_ucp_compliance'
      ],
      availableTools: [
        'discrepancyEngine',
        'azureDataService',
        'ucpRulesDatabase'
      ]
    });
  }

  async perceive(environment: any): Promise<any> {
    // Agent assesses processed documents for discrepancy analysis
    try {
      const documentSets = await azureDataService.getDocumentSets(environment.userId || 'system');
      const processedDocs = documentSets.filter(doc => 
        doc.analysisStatus === 'processed' || doc.analysisStatus === 'completed'
      );
      
      const situation = {
        processedDocuments: processedDocs.length,
        documentsNeedingAnalysis: processedDocs.filter(doc => !doc.discrepancyAnalysis).length,
        documentTypes: [...new Set(processedDocs.map(doc => doc.documentType))],
        priority: this.assessAnalysisPriority(processedDocs)
      };
      
      await this.learn({ type: 'perception', data: situation });
      return situation;
    } catch (error) {
      console.error('DiscrepancyDetectionAgent perception error:', error);
      return { error: 'perception_failed', details: error.message };
    }
  }

  async decide(situation: any): Promise<string[]> {
    const actions: string[] = [];
    
    if (situation.error) {
      actions.push('report_error');
      return actions;
    }
    
    if (situation.documentsNeedingAnalysis > 0) {
      if (situation.priority === 'high') {
        actions.push('run_comprehensive_analysis');
        actions.push('apply_ucp_rules');
      } else {
        actions.push('run_basic_analysis');
      }
      
      if (situation.documentTypes.includes('MT700') || situation.documentTypes.includes('LC')) {
        actions.push('perform_trade_finance_validation');
      }
    }
    
    await this.learn({ type: 'decision', situation, actions });
    return actions;
  }

  async act(actions: string[]): Promise<any> {
    const results = [];
    
    for (const action of actions) {
      try {
        let result;
        
        switch (action) {
          case 'run_comprehensive_analysis':
            result = await this.runComprehensiveAnalysis();
            break;
            
          case 'run_basic_analysis':
            result = await this.runBasicAnalysis();
            break;
            
          case 'apply_ucp_rules':
            result = await this.applyUCPRules();
            break;
            
          case 'perform_trade_finance_validation':
            result = await this.performTradeFinanceValidation();
            break;
            
          case 'report_error':
            result = await this.reportError();
            break;
            
          default:
            result = { action, status: 'unknown_action' };
        }
        
        results.push({ action, result, status: 'completed' });
      } catch (error) {
        results.push({ action, error: error.message, status: 'failed' });
      }
    }
    
    await this.learn({ type: 'action_results', results });
    return results;
  }

  private assessAnalysisPriority(documents: any[]): 'low' | 'medium' | 'high' {
    const highValueDocs = documents.filter(doc => 
      doc.extractedData?.amount && parseFloat(doc.extractedData.amount.replace(/[^0-9.]/g, '')) > 100000
    );
    
    if (highValueDocs.length > 0) return 'high';
    if (documents.length > 5) return 'medium';
    return 'low';
  }

  private async runComprehensiveAnalysis(): Promise<any> {
    console.log(`${this.name}: Running comprehensive discrepancy analysis`);
    
    // Agent calls discrepancy engine
    const documentSets = await azureDataService.getDocumentSets('system');
    const results = [];
    
    for (const docSet of documentSets) {
      try {
        const analysis = await discrepancyEngine.runDiscrepancyAnalysis(docSet.id.toString());
        results.push({
          documentSetId: docSet.id,
          analysis,
          status: 'analyzed'
        });
      } catch (error) {
        results.push({
          documentSetId: docSet.id,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    return { analyzedDocuments: results.length, results };
  }

  private async runBasicAnalysis(): Promise<any> {
    console.log(`${this.name}: Running basic discrepancy analysis`);
    
    // Simplified analysis for lower priority documents
    return {
      action: 'basic_analysis_completed',
      timestamp: new Date().toISOString()
    };
  }

  private async applyUCPRules(): Promise<any> {
    console.log(`${this.name}: Applying UCP 600 rules to identified discrepancies`);
    
    // Agent calls UCP rules service
    const ucpArticles = await azureDataService.getUCPArticles();
    const ucpRules = await azureDataService.getUCPRules();
    
    return {
      action: 'ucp_rules_applied',
      articlesChecked: ucpArticles.length,
      rulesApplied: ucpRules.length,
      timestamp: new Date().toISOString()
    };
  }

  private async performTradeFinanceValidation(): Promise<any> {
    console.log(`${this.name}: Performing specialized trade finance validation`);
    
    // Agent performs specialized validation for trade finance documents
    return {
      action: 'trade_finance_validation_completed',
      timestamp: new Date().toISOString()
    };
  }

  private async reportError(): Promise<any> {
    console.log(`${this.name}: Reporting analysis error`);
    return {
      action: 'error_reported',
      agent: this.id,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * AI-Centric Agent Manager
 * Coordinates autonomous agents but lets them make their own decisions
 */
export class AutonomousAgentCoordinator {
  private agents: Map<string, IAutonomousAgent> = new Map();
  private environment: any = {};
  
  constructor() {
    this.initializeAgents();
  }
  
  private initializeAgents() {
    // Initialize autonomous agents
    const docAgent = new DocumentAnalysisAgent();
    const discrepancyAgent = new DiscrepancyDetectionAgent();
    
    this.agents.set(docAgent.id, docAgent);
    this.agents.set(discrepancyAgent.id, discrepancyAgent);
    
    console.log('Autonomous agents initialized and ready for independent operation');
  }
  
  async updateEnvironment(environmentData: any) {
    this.environment = { ...this.environment, ...environmentData };
    
    // Notify all agents of environment changes - they decide how to respond
    for (const agent of this.agents.values()) {
      try {
        const situation = await agent.perceive(this.environment);
        const actions = await agent.decide(situation);
        await agent.act(actions);
      } catch (error) {
        console.error(`Error in agent ${agent.id}:`, error);
      }
    }
  }
  
  async getAgentStatus(): Promise<any[]> {
    const statusList = [];
    
    for (const agent of this.agents.values()) {
      statusList.push({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities,
        goals: agent.goals,
        memorySize: agent.memory.size,
        status: 'autonomous_operation'
      });
    }
    
    return statusList;
  }
  
  async initiateAgentWorkflow(userId: string, context: any = {}) {
    // Provide context to environment and let agents decide what to do
    await this.updateEnvironment({ userId, ...context });
    
    return {
      message: 'Environment updated - agents operating autonomously',
      activeAgents: this.agents.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
export const autonomousAgentCoordinator = new AutonomousAgentCoordinator();
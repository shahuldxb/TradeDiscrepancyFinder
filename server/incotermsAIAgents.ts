import { incotermsService } from './incotermsService.ts';
import { azureDataService } from './azureDataService.ts';

/**
 * Enhanced AI Agents for Incoterms Management System
 * Based on the Comprehensive System Design Document requirements
 */

// Utility classes that Incoterms agents can call
class IncotermsValidationUtils {
  static async validateIncotermCompliance(incotermCode: string, documentData: any) {
    const incoterm = await incotermsService.getIncotermByCode(incotermCode);
    if (!incoterm) {
      throw new Error(`Incoterm ${incotermCode} not found`);
    }

    const validationResults = {
      incotermCode,
      incotermName: incoterm.term_name,
      transportModeCompliant: true,
      insuranceCompliant: true,
      documentationCompliant: true,
      riskTransferCompliant: true,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Validate transport mode compliance
    if (documentData.transportMode && incoterm.transport_mode !== 'Any Mode') {
      const isSeaTransport = ['Sea', 'Ocean', 'Maritime', 'Vessel'].some(mode => 
        documentData.transportMode.toLowerCase().includes(mode.toLowerCase())
      );
      
      if (incoterm.transport_mode === 'Sea and Inland Waterway' && !isSeaTransport) {
        validationResults.transportModeCompliant = false;
        validationResults.issues.push(`${incotermCode} requires sea/inland waterway transport, but ${documentData.transportMode} specified`);
      }
    }

    // Validate insurance requirements
    if (incoterm.insurance_requirement === 'Required' && !documentData.insuranceProvided) {
      validationResults.insuranceCompliant = false;
      validationResults.issues.push(`${incotermCode} requires insurance coverage but none provided`);
    }

    return validationResults;
  }

  static async extractIncotermFromDocument(documentText: string) {
    const incotermPattern = /\b(EXW|FCA|CPT|CIP|DAP|DPU|DDP|FAS|FOB|CFR|CIF)\b/gi;
    const matches = documentText.match(incotermPattern);
    
    if (matches && matches.length > 0) {
      const detectedIncoterm = matches[0].toUpperCase();
      const incotermData = await incotermsService.getIncotermByCode(detectedIncoterm);
      
      return {
        detected: true,
        incotermCode: detectedIncoterm,
        incotermData,
        confidence: 0.9,
        location: documentText.indexOf(matches[0])
      };
    }

    return {
      detected: false,
      incotermCode: null,
      incotermData: null,
      confidence: 0.0,
      location: -1
    };
  }

  static async crossValidateDocuments(documents: any[], incotermCode: string) {
    const incoterm = await incotermsService.getIncotermByCode(incotermCode);
    const validationResults = {
      crossValidationPassed: true,
      inconsistencies: [] as string[],
      missingDocuments: [] as string[],
      recommendations: [] as string[]
    };

    // Check for required documents based on Incoterm
    const requiredDocs = this.getRequiredDocuments(incotermCode);
    const providedDocTypes = documents.map(doc => doc.documentType?.toLowerCase());

    for (const requiredDoc of requiredDocs) {
      const isProvided = providedDocTypes.some(docType => 
        docType?.includes(requiredDoc.toLowerCase())
      );
      
      if (!isProvided) {
        validationResults.crossValidationPassed = false;
        validationResults.missingDocuments.push(requiredDoc);
      }
    }

    return validationResults;
  }

  private static getRequiredDocuments(incotermCode: string): string[] {
    const documentRequirements: Record<string, string[]> = {
      'CIF': ['Commercial Invoice', 'Bill of Lading', 'Insurance Certificate'],
      'CIP': ['Commercial Invoice', 'Transport Document', 'Insurance Certificate'],
      'FOB': ['Commercial Invoice', 'Bill of Lading'],
      'CFR': ['Commercial Invoice', 'Bill of Lading'],
      'EXW': ['Commercial Invoice'],
      'FCA': ['Commercial Invoice', 'Transport Document'],
      'CPT': ['Commercial Invoice', 'Transport Document'],
      'DAP': ['Commercial Invoice', 'Transport Document'],
      'DPU': ['Commercial Invoice', 'Transport Document'],
      'DDP': ['Commercial Invoice', 'Transport Document', 'Import Permit'],
      'FAS': ['Commercial Invoice']
    };

    return documentRequirements[incotermCode] || ['Commercial Invoice'];
  }
}

class MTMessageIncotermsUtils {
  static async validateMTMessageIncoterms(mtMessage: any, incotermCode: string) {
    const validation = {
      mtMessageCompliant: true,
      incotermConsistent: true,
      fieldValidation: [] as any[],
      warnings: [] as string[]
    };

    // Validate MT700 fields against Incoterm requirements
    if (mtMessage.messageType === 'MT700') {
      await this.validateMT700Fields(mtMessage, incotermCode, validation);
    }

    return validation;
  }

  private static async validateMT700Fields(mtMessage: any, incotermCode: string, validation: any) {
    const incoterm = await incotermsService.getIncotermByCode(incotermCode);
    
    // Check Field 45A (Description of Goods) for Incoterm mention
    if (mtMessage.field45A && !mtMessage.field45A.includes(incotermCode)) {
      validation.warnings.push('Incoterm not explicitly mentioned in goods description');
    }

    // Check Field 46A (Documents Required) based on Incoterm
    if (incoterm.insurance_requirement === 'Required' && mtMessage.field46A) {
      if (!mtMessage.field46A.toLowerCase().includes('insurance')) {
        validation.mtMessageCompliant = false;
        validation.fieldValidation.push({
          field: '46A',
          issue: 'Insurance certificate required for ' + incotermCode,
          severity: 'High'
        });
      }
    }

    // Check Field 44C (Latest Date of Shipment) consistency
    if (mtMessage.field44C && ['EXW', 'FCA'].includes(incotermCode)) {
      validation.warnings.push('Shipment date may not be relevant for ' + incotermCode);
    }
  }
}

/**
 * Incoterms Validation Agent - Autonomous agent for Incoterms compliance
 */
export class IncotermsValidationAgent {
  public id: string = 'incoterms_validation_agent';
  public name: string = 'Incoterms Validation Agent';
  public role: string = 'Validates trade finance documents against Incoterms 2020 rules';
  public isRunning: boolean = false;
  public memory: Map<string, any> = new Map();

  constructor() {
    this.startAutonomousOperation();
  }

  private startAutonomousOperation() {
    this.isRunning = true;
    this.autonomousLoop();
  }

  private async autonomousLoop() {
    while (this.isRunning) {
      try {
        const environment = await this.perceiveEnvironment();
        const decisions = await this.makeDecisions(environment);
        
        for (const decision of decisions) {
          await this.executeAction(decision);
        }
        
        await this.learn({ environment, decisions, timestamp: new Date() });
        await new Promise(resolve => setTimeout(resolve, 8000)); // Check every 8 seconds
        
      } catch (error) {
        console.error(`${this.name} encountered error:`, error);
        await this.handleError(error);
      }
    }
  }

  async perceiveEnvironment() {
    // Agent perceives need for Incoterms validation
    const documentSets = await azureDataService.getDocumentSets('system');
    const pendingValidation = documentSets.filter(ds => 
      ds.status === 'pending' || ds.status === 'uploaded'
    );

    return {
      pendingDocuments: pendingValidation,
      hasIncotermValidationWork: pendingValidation.length > 0,
      timestamp: new Date()
    };
  }

  async makeDecisions(environment: any): Promise<string[]> {
    const decisions: string[] = [];

    if (environment.hasIncotermValidationWork) {
      decisions.push('validateIncotermsCompliance');
    }

    // Check memory for patterns
    const recentWork = this.memory.get('recent_validations') || [];
    if (recentWork.length > 5) {
      decisions.push('analyzeValidationPatterns');
    }

    return decisions;
  }

  async executeAction(action: string): Promise<any> {
    switch (action) {
      case 'validateIncotermsCompliance':
        return await this.performIncotermsValidation();
      
      case 'analyzeValidationPatterns':
        return await this.analyzeValidationPatterns();
      
      default:
        console.log(`${this.name}: Unknown action ${action}`);
    }
  }

  private async performIncotermsValidation() {
    console.log(`${this.name}: Performing autonomous Incoterms validation`);
    
    const documentSets = await azureDataService.getDocumentSets('system');
    const pendingValidation = documentSets.filter(ds => 
      ds.status === 'pending' || ds.status === 'uploaded'
    ).slice(0, 3); // Process up to 3 at a time

    const validationResults = [];

    for (const docSet of pendingValidation) {
      try {
        // Extract Incoterm from documents
        const incotermDetection = await IncotermsValidationUtils.extractIncotermFromDocument(
          docSet.setName || ''
        );

        if (incotermDetection.detected) {
          // Validate compliance
          const complianceResult = await IncotermsValidationUtils.validateIncotermCompliance(
            incotermDetection.incotermCode,
            docSet
          );

          // Cross-validate documents
          const crossValidation = await IncotermsValidationUtils.crossValidateDocuments(
            [], // Would get actual documents from docSet
            incotermDetection.incotermCode
          );

          const result = {
            documentSetId: docSet.id,
            incotermDetection,
            complianceResult,
            crossValidation,
            agentId: this.id,
            validationDate: new Date()
          };

          validationResults.push(result);

          // Store validation result
          await azureDataService.createDiscrepancy({
            document_set_id: docSet.id,
            discrepancy_type: 'Incoterms Validation',
            description: `Incoterms validation completed for ${incotermDetection.incotermCode}`,
            severity: complianceResult.issues.length > 0 ? 'Medium' : 'Low',
            status: complianceResult.issues.length > 0 ? 'Open' : 'Resolved',
            ai_agent_analysis: JSON.stringify(result)
          });
        }
      } catch (error) {
        console.error(`Error validating document set ${docSet.id}:`, error);
      }
    }

    // Update memory
    const recentValidations = this.memory.get('recent_validations') || [];
    recentValidations.push(...validationResults);
    this.memory.set('recent_validations', recentValidations.slice(-10)); // Keep last 10

    return {
      action: 'incoterms_validation_completed',
      validatedSets: validationResults.length,
      results: validationResults
    };
  }

  private async analyzeValidationPatterns() {
    const recentValidations = this.memory.get('recent_validations') || [];
    
    const patterns = {
      mostCommonIncoterms: this.getMostCommonIncoterms(recentValidations),
      commonIssues: this.getCommonIssues(recentValidations),
      complianceRate: this.calculateComplianceRate(recentValidations)
    };

    this.memory.set('validation_patterns', patterns);

    return {
      action: 'pattern_analysis_completed',
      patterns,
      analysisDate: new Date()
    };
  }

  private getMostCommonIncoterms(validations: any[]) {
    const incotermCounts: Record<string, number> = {};
    validations.forEach(v => {
      if (v.incotermDetection?.incotermCode) {
        incotermCounts[v.incotermDetection.incotermCode] = 
          (incotermCounts[v.incotermDetection.incotermCode] || 0) + 1;
      }
    });
    return incotermCounts;
  }

  private getCommonIssues(validations: any[]) {
    const issues: string[] = [];
    validations.forEach(v => {
      if (v.complianceResult?.issues) {
        issues.push(...v.complianceResult.issues);
      }
    });
    return issues;
  }

  private calculateComplianceRate(validations: any[]) {
    if (validations.length === 0) return 0;
    const compliant = validations.filter(v => 
      v.complianceResult?.issues?.length === 0
    ).length;
    return (compliant / validations.length) * 100;
  }

  async learn(experience: any) {
    this.memory.set(`experience_${Date.now()}`, experience);
    if (this.memory.size > 50) {
      const oldestKey = this.memory.keys().next().value;
      this.memory.delete(oldestKey);
    }
  }

  async handleError(error: any) {
    console.error(`${this.name} error:`, error);
    // Could save error to database for analysis
  }

  stop() {
    this.isRunning = false;
  }
}

/**
 * MT Message Incoterms Agent - Validates SWIFT messages against Incoterms
 */
export class MTMessageIncotermsAgent {
  public id: string = 'mt_message_incoterms_agent';
  public name: string = 'MT Message Incoterms Agent';
  public role: string = 'Validates SWIFT MT messages for Incoterms compliance';
  public isRunning: boolean = false;
  public memory: Map<string, any> = new Map();

  constructor() {
    this.startAutonomousOperation();
  }

  private startAutonomousOperation() {
    this.isRunning = true;
    this.autonomousLoop();
  }

  private async autonomousLoop() {
    while (this.isRunning) {
      try {
        const environment = await this.perceiveEnvironment();
        const decisions = await this.makeDecisions(environment);
        
        for (const decision of decisions) {
          await this.executeAction(decision);
        }
        
        await this.learn({ environment, decisions, timestamp: new Date() });
        await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
        
      } catch (error) {
        console.error(`${this.name} encountered error:`, error);
        await this.handleError(error);
      }
    }
  }

  async perceiveEnvironment() {
    // Check for MT messages that need Incoterms validation
    const swiftMessages = await azureDataService.getSwiftMessageTypes();
    const mt700Messages = swiftMessages.filter(msg => 
      msg.message_type?.startsWith('MT7')
    );

    return {
      pendingMTMessages: mt700Messages,
      hasMTValidationWork: mt700Messages.length > 0,
      timestamp: new Date()
    };
  }

  async makeDecisions(environment: any): Promise<string[]> {
    const decisions: string[] = [];

    if (environment.hasMTValidationWork) {
      decisions.push('validateMTIncotermsCompliance');
    }

    return decisions;
  }

  async executeAction(action: string): Promise<any> {
    switch (action) {
      case 'validateMTIncotermsCompliance':
        return await this.validateMTMessages();
      
      default:
        console.log(`${this.name}: Unknown action ${action}`);
    }
  }

  private async validateMTMessages() {
    console.log(`${this.name}: Validating MT messages for Incoterms compliance`);
    
    // This would integrate with actual MT message processing
    const validationResult = {
      action: 'mt_message_validation_completed',
      messagesProcessed: 0,
      validationDate: new Date()
    };

    return validationResult;
  }

  async learn(experience: any) {
    this.memory.set(`experience_${Date.now()}`, experience);
    if (this.memory.size > 50) {
      const oldestKey = this.memory.keys().next().value;
      this.memory.delete(oldestKey);
    }
  }

  async handleError(error: any) {
    console.error(`${this.name} error:`, error);
  }

  stop() {
    this.isRunning = false;
  }
}

// Enhanced Agent Coordinator for Incoterms
export class IncotermsAgentCoordinator {
  private agents: Map<string, any> = new Map();
  private environment: any = {};

  constructor() {
    this.initializeIncotermsAgents();
  }

  private initializeIncotermsAgents() {
    const incotermsAgent = new IncotermsValidationAgent();
    const mtAgent = new MTMessageIncotermsAgent();

    this.agents.set(incotermsAgent.id, incotermsAgent);
    this.agents.set(mtAgent.id, mtAgent);

    console.log('Incoterms AI agents initialized and running autonomously');
  }

  async updateEnvironment(environmentData: any) {
    this.environment = { ...this.environment, ...environmentData };
    console.log('Incoterms agent environment updated:', environmentData);
  }

  async getAgentStatus(): Promise<any[]> {
    const statusList = [];
    for (const [id, agent] of this.agents) {
      statusList.push({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        isRunning: agent.isRunning,
        memorySize: agent.memory.size,
        status: agent.isRunning ? 'active' : 'inactive'
      });
    }
    return statusList;
  }

  stopAllAgents() {
    for (const [id, agent] of this.agents) {
      agent.stop();
    }
    console.log('All Incoterms agents stopped');
  }
}

export const incotermsAgentCoordinator = new IncotermsAgentCoordinator();
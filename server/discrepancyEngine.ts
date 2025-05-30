import { processDocumentSetWithAgents } from './crewai';

interface FieldValidation {
  field: string;
  isValid: boolean;
  value?: any;
  expectedValue?: any;
  rule?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

interface DocumentComparison {
  document1: any;
  document2: any;
  fieldComparisons: FieldValidation[];
  discrepancies: any[];
}

export async function runDiscrepancyAnalysis(documentSetId: string): Promise<string> {
  // AI-Centric: This function should only be called by autonomous agents
  // External systems should signal agents instead of calling this directly
  
  const { azureDataService } = await import('./azureDataService');
  
  try {
    // Agents call this utility to perform actual discrepancy analysis
    const documents = await azureDataService.getDocumentSets(documentSetId);
    const discrepancies = await azureDataService.getDiscrepancies({ documentSetId });
    
    // Perform analysis logic here (called by agents)
    const analysisResult = {
      documentSetId,
      discrepanciesFound: discrepancies.length,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(analysisResult);
    
  } catch (error) {
    console.error('Error in discrepancy analysis utility:', error);
    throw error;
  }
}

export async function getDiscrepancies(documentSetId: string) {
  const { storage } = await import('./storage');
  return await storage.getDiscrepanciesBySet(documentSetId);
}

// Manual validation functions for specific use cases
export async function validateMandatoryFields(documents: any[]): Promise<FieldValidation[]> {
  const validations: FieldValidation[] = [];
  
  for (const doc of documents) {
    const mandatoryFields = getMandatoryFieldsForDocumentType(doc.documentType);
    
    for (const field of mandatoryFields) {
      const hasField = doc.extractedData?.fields?.[field] != null;
      
      validations.push({
        field: `${doc.documentType}.${field}`,
        isValid: hasField,
        value: doc.extractedData?.fields?.[field],
        rule: `UCP 600 - Mandatory field for ${doc.documentType}`,
        severity: 'critical',
      });
    }
  }
  
  return validations;
}

export async function validateFieldFormats(documents: any[]): Promise<FieldValidation[]> {
  const validations: FieldValidation[] = [];
  
  for (const doc of documents) {
    if (doc.extractedData?.fields) {
      // Validate amount format
      if (doc.extractedData.fields.amount) {
        const isValidAmount = /^[0-9]+\.?[0-9]*$/.test(doc.extractedData.fields.amount);
        validations.push({
          field: `${doc.documentType}.amount`,
          isValid: isValidAmount,
          value: doc.extractedData.fields.amount,
          rule: 'Amount must be numeric',
          severity: 'high',
        });
      }
      
      // Validate date format
      if (doc.extractedData.fields.date) {
        const isValidDate = !isNaN(Date.parse(doc.extractedData.fields.date));
        validations.push({
          field: `${doc.documentType}.date`,
          isValid: isValidDate,
          value: doc.extractedData.fields.date,
          rule: 'Date must be valid format',
          severity: 'medium',
        });
      }
      
      // Validate currency format
      if (doc.extractedData.fields.currency) {
        const isValidCurrency = /^[A-Z]{3}$/.test(doc.extractedData.fields.currency);
        validations.push({
          field: `${doc.documentType}.currency`,
          isValid: isValidCurrency,
          value: doc.extractedData.fields.currency,
          rule: 'Currency must be 3-letter ISO code',
          severity: 'high',
        });
      }
    }
  }
  
  return validations;
}

export async function performCrossDocumentValidation(documents: any[]): Promise<DocumentComparison[]> {
  const comparisons: DocumentComparison[] = [];
  
  // Compare MT700 with Commercial Invoice
  const mt700 = documents.find(d => d.documentType === 'mt700');
  const invoice = documents.find(d => d.documentType === 'commercial_invoice');
  
  if (mt700 && invoice) {
    const comparison = compareDocuments(mt700, invoice);
    comparisons.push(comparison);
  }
  
  // Compare MT700 with Bill of Lading
  const billOfLading = documents.find(d => d.documentType === 'bill_of_lading');
  
  if (mt700 && billOfLading) {
    const comparison = compareDocuments(mt700, billOfLading);
    comparisons.push(comparison);
  }
  
  return comparisons;
}

function compareDocuments(doc1: any, doc2: any): DocumentComparison {
  const fieldComparisons: FieldValidation[] = [];
  const discrepancies: any[] = [];
  
  const commonFields = ['amount', 'currency', 'beneficiary', 'date'];
  
  for (const field of commonFields) {
    const value1 = doc1.extractedData?.fields?.[field];
    const value2 = doc2.extractedData?.fields?.[field];
    
    if (value1 && value2) {
      const isMatch = normalizeValue(value1) === normalizeValue(value2);
      
      fieldComparisons.push({
        field,
        isValid: isMatch,
        value: value2,
        expectedValue: value1,
        rule: `${field} must match between ${doc1.documentType} and ${doc2.documentType}`,
        severity: getSeverityForField(field),
      });
      
      if (!isMatch) {
        discrepancies.push({
          type: 'data_inconsistency',
          field,
          severity: getSeverityForField(field),
          description: `${field} mismatch between ${doc1.documentType} and ${doc2.documentType}`,
          values: {
            [doc1.documentType]: value1,
            [doc2.documentType]: value2,
          },
        });
      }
    }
  }
  
  return {
    document1: doc1,
    document2: doc2,
    fieldComparisons,
    discrepancies,
  };
}

function getMandatoryFieldsForDocumentType(documentType: string): string[] {
  const mandatoryFields: Record<string, string[]> = {
    'mt700': ['creditNumber', 'amount', 'currency', 'expiryDate', 'beneficiary', 'applicant'],
    'commercial_invoice': ['amount', 'currency', 'date', 'beneficiary'],
    'bill_of_lading': ['vesselName', 'portOfLoading', 'portOfDischarge', 'date'],
    'insurance_certificate': ['amount', 'currency', 'coverage', 'effectiveDate'],
  };
  
  return mandatoryFields[documentType] || [];
}

function normalizeValue(value: any): string {
  if (typeof value === 'string') {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
  return String(value).trim().toLowerCase();
}

function getSeverityForField(field: string): 'critical' | 'high' | 'medium' | 'low' {
  const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    'amount': 'critical',
    'currency': 'critical',
    'expiryDate': 'critical',
    'beneficiary': 'high',
    'applicant': 'high',
    'date': 'medium',
    'description': 'low',
  };
  
  return severityMap[field] || 'medium';
}

export async function applyUCPRules(discrepancies: any[]): Promise<any[]> {
  const ucpValidatedDiscrepancies = [];
  
  for (const discrepancy of discrepancies) {
    const ucpRule = getUCPRuleForDiscrepancy(discrepancy);
    
    const validatedDiscrepancy = {
      ...discrepancy,
      ucpReference: ucpRule.reference,
      ruleExplanation: ucpRule.explanation,
      advice: ucpRule.advice,
      severity: ucpRule.severity || discrepancy.severity,
    };
    
    ucpValidatedDiscrepancies.push(validatedDiscrepancy);
  }
  
  return ucpValidatedDiscrepancies;
}

function getUCPRuleForDiscrepancy(discrepancy: any): any {
  const ucpRules: Record<string, any> = {
    'amount': {
      reference: 'Article 18b',
      explanation: 'Commercial invoice amount must not exceed the credit amount',
      advice: 'Ensure invoice amount is within credit limits',
      severity: 'critical',
    },
    'currency': {
      reference: 'Article 18c',
      explanation: 'Commercial invoice must be in the same currency as the credit',
      advice: 'Verify currency matches credit terms',
      severity: 'critical',
    },
    'expiryDate': {
      reference: 'Article 14c',
      explanation: 'Documents must not be dated later than their date of presentation',
      advice: 'Check document dates against presentation timeline',
      severity: 'critical',
    },
    'beneficiary': {
      reference: 'Article 14d',
      explanation: 'Beneficiary name must be consistent across documents',
      advice: 'Verify beneficiary details match exactly',
      severity: 'high',
    },
    'description': {
      reference: 'Article 14e',
      explanation: 'Description of goods must correspond with credit terms',
      advice: 'Review goods description for compliance',
      severity: 'medium',
    },
  };
  
  const fieldName = discrepancy.field?.split('.').pop() || discrepancy.fieldName;
  return ucpRules[fieldName] || {
    reference: 'General UCP 600',
    explanation: 'Document must comply with credit terms and conditions',
    advice: 'Review document for compliance with UCP 600 standards',
  };
}

import { db } from "./db";
import { discrepancies, documentSets, documents } from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";

interface DiscrepancyPattern {
  fieldCode: string;
  discrepancyType: string;
  frequency: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  commonCauses: string[];
  predictiveIndicators: string[];
}

interface RiskPrediction {
  documentSetId: string;
  overallRiskScore: number;
  fieldRiskScores: { [fieldCode: string]: number };
  predictedDiscrepancies: PredictedDiscrepancy[];
  recommendations: string[];
  confidence: number;
}

interface PredictedDiscrepancy {
  fieldCode: string;
  type: string;
  probability: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  preventionSuggestions: string[];
}

interface MLTrainingData {
  documentFeatures: any;
  knownDiscrepancies: any[];
  fieldValues: any;
  documentTypes: string[];
  historicalPatterns: any;
}

export class MLPredictiveEngine {
  private trainingData: MLTrainingData[] = [];
  private patterns: Map<string, DiscrepancyPattern> = new Map();

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine() {
    await this.loadHistoricalData();
    await this.analyzePatterns();
  }

  /**
   * Load historical discrepancy data for training
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const historicalDiscrepancies = await db
        .select()
        .from(discrepancies)
        .orderBy(desc(discrepancies.createdAt))
        .limit(1000);

      const documentSetIds = [...new Set(historicalDiscrepancies.map(d => d.documentSetId))];
      
      for (const setId of documentSetIds) {
        const documentSet = await db
          .select()
          .from(documentSets)
          .where(eq(documentSets.id, setId))
          .limit(1);

        const setDiscrepancies = historicalDiscrepancies.filter(d => d.documentSetId === setId);

        if (documentSet.length > 0) {
          const trainingPoint: MLTrainingData = {
            documentFeatures: {
              setId: documentSet[0].id,
              setName: documentSet[0].setName,
              requiredDocuments: documentSet[0].requiredDocuments,
              uploadedDocuments: documentSet[0].uploadedDocuments
            },
            knownDiscrepancies: setDiscrepancies,
            fieldValues: {},
            documentTypes: [],
            historicalPatterns: {}
          };

          this.trainingData.push(trainingPoint);
        }
      }

      console.log(`Loaded ${this.trainingData.length} historical data points for ML training`);
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  }

  /**
   * Analyze patterns using rule-based analysis to identify common discrepancy trends
   */
  private async analyzePatterns(): Promise<void> {
    if (this.trainingData.length === 0) {
      console.log("No training data available for pattern analysis");
      return;
    }

    try {
      // Rule-based pattern analysis
      const fieldFrequencies = new Map<string, number>();
      const severityDistribution = new Map<string, Map<string, number>>();
      
      // Analyze historical data for patterns
      this.trainingData.forEach(data => {
        data.knownDiscrepancies.forEach((discrepancy: any) => {
          const fieldCode = discrepancy.fieldName || 'unknown';
          const severity = discrepancy.severity || 'medium';
          
          // Count field frequencies
          fieldFrequencies.set(fieldCode, (fieldFrequencies.get(fieldCode) || 0) + 1);
          
          // Track severity distribution per field
          if (!severityDistribution.has(fieldCode)) {
            severityDistribution.set(fieldCode, new Map());
          }
          const fieldSeverities = severityDistribution.get(fieldCode)!;
          fieldSeverities.set(severity, (fieldSeverities.get(severity) || 0) + 1);
        });
      });

      // Generate patterns based on analysis
      fieldFrequencies.forEach((frequency, fieldCode) => {
        const severities = severityDistribution.get(fieldCode);
        const mostCommonSeverity = this.getMostCommonSeverity(severities);
        
        const pattern: DiscrepancyPattern = {
          fieldCode,
          discrepancyType: this.getCommonDiscrepancyType(fieldCode),
          frequency,
          severity: mostCommonSeverity,
          commonCauses: this.getCommonCauses(fieldCode),
          predictiveIndicators: this.getPredictiveIndicators(fieldCode)
        };

        this.patterns.set(fieldCode, pattern);
      });

      console.log(`Analyzed patterns for ${this.patterns.size} field codes`);
    } catch (error) {
      console.error("Error in pattern analysis:", error);
    }
  }

  /**
   * Predict potential discrepancies for a new document set using rule-based analysis
   */
  async predictDiscrepancies(documentSetId: string): Promise<RiskPrediction> {
    try {
      const documentFeatures = await this.extractDocumentFeatures(documentSetId);
      
      // Rule-based risk calculation
      let overallRiskScore = 0;
      const fieldRiskScores: { [fieldCode: string]: number } = {};
      const predictedDiscrepancies: PredictedDiscrepancy[] = [];
      const recommendations: string[] = [];

      // Check for missing required documents
      const requiredDocsComplete = this.checkRequiredDocuments(documentFeatures.documents || []);
      if (!requiredDocsComplete) {
        overallRiskScore += 0.3;
        recommendations.push("Ensure all required documents are uploaded before processing");
      }

      // Analyze field patterns
      this.patterns.forEach((pattern, fieldCode) => {
        const riskScore = this.calculateFieldRisk(pattern, documentFeatures);
        fieldRiskScores[fieldCode] = riskScore;
        
        if (riskScore > 0.6) {
          predictedDiscrepancies.push({
            fieldCode,
            type: pattern.discrepancyType,
            probability: riskScore,
            severity: pattern.severity,
            description: `High probability of ${pattern.discrepancyType} in field ${fieldCode}`,
            preventionSuggestions: pattern.commonCauses.map(cause => `Review ${cause}`)
          });
        }
      });

      // Calculate overall risk
      const avgFieldRisk = Object.values(fieldRiskScores).reduce((sum, risk) => sum + risk, 0) / 
                          Math.max(Object.keys(fieldRiskScores).length, 1);
      overallRiskScore = Math.min(1, overallRiskScore + avgFieldRisk);

      // Generate recommendations
      if (overallRiskScore > 0.7) {
        recommendations.push("High risk detected - recommend thorough manual review");
      } else if (overallRiskScore > 0.5) {
        recommendations.push("Medium risk - focus on highlighted fields");
      }

      return {
        documentSetId,
        overallRiskScore,
        fieldRiskScores,
        predictedDiscrepancies,
        recommendations,
        confidence: this.calculateSystemConfidence()
      };

    } catch (error) {
      console.error("Error predicting discrepancies:", error);
      throw error;
    }
  }

  /**
   * Learn from new discrepancy data to improve predictions
   */
  async learnFromNewData(documentSetId: string, actualDiscrepancies: any[]): Promise<void> {
    try {
      const documentFeatures = await this.extractDocumentFeatures(documentSetId);
      
      const newTrainingData: MLTrainingData = {
        documentFeatures,
        knownDiscrepancies: actualDiscrepancies,
        fieldValues: {},
        documentTypes: [],
        historicalPatterns: {}
      };

      this.trainingData.push(newTrainingData);
      
      // Re-analyze patterns with new data
      await this.analyzePatterns();
      
      console.log(`Learned from ${actualDiscrepancies.length} new discrepancies`);
    } catch (error) {
      console.error("Error learning from new data:", error);
    }
  }

  /**
   * Get pattern insights for specific field codes
   */
  getFieldPatterns(fieldCode: string): DiscrepancyPattern | undefined {
    return this.patterns.get(fieldCode);
  }

  /**
   * Get overall system confidence metrics
   */
  getSystemMetrics(): any {
    return {
      totalTrainingData: this.trainingData.length,
      identifiedPatterns: this.patterns.size,
      confidence: this.calculateSystemConfidence(),
      lastUpdated: new Date().toISOString()
    };
  }

  // Helper methods
  private getMostCommonSeverity(severities?: Map<string, number>): 'critical' | 'high' | 'medium' | 'low' {
    if (!severities || severities.size === 0) return 'medium';
    
    let maxCount = 0;
    let mostCommon: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    
    severities.forEach((count, severity) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = severity as 'critical' | 'high' | 'medium' | 'low';
      }
    });
    
    return mostCommon;
  }

  private getCommonDiscrepancyType(fieldCode: string): string {
    // Rule-based classification
    if (fieldCode.includes('date') || fieldCode.includes('Date')) {
      return 'date_format_error';
    } else if (fieldCode.includes('amount') || fieldCode.includes('Amount')) {
      return 'amount_mismatch';
    } else if (fieldCode.includes('reference') || fieldCode.includes('Reference')) {
      return 'reference_error';
    }
    return 'format_error';
  }

  private getCommonCauses(fieldCode: string): string[] {
    // Rule-based common causes
    const causes = ['data_entry_error', 'format_inconsistency'];
    
    if (fieldCode.includes('date')) {
      causes.push('date_format_variation');
    } else if (fieldCode.includes('amount')) {
      causes.push('currency_mismatch', 'calculation_error');
    }
    
    return causes;
  }

  private getPredictiveIndicators(fieldCode: string): string[] {
    // Rule-based indicators
    const indicators = ['incomplete_data', 'manual_entry'];
    
    if (fieldCode.includes('date')) {
      indicators.push('inconsistent_date_formats');
    } else if (fieldCode.includes('amount')) {
      indicators.push('multiple_currencies', 'complex_calculations');
    }
    
    return indicators;
  }

  private calculateFieldRisk(pattern: DiscrepancyPattern, documentFeatures: any): number {
    let risk = 0;
    
    // Base risk from frequency
    risk += Math.min(0.4, pattern.frequency / 100);
    
    // Severity multiplier
    const severityMultiplier = {
      'critical': 1.0,
      'high': 0.8,
      'medium': 0.5,
      'low': 0.2
    };
    risk *= severityMultiplier[pattern.severity];
    
    return Math.min(1, risk);
  }

  private checkRequiredDocuments(documents: any[]): boolean {
    const requiredTypes = ['commercial_invoice', 'bill_of_lading', 'mt700'];
    const uploadedTypes = documents.map(d => d.documentType || d.type).filter(Boolean);
    
    return requiredTypes.every(type => uploadedTypes.includes(type));
  }

  private async extractDocumentFeatures(documentSetId: string): Promise<any> {
    try {
      const documentSet = await db
        .select()
        .from(documentSets)
        .where(eq(documentSets.id, documentSetId))
        .limit(1);

      const documents: any = await db
        .select()
        .from(documents)
        .where(eq(documents.documentSetId, documentSetId));

      return {
        documentSet: documentSet[0],
        documents,
        documentCount: documents.length,
        avgFileSize: documents.reduce((sum: number, d: any) => sum + (d.fileSize || 0), 0) / 
                    Math.max(documents.length, 1),
        hasAllRequiredDocs: this.checkRequiredDocuments(documents)
      };
    } catch (error) {
      console.error("Error extracting document features:", error);
      return {};
    }
  }

  private calculateSystemConfidence(): number {
    const minTrainingData = 100;
    const minPatterns = 10;
    
    const dataConfidence = Math.min(1, this.trainingData.length / minTrainingData);
    const patternConfidence = Math.min(1, this.patterns.size / minPatterns);
    
    return (dataConfidence + patternConfidence) / 2;
  }
}

export const mlEngine = new MLPredictiveEngine();

// Export functions for use in routes
export async function generateRiskPrediction(documentSetId: string): Promise<RiskPrediction> {
  return await mlEngine.predictDiscrepancies(documentSetId);
}

export async function updateMLLearning(documentSetId: string, discrepancies: any[]): Promise<void> {
  await mlEngine.learnFromNewData(documentSetId, discrepancies);
}

export function getMLSystemMetrics(): any {
  return mlEngine.getSystemMetrics();
}

export function getFieldPatternInsights(fieldCode: string): DiscrepancyPattern | undefined {
  return mlEngine.getFieldPatterns(fieldCode);
}
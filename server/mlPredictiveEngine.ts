import OpenAI from "openai";
import { db } from "./db";
import { discrepancies, documentSets, documents } from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    console.log("Initializing ML Predictive Engine...");
    await this.loadHistoricalData();
    await this.analyzePatterns();
  }

  /**
   * Load historical discrepancy data for training
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const historicalDiscrepancies = await db
        .select({
          discrepancy: discrepancies,
          documentSet: documentSets,
        })
        .from(discrepancies)
        .leftJoin(documentSets, eq(discrepancies.documentSetId, documentSets.id))
        .orderBy(desc(discrepancies.createdAt))
        .limit(1000);

      for (const record of historicalDiscrepancies) {
        if (record.discrepancy && record.documentSet) {
          const trainingPoint: MLTrainingData = {
            documentFeatures: {
              documentSetId: record.documentSet.id,
              name: record.documentSet.name,
              status: record.documentSet.status,
              createdAt: record.documentSet.createdAt,
            },
            knownDiscrepancies: [record.discrepancy],
            fieldValues: record.discrepancy.fieldValue || {},
            documentTypes: record.documentSet.name?.split('_') || [],
            historicalPatterns: {
              fieldCode: record.discrepancy.fieldCode,
              discrepancyType: record.discrepancy.type,
              severity: record.discrepancy.severity,
            },
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
   * Analyze patterns using OpenAI to identify common discrepancy trends
   */
  private async analyzePatterns(): Promise<void> {
    if (this.trainingData.length === 0) {
      console.log("No training data available for pattern analysis");
      return;
    }

    try {
      const patternAnalysisPrompt = `
        Analyze the following trade finance discrepancy data and identify patterns:
        
        Historical Discrepancies:
        ${JSON.stringify(this.trainingData.slice(0, 50), null, 2)}
        
        Please identify:
        1. Most common field codes with discrepancies
        2. Common discrepancy types and their severity patterns
        3. Predictive indicators that suggest potential issues
        4. Field dependencies that often cause cascading errors
        
        Respond with JSON in this format:
        {
          "patterns": [
            {
              "fieldCode": "string",
              "discrepancyType": "string", 
              "frequency": number,
              "severity": "critical|high|medium|low",
              "commonCauses": ["string"],
              "predictiveIndicators": ["string"]
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in trade finance and SWIFT message validation. Analyze discrepancy patterns to identify predictive indicators for future issues."
          },
          {
            role: "user",
            content: patternAnalysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent analysis
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      
      if (analysisResult.patterns) {
        for (const pattern of analysisResult.patterns) {
          this.patterns.set(pattern.fieldCode, pattern);
        }
      }

      console.log(`Identified ${this.patterns.size} discrepancy patterns`);
    } catch (error) {
      console.error("Error analyzing patterns:", error);
    }
  }

  /**
   * Predict potential discrepancies for a new document set
   */
  async predictDiscrepancies(documentSetId: string): Promise<RiskPrediction> {
    try {
      // Get document set details
      const documentSet = await db
        .select()
        .from(documentSets)
        .where(eq(documentSets.id, documentSetId))
        .limit(1);

      if (!documentSet.length) {
        throw new Error("Document set not found");
      }

      // Get documents in the set
      const documentList = await db
        .select()
        .from(documents)
        .where(eq(documents.documentSetId, documentSetId));

      // Extract document features for analysis
      const documentFeatures = {
        documentCount: documentList.length,
        documentTypes: documentList.map(d => d.documentType),
        hasRequiredDocs: this.checkRequiredDocuments(documentList),
        avgFileSize: documentList.reduce((sum, d) => sum + (d.fileSize || 0), 0) / documentList.length,
      };

      // Use OpenAI to predict potential issues
      const predictionPrompt = `
        Based on the following document set and historical patterns, predict potential discrepancies:
        
        Document Set: ${JSON.stringify(documentSet[0], null, 2)}
        Documents: ${JSON.stringify(documentList, null, 2)}
        Document Features: ${JSON.stringify(documentFeatures, null, 2)}
        
        Historical Patterns: ${JSON.stringify(Array.from(this.patterns.values()), null, 2)}
        
        Please analyze and predict:
        1. Overall risk score (0-100)
        2. Field-specific risk scores
        3. Potential discrepancies with probability
        4. Prevention recommendations
        
        Respond with JSON in this format:
        {
          "overallRiskScore": number,
          "fieldRiskScores": {"fieldCode": number},
          "predictedDiscrepancies": [
            {
              "fieldCode": "string",
              "type": "string",
              "probability": number,
              "severity": "critical|high|medium|low",
              "description": "string",
              "preventionSuggestions": ["string"]
            }
          ],
          "recommendations": ["string"],
          "confidence": number
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert ML system for trade finance risk prediction. Analyze document patterns and predict potential discrepancies with high accuracy."
          },
          {
            role: "user",
            content: predictionPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const prediction = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        documentSetId,
        overallRiskScore: prediction.overallRiskScore || 0,
        fieldRiskScores: prediction.fieldRiskScores || {},
        predictedDiscrepancies: prediction.predictedDiscrepancies || [],
        recommendations: prediction.recommendations || [],
        confidence: prediction.confidence || 0,
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
      // Add new training data
      const newTrainingData: MLTrainingData = {
        documentFeatures: await this.extractDocumentFeatures(documentSetId),
        knownDiscrepancies: actualDiscrepancies,
        fieldValues: actualDiscrepancies.reduce((acc, d) => ({ ...acc, [d.fieldCode]: d.fieldValue }), {}),
        documentTypes: [], // Will be populated by extractDocumentFeatures
        historicalPatterns: {},
      };

      this.trainingData.push(newTrainingData);

      // Re-analyze patterns with new data
      if (this.trainingData.length % 10 === 0) { // Re-analyze every 10 new data points
        await this.analyzePatterns();
      }

      console.log("ML engine learned from new discrepancy data");
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
      trainingDataSize: this.trainingData.length,
      identifiedPatterns: this.patterns.size,
      lastUpdated: new Date().toISOString(),
      confidence: this.calculateSystemConfidence(),
    };
  }

  private checkRequiredDocuments(documents: any[]): boolean {
    const requiredTypes = ['commercial_invoice', 'bill_of_lading', 'packing_list'];
    const presentTypes = documents.map(d => d.documentType);
    return requiredTypes.every(type => presentTypes.includes(type));
  }

  private async extractDocumentFeatures(documentSetId: string): Promise<any> {
    const documents = await db
      .select()
      .from(documents)
      .where(eq(documents.documentSetId, documentSetId));

    return {
      documentCount: documents.length,
      documentTypes: documents.map(d => d.documentType),
      totalSize: documents.reduce((sum, d) => sum + (d.fileSize || 0), 0),
      avgProcessingTime: documents.reduce((sum, d) => sum + (d.processingTime || 0), 0) / documents.length,
    };
  }

  private calculateSystemConfidence(): number {
    if (this.trainingData.length === 0) return 0;
    
    // Confidence increases with more training data and identified patterns
    const dataConfidence = Math.min(this.trainingData.length / 100, 1) * 50;
    const patternConfidence = Math.min(this.patterns.size / 20, 1) * 50;
    
    return Math.round(dataConfidence + patternConfidence);
  }
}

// Global ML engine instance
export const mlEngine = new MLPredictiveEngine();

// API functions for use in routes
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
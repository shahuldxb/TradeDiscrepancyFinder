import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface AzureOcrResult {
  success: boolean;
  extractedText: string;
  confidence?: number;
  error?: string;
}

export class AzureOcrService {
  private endpoint: string;
  private apiKey: string;
  private apiVersion = '2024-02-29-preview';

  constructor() {
    this.endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '';
    this.apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '';
    
    if (!this.endpoint || !this.apiKey) {
      console.warn('Azure Document Intelligence credentials not found');
    }
  }

  async extractTextFromPdf(filePath: string): Promise<AzureOcrResult> {
    try {
      if (!this.endpoint || !this.apiKey) {
        return {
          success: false,
          extractedText: '',
          error: 'Azure Document Intelligence credentials not configured'
        };
      }

      // Read the PDF file
      const fileBuffer = fs.readFileSync(filePath);
      
      // Step 1: Submit document for analysis
      const cleanEndpoint = this.endpoint.endsWith('/') ? this.endpoint.slice(0, -1) : this.endpoint;
      const analyzeUrl = `${cleanEndpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=${this.apiVersion}`;
      
      console.log('Submitting document to Azure Document Intelligence...');
      const submitResponse = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/pdf'
        },
        body: fileBuffer
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Azure OCR submission failed:', errorText);
        return {
          success: false,
          extractedText: '',
          error: `Azure OCR failed: ${submitResponse.status} - ${errorText}`
        };
      }

      // Get the operation location from response headers
      const operationLocation = submitResponse.headers.get('operation-location');
      if (!operationLocation) {
        return {
          success: false,
          extractedText: '',
          error: 'No operation location returned from Azure'
        };
      }

      console.log('Document submitted, waiting for processing...');

      // Step 2: Poll for results
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait time
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;

        const resultResponse = await fetch(operationLocation, {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey
          }
        });

        if (!resultResponse.ok) {
          console.error('Failed to get OCR results:', resultResponse.status);
          continue;
        }

        const result = await resultResponse.json();
        
        if (result.status === 'succeeded') {
          console.log('Azure OCR processing completed successfully');
          return this.extractTextFromResult(result);
        } else if (result.status === 'failed') {
          return {
            success: false,
            extractedText: '',
            error: 'Azure OCR processing failed'
          };
        }
        
        console.log(`OCR processing status: ${result.status}, attempt ${attempts}/${maxAttempts}`);
      }

      return {
        success: false,
        extractedText: '',
        error: 'OCR processing timeout'
      };

    } catch (error) {
      console.error('Azure OCR service error:', error);
      return {
        success: false,
        extractedText: '',
        error: `OCR service error: ${(error as Error).message}`
      };
    }
  }

  private extractTextFromResult(result: any): AzureOcrResult {
    try {
      let extractedText = '';
      let totalConfidence = 0;
      let wordCount = 0;

      if (result.analyzeResult && result.analyzeResult.pages) {
        for (const page of result.analyzeResult.pages) {
          if (page.lines) {
            for (const line of page.lines) {
              extractedText += line.content + '\n';
              
              // Calculate average confidence
              if (line.words) {
                for (const word of line.words) {
                  if (word.confidence) {
                    totalConfidence += word.confidence;
                    wordCount++;
                  }
                }
              }
            }
          }
        }
      }

      const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

      return {
        success: true,
        extractedText: extractedText.trim(),
        confidence: averageConfidence
      };

    } catch (error) {
      return {
        success: false,
        extractedText: '',
        error: `Failed to parse OCR results: ${(error as Error).message}`
      };
    }
  }

  isConfigured(): boolean {
    return !!(this.endpoint && this.apiKey);
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      const cleanEndpoint = this.endpoint.endsWith('/') ? this.endpoint.slice(0, -1) : this.endpoint;
      const testUrl = `${cleanEndpoint}/documentintelligence/documentModels?api-version=${this.apiVersion}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Azure OCR connection test failed:', error);
      return false;
    }
  }
}

export const azureOcrService = new AzureOcrService();
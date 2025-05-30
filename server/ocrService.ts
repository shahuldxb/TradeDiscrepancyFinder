import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToAzureSQL } from './azureSqlConnection';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface OCRResult {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  processingTime: number;
  created_at: Date;
  error?: string;
}

export class OCRService {
  
  async processDocument(filePath: string, originalName: string, mimeType: string, fileSize: number): Promise<OCRResult> {
    const startTime = Date.now();
    const id = this.generateId();
    
    try {
      // Create initial record in database
      await this.saveOCRResult({
        id,
        filename: path.basename(filePath),
        originalName,
        fileSize,
        mimeType,
        extractedText: '',
        processingStatus: 'processing',
        confidence: 0,
        processingTime: 0,
        created_at: new Date()
      });

      let extractedText = '';
      let confidence = 0;

      if (mimeType.startsWith('image/')) {
        // Process image files
        const result = await this.processImage(filePath);
        extractedText = result.text;
        confidence = result.confidence;
      } else if (mimeType === 'application/pdf') {
        // Process PDF files
        const result = await this.processPDF(filePath);
        extractedText = result.text;
        confidence = result.confidence;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const processingTime = Date.now() - startTime;

      // Update record with results
      const finalResult: OCRResult = {
        id,
        filename: path.basename(filePath),
        originalName,
        fileSize,
        mimeType,
        extractedText,
        processingStatus: 'completed',
        confidence,
        processingTime,
        created_at: new Date()
      };

      await this.updateOCRResult(id, finalResult);
      
      // Clean up uploaded file
      this.cleanupFile(filePath);
      
      return finalResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorResult: OCRResult = {
        id,
        filename: path.basename(filePath),
        originalName,
        fileSize,
        mimeType,
        extractedText: '',
        processingStatus: 'failed',
        confidence: 0,
        processingTime,
        created_at: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      await this.updateOCRResult(id, errorResult);
      this.cleanupFile(filePath);
      
      throw error;
    }
  }

  private async processImage(imagePath: string): Promise<{ text: string; confidence: number }> {
    try {
      // Convert image to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeTypeFromExtension(imagePath);

      // Use Gemini Pro Vision model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "Please extract all text from this image. Maintain the original formatting and structure as much as possible. If there are tables, preserve the table structure. Return only the extracted text without any additional commentary or explanation.";

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const extractedText = response.text() || '';
      
      // Calculate confidence based on response quality and length
      const confidence = this.calculateConfidence(extractedText);
      
      return {
        text: extractedText,
        confidence
      };

    } catch (error) {
      console.error('Error processing image with Gemini:', error);
      throw new Error(`Image OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPDF(pdfPath: string): Promise<{ text: string; confidence: number }> {
    try {
      // Convert PDF to base64
      const pdfBuffer = fs.readFileSync(pdfPath);
      const base64Pdf = pdfBuffer.toString('base64');

      // Use Gemini Pro model for PDF processing
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "Please extract all text from this PDF document. Maintain the original formatting and structure as much as possible. If there are tables, preserve the table structure. Return only the extracted text without any additional commentary or explanation.";

      const pdfPart = {
        inlineData: {
          data: base64Pdf,
          mimeType: "application/pdf",
        },
      };

      const result = await model.generateContent([prompt, pdfPart]);
      const response = await result.response;
      const extractedText = response.text() || '';
      
      // Calculate confidence based on response quality and length
      const confidence = this.calculateConfidence(extractedText);
      
      return {
        text: extractedText,
        confidence
      };

    } catch (error) {
      console.error('Error processing PDF with Gemini:', error);
      throw new Error(`PDF OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateConfidence(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Simple confidence calculation based on text characteristics
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for longer text
    if (text.length > 100) confidence += 0.2;
    if (text.length > 500) confidence += 0.1;
    
    // Increase confidence for structured text
    if (text.includes('\n') || text.includes('\t')) confidence += 0.1;
    
    // Increase confidence for common words
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const wordCount = commonWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    confidence += Math.min(wordCount * 0.02, 0.1);
    
    return Math.min(confidence, 1.0);
  }

  private getMimeTypeFromExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private generateId(): string {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  async saveOCRResult(result: OCRResult): Promise<void> {
    try {
      const pool = await connectToAzureSQL();
      
      // Create OCR results table if it doesn't exist
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ocr_results' AND xtype='U')
        CREATE TABLE ocr_results (
          id NVARCHAR(255) PRIMARY KEY,
          filename NVARCHAR(255) NOT NULL,
          original_name NVARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type NVARCHAR(100) NOT NULL,
          extracted_text NTEXT,
          processing_status NVARCHAR(50) NOT NULL,
          confidence FLOAT DEFAULT 0,
          processing_time INT DEFAULT 0,
          error_message NTEXT,
          created_at DATETIME2 DEFAULT GETDATE()
        )
      `);

      await pool.request()
        .input('id', result.id)
        .input('filename', result.filename)
        .input('original_name', result.originalName)
        .input('file_size', result.fileSize)
        .input('mime_type', result.mimeType)
        .input('extracted_text', result.extractedText)
        .input('processing_status', result.processingStatus)
        .input('confidence', result.confidence)
        .input('processing_time', result.processingTime)
        .input('error_message', result.error || null)
        .query(`
          INSERT INTO ocr_results 
          (id, filename, original_name, file_size, mime_type, extracted_text, processing_status, confidence, processing_time, error_message)
          VALUES (@id, @filename, @original_name, @file_size, @mime_type, @extracted_text, @processing_status, @confidence, @processing_time, @error_message)
        `);

    } catch (error) {
      console.error('Error saving OCR result:', error);
      throw error;
    }
  }

  async updateOCRResult(id: string, result: Partial<OCRResult>): Promise<void> {
    try {
      const pool = await connectToAzureSQL();
      
      await pool.request()
        .input('id', id)
        .input('extracted_text', result.extractedText)
        .input('processing_status', result.processingStatus)
        .input('confidence', result.confidence)
        .input('processing_time', result.processingTime)
        .input('error_message', result.error || null)
        .query(`
          UPDATE ocr_results 
          SET extracted_text = @extracted_text,
              processing_status = @processing_status,
              confidence = @confidence,
              processing_time = @processing_time,
              error_message = @error_message
          WHERE id = @id
        `);

    } catch (error) {
      console.error('Error updating OCR result:', error);
      throw error;
    }
  }

  async getOCRResults(): Promise<OCRResult[]> {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request().query(`
        SELECT 
          id,
          filename,
          original_name,
          file_size,
          mime_type,
          extracted_text,
          processing_status,
          confidence,
          processing_time,
          error_message,
          created_at
        FROM ocr_results 
        ORDER BY created_at DESC
      `);

      return result.recordset.map(row => ({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        extractedText: row.extracted_text || '',
        processingStatus: row.processing_status,
        confidence: row.confidence || 0,
        processingTime: row.processing_time || 0,
        created_at: row.created_at,
        error: row.error_message
      }));

    } catch (error) {
      console.error('Error fetching OCR results:', error);
      throw error;
    }
  }

  async getOCRResult(id: string): Promise<OCRResult | null> {
    try {
      const pool = await connectToAzureSQL();
      
      const result = await pool.request()
        .input('id', id)
        .query(`
          SELECT 
            id,
            filename,
            original_name,
            file_size,
            mime_type,
            extracted_text,
            processing_status,
            confidence,
            processing_time,
            error_message,
            created_at
          FROM ocr_results 
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const row = result.recordset[0];
      return {
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        extractedText: row.extracted_text || '',
        processingStatus: row.processing_status,
        confidence: row.confidence || 0,
        processingTime: row.processing_time || 0,
        created_at: row.created_at,
        error: row.error_message
      };

    } catch (error) {
      console.error('Error fetching OCR result:', error);
      throw error;
    }
  }
}

export const ocrService = new OCRService();
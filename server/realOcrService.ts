import fs from 'fs';
import { spawn } from 'child_process';

interface OcrResult {
  success: boolean;
  extractedText: string;
  method: string;
  error?: string;
}

export class RealOcrService {
  
  async extractTextFromPdf(filePath: string): Promise<OcrResult> {
    // Try multiple OCR approaches for scanned PDFs
    
    // Method 1: Try pdftotext (good for text-based PDFs)
    const textResult = await this.tryPdfToText(filePath);
    if (textResult.success && textResult.extractedText.length > 50) {
      return textResult;
    }
    
    // Method 2: Try converting PDF to images and OCR
    const imageOcrResult = await this.tryImageOcr(filePath);
    if (imageOcrResult.success) {
      return imageOcrResult;
    }
    
    // Method 3: Try Tesseract directly on PDF
    const tesseractResult = await this.tryTesseractPdf(filePath);
    if (tesseractResult.success) {
      return tesseractResult;
    }
    
    return {
      success: false,
      extractedText: '',
      method: 'none',
      error: 'All OCR methods failed for this scanned document'
    };
  }
  
  private async tryPdfToText(filePath: string): Promise<OcrResult> {
    return new Promise((resolve) => {
      const process = spawn('pdftotext', ['-layout', filePath, '-'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.trim().length > 0) {
          resolve({
            success: true,
            extractedText: output.trim(),
            method: 'pdftotext'
          });
        } else {
          resolve({
            success: false,
            extractedText: '',
            method: 'pdftotext',
            error: errorOutput || `Exit code: ${code}`
          });
        }
      });
      
      process.on('error', (error) => {
        resolve({
          success: false,
          extractedText: '',
          method: 'pdftotext',
          error: error.message
        });
      });
    });
  }
  
  private async tryImageOcr(filePath: string): Promise<OcrResult> {
    // Convert PDF to images first, then OCR the images
    const tempDir = '/tmp/ocr_temp_' + Date.now();
    
    try {
      // Create temp directory
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Convert PDF to images using pdftoppm
      const convertResult = await this.convertPdfToImages(filePath, tempDir);
      if (!convertResult.success) {
        return convertResult;
      }
      
      // OCR the generated images
      const ocrResult = await this.ocrImages(tempDir);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      return ocrResult;
      
    } catch (error) {
      // Cleanup on error
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
      
      return {
        success: false,
        extractedText: '',
        method: 'image_ocr',
        error: (error as Error).message
      };
    }
  }
  
  private async convertPdfToImages(pdfPath: string, outputDir: string): Promise<OcrResult> {
    return new Promise((resolve) => {
      const process = spawn('pdftoppm', [
        '-png',
        '-r', '300', // 300 DPI for better OCR
        pdfPath,
        `${outputDir}/page`
      ]);
      
      let errorOutput = '';
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            extractedText: '',
            method: 'pdftoppm'
          });
        } else {
          resolve({
            success: false,
            extractedText: '',
            method: 'pdftoppm',
            error: errorOutput || `Exit code: ${code}`
          });
        }
      });
      
      process.on('error', (error) => {
        resolve({
          success: false,
          extractedText: '',
          method: 'pdftoppm',
          error: error.message
        });
      });
    });
  }
  
  private async ocrImages(imageDir: string): Promise<OcrResult> {
    try {
      const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.png')).sort();
      let combinedText = '';
      
      for (const file of files) {
        const imagePath = `${imageDir}/${file}`;
        const pageText = await this.ocrSingleImage(imagePath);
        if (pageText.success) {
          combinedText += pageText.extractedText + '\n\n';
        }
      }
      
      if (combinedText.trim().length > 0) {
        return {
          success: true,
          extractedText: combinedText.trim(),
          method: 'tesseract_images'
        };
      } else {
        return {
          success: false,
          extractedText: '',
          method: 'tesseract_images',
          error: 'No text extracted from images'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        method: 'tesseract_images',
        error: (error as Error).message
      };
    }
  }
  
  private async ocrSingleImage(imagePath: string): Promise<OcrResult> {
    return new Promise((resolve) => {
      const process = spawn('tesseract', [imagePath, 'stdout', '-l', 'eng']);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            extractedText: output.trim(),
            method: 'tesseract'
          });
        } else {
          resolve({
            success: false,
            extractedText: '',
            method: 'tesseract',
            error: errorOutput || `Exit code: ${code}`
          });
        }
      });
      
      process.on('error', (error) => {
        resolve({
          success: false,
          extractedText: '',
          method: 'tesseract',
          error: error.message
        });
      });
    });
  }
  
  private async tryTesseractPdf(filePath: string): Promise<OcrResult> {
    return new Promise((resolve) => {
      const process = spawn('tesseract', [filePath, 'stdout', '-l', 'eng']);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.trim().length > 0) {
          resolve({
            success: true,
            extractedText: output.trim(),
            method: 'tesseract_direct'
          });
        } else {
          resolve({
            success: false,
            extractedText: '',
            method: 'tesseract_direct',
            error: errorOutput || `Exit code: ${code}`
          });
        }
      });
      
      process.on('error', (error) => {
        resolve({
          success: false,
          extractedText: '',
          method: 'tesseract_direct',
          error: error.message
        });
      });
    });
  }
}

export const realOcrService = new RealOcrService();
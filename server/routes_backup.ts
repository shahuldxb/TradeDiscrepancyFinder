// Working Form Detection API - Clean Implementation
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";

// Form Detection API Endpoint
app.post('/api/form-detection/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const docId = Date.now().toString();
    
    // Use quick OCR processor for document classification
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python3', ['server/quickOCR.py', req.file.path], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const result = await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const analysisResult = JSON.parse(output);
            
            const detectedForms = [{
              id: `${docId}_form_1`,
              formType: analysisResult.document_type,
              confidence: analysisResult.confidence,
              pageNumbers: [1],
              extractedFields: {
                'Extracted Text Preview': analysisResult.extracted_text.substring(0, 500) + '...',
                'Text Length': `${analysisResult.text_length} characters`,
                'Processing Method': 'OCR-based content analysis'
              },
              status: 'completed',
              processingMethod: 'Real OCR Content Analysis',
              fullText: analysisResult.extracted_text
            }];
            
            resolve({
              docId,
              detectedForms,
              totalForms: 1,
              processingMethod: 'OCR Classification',
              status: 'completed'
            });
          } catch (parseError) {
            reject(parseError);
          }
        } else {
          reject(new Error(`OCR processing failed: ${errorOutput}`));
        }
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Form detection error:', error);
    res.status(500).json({ error: 'Form detection failed' });
  }
});
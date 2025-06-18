import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { completeFormsWorkflow } from "./completeFormsWorkflow";
import { pythonBackendProxy } from "./pythonBackendProxy";
import { setupLocalDevAuth, isAuthenticatedLocal } from "./localDevConfig";
import { 
  insertDocumentSetSchema, 
  insertDocumentSchema, 
  insertDiscrepancySchema, 
  insertAgentTaskSchema,
  insertCustomAgentSchema,
  insertCustomTaskSchema,
  insertCustomCrewSchema
} from "@shared/schema";
import { crewAI, processDocumentSetWithAgents } from "./crewai";
import { runDiscrepancyAnalysis, getDiscrepancies } from "./discrepancyEngine";
import { azureDataService } from "./azureDataService";
import { azureAgentService } from "./azureAgentService";
import fs from 'fs';
import path from 'path';
import { ucpDataService } from "./ucpDataService";
import { ucpPostgresService } from "./ucpPostgresService";
import { documentaryCreditService } from "./documentaryCreditService";
import { NewFormDetectionService } from "./newFormDetectionService";
import multer from "multer";
import { nanoid } from "nanoid";
import { spawn } from "child_process";
import sql from 'mssql';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      cb(null, `${timestamp}_${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication setup
  if (process.env.NODE_ENV === 'development' && !process.env.REPLIT_DOMAINS) {
    await setupLocalDevAuth(app);
  } else {
    await setupAuth(app);
  }

  // Form Detection API endpoint for OCR-based document processing
  app.post('/api/form-detection/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const docId = Date.now().toString();
      
      // Use quick OCR processor for document classification
      const pythonProcess = spawn('python3', ['server/quickOCR.py', req.file.path], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      const result = await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            try {
              const analysisResult = JSON.parse(output);
              
              const detectedForms = [{
                id: `${docId}_form_1`,
                formType: analysisResult.document_type,
                confidence: analysisResult.confidence,
                pageNumbers: [1],
                extractedFields: {
                  'Full Extracted Text': analysisResult.extracted_text,
                  'Document Classification': analysisResult.document_type,
                  'Processing Statistics': `${analysisResult.text_length} characters extracted via OCR`
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

  // Status endpoint for form detection
  app.get('/api/form-detection/status/:docId', async (req, res) => {
    try {
      const { docId } = req.params;
      res.json({
        docId,
        status: 'completed',
        message: 'Form detection completed successfully'
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ error: 'Status check failed' });
    }
  });

// Document history storage - use file-based persistence
const HISTORY_FILE = path.join(process.cwd(), 'document_history.json');

// Load existing history from file
function loadDocumentHistory(): any[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading document history:', error);
  }
  return [];
}

// Save history to file
function saveDocumentHistory(history: any[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving document history:', error);
  }
}

let documentHistory = loadDocumentHistory();

  // Form detection upload endpoint with history storage
  app.post('/api/form-detection/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const docId = Date.now().toString();
      const filePath = req.file.path;

      // Process document with OCR
      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', ['server/quickOCR.py', filePath]);
        
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            try {
              const analysisResult = JSON.parse(output);
              
              // Store in history
              const historyEntry = {
                id: docId,
                filename: req.file?.originalname || 'Unknown',
                documentType: analysisResult.document_type,
                confidence: Math.round((analysisResult.confidence || 0) * 100),
                extractedText: analysisResult.extracted_text,
                fileSize: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                processedAt: new Date().toISOString(),
                docId: docId
              };
              
              documentHistory.unshift(historyEntry); // Add to beginning of array
              saveDocumentHistory(documentHistory); // Persist to file
              console.log(`Document stored in history: ${historyEntry.filename}, total documents: ${documentHistory.length}`);
              console.log(`History entry:`, JSON.stringify(historyEntry, null, 2));
              
              const detectedForms = [{
                id: `${docId}_form_1`,
                formType: analysisResult.document_type,
                confidence: analysisResult.confidence,
                pageNumbers: [1],
                extractedFields: {
                  'Full Extracted Text': analysisResult.extracted_text,
                  'Document Classification': analysisResult.document_type,
                  'Processing Statistics': `${analysisResult.text_length} characters extracted via OCR`
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

  // Document history endpoint
  app.get('/api/form-detection/history', async (req, res) => {
    try {
      console.log(`History requested: ${documentHistory.length} documents found`);
      res.json({
        documents: documentHistory,
        total: documentHistory.length
      });
    } catch (error) {
      console.error('History fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch document history' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
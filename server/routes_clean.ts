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
import { ucpDataService } from "./ucpDataService";
import { ucpPostgresService } from "./ucpPostgresService";
import { documentaryCreditService } from "./documentaryCreditService";
import { NewFormDetectionService } from "./newFormDetectionService";
import multer from "multer";
import path from "path";
import fs from "fs";
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

  const httpServer = createServer(app);
  return httpServer;
}
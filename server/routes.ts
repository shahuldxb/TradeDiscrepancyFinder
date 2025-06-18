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
      
      // Use Direct OCR for authentic document content extraction
      const pythonProcess = spawn('python3', ['server/directOCR.py', req.file.path], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
        console.log('Python stdout:', data.toString());
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
        console.log('Python stderr:', data.toString());
      });

      const result = await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code: number) => {
          console.log(`Python process exited with code: ${code}`);
          console.log(`Output received: ${output}`);
          console.log(`Error output: ${errorOutput}`);
          
          if (code === 0) {
            try {
              const analysisResult = JSON.parse(output);
              console.log('Parsed analysis result:', JSON.stringify(analysisResult, null, 2));
              
              // Handle multiple detected forms from Fast LC Processor
              const formsData = analysisResult.detected_forms || [];
              console.log(`Forms data array length: ${formsData.length}`);
              
              const detectedForms = formsData.map((form: any, index: number) => ({
                id: `${docId}_form_${index + 1}`,
                formType: form.form_type || form.document_type,
                confidence: form.confidence,
                pageNumbers: [form.page_number],
                extractedFields: {
                  'Full Extracted Text': form.extracted_text,
                  'Document Classification': form.form_type || form.document_type,
                  'Processing Statistics': `${form.text_length} characters extracted from page ${form.page_number}`,
                  'Page Number': form.page_number.toString()
                },
                status: 'completed',
                processingMethod: analysisResult.processing_method,
                fullText: form.extracted_text
              }));
              
              resolve({
                docId,
                detectedForms,
                totalForms: formsData.length,
                processingMethod: analysisResult.processing_method,
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

// Document history storage with synchronous file operations
let documentHistory: any[] = [];

// Load existing history on startup
function loadDocumentHistory() {
  try {
    const historyPath = path.join(process.cwd(), 'document_history.json');
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8');
      const parsedData = JSON.parse(data);
      documentHistory = Array.isArray(parsedData) ? parsedData : [];
      console.log(`✓ Loaded ${documentHistory.length} documents from history file`);
    } else {
      documentHistory = [];
      console.log('No existing document history found, starting fresh');
    }
  } catch (error) {
    console.error('Error loading document history:', error);
    documentHistory = [];
  }
}

// Save history to file with error handling and atomic writes
function saveDocumentHistory() {
  try {
    const historyPath = path.join(process.cwd(), 'document_history.json');
    const tempPath = historyPath + '.tmp';
    
    // Write to temporary file first, then rename for atomic operation
    fs.writeFileSync(tempPath, JSON.stringify(documentHistory, null, 2));
    fs.renameSync(tempPath, historyPath);
    console.log(`✓ Document history saved: ${documentHistory.length} documents`);
  } catch (error) {
    console.error('Error saving document history:', error);
  }
}

// Initialize history on module load - ensure it runs
try {
  loadDocumentHistory();
  console.log('Document history initialization complete');
} catch (error) {
  console.error('Failed to initialize document history:', error);
}

  // Form detection upload endpoint with immediate history storage
  app.post('/api/form-detection/upload', upload.single('file'), async (req, res) => {
    console.log('=== UPLOAD ENDPOINT CALLED ===');
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('=== UPLOAD STARTED ===');
      const docId = Date.now().toString();
      const filePath = req.file.path;

      // Store document in history immediately - MUST work
      const historyEntry = {
        id: docId,
        filename: req.file.originalname,
        documentType: 'Processing...',
        confidence: 0,
        extractedText: 'Document uploaded, processing in progress...',
        fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        processedAt: new Date().toISOString(),
        docId: docId
      };
      
      // Add to memory and save immediately
      documentHistory.unshift(historyEntry);
      console.log(`Before save: ${documentHistory.length} documents in memory`);
      saveDocumentHistory();
      console.log(`✓ DOCUMENT STORED: ${historyEntry.filename} (${historyEntry.fileSize})`);

      // Process document with LC-aware multi-page form detection
      const result = await new Promise<any>((resolve, reject) => {
        // Use fast LC processor for LC documents (check filename and content), multi-page processor for others
        const filename = req.file?.originalname?.toLowerCase() || '';
        const isLCDocument = filename.includes('lc_') || filename.includes('lc ') || 
                           filename.includes('credit') || filename.includes('letter');
        
        console.log(`📋 Processing: ${req.file?.originalname} | LC Detection: ${isLCDocument}`);
        
        // Use Direct OCR for authentic document content extraction
        const scriptPath = 'server/directOCR.py';
        console.log(`🚀 Using Direct OCR Processor: ${scriptPath}`);
        const pythonProcess = spawn('python3', [scriptPath, filePath]);
        
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
              
              if (analysisResult.error) {
                reject(new Error(analysisResult.error));
                return;
              }
              
              // Create detected forms array from multi-page or LC processing
              const formsData = analysisResult.detected_forms || analysisResult.constituent_documents || [];
              console.log(`📋 Forms data length: ${formsData.length}`);
              
              const detectedForms = formsData.map((form: any, index: number) => ({
                id: `${docId}_form_${index + 1}`,
                formType: form.form_type || form.document_type,
                confidence: form.confidence,
                pageNumbers: [form.page_number],
                extractedFields: {
                  'Full Extracted Text': form.extracted_text,
                  'Document Classification': form.form_type || form.document_type,
                  'Processing Statistics': `${form.text_length} characters extracted from page ${form.page_number}`,
                  'Page Number': form.page_number.toString()
                },
                status: 'completed',
                processingMethod: analysisResult.processing_method,
                fullText: form.extracted_text
              }));
              
              console.log(`📊 Detected ${detectedForms.length} forms from analysis`);
              
              // For history, use the first/primary form from either processing type
              const formsArray = analysisResult.detected_forms || analysisResult.constituent_documents || [];
              const primaryForm = formsArray[0] || {
                form_type: 'Unknown Document',
                document_type: 'Unknown Document',
                confidence: 0.3,
                extracted_text: 'No content extracted',
                text_length: 0
              };
              
              // Store complete processing result in document history
              const historyDoc = {
                id: docId,
                filename: req.file?.originalname || 'Unknown',
                documentType: primaryForm.form_type || primaryForm.document_type,
                confidence: Math.round((primaryForm.confidence || 0) * 100),
                extractedText: primaryForm.extracted_text,
                fullText: primaryForm.extracted_text,
                fileSize: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                processedAt: new Date().toISOString(),
                docId: docId,
                totalPages: analysisResult.total_pages,
                totalForms: formsData.length
              };
              
              // Replace the initial entry with complete processing result
              const existingIndex = documentHistory.findIndex(doc => doc.docId === docId);
              if (existingIndex !== -1) {
                documentHistory[existingIndex] = historyDoc;
              } else {
                documentHistory.unshift(historyDoc);
              }
              saveDocumentHistory();
              console.log(`✓ Multi-page document processed: ${historyDoc.filename} (${analysisResult.total_pages} pages, ${formsArray.length} forms) - ${documentHistory.length} total`);
              
              resolve({
                docId,
                detectedForms,
                totalForms: formsArray.length,
                totalPages: analysisResult.total_pages,
                processingMethod: analysisResult.processing_method,
                status: 'completed'
              });
            } catch (parseError) {
              reject(parseError);
            }
          } else {
            console.error(`❌ Python process failed with code ${code}: ${errorOutput}`);
            reject(new Error(`Multi-page processing failed: ${errorOutput}`));
          }
        });
      });

      res.json(result);
    } catch (error) {
      console.error('Form detection error:', error);
      res.status(500).json({ error: 'Form detection failed' });
    }
  });

  // Document history endpoint with fresh file loading
  app.get('/api/form-detection/history', async (req, res) => {
    try {
      // Always reload from file to get latest state
      loadDocumentHistory();
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
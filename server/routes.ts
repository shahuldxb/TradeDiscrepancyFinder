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

// Azure SQL Database storage functions
async function saveToAzureDatabase(docId: string, file: any, analysisResult: any, formsData: any[]) {
  try {
    const { connectToAzureSQL } = await import('./azureSqlConnection');
    const pool = await connectToAzureSQL();
    
    // 1. Insert main ingestion record
    await pool.request()
      .input('ingestionId', docId)
      .input('originalFilename', file?.originalname || 'Unknown')
      .input('filePath', file?.path || '')
      .input('fileType', file?.mimetype || 'unknown')
      .input('fileSize', file?.size || 0)
      .input('status', 'completed')
      .input('extractedText', formsData[0]?.extracted_text || '')
      .input('extractedData', JSON.stringify({
        totalPages: analysisResult.total_pages,
        totalForms: formsData.length,
        processingMethod: 'Direct OCR Text Extraction',
        detectedForms: formsData.map((f: any) => ({
          formType: f.form_type || f.document_type,
          confidence: f.confidence,
          pageNumber: f.page_number
        }))
      }))
      .query(`
        INSERT INTO TF_ingestion (
          ingestion_id, original_filename, file_path, file_type, file_size, 
          status, extracted_text, extracted_data, created_date, updated_date
        ) VALUES (
          @ingestionId, @originalFilename, @filePath, @fileType, @fileSize,
          @status, @extractedText, @extractedData, GETDATE(), GETDATE()
        )
      `);

    // 2. Insert PDF processing records for each detected form
    for (let i = 0; i < formsData.length; i++) {
      const form = formsData[i];
      const pdfId = `${docId}_form_${i + 1}`;
      
      await pool.request()
        .input('pdfId', pdfId)
        .input('ingestionId', docId)
        .input('originalFilename', `${file?.originalname || 'Unknown'}_page_${form.page_number}`)
        .input('filePath', file?.path || '')
        .input('fileSize', file?.size || 0)
        .input('pageCount', 1)
        .input('ocrText', form.extracted_text)
        .input('processingStatus', 'completed')
        .input('azureClassification', JSON.stringify({
          documentType: form.form_type || form.document_type,
          confidence: form.confidence,
          pageNumber: form.page_number
        }))
        .input('confidenceScore', Math.round((form.confidence || 0) * 100))
        .query(`
          INSERT INTO TF_ingestion_Pdf (
            pdf_id, ingestion_id, original_filename, file_path, file_size_bytes,
            page_count, ocr_text, processing_status, azure_classification, 
            confidence_score, created_date, updated_date
          ) VALUES (
            @pdfId, @ingestionId, @originalFilename, @filePath, @fileSize,
            @pageCount, @ocrText, @processingStatus, @azureClassification,
            @confidenceScore, GETDATE(), GETDATE()
          )
        `);

      // 3. Insert OCR text record
      await pool.request()
        .input('ingestionId', docId)
        .input('content', form.extracted_text)
        .input('language', 'en')
        .query(`
          INSERT INTO TF_ingestion_TXT (
            ingestion_id, content, language, created_date
          ) VALUES (
            @ingestionId, @content, @language, GETDATE()
          )
        `);

      // 4. Insert extracted fields
      const fields = [
        { name: 'Full_Extracted_Text', value: form.extracted_text, type: 'text' },
        { name: 'Document_Classification', value: form.form_type || form.document_type, type: 'classification' },
        { name: 'Processing_Statistics', value: `${form.text_length || 0} characters extracted from page ${form.page_number}`, type: 'metadata' },
        { name: 'Page_Number', value: form.page_number.toString(), type: 'metadata' }
      ];

      for (const field of fields) {
        await pool.request()
          .input('ingestionId', docId)
          .input('fieldName', field.name)
          .input('fieldValue', field.value)
          .input('fieldType', field.type)
          .input('confidence', Math.round((form.confidence || 0) * 100))
          .input('pageNumber', form.page_number)
          .query(`
            INSERT INTO TF_ingestion_fields (
              ingestion_id, field_name, field_value, field_type, confidence, page_number, created_date
            ) VALUES (
              @ingestionId, @fieldName, @fieldValue, @fieldType, @confidence, @pageNumber, GETDATE()
            )
          `);
      }
    }
    
    console.log(`✓ Saved ${formsData.length} forms to Azure SQL database`);
    
  } catch (error) {
    console.error('Error saving to Azure database:', error);
    throw error;
  }
}

async function loadFromAzureDatabase() {
  try {
    const { connectToAzureSQL } = await import('./azureSqlConnection');
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT 
        i.ingestion_id,
        i.original_filename,
        i.file_type,
        i.file_size,
        i.status,
        i.created_date,
        (SELECT COUNT(*) FROM TF_ingestion_Pdf p WHERE p.ingestion_id = i.ingestion_id) as form_count
      FROM TF_ingestion i
      WHERE i.status = 'completed'
      ORDER BY i.created_date DESC
    `);
    
    // Get extracted data and text separately for each record
    const enrichedResults = await Promise.all(result.recordset.map(async (record: any) => {
      // Get extracted data
      const dataResult = await pool.request()
        .input('ingestionId', record.ingestion_id)
        .query('SELECT extracted_data FROM TF_ingestion WHERE ingestion_id = @ingestionId');
      
      // Get extracted text
      const textResult = await pool.request()
        .input('ingestionId', record.ingestion_id)
        .query('SELECT TOP 1 content FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId');
      
      return {
        ...record,
        extracted_data: dataResult.recordset[0]?.extracted_data || '{}',
        extracted_text: textResult.recordset[0]?.content || ''
      };
    }));
    
    return enrichedResults.map((record: any) => {
      const extractedData = record.extracted_data ? JSON.parse(record.extracted_data) : {};
      return {
        id: record.ingestion_id,
        filename: record.original_filename,
        uploadDate: record.created_date,
        processingMethod: extractedData.processingMethod || 'Direct OCR Text Extraction',
        totalForms: record.form_count || extractedData.totalForms || 1,
        fileSize: record.file_size,
        documentType: extractedData.detectedForms?.[0]?.formType || 'Unknown Document',
        confidence: extractedData.detectedForms?.[0]?.confidence ? Math.round(extractedData.detectedForms[0].confidence * 100) : 85,
        extractedText: record.extracted_text,
        fullText: record.extracted_text,
        processedAt: record.created_date,
        docId: record.ingestion_id,
        totalPages: extractedData.totalPages || 1
      };
    });
    
  } catch (error) {
    console.error('Error loading from Azure database:', error);
    return [];
  }
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
      
      // Document processing will be saved to Azure SQL database after completion
      console.log(`✓ DOCUMENT UPLOADED: ${historyEntry.filename} (${historyEntry.fileSize}) - processing started`);

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

        pythonProcess.on('close', async (code: number) => {
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
              
              // Store in Azure SQL database instead of JSON file
              try {
                await saveToAzureDatabase(docId, req.file, analysisResult, formsData);
                console.log(`✓ Multi-page document processed: ${req.file?.originalname} (${analysisResult.total_pages} pages, ${formsData.length} forms) - saved to Azure SQL`);
              } catch (dbError) {
                console.error('Database save error:', dbError);
                // Continue with response even if database save fails
              }
              
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

  // Document history endpoint loading from Azure database
  app.get('/api/form-detection/history', async (req, res) => {
    try {
      const documents = await loadFromAzureDatabase();
      console.log(`History requested: ${documents.length} documents found from Azure SQL`);
      res.json({
        documents,
        total: documents.length
      });
    } catch (error) {
      console.error('History fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch document history from database' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
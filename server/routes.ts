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
      
      // Use Fast Document Analyzer for authentic content analysis
      const pythonProcess = spawn('python3', ['server/fastDocumentAnalyzer.py', req.file.path], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000  // Reasonable timeout for text-based analysis
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
                  'Processing Statistics': `${form.text_length} characters extracted from ${form.page_range || `page ${form.page_number || 'unknown'}`}`,
                  'Page Range': form.page_range || `Page ${form.page_number || 'Unknown'}`
                },
                status: 'completed',
                processingMethod: analysisResult.processing_method,
                fullText: form.extracted_text
              }));
              
              console.log(`✓ Form-type grouping completed: ${formsData.length} documents`, 
                formsData.map(f => `${f.form_type} (${f.page_range})`).join(', '));
              
              // Save to Azure SQL database
              saveToAzureDatabase(docId, req.file, analysisResult, formsData)
                .then(() => {
                  console.log(`✓ Document ${docId} saved to Azure SQL database`);
                  resolve({
                    docId,
                    detectedForms,
                    totalForms: formsData.length,
                    processingMethod: analysisResult.processing_method,
                    status: 'completed'
                  });
                })
                .catch(dbError => {
                  console.error('Database save error:', dbError);
                  // Still resolve with results even if DB save fails
                  resolve({
                    docId,
                    detectedForms,
                    totalForms: formsData.length,
                    processingMethod: analysisResult.processing_method,
                    status: 'completed'
                  });
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

  // Delete document endpoint
  app.delete('/api/form-detection/delete/:docId', async (req, res) => {
    try {
      const { docId } = req.params;
      console.log(`Deleting document: ${docId}`);
      
      const { connectToAzureSQL } = await import('./azureSqlConnection');
      const pool = await connectToAzureSQL();
      
      // Delete from related tables first (foreign key constraints)
      await pool.request()
        .input('ingestionId', docId)
        .query('DELETE FROM TF_ingestion_fields WHERE ingestion_id = @ingestionId');
      
      await pool.request()
        .input('ingestionId', docId)
        .query('DELETE FROM TF_ingestion_TXT WHERE ingestion_id = @ingestionId');
        
      await pool.request()
        .input('ingestionId', docId)
        .query('DELETE FROM TF_ingestion_Pdf WHERE ingestion_id = @ingestionId');
      
      // Delete main record
      const result = await pool.request()
        .input('ingestionId', docId)
        .query('DELETE FROM TF_ingestion WHERE ingestion_id = @ingestionId');
      
      await pool.close();
      
      if (result.rowsAffected[0] > 0) {
        console.log(`Successfully deleted document ${docId}`);
        res.json({ success: true, message: 'Document deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Document not found' });
      }
      
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete document' });
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
    console.log(`Starting database save for document ${docId}...`);
    const { connectToAzureSQL } = await import('./azureSqlConnection');
    const pool = await connectToAzureSQL();
    console.log('Database connection established');
    
    // 1. Insert main ingestion record
    await pool.request()
      .input('ingestionId', docId)
      .input('originalFilename', file?.originalname || 'Unknown')
      .input('filePath', file?.path || '')
      .input('fileType', file?.mimetype || 'unknown')
      .input('fileSize', file?.size || 0)
      .input('status', 'completed')
      .input('extractedText', formsData.map(f => f.extracted_text).join('\n\n--- PAGE BREAK ---\n\n'))
      .input('extractedData', JSON.stringify({
        totalPages: analysisResult.total_pages,
        totalForms: formsData.length,
        processingMethod: 'Direct OCR Text Extraction',
        detectedForms: formsData.map((f: any) => ({
          id: `${docId}_form_${formsData.indexOf(f) + 1}`,
          formType: f.form_type || f.document_type,
          confidence: f.confidence,
          pageNumbers: f.pages || [f.page_number || 1],
          extractedFields: {
            'Full Extracted Text': f.extracted_text,
            'Document Classification': f.form_type || f.document_type,
            'Processing Statistics': `${f.extracted_text?.length || 0} characters extracted from page ${f.page_number}`,
            'Page Range': f.page_range || `Page ${f.page_number || 'Unknown'}`
          },
          status: 'completed',
          processingMethod: 'Direct OCR Text Extraction',
          fullText: f.extracted_text
        }))
      }))
      .query(`
        INSERT INTO TF_ingestion (
          ingestion_id, original_filename, file_path, file_type, file_size, 
          status, extracted_text, extracted_data, created_date
        ) VALUES (
          @ingestionId, @originalFilename, @filePath, @fileType, @fileSize,
          @status, @extractedText, @extractedData, GETDATE()
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
            confidence_score, created_date
          ) VALUES (
            @pdfId, @ingestionId, @originalFilename, @filePath, @fileSize,
            @pageCount, @ocrText, @processingStatus, @azureClassification,
            @confidenceScore, GETDATE()
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
    
    // Simple query without NTEXT columns in ORDER BY
    const result = await pool.request().query(`
      SELECT TOP 20
        ingestion_id,
        original_filename,
        file_type,
        file_size,
        status,
        created_date
      FROM TF_ingestion
      WHERE status = 'completed'
      ORDER BY id DESC
    `);
    
    if (result.recordset.length === 0) {
      console.log('No completed documents found in database');
      await pool.close();
      return [];
    }
    
    // Process each record to get additional data
    const documents = [];
    for (const record of result.recordset) {
      try {
        // Get extracted data
        const dataResult = await pool.request()
          .input('ingestionId', record.ingestion_id)
          .query('SELECT extracted_data FROM TF_ingestion WHERE ingestion_id = @ingestionId');
        
        // Get main extracted text
        const textResult = await pool.request()
          .input('ingestionId', record.ingestion_id)
          .query('SELECT extracted_text FROM TF_ingestion WHERE ingestion_id = @ingestionId');
        
        // Get form count from database
        const formResult = await pool.request()
          .input('ingestionId', record.ingestion_id)
          .query('SELECT COUNT(*) as count FROM TF_ingestion_Pdf WHERE ingestion_id = @ingestionId');
        
        const extractedData = dataResult.recordset[0]?.extracted_data ? 
          JSON.parse(dataResult.recordset[0].extracted_data) : {};
        
        const extractedText = textResult.recordset[0]?.extracted_text || '';
        const formCount = formResult.recordset[0]?.count || 1;
        
        documents.push({
          id: record.ingestion_id,
          filename: record.original_filename,
          uploadDate: record.created_date,
          processingMethod: extractedData.processingMethod || 'Direct OCR Text Extraction',
          totalForms: formCount || extractedData.totalForms || 1,
          fileSize: record.file_size,
          documentType: extractedData.detectedForms?.[0]?.formType || 'Unknown Document',
          confidence: extractedData.detectedForms?.[0]?.confidence ? 
            Math.round(extractedData.detectedForms[0].confidence * 100) : 85,
          extractedText: extractedText,
          fullText: extractedText,
          processedAt: record.created_date,
          docId: record.ingestion_id,
          totalPages: extractedData.totalPages || 1,
          detectedForms: extractedData.detectedForms?.map((form: any, index: number) => ({
            id: `${record.ingestion_id}_form_${index + 1}`,
            formType: form.formType,
            confidence: form.confidence,
            pageNumbers: [form.pageNumber || index + 1],
            extractedFields: {
              'Full Extracted Text': extractedText,
              'Document Classification': form.formType,
              'Processing Statistics': `${extractedText.length} characters extracted`,
              'Page Number': (form.pageNumber || index + 1).toString()
            },
            status: 'completed',
            processingMethod: 'Direct OCR Text Extraction',
            fullText: extractedText
          })) || [{
            id: `${record.ingestion_id}_form_1`,
            formType: extractedData.detectedForms?.[0]?.formType || 'Unknown Document',
            confidence: extractedData.detectedForms?.[0]?.confidence || 0.85,
            pageNumbers: [1],
            extractedFields: {
              'Full Extracted Text': extractedText,
              'Document Classification': extractedData.detectedForms?.[0]?.formType || 'Unknown Document',
              'Processing Statistics': `${extractedText.length} characters extracted`,
              'Page Number': '1'
            },
            status: 'completed',
            processingMethod: 'Direct OCR Text Extraction',
            fullText: extractedText
          }]
        });
        
      } catch (recordError) {
        console.error(`Error processing record ${record.ingestion_id}:`, recordError);
      }
    }
    
    await pool.close();
    console.log(`Loaded ${documents.length} documents from Azure database`);
    return documents;
    
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
                  'Processing Statistics': `${form.text_length} characters extracted from ${form.page_range || `page ${form.page_number || 'unknown'}`}`,
                  'Page Range': form.page_range || `Page ${form.page_number || 'Unknown'}`
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
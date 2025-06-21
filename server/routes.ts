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
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { nanoid } from 'nanoid';
import sql from 'mssql';
import { connectToAzure, saveToAzureDatabase } from './azureSqlConnection';

// In-memory storage for processed documents
const processedDocuments: any[] = [];
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
      
      // Use OpenCV OCR for enhanced text extraction
      const pythonProcess = spawn('python3', ['server/opencvOCR.py', req.file.path], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 35000  // Optimized timeout for OCR processing
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
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
              
              // Handle individual forms from Real Form Splitter - NO GROUPING
              const formsData = analysisResult.forms || analysisResult.detected_forms || [];
              console.log(`✅ Real Form Splitter extracted ${formsData.length} individual forms (NO GROUPING)`);
              
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
    
    const extractedText = formsData.map(f => f.extracted_text || '').join('\n\n--- PAGE BREAK ---\n\n');
    
    // Insert main ingestion record using correct table structure
    await pool.request()
      .input('ingestionId', docId)
      .input('originalFilename', file?.originalname || 'Unknown')
      .input('filePath', file?.path || '')
      .input('fileType', file?.mimetype || 'application/pdf')
      .input('fileSize', file?.size || 0)
      .input('status', 'completed')
      .input('extractedText', extractedText)
      .input('extractedData', JSON.stringify({
        totalPages: analysisResult.total_pages || formsData.length,
        totalForms: formsData.length,
        processingMethod: 'Robust OCR Extraction',
        detectedForms: formsData.map((f: any, index: number) => ({
          id: f.id || `${docId}_form_${index + 1}`,
          formType: f.form_type || f.formType,
          confidence: f.confidence || 0.8,
          pageNumbers: f.pageNumbers || [index + 1],
          extractedText: f.extracted_text || f.fullText,
          status: 'completed'
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

    console.log(`✓ Saved document to Azure SQL TF_ingestion: ${file?.originalname}`);
    console.log(`✓ Total forms saved: ${formsData.length}`);
    console.log(`✓ Extracted text length: ${extractedText.length} characters`);
    
  } catch (error) {
    console.error('Error saving to Azure SQL database:', error);
    console.error('Error details:', error.message);
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
        
        // Skip form count query since TF_ingestion_Pdf table structure is causing issues
        const formCount = 1;
        
        const extractedData = dataResult.recordset[0]?.extracted_data ? 
          JSON.parse(dataResult.recordset[0].extracted_data) : {};
        
        const extractedText = textResult.recordset[0]?.extracted_text || '';
        
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

  // MAIN Form detection upload endpoint - Real Form Splitter only
  app.post('/api/form-detection/upload', upload.single('file'), async (req, res) => {
    console.log('=== UPLOAD ENDPOINT CALLED ===');
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('=== STARTING REAL OCR PROCESSING ===');
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
        
        // Use the working OpenCV OCR script
        const opencvOCRPath = path.join(__dirname, 'opencvOCR.py');
        console.log(`🚀 Using OpenCV OCR: ${opencvOCRPath}`);
        console.log(`📋 Processing with OpenCV + Tesseract OCR for authentic text extraction`);
        const pythonProcess = spawn('python3', [opencvOCRPath, filePath]);
        
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code: number) => {
          console.log(`OpenCV OCR process exited with code: ${code}`);
          console.log(`Output received: ${output.substring(0, 1000)}...`);
          console.log(`Error output: ${errorOutput}`);
          
          if (code === 0) {
            try {
              const analysisResult = JSON.parse(output);
              console.log('Parsed OpenCV OCR result:', JSON.stringify(analysisResult, null, 2));
              
              if (analysisResult.error) {
                reject(new Error(analysisResult.error));
                return;
              }
              
              // Extract individual forms from OpenCV OCR
              const formsData = analysisResult.forms || [];
              console.log(`✅ OpenCV OCR extracted ${formsData.length} individual forms`);
              
              // Save to Azure SQL database first
              try {
                await saveToAzureDatabase(docId, req.file, analysisResult, formsData);
                console.log(`✅ Document saved to Azure SQL: ${req.file?.originalname}`);
              } catch (saveError) {
                console.error('Azure SQL save error:', saveError);
              }

              // Return OpenCV OCR results with real extracted text
              return res.json({
                docId: docId,
                detectedForms: formsData,
                totalForms: formsData.length,
                processingMethod: 'OpenCV + Tesseract OCR',
                status: 'completed',
                message: `Successfully processed ${formsData.length} forms with OCR`
              });
              

            } catch (parseError) {
              reject(parseError);
            }
          } else {
            console.error(`❌ OCR processing failed with code ${code}: ${errorOutput}`);
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

  // Persistent document history will be imported in upload handler

  // Document history endpoint using Azure SQL database
  app.get('/api/form-detection/history', async (req, res) => {
    try {
      const { connectToAzureSQL } = await import('./azureSqlConnection');
      const pool = await connectToAzureSQL();
      
      const result = await pool.request().query(`
        SELECT 
          ingestion_id, original_filename, file_type, file_size, 
          status, extracted_text, extracted_data, created_date
        FROM TF_ingestion 
        ORDER BY created_date DESC
      `);
      
      const documents = result.recordset.map(record => {
        let extractedData = {};
        try {
          extractedData = JSON.parse(record.extracted_data || '{}');
        } catch (e) {
          extractedData = { totalForms: 1, processingMethod: 'OCR Processing' };
        }
        
        return {
          id: record.ingestion_id,
          filename: record.original_filename,
          uploadDate: record.created_date,
          documentType: extractedData.detectedForms?.[0]?.formType || 'Trade Finance Document',
          confidence: Math.round((extractedData.detectedForms?.[0]?.confidence || 0.8) * 100),
          totalForms: extractedData.totalForms || 1,
          extractedText: record.extracted_text?.substring(0, 200) + '...' || 'No preview available',
          fullText: record.extracted_text || 'No content available',
          fileSize: `${(record.file_size / 1024 / 1024).toFixed(1)} MB` || 'Unknown',
          processedAt: record.created_date,
          docId: record.ingestion_id,
          processingMethod: extractedData.processingMethod || 'OCR Processing',
          detectedForms: extractedData.detectedForms || [{
            id: `${record.ingestion_id}_form_1`,
            formType: 'Trade Finance Document',
            form_type: 'Trade Finance Document',
            confidence: 80,
            pageNumbers: [1],
            extractedFields: {
              'Full Extracted Text': record.extracted_text || '',
              'Document Classification': 'Trade Finance Document',
              'Processing Statistics': `${record.extracted_text?.length || 0} characters extracted`,
              'Page Range': 'Page 1'
            },
            status: 'completed',
            processingMethod: 'OCR Processing',
            fullText: record.extracted_text || '',
            extracted_text: record.extracted_text || '',
            page_range: 'Page 1'
          }]
        };
      });
      
      console.log(`✅ Loaded ${documents.length} documents from Azure SQL TF_ingestion`);
      
      res.setHeader('Cache-Control', 'no-cache');
      res.json({ documents, total: documents.length });
      
    } catch (error) {
      console.error('Azure SQL history error:', error.message);
      res.json({ documents: [], total: 0, error: error.message });
    }
  });

  // Bulk delete endpoint - keep only the latest document
  app.delete('/api/form-detection/cleanup-old', async (req, res) => {
    try {
      console.log('🧹 Starting cleanup of old documents...');
      
      const azureConfig = {
        server: 'shahulmi.database.windows.net',
        port: 1433,
        database: 'tf_genie',
        user: 'shahul',
        password: 'Apple123!@#',
        options: {
          encrypt: true,
          trustServerCertificate: false
        }
      };
      
      const pool = new sql.ConnectionPool(azureConfig);
      await pool.connect();
      
      // Get the latest document ID (most recent upload)
      const latestDocQuery = `
        SELECT TOP 1 ingestion_id, original_filename, created_date 
        FROM TF_ingestion 
        ORDER BY ingestion_id DESC
      `;
      
      const latestResult = await pool.request().query(latestDocQuery);
      
      if (latestResult.recordset.length === 0) {
        await pool.close();
        return res.json({ 
          success: false, 
          message: 'No documents found in database',
          remaining: 0 
        });
      }

      const latestDoc = latestResult.recordset[0];
      console.log(`📄 Latest document: ${latestDoc.original_filename} (ID: ${latestDoc.ingestion_id})`);

      // Count total documents before cleanup
      const countQuery = 'SELECT COUNT(*) as total FROM TF_ingestion';
      const countResult = await pool.request().query(countQuery);
      const totalDocs = countResult.recordset[0].total;
      
      console.log(`📊 Total documents before cleanup: ${totalDocs}`);

      if (totalDocs <= 1) {
        await pool.close();
        return res.json({ 
          success: true, 
          message: 'Only one document exists, no cleanup needed',
          remaining: 1,
          keptDocument: latestDoc.original_filename
        });
      }

      // Delete all documents except the latest one
      const deleteQuery = `
        DELETE FROM TF_ingestion 
        WHERE ingestion_id != @latestDocId
      `;
      
      console.log('🗑️ Deleting old documents...');
      const deleteRequest = pool.request();
      deleteRequest.input('latestDocId', sql.VarChar(50), latestDoc.ingestion_id);
      const deleteResult = await deleteRequest.query(deleteQuery);
      
      const deletedCount = deleteResult.rowsAffected[0];
      console.log(`✅ Deleted ${deletedCount} old documents`);
      console.log(`📄 Kept latest document: ${latestDoc.original_filename}`);
      
      // Verify cleanup
      const finalCountResult = await pool.request().query(countQuery);
      const remainingDocs = finalCountResult.recordset[0].total;
      
      await pool.close();
      
      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} old documents`,
        deletedCount,
        remaining: remainingDocs,
        keptDocument: latestDoc.original_filename,
        keptDocumentId: latestDoc.ingestion_id
      });

    } catch (error) {
      console.error('❌ Cleanup error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        message: 'Failed to cleanup old documents'
      });
    }
  });

  function getDocumentType(filename) {
    if (!filename) return 'Trade Finance Document';
    const lower = filename.toLowerCase();
    if (lower.includes('invoice')) return 'Commercial Invoice';
    if (lower.includes('bill')) return 'Bill of Lading';
    if (lower.includes('certificate')) return 'Certificate of Origin';
    if (lower.includes('lc') || lower.includes('credit')) return 'Letter of Credit';
    return 'Trade Finance Document';
  }

  // SWIFT API endpoints for Azure database integration
  app.get("/api/swift/message-types-azure", async (req, res) => {
    try {
      const messageTypes = await azureDataService.getSwiftMessageTypes();
      console.log(`Returning ${messageTypes.length} SWIFT message types`);
      res.json(messageTypes);
    } catch (error) {
      console.error('Error fetching SWIFT message types:', error);
      res.status(500).json({ error: 'Failed to fetch message types' });
    }
  });

  app.get("/api/swift/fields-azure", async (req, res) => {
    try {
      const messageTypeId = req.query.messageType as string;
      const fields = await azureDataService.getSwiftFields(messageTypeId);
      console.log(`Returning ${fields.length} SWIFT fields`);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching SWIFT fields:', error);
      res.status(500).json({ error: 'Failed to fetch fields' });
    }
  });

  app.get('/api/swift/validation-rules-azure', async (req, res) => {
    try {
      const messageTypeId = req.query.messageTypeId as string;
      const fieldId = req.query.fieldId as string;
      
      // Get validation rules from Azure database
      const rules = await azureDataService.getValidationRules(messageTypeId, fieldId);
      console.log(`Returning ${rules.length} validation rules`);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      res.status(500).json({ error: 'Failed to fetch validation rules' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
/**
 * Migration script to transfer existing JSON document history to Azure SQL database
 */

import { connectToAzureSQL } from './azureSqlConnection';
import * as fs from 'fs';
import * as path from 'path';

interface JsonDocument {
  id: string;
  filename: string;
  uploadDate: string;
  processingMethod: string;
  totalForms: number;
  fileSize: number | string;
  documentType: string;
  confidence: number;
  extractedText: string;
  fullText: string;
  processedAt: string;
  docId: string;
  totalPages?: number;
  detectedForms?: any[];
}

export async function migrateJsonToAzure() {
  try {
    console.log('Starting JSON to Azure SQL migration...');
    
    // Check if JSON file exists
    const jsonPath = path.join(process.cwd(), 'document_history.json');
    if (!fs.existsSync(jsonPath)) {
      console.log('No document_history.json file found - nothing to migrate');
      return;
    }

    // Load JSON data
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      console.log('JSON file is empty or invalid - nothing to migrate');
      return;
    }

    console.log(`Found ${jsonData.length} documents in JSON file`);

    // Connect to Azure SQL
    const pool = await connectToAzureSQL();

    let migratedCount = 0;
    for (const doc of jsonData as JsonDocument[]) {
      try {
        // Check if document already exists
        const existingCheck = await pool.request()
          .input('ingestionId', doc.docId || doc.id)
          .query('SELECT COUNT(*) as count FROM TF_ingestion WHERE ingestion_id = @ingestionId');

        if (existingCheck.recordset[0].count > 0) {
          console.log(`Document ${doc.filename} already exists - skipping`);
          continue;
        }

        // Parse file size if it's a string
        let fileSize = 0;
        if (typeof doc.fileSize === 'string') {
          const sizeMatch = doc.fileSize.match(/(\d+\.?\d*)/);
          fileSize = sizeMatch ? Math.round(parseFloat(sizeMatch[1]) * 1024 * 1024) : 0;
        } else {
          fileSize = doc.fileSize || 0;
        }

        // Insert main record
        await pool.request()
          .input('ingestionId', doc.docId || doc.id)
          .input('originalFilename', doc.filename)
          .input('filePath', '')
          .input('fileType', 'application/pdf')
          .input('fileSize', fileSize)
          .input('status', 'completed')
          .input('extractedData', JSON.stringify({
            totalPages: doc.totalPages || 1,
            totalForms: doc.totalForms || 1,
            processingMethod: doc.processingMethod || 'Direct OCR Text Extraction',
            detectedForms: doc.detectedForms || [{
              formType: doc.documentType,
              confidence: doc.confidence / 100,
              pageNumber: 1
            }],
            migratedFromJson: true
          }))
          .input('createdDate', new Date(doc.uploadDate || doc.processedAt))
          .query(`
            INSERT INTO TF_ingestion (
              ingestion_id, original_filename, file_path, file_type, file_size, 
              status, extracted_data, created_date, updated_date
            ) VALUES (
              @ingestionId, @originalFilename, @filePath, @fileType, @fileSize,
              @status, @extractedData, @createdDate, GETDATE()
            )
          `);

        // Insert PDF record
        await pool.request()
          .input('pdfId', `${doc.docId || doc.id}_form_1`)
          .input('ingestionId', doc.docId || doc.id)
          .input('originalFilename', doc.filename)
          .input('filePath', '')
          .input('fileSize', fileSize)
          .input('pageCount', doc.totalPages || 1)
          .input('ocrText', doc.extractedText || doc.fullText || '')
          .input('processingStatus', 'completed')
          .input('azureClassification', JSON.stringify({
            documentType: doc.documentType,
            confidence: doc.confidence / 100,
            pageNumber: 1
          }))
          .input('confidenceScore', doc.confidence)
          .input('createdDate', new Date(doc.uploadDate || doc.processedAt))
          .query(`
            INSERT INTO TF_ingestion_Pdf (
              pdf_id, ingestion_id, original_filename, file_path, file_size_bytes,
              page_count, ocr_text, processing_status, azure_classification, 
              confidence_score, created_date, updated_date
            ) VALUES (
              @pdfId, @ingestionId, @originalFilename, @filePath, @fileSize,
              @pageCount, @ocrText, @processingStatus, @azureClassification,
              @confidenceScore, @createdDate, GETDATE()
            )
          `);

        // Insert TXT record
        await pool.request()
          .input('ingestionId', doc.docId || doc.id)
          .input('content', doc.extractedText || doc.fullText || '')
          .input('language', 'en')
          .input('createdDate', new Date(doc.uploadDate || doc.processedAt))
          .query(`
            INSERT INTO TF_ingestion_TXT (
              ingestion_id, content, language, created_date
            ) VALUES (
              @ingestionId, @content, @language, @createdDate)
          `);

        migratedCount++;
        console.log(`✓ Migrated: ${doc.filename}`);

      } catch (docError) {
        console.error(`Error migrating ${doc.filename}:`, docError);
      }
    }

    await pool.close();
    console.log(`Migration completed: ${migratedCount}/${jsonData.length} documents migrated`);

    // Rename JSON file as backup
    if (migratedCount > 0) {
      const backupPath = jsonPath + '.migrated.backup';
      fs.renameSync(jsonPath, backupPath);
      console.log(`JSON file backed up to: ${backupPath}`);
    }

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateJsonToAzure()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
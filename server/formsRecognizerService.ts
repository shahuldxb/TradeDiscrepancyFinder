import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

interface ProcessingResult {
  success: boolean;
  ingestion_id: string;
  total_forms?: number;
  segregated_forms?: any[];
  form_templates?: string[];
  processing_summary?: any;
  error?: string;
}

export class FormsRecognizerService {
  private uploadsDir: string;
  private outputDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.outputDir = path.join(process.cwd(), 'form_outputs');
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async processMultiFormPDF(filePath: string, ingestionId: string): Promise<ProcessingResult> {
    return new Promise((resolve) => {
      const outputPath = path.join(this.outputDir, ingestionId);
      const pythonScript = path.join(__dirname, 'formsRecognizerProcessor.py');
      
      // Create output directory for this ingestion
      fs.mkdir(outputPath, { recursive: true }).catch(console.error);

      const pythonProcess = spawn('python', [pythonScript, filePath, outputPath, ingestionId], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
          AZURE_DOCUMENT_INTELLIGENCE_KEY: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
        }
      });

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(outputData);
            resolve(result);
          } catch (parseError) {
            resolve({
              success: false,
              ingestion_id: ingestionId,
              error: `Failed to parse Python output: ${parseError}`
            });
          }
        } else {
          resolve({
            success: false,
            ingestion_id: ingestionId,
            error: `Python process exited with code ${code}: ${errorData}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          ingestion_id: ingestionId,
          error: `Failed to start Python process: ${error.message}`
        });
      });
    });
  }

  async saveFileAndCreateIngestion(file: Express.Multer.File): Promise<{ filePath: string; ingestionId: string }> {
    const ingestionId = `ing_${Date.now()}_${nanoid(9)}`;
    const fileName = `${ingestionId}_${file.originalname}`;
    const filePath = path.join(this.uploadsDir, fileName);
    
    await fs.writeFile(filePath, file.buffer);
    
    return { filePath, ingestionId };
  }

  async createTables(): Promise<void> {
    const { connectToAzureSQL } = await import('./azureSqlConnection');
    const pool = await connectToAzureSQL();

    const createTablesSQL = `
      -- TF_ingestion table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion' AND xtype='U')
      CREATE TABLE TF_ingestion (
          id INT IDENTITY(1,1) PRIMARY KEY,
          ingestion_id VARCHAR(50) UNIQUE NOT NULL,
          original_filename NVARCHAR(255) NOT NULL,
          file_path NVARCHAR(500),
          file_size BIGINT,
          mime_type VARCHAR(100),
          status VARCHAR(50) DEFAULT 'uploaded',
          extracted_text NTEXT,
          extracted_data NTEXT,
          document_type VARCHAR(100),
          processing_method VARCHAR(100),
          confidence_score DECIMAL(5,2),
          total_forms_detected INT DEFAULT 0,
          created_date DATETIME2 DEFAULT GETDATE(),
          updated_date DATETIME2 DEFAULT GETDATE()
      );

      -- TF_ingestion_Pdf table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_Pdf' AND xtype='U')
      CREATE TABLE TF_ingestion_Pdf (
          id INT IDENTITY(1,1) PRIMARY KEY,
          ingestion_id VARCHAR(50) NOT NULL,
          form_id VARCHAR(50),
          file_path NVARCHAR(500),
          page_number INT,
          document_type VARCHAR(100),
          page_range VARCHAR(50),
          confidence_score DECIMAL(5,2),
          form_classification VARCHAR(100),
          created_date DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id)
      );

      -- TF_ingestion_TXT table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_TXT' AND xtype='U')
      CREATE TABLE TF_ingestion_TXT (
          id INT IDENTITY(1,1) PRIMARY KEY,
          ingestion_id VARCHAR(50) NOT NULL,
          form_id VARCHAR(50),
          content NTEXT,
          confidence DECIMAL(5,2),
          language VARCHAR(10) DEFAULT 'en',
          character_count INT,
          word_count INT,
          created_date DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id)
      );

      -- TF_ingestion_fields table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_ingestion_fields' AND xtype='U')
      CREATE TABLE TF_ingestion_fields (
          id INT IDENTITY(1,1) PRIMARY KEY,
          ingestion_id VARCHAR(50) NOT NULL,
          form_id VARCHAR(50),
          field_name VARCHAR(200),
          field_value NTEXT,
          field_type VARCHAR(50),
          confidence DECIMAL(5,2),
          extraction_method VARCHAR(100),
          created_date DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (ingestion_id) REFERENCES TF_ingestion(ingestion_id)
      );

      -- TF_forms table (baseline forms requiring approval)
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_forms' AND xtype='U')
      CREATE TABLE TF_forms (
          form_id VARCHAR(50) PRIMARY KEY,
          form_name VARCHAR(200) NOT NULL,
          form_type VARCHAR(100) NOT NULL,
          form_description NTEXT,
          template_version VARCHAR(20) DEFAULT '1.0',
          approval_status VARCHAR(50) DEFAULT 'pending',
          approved_by VARCHAR(100),
          approved_date DATETIME2,
          template_data NTEXT,
          field_definitions NTEXT,
          validation_rules NTEXT,
          usage_count INT DEFAULT 0,
          created_date DATETIME2 DEFAULT GETDATE(),
          updated_date DATETIME2 DEFAULT GETDATE()
      );

      -- TF_Fields table (field definitions for approved forms)
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TF_Fields' AND xtype='U')
      CREATE TABLE TF_Fields (
          field_id VARCHAR(50) PRIMARY KEY,
          form_id VARCHAR(50) NOT NULL,
          field_name VARCHAR(200) NOT NULL,
          field_label VARCHAR(200),
          field_type VARCHAR(50) NOT NULL,
          field_description NTEXT,
          is_required BIT DEFAULT 0,
          validation_pattern VARCHAR(500),
          default_value NVARCHAR(500),
          field_order INT,
          extraction_priority INT DEFAULT 1,
          confidence_threshold DECIMAL(5,2) DEFAULT 70.00,
          created_date DATETIME2 DEFAULT GETDATE(),
          updated_date DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (form_id) REFERENCES TF_forms(form_id)
      );
    `;

    await pool.request().query(createTablesSQL);
    console.log('Forms Recognizer tables created successfully');
  }

  async saveProcessingResults(
    ingestionId: string,
    processingResult: ProcessingResult,
    originalFile: { filename: string; size: number; path: string }
  ): Promise<void> {
    const { connectToAzureSQL } = await import('./azureSqlConnection');
    const pool = await connectToAzureSQL();

    try {
      // Update main ingestion record
      await pool.request()
        .input('ingestionId', ingestionId)
        .input('status', processingResult.success ? 'completed' : 'failed')
        .input('totalForms', processingResult.total_forms || 0)
        .input('processingMethod', 'Azure Document Intelligence + Python')
        .query(`
          UPDATE TF_ingestion 
          SET status = @status, 
              total_forms_detected = @totalForms,
              processing_method = @processingMethod,
              updated_date = GETDATE()
          WHERE ingestion_id = @ingestionId
        `);

      if (processingResult.success && processingResult.segregated_forms) {
        // Save individual PDF records
        for (const form of processingResult.segregated_forms) {
          await pool.request()
            .input('ingestionId', ingestionId)
            .input('formId', `form_${form.page_number}`)
            .input('filePath', form.file_path)
            .input('pageNumber', form.page_number)
            .input('documentType', form.form_type)
            .input('pageRange', form.page_number.toString())
            .input('confidence', form.confidence)
            .input('formClassification', form.form_type)
            .query(`
              INSERT INTO TF_ingestion_Pdf (
                ingestion_id, form_id, file_path, page_number, 
                document_type, page_range, confidence_score, form_classification
              ) VALUES (
                @ingestionId, @formId, @filePath, @pageNumber,
                @documentType, @pageRange, @confidence, @formClassification
              )
            `);

          // Save text records
          await pool.request()
            .input('ingestionId', ingestionId)
            .input('formId', `form_${form.page_number}`)
            .input('content', form.text_content)
            .input('confidence', form.confidence)
            .input('characterCount', form.character_count)
            .input('wordCount', form.word_count)
            .query(`
              INSERT INTO TF_ingestion_TXT (
                ingestion_id, form_id, content, confidence,
                character_count, word_count
              ) VALUES (
                @ingestionId, @formId, @content, @confidence,
                @characterCount, @wordCount
              )
            `);

          // Save extracted fields
          if (form.extracted_fields) {
            for (const [fieldName, fieldValue] of Object.entries(form.extracted_fields)) {
              await pool.request()
                .input('ingestionId', ingestionId)
                .input('formId', `form_${form.page_number}`)
                .input('fieldName', fieldName)
                .input('fieldValue', String(fieldValue))
                .input('fieldType', 'string')
                .input('confidence', form.confidence)
                .input('extractionMethod', 'Azure Document Intelligence')
                .query(`
                  INSERT INTO TF_ingestion_fields (
                    ingestion_id, form_id, field_name, field_value,
                    field_type, confidence, extraction_method
                  ) VALUES (
                    @ingestionId, @formId, @fieldName, @fieldValue,
                    @fieldType, @confidence, @extractionMethod
                  )
                `);
            }
          }

          // Create/update form template if new form type detected
          await this.createOrUpdateFormTemplate(form.form_type, form.extracted_fields);
        }
      }
    } catch (error) {
      console.error('Error saving processing results:', error);
      throw error;
    }
  }

  private async createOrUpdateFormTemplate(formType: string, extractedFields: Record<string, any>): Promise<void> {
    const { connectToAzureSQL } = await import('./azureSqlConnection');
    const pool = await connectToAzureSQL();

    try {
      // Check if form type already exists
      const existingForm = await pool.request()
        .input('formType', formType)
        .query('SELECT form_id FROM TF_forms WHERE form_type = @formType');

      if (existingForm.recordset.length === 0) {
        // Create new form template requiring approval
        const formId = `form_${formType}_${Date.now()}`;
        
        await pool.request()
          .input('formId', formId)
          .input('formName', formType.replace(/_/g, ' ').toUpperCase())
          .input('formType', formType)
          .input('formDescription', `Auto-detected form type: ${formType}`)
          .input('templateData', JSON.stringify({ sampleFields: extractedFields }))
          .input('fieldDefinitions', JSON.stringify(Object.keys(extractedFields)))
          .query(`
            INSERT INTO TF_forms (
              form_id, form_name, form_type, form_description,
              template_data, field_definitions, approval_status
            ) VALUES (
              @formId, @formName, @formType, @formDescription,
              @templateData, @fieldDefinitions, 'pending'
            )
          `);

        // Create field definitions
        let fieldOrder = 1;
        for (const fieldName of Object.keys(extractedFields)) {
          const fieldId = `field_${formId}_${fieldOrder}`;
          
          await pool.request()
            .input('fieldId', fieldId)
            .input('formId', formId)
            .input('fieldName', fieldName)
            .input('fieldLabel', fieldName.replace(/_/g, ' ').toUpperCase())
            .input('fieldType', 'string')
            .input('fieldDescription', `Auto-detected field: ${fieldName}`)
            .input('fieldOrder', fieldOrder)
            .query(`
              INSERT INTO TF_Fields (
                field_id, form_id, field_name, field_label,
                field_type, field_description, field_order
              ) VALUES (
                @fieldId, @formId, @fieldName, @fieldLabel,
                @fieldType, @fieldDescription, @fieldOrder
              )
            `);
          
          fieldOrder++;
        }
      }
    } catch (error) {
      console.error('Error creating form template:', error);
    }
  }
}
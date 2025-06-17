import * as sql from 'mssql';

interface FormField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  isRequired: boolean;
  description: string;
  extractionPattern?: string;
}

interface NewFormTemplate {
  formName: string;
  formType: string;
  description: string;
  fields: FormField[];
  confidence: number;
  sourceText: string;
}

export class NewFormDetectionService {
  constructor() {
    // Service initialization - using Azure SQL for data access
  }

  async detectNewForm(textContent: string, filename: string): Promise<NewFormTemplate | null> {
    try {
      // Check if this form type already exists
      const existingForm = await this.checkExistingFormType(textContent, filename);
      if (existingForm) {
        console.log(`Form type already exists: ${existingForm.form_type}`);
        return null;
      }

      // Generate new form template using AI analysis
      const newTemplate = await this.generateFormTemplate(textContent, filename);
      
      if (newTemplate && newTemplate.confidence > 0.7) {
        console.log(`New form detected: ${newTemplate.formName} (confidence: ${newTemplate.confidence})`);
        return newTemplate;
      }

      return null;
    } catch (error) {
      console.error('Error in new form detection:', error);
      return null;
    }
  }

  private async checkExistingFormType(textContent: string, filename: string): Promise<any> {
    try {
      const pool = await sql.connect({
        server: process.env.AZURE_SQL_SERVER!,
        database: process.env.AZURE_SQL_DATABASE!,
        user: process.env.AZURE_SQL_USER!,
        password: process.env.AZURE_SQL_PASSWORD!,
        options: {
          encrypt: true,
          trustServerCertificate: false
        }
      });
      
      // Get all existing form types
      const result = await pool.request().query(`
        SELECT form_type, form_name, form_description
        FROM TF_forms 
        WHERE status IN ('Approved', 'Pending Approval')
      `);

      // Check similarity with existing forms using keywords and patterns
      const keywords = this.extractKeywords(textContent, filename);
      
      for (const existingForm of result.recordset) {
        const similarity = this.calculateSimilarity(keywords, existingForm.form_type);
        if (similarity > 0.8) {
          return existingForm;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking existing form types:', error);
      return null;
    }
  }

  private extractKeywords(textContent: string, filename: string): string[] {
    const keywords: string[] = [];
    
    // Extract from filename
    const fileKeywords = filename.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    keywords.push(...fileKeywords);

    // Extract from content - look for document type indicators
    const documentTypePatterns = [
      /invoice/gi,
      /bill\s+of\s+lading/gi,
      /certificate\s+of\s+origin/gi,
      /packing\s+list/gi,
      /letter\s+of\s+credit/gi,
      /commercial\s+invoice/gi,
      /customs\s+declaration/gi,
      /shipping\s+manifest/gi,
      /insurance\s+certificate/gi,
      /bill\s+of\s+exchange/gi,
      /proforma\s+invoice/gi,
      /freight\s+invoice/gi
    ];

    for (const pattern of documentTypePatterns) {
      const matches = textContent.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.toLowerCase()));
      }
    }

    // Extract header-like text (usually form names appear at the top)
    const lines = textContent.split('\n').slice(0, 10);
    for (const line of lines) {
      if (line.trim().length > 5 && line.trim().length < 50) {
        const words = line.toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2);
        keywords.push(...words);
      }
    }

    return Array.from(new Set(keywords));
  }

  private calculateSimilarity(keywords1: string[], formType: string): number {
    const formTypeWords = formType.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const intersection = keywords1.filter(word => 
      formTypeWords.some(formWord => 
        word.includes(formWord) || formWord.includes(word)
      )
    );

    return intersection.length / Math.max(keywords1.length, formTypeWords.length);
  }

  private async generateFormTemplate(textContent: string, filename: string): Promise<NewFormTemplate> {
    // Analyze text to determine form type and generate fields
    const formType = this.determineFormType(textContent, filename);
    const fields = this.extractFormFields(textContent, formType);
    
    return {
      formName: this.generateFormName(textContent, filename),
      formType: formType,
      description: this.generateDescription(textContent, formType),
      fields: fields,
      confidence: this.calculateConfidence(textContent, fields),
      sourceText: textContent.substring(0, 1000) // First 1000 chars for reference
    };
  }

  private determineFormType(textContent: string, filename: string): string {
    const text = textContent.toLowerCase();
    const file = filename.toLowerCase();

    // Priority-based form type detection
    if (text.includes('commercial invoice') || file.includes('invoice')) {
      return 'Commercial Invoice';
    }
    if (text.includes('bill of lading') || text.includes('b/l')) {
      return 'Bill of Lading';
    }
    if (text.includes('certificate of origin')) {
      return 'Certificate of Origin';
    }
    if (text.includes('packing list') || text.includes('packing slip')) {
      return 'Packing List';
    }
    if (text.includes('letter of credit') || text.includes('documentary credit')) {
      return 'Letter of Credit';
    }
    if (text.includes('bill of exchange')) {
      return 'Bill of Exchange';
    }
    if (text.includes('insurance certificate')) {
      return 'Insurance Certificate';
    }
    if (text.includes('customs declaration')) {
      return 'Customs Declaration';
    }
    if (text.includes('freight invoice')) {
      return 'Freight Invoice';
    }
    if (text.includes('proforma invoice')) {
      return 'Proforma Invoice';
    }

    // If no specific type found, create a generic type based on filename or content
    const nameWords = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    return nameWords ? `${nameWords} Document` : 'Trade Document';
  }

  private extractFormFields(textContent: string, formType: string): FormField[] {
    const fields: FormField[] = [];
    const lines = textContent.split('\n');

    // Common field patterns for trade finance documents
    const fieldPatterns = {
      'invoice_number': {
        pattern: /(?:invoice\s+(?:no|number|#)|inv\s+(?:no|number|#))[:\s]*([a-zA-Z0-9\-\/]+)/gi,
        type: 'text' as const,
        required: true,
        description: 'Invoice number or reference'
      },
      'date': {
        pattern: /(?:date|dated)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/gi,
        type: 'date' as const,
        required: true,
        description: 'Document date'
      },
      'amount': {
        pattern: /(?:amount|total|sum)[:\s]*(?:USD|EUR|GBP|CHF)?\s*[\$€£]?\s*([\d,]+\.?\d*)/gi,
        type: 'currency' as const,
        required: true,
        description: 'Total amount'
      },
      'seller': {
        pattern: /(?:seller|shipper|exporter|from)[:\s]*([a-zA-Z\s&\.,\-]+?)(?:\n|$)/gi,
        type: 'text' as const,
        required: true,
        description: 'Seller or shipper information'
      },
      'buyer': {
        pattern: /(?:buyer|consignee|importer|to)[:\s]*([a-zA-Z\s&\.,\-]+?)(?:\n|$)/gi,
        type: 'text' as const,
        required: true,
        description: 'Buyer or consignee information'
      },
      'reference': {
        pattern: /(?:reference|ref|lc\s+no)[:\s]*([a-zA-Z0-9\-\/]+)/gi,
        type: 'text' as const,
        required: false,
        description: 'Reference number'
      },
      'port_of_loading': {
        pattern: /(?:port\s+of\s+loading|loading\s+port)[:\s]*([a-zA-Z\s,\-]+?)(?:\n|$)/gi,
        type: 'text' as const,
        required: false,
        description: 'Port of loading'
      },
      'port_of_discharge': {
        pattern: /(?:port\s+of\s+discharge|discharge\s+port)[:\s]*([a-zA-Z\s,\-]+?)(?:\n|$)/gi,
        type: 'text' as const,
        required: false,
        description: 'Port of discharge'
      }
    };

    // Extract fields based on form type and patterns
    for (const [fieldName, config] of Object.entries(fieldPatterns)) {
      const matches = textContent.match(config.pattern);
      if (matches && matches.length > 0) {
        fields.push({
          fieldName: fieldName,
          fieldType: config.type,
          isRequired: config.required,
          description: config.description,
          extractionPattern: config.pattern.source
        });
      }
    }

    // Add form-specific fields
    if (formType === 'Commercial Invoice') {
      fields.push(
        {
          fieldName: 'incoterms',
          fieldType: 'text',
          isRequired: false,
          description: 'Incoterms (FOB, CIF, etc.)'
        },
        {
          fieldName: 'currency',
          fieldType: 'text',
          isRequired: true,
          description: 'Currency code (USD, EUR, etc.)'
        }
      );
    } else if (formType === 'Bill of Lading') {
      fields.push(
        {
          fieldName: 'vessel_name',
          fieldType: 'text',
          isRequired: true,
          description: 'Name of vessel'
        },
        {
          fieldName: 'container_number',
          fieldType: 'text',
          isRequired: false,
          description: 'Container number'
        }
      );
    }

    return fields;
  }

  private generateFormName(textContent: string, filename: string): string {
    const formType = this.determineFormType(textContent, filename);
    
    // Extract potential form name from document header
    const lines = textContent.split('\n').slice(0, 5);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5 && trimmed.length < 60 && !trimmed.includes(':')) {
        return trimmed;
      }
    }

    return formType;
  }

  private generateDescription(textContent: string, formType: string): string {
    const descriptions: Record<string, string> = {
      'Commercial Invoice': 'Commercial invoice for international trade transactions',
      'Bill of Lading': 'Bill of lading for shipping and logistics',
      'Certificate of Origin': 'Certificate of origin for customs and trade compliance',
      'Packing List': 'Detailed packing list for shipped goods',
      'Letter of Credit': 'Documentary letter of credit for trade finance',
      'Bill of Exchange': 'Bill of exchange for payment terms',
      'Insurance Certificate': 'Insurance certificate for cargo protection',
      'Customs Declaration': 'Customs declaration for import/export',
      'Freight Invoice': 'Freight and shipping cost invoice',
      'Proforma Invoice': 'Proforma invoice for quotation purposes'
    };

    return descriptions[formType] || `Custom ${formType} for trade finance processing`;
  }

  private calculateConfidence(textContent: string, fields: FormField[]): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on number of detected fields
    confidence += Math.min(fields.length * 0.1, 0.3);

    // Increase confidence for required fields
    const requiredFields = fields.filter(f => f.isRequired).length;
    confidence += Math.min(requiredFields * 0.05, 0.2);

    // Increase confidence for document structure
    const lines = textContent.split('\n');
    if (lines.length > 10) confidence += 0.1;
    if (textContent.length > 500) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  async submitNewFormForApproval(template: NewFormTemplate, ingestionId: string): Promise<string> {
    try {
      const pool = await sql.connect({
        server: process.env.AZURE_SQL_SERVER!,
        database: process.env.AZURE_SQL_DATABASE!,
        user: process.env.AZURE_SQL_USER!,
        password: process.env.AZURE_SQL_PASSWORD!,
        options: {
          encrypt: true,
          trustServerCertificate: false
        }
      });

      // Generate form ID
      const formIdResult = await pool.request().query(`
        SELECT ISNULL(MAX(form_id), 0) + 1 as next_id FROM TF_forms
      `);
      const formId = formIdResult.recordset[0].next_id;

      // Insert into TF_forms table with Pending Approval status
      await pool.request()
        .input('formId', formId)
        .input('formType', template.formType)
        .input('formName', template.formName)
        .input('formDescription', template.description)
        .input('status', 'Pending Approval')
        .input('sourceIngestionId', ingestionId)
        .input('confidence', template.confidence)
        .input('sourceText', template.sourceText)
        .query(`
          INSERT INTO TF_forms (
            form_id, form_type, form_name, form_description, 
            status, created_date, source_ingestion_id, confidence, source_text
          ) VALUES (
            @formId, @formType, @formName, @formDescription,
            @status, GETDATE(), @sourceIngestionId, @confidence, @sourceText
          )
        `);

      // Insert field definitions into TF_Fields table
      for (let i = 0; i < template.fields.length; i++) {
        const field = template.fields[i];
        await pool.request()
          .input('formId', formId)
          .input('fieldName', field.fieldName)
          .input('fieldType', field.fieldType)
          .input('isRequired', field.isRequired)
          .input('description', field.description)
          .input('extractionPattern', field.extractionPattern || '')
          .input('fieldOrder', i + 1)
          .query(`
            INSERT INTO TF_Fields (
              form_id, field_name, field_type, is_required, 
              description, extraction_pattern, field_order, created_date
            ) VALUES (
              @formId, @fieldName, @fieldType, @isRequired,
              @description, @extractionPattern, @fieldOrder, GETDATE()
            )
          `);
      }

      console.log(`New form submitted for approval: ${template.formName} (ID: ${formId})`);
      return formId.toString();

    } catch (error) {
      console.error('Error submitting new form for approval:', error);
      throw error;
    }
  }
}
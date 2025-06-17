/**
 * Multi-Form Document Processor
 * 
 * Analyzes PDF documents to identify and extract individual forms,
 * classifies each form separately, and stores them with proper grouping
 */

import { azureFormsClassifier } from './azureFormsClassifier';

export interface FormSection {
  formType: string;
  confidence: number;
  startPage?: number;
  endPage?: number;
  extractedText: string;
  extractedFields: Record<string, any>;
  boundingBox?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface MultiFormResult {
  totalForms: number;
  forms: FormSection[];
  originalFilename: string;
  processingMethod: string;
  totalTextLength: number;
}

export class MultiFormProcessor {
  
  /**
   * Analyze PDF content to identify individual forms within the document
   */
  async analyzeMultiFormDocument(filePath: string, extractedText: string): Promise<MultiFormResult> {
    try {
      console.log('🔍 Analyzing multi-form document for individual form detection...');
      
      // Split text into logical sections based on form patterns
      const formSections = this.identifyFormSections(extractedText);
      
      // Classify each section
      const classifiedForms: FormSection[] = [];
      
      for (let i = 0; i < formSections.length; i++) {
        const section = formSections[i];
        const formType = this.classifyFormSection(section);
        
        // Extract fields specific to this form type
        const extractedFields = await this.extractFormFields(section, formType);
        
        classifiedForms.push({
          formType,
          confidence: this.calculateConfidence(section, formType),
          extractedText: section,
          extractedFields,
          startPage: i + 1,
          endPage: i + 1
        });
      }
      
      const result: MultiFormResult = {
        totalForms: classifiedForms.length,
        forms: classifiedForms,
        originalFilename: filePath.split('/').pop() || 'unknown',
        processingMethod: 'multi_form_analysis',
        totalTextLength: extractedText.length
      };
      
      console.log(`📋 Identified ${result.totalForms} forms in document`);
      return result;
      
    } catch (error) {
      console.error('Error analyzing multi-form document:', error);
      throw error;
    }
  }
  
  /**
   * Identify individual form sections within the extracted text
   */
  private identifyFormSections(text: string): string[] {
    // Form boundary patterns
    const formHeaders = [
      /COMMERCIAL\s+INVOICE/i,
      /BILL\s+OF\s+LADING/i,
      /CERTIFICATE\s+OF\s+ORIGIN/i,
      /PACKING\s+LIST/i,
      /LETTER\s+OF\s+CREDIT/i,
      /DOCUMENTARY\s+CREDIT/i,
      /INSURANCE\s+CERTIFICATE/i,
      /BILL\s+OF\s+EXCHANGE/i,
      /INSPECTION\s+CERTIFICATE/i,
      /SHIPMENT\s+ADVICE/i
    ];
    
    const sections: string[] = [];
    const lines = text.split('\n');
    let currentSection = '';
    let sectionStart = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line indicates a new form
      const isFormHeader = formHeaders.some(pattern => pattern.test(line));
      
      if (isFormHeader && currentSection.length > 100) {
        // Save previous section
        sections.push(currentSection.trim());
        currentSection = line + '\n';
        sectionStart = i;
      } else {
        currentSection += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection.trim().length > 100) {
      sections.push(currentSection.trim());
    }
    
    // If no clear sections found, try intelligent splitting by content density
    if (sections.length === 0) {
      return this.intelligentTextSplitting(text);
    }
    
    return sections;
  }
  
  /**
   * Intelligent text splitting when form headers are not clearly defined
   */
  private intelligentTextSplitting(text: string): string[] {
    const sections: string[] = [];
    const minSectionLength = 500;
    const maxSectionLength = 3000;
    
    // Split by paragraph breaks or significant whitespace
    const paragraphs = text.split(/\n\s*\n/);
    let currentSection = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (currentSection.length + trimmedParagraph.length > maxSectionLength && 
          currentSection.length > minSectionLength) {
        sections.push(currentSection.trim());
        currentSection = trimmedParagraph + '\n\n';
      } else {
        currentSection += trimmedParagraph + '\n\n';
      }
    }
    
    if (currentSection.trim().length > minSectionLength) {
      sections.push(currentSection.trim());
    }
    
    return sections;
  }
  
  /**
   * Classify the type of form based on content analysis
   */
  private classifyFormSection(sectionText: string): string {
    const patterns = {
      'Commercial Invoice': [
        /invoice\s+(?:no|number)/i,
        /invoice\s+date/i,
        /seller|exporter/i,
        /buyer|importer/i,
        /unit\s+price/i,
        /total\s+amount/i,
        /quantity/i
      ],
      'Bill of Lading': [
        /bill\s+of\s+lading/i,
        /shipper/i,
        /consignee/i,
        /notify\s+party/i,
        /port\s+of\s+loading/i,
        /port\s+of\s+discharge/i,
        /vessel/i,
        /container/i
      ],
      'Certificate of Origin': [
        /certificate\s+of\s+origin/i,
        /country\s+of\s+origin/i,
        /chamber\s+of\s+commerce/i,
        /certify\s+that/i,
        /goods\s+originated/i
      ],
      'Packing List': [
        /packing\s+list/i,
        /gross\s+weight/i,
        /net\s+weight/i,
        /packages?/i,
        /cartons?/i,
        /dimensions/i
      ],
      'LC Document': [
        /letter\s+of\s+credit/i,
        /documentary\s+credit/i,
        /credit\s+number/i,
        /applicant/i,
        /beneficiary/i,
        /issuing\s+bank/i,
        /expiry\s+date/i
      ],
      'Insurance Certificate': [
        /insurance\s+certificate/i,
        /policy\s+number/i,
        /insured\s+amount/i,
        /coverage/i,
        /premium/i
      ],
      'Bill of Exchange': [
        /bill\s+of\s+exchange/i,
        /exchange\s+for/i,
        /pay\s+to\s+the\s+order/i,
        /drawn\s+under/i,
        /tenor/i
      ]
    };
    
    let bestMatch = 'Unclassified';
    let maxScore = 0;
    
    for (const [formType, formPatterns] of Object.entries(patterns)) {
      let score = 0;
      for (const pattern of formPatterns) {
        if (pattern.test(sectionText)) {
          score++;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = formType;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Calculate confidence score for form classification
   */
  private calculateConfidence(sectionText: string, formType: string): number {
    const baseConfidence = 0.7;
    const lengthFactor = Math.min(sectionText.length / 1000, 1.0);
    const typeFactor = formType === 'Unclassified' ? 0.5 : 1.0;
    
    return Math.round((baseConfidence + lengthFactor * 0.2) * typeFactor * 100) / 100;
  }
  
  /**
   * Extract specific fields based on form type
   */
  private async extractFormFields(sectionText: string, formType: string): Promise<Record<string, any>> {
    const fields: Record<string, any> = {};
    
    try {
      switch (formType) {
        case 'Commercial Invoice':
          fields.invoiceNumber = this.extractPattern(sectionText, /invoice\s+(?:no|number)[\s:]+([^\n]+)/i);
          fields.invoiceDate = this.extractPattern(sectionText, /invoice\s+date[\s:]+([^\n]+)/i);
          fields.seller = this.extractPattern(sectionText, /seller[\s:]+([^\n]+)/i);
          fields.buyer = this.extractPattern(sectionText, /buyer[\s:]+([^\n]+)/i);
          fields.totalAmount = this.extractPattern(sectionText, /total[\s:]+([^\n]+)/i);
          break;
          
        case 'Bill of Lading':
          fields.blNumber = this.extractPattern(sectionText, /b\/l\s+(?:no|number)[\s:]+([^\n]+)/i);
          fields.shipper = this.extractPattern(sectionText, /shipper[\s:]+([^\n]+)/i);
          fields.consignee = this.extractPattern(sectionText, /consignee[\s:]+([^\n]+)/i);
          fields.vessel = this.extractPattern(sectionText, /vessel[\s:]+([^\n]+)/i);
          fields.portOfLoading = this.extractPattern(sectionText, /port\s+of\s+loading[\s:]+([^\n]+)/i);
          break;
          
        case 'Certificate of Origin':
          fields.certificateNumber = this.extractPattern(sectionText, /certificate\s+(?:no|number)[\s:]+([^\n]+)/i);
          fields.countryOfOrigin = this.extractPattern(sectionText, /country\s+of\s+origin[\s:]+([^\n]+)/i);
          fields.issuer = this.extractPattern(sectionText, /issued\s+by[\s:]+([^\n]+)/i);
          break;
          
        case 'LC Document':
          fields.lcNumber = this.extractPattern(sectionText, /(?:lc|credit)\s+(?:no|number)[\s:]+([^\n]+)/i);
          fields.applicant = this.extractPattern(sectionText, /applicant[\s:]+([^\n]+)/i);
          fields.beneficiary = this.extractPattern(sectionText, /beneficiary[\s:]+([^\n]+)/i);
          fields.amount = this.extractPattern(sectionText, /amount[\s:]+([^\n]+)/i);
          break;
          
        default:
          fields.content = sectionText.substring(0, 200) + (sectionText.length > 200 ? '...' : '');
          break;
      }
      
      fields.textLength = sectionText.length;
      fields.extractedAt = new Date().toISOString();
      
    } catch (error) {
      console.error('Error extracting fields:', error);
      fields.error = 'Field extraction failed';
    }
    
    return fields;
  }
  
  /**
   * Extract text matching a specific pattern
   */
  private extractPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Store multi-form results in Azure SQL tables
   */
  async storeMultiFormResults(pool: any, ingestionId: string, multiFormResult: MultiFormResult): Promise<void> {
    try {
      console.log(`💾 Storing ${multiFormResult.totalForms} forms for ingestion ${ingestionId}`);
      
      for (let i = 0; i < multiFormResult.forms.length; i++) {
        const form = multiFormResult.forms[i];
        
        // Store in PDF table
        await pool.request()
          .input('ingestionId', ingestionId)
          .input('formId', this.generateFormId(form.formType))
          .input('filePath', `${ingestionId}_form_${i + 1}.pdf`)
          .input('documentType', form.formType)
          .input('pageRange', `${form.startPage || 1}-${form.endPage || 1}`)
          .query(`
            INSERT INTO TF_ingestion_Pdf (ingestion_id, form_id, file_path, document_type, page_range, created_date)
            VALUES (@ingestionId, @formId, @filePath, @documentType, @pageRange, GETDATE())
          `);
        
        // Store in TXT table
        await pool.request()
          .input('ingestionId', ingestionId)
          .input('content', form.extractedText)
          .input('language', 'en')
          .query(`
            INSERT INTO TF_ingestion_TXT (ingestion_id, content, language, created_date)
            VALUES (@ingestionId, @content, @language, GETDATE())
          `);
        
        // Store extracted fields
        await pool.request()
          .input('ingestionId', ingestionId)
          .input('formType', form.formType)
          .input('confidence', form.confidence)
          .input('extractedFields', JSON.stringify(form.extractedFields))
          .query(`
            INSERT INTO TF_ingestion_fields (ingestion_id, form_type, confidence, extracted_fields, created_date)
            VALUES (@ingestionId, @formType, @confidence, @extractedFields, GETDATE())
          `);
      }
      
      console.log(`✅ Successfully stored ${multiFormResult.totalForms} forms in processing tables`);
      
    } catch (error) {
      console.error('Error storing multi-form results:', error);
      throw error;
    }
  }
  
  /**
   * Generate consistent form ID based on form type
   */
  private generateFormId(formType: string): string {
    const typeMap: Record<string, string> = {
      'Commercial Invoice': 'commercial_invoice_v1',
      'Bill of Lading': 'bill_of_lading_v1',
      'Certificate of Origin': 'certificate_origin_v1',
      'Packing List': 'packing_list_v1',
      'LC Document': 'lc_document_v1',
      'Insurance Certificate': 'insurance_certificate_v1',
      'Bill of Exchange': 'bill_of_exchange_v1',
      'Unclassified': 'unclassified_v1'
    };
    
    return typeMap[formType] || 'unknown_form_v1';
  }
}

export const multiFormProcessor = new MultiFormProcessor();
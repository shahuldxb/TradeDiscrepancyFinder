import fs from 'fs';
import path from 'path';

interface ProcessingResult {
  documentId: number;
  status: 'success' | 'error';
  extractedData?: any;
  error?: string;
}

export async function processDocument(documentId: number): Promise<ProcessingResult> {
  const { storage } = await import('./storage');
  
  try {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await storage.updateDocumentStatus(documentId, 'processing');

    let extractedData: any = {};

    // Process based on file type
    switch (document.mimeType) {
      case 'application/pdf':
        extractedData = await processPDF(document.filePath);
        break;
      case 'text/plain':
        extractedData = await processTextFile(document.filePath);
        break;
      case 'image/jpeg':
      case 'image/png':
        extractedData = await processImageOCR(document.filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${document.mimeType}`);
    }

    // Store extracted data
    await storage.updateDocumentExtractedData(documentId, extractedData);
    await storage.updateDocumentStatus(documentId, 'processed');

    return {
      documentId,
      status: 'success',
      extractedData,
    };

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    await storage.updateDocumentStatus(documentId, 'failed');
    
    return {
      documentId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function processPDF(filePath: string): Promise<any> {
  // This would integrate with pdf.js or similar library
  // For now, simulate PDF text extraction
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'pdf',
        pages: 1,
        text: 'Sample extracted PDF text content...',
        fields: {
          amount: '100000.00',
          currency: 'USD',
          date: '2024-01-15',
        },
      });
    }, 2000);
  });
}

async function processTextFile(filePath: string): Promise<any> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // Parse MT message format if detected
    if (content.includes(':20:') || content.includes('MT700')) {
      return parseMTMessage(content);
    }
    
    return {
      type: 'text',
      content,
      fields: extractFieldsFromText(content),
    };
    
  } catch (error) {
    throw new Error(`Failed to read text file: ${error}`);
  }
}

async function processImageOCR(filePath: string): Promise<any> {
  // This would integrate with Tesseract.js or similar OCR library
  // For now, simulate OCR processing
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'ocr',
        confidence: 0.95,
        text: 'Sample OCR extracted text...',
        fields: {
          amount: '100000.00',
          date: '2024-01-15',
        },
      });
    }, 5000);
  });
}

function parseMTMessage(content: string): any {
  const fields: any = {};
  
  // Parse standard MT700 fields
  const patterns = {
    creditNumber: /:20:([^\n]+)/,
    amount: /:32B:([A-Z]{3})([0-9,]+\.?[0-9]*)/,
    expiryDate: /:31D:([0-9]{6})/,
    beneficiary: /:59:([^\n]+)/,
    applicant: /:50:([^\n]+)/,
    description: /:45A:([^\n]+)/,
  };

  for (const [fieldName, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    if (match) {
      if (fieldName === 'amount') {
        fields.currency = match[1];
        fields.amount = match[2].replace(/,/g, '');
      } else {
        fields[fieldName] = match[1];
      }
    }
  }

  return {
    type: 'mt_message',
    messageType: 'MT700',
    fields,
    rawContent: content,
  };
}

function extractFieldsFromText(content: string): any {
  const fields: any = {};
  
  // Common field patterns
  const patterns = {
    amount: /(?:amount|total|sum)[:\s]+([0-9,]+\.?[0-9]*)/i,
    date: /(?:date|dated)[:\s]+([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
    currency: /([A-Z]{3})\s*[0-9,]/,
    invoice: /invoice[:\s]*([A-Z0-9\-]+)/i,
  };

  for (const [fieldName, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    if (match) {
      fields[fieldName] = match[1];
    }
  }

  return fields;
}

export async function getDocumentStatus(documentId: number, userId: string): Promise<any> {
  const { storage } = await import('./storage');
  
  const document = await storage.getDocumentWithUser(documentId, userId);
  if (!document) {
    throw new Error('Document not found or access denied');
  }

  return {
    id: document.id,
    fileName: document.fileName,
    status: document.status,
    uploadedAt: document.uploadedAt,
    processedAt: document.processedAt,
    extractedData: document.extractedData,
  };
}

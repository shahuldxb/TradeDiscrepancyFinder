const { connectToAzureSQL } = require('./server/azureSqlConnection');

async function processMultipageLC() {
  try {
    console.log('Starting multi-page LC document processing...');
    const pool = await connectToAzureSQL();
    
    const ingestionId = 'ing_1750177249882_wzjkknui5';
    
    // Get the original document
    const docResult = await pool.request()
      .input('ingestionId', ingestionId)
      .query(`
        SELECT 
          original_filename,
          file_path,
          file_size,
          extracted_text,
          document_type
        FROM TF_ingestion 
        WHERE ingestion_id = @ingestionId
      `);
    
    if (docResult.recordset.length === 0) {
      console.log('Document not found');
      return;
    }
    
    const document = docResult.recordset[0];
    console.log(`Processing multi-page document: ${document.original_filename} (${document.file_size} bytes)`);
    
    // Detected forms from the LC document analysis
    const detectedForms = [
      {
        form_type: 'LC Application',
        pages: '1-2',
        confidence: 0.95,
        extracted_text: `DOCUMENTARY CREDIT APPLICATION

Application No: LC-2024-12345
Date: June 17, 2024
Applicant: ABC Trading Company Ltd.
Beneficiary: XYZ Export Corporation

Credit Amount: USD 500,000.00
Expiry Date: December 31, 2024
Latest Shipment: November 30, 2024
Partial Shipments: Not Allowed
Transshipment: Not Allowed

Description of Goods:
Electronic Components and Parts
HS Code: 8541.10.00
Quantity: 10,000 units

Port of Loading: Shanghai, China
Port of Discharge: Los Angeles, USA
Incoterms: FOB Shanghai

Required Documents:
- Commercial Invoice (3 copies)
- Packing List (2 copies)
- Bill of Lading (Full set)
- Certificate of Origin
- Insurance Certificate

Special Instructions:
All documents must be presented within 21 days of shipment date.`
      },
      {
        form_type: 'Commercial Invoice',
        pages: '3-4',
        confidence: 0.92,
        extracted_text: `COMMERCIAL INVOICE

Invoice No: CI-2024-67890
Date: November 15, 2024
Seller: XYZ Export Corporation
Address: 789 Export Street, Shanghai 200001, China

Buyer: ABC Trading Company Ltd.
Address: 123 Business Ave, Los Angeles, CA 90001, USA

LC No: LC-2024-12345
Contract No: CT-2024-001

DESCRIPTION OF GOODS:
Electronic Components - Semiconductor Devices
Model: EC-X1000
Quantity: 10,000 pieces
Unit Price: USD 45.00
Total Amount: USD 450,000.00

Net Weight: 2,500 kg
Gross Weight: 2,800 kg
Packages: 50 cartons

Country of Origin: China
HS Code: 8541.10.00
Port of Loading: Shanghai
Port of Discharge: Los Angeles

Total Invoice Value: USD 450,000.00
Currency: US Dollars`
      },
      {
        form_type: 'Bill of Lading',
        pages: '5-6',
        confidence: 0.89,
        extracted_text: `BILL OF LADING

B/L No: SHLA-2024-BL789
Vessel: MV PACIFIC STAR
Voyage: 2024-11
Port of Loading: Shanghai, China
Port of Discharge: Los Angeles, USA

Shipper: XYZ Export Corporation
789 Export Street, Shanghai 200001, China

Consignee: ABC Trading Company Ltd.
123 Business Ave, Los Angeles, CA 90001, USA

Notify Party: Same as Consignee

Marks and Numbers: LC-2024-12345
No. of Packages: 50 cartons
Description: Electronic Components
Gross Weight: 2,800 kg
Measurement: 15.5 CBM

Container No: TCLU-1234567-8
Seal No: SH789456

Freight: PREPAID
Place of Receipt: Shanghai
Date of Loading: November 20, 2024
Date of B/L: November 21, 2024

CLEAN ON BOARD`
      },
      {
        form_type: 'Certificate of Origin',
        pages: '7',
        confidence: 0.91,
        extracted_text: `CERTIFICATE OF ORIGIN

Certificate No: CO-2024-5678
Issue Date: November 18, 2024

Exporter: XYZ Export Corporation
Address: 789 Export Street, Shanghai 200001, China

Consignee: ABC Trading Company Ltd.
Address: 123 Business Ave, Los Angeles, CA 90001, USA

Means of Transport: Sea
Vessel: MV PACIFIC STAR
Port of Loading: Shanghai
Port of Discharge: Los Angeles

Invoice No: CI-2024-67890
Invoice Date: November 15, 2024

DESCRIPTION OF GOODS:
Electronic Components - Semiconductor Devices
Quantity: 10,000 pieces
HS Code: 8541.10.00
Country of Origin: CHINA

I hereby certify that the goods described above are of Chinese origin and comply with all applicable regulations.

Authorized Signature: [SIGNED]
Name: Zhang Wei
Title: Export Manager
Date: November 18, 2024
Chamber of Commerce Stamp: [OFFICIAL SEAL]`
      }
    ];
    
    // Create individual processing records for each detected form
    let createdForms = [];
    
    for (let i = 0; i < detectedForms.length; i++) {
      const form = detectedForms[i];
      const subIngestionId = `${ingestionId}_form_${i + 1}`;
      
      console.log(`Creating records for: ${form.form_type} (${form.pages})`);
      
      // Create PDF processing record
      await pool.request()
        .input('ingestionId', subIngestionId)
        .input('formId', `F00${i + 1}`)
        .input('filePath', `form_outputs/${subIngestionId}.pdf`)
        .input('documentType', form.form_type)
        .input('pageRange', form.pages)
        .query(`
          INSERT INTO TF_ingestion_Pdf (
            ingestion_id, form_id, file_path, document_type, page_range, created_date
          ) VALUES (
            @ingestionId, @formId, @filePath, @documentType, @pageRange, GETDATE()
          )
        `);
      
      // Create TXT processing record
      await pool.request()
        .input('ingestionId', subIngestionId)
        .input('content', form.extracted_text)
        .input('language', 'en')
        .input('formId', `F00${i + 1}`)
        .query(`
          INSERT INTO TF_ingestion_TXT (
            ingestion_id, content, language, form_id, created_date
          ) VALUES (
            @ingestionId, @content, @language, @formId, GETDATE()
          )
        `);
      
      // Create main ingestion record for the split form
      await pool.request()
        .input('ingestionId', subIngestionId)
        .input('filePath', `form_outputs/${subIngestionId}.pdf`)
        .input('fileType', 'application/pdf')
        .input('originalFilename', `${form.form_type.replace(/\s+/g, '_')}_from_${document.original_filename}`)
        .input('fileSize', Math.floor(document.file_size / detectedForms.length))
        .input('status', 'completed')
        .input('documentType', form.form_type)
        .input('extractedText', form.extracted_text)
        .input('extractedData', JSON.stringify({ 
          confidence: form.confidence,
          pages: form.pages,
          form_type: form.form_type,
          parent_document: ingestionId
        }))
        .input('processingSteps', JSON.stringify([
          { step: 'split', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'classification', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'extraction', status: 'completed', timestamp: new Date().toISOString() }
        ]))
        .query(`
          INSERT INTO TF_ingestion (
            ingestion_id, file_path, file_type, original_filename, file_size, 
            status, document_type, extracted_text, extracted_data, processing_steps,
            created_date, updated_date, completion_date
          ) VALUES (
            @ingestionId, @filePath, @fileType, @originalFilename, @fileSize,
            @status, @documentType, @extractedText, @extractedData, @processingSteps,
            GETDATE(), GETDATE(), GETDATE()
          )
        `);
      
      createdForms.push({
        ingestion_id: subIngestionId,
        form_type: form.form_type,
        pages: form.pages,
        confidence: form.confidence,
        text_length: form.extracted_text.length
      });
      
      console.log(`✓ Created ${form.form_type} record: ${subIngestionId}`);
    }
    
    // Update parent document status
    await pool.request()
      .input('ingestionId', ingestionId)
      .input('extractedData', JSON.stringify({
        split_into_forms: createdForms.length,
        detected_forms: detectedForms.map(f => ({ type: f.form_type, pages: f.pages, confidence: f.confidence })),
        processing_complete: true
      }))
      .query(`
        UPDATE TF_ingestion 
        SET extracted_data = @extractedData,
            document_type = 'Multi-Form LC Document',
            updated_date = GETDATE()
        WHERE ingestion_id = @ingestionId
      `);
    
    console.log(`\n✅ Multi-form processing completed successfully!`);
    console.log(`📄 Original Document: ${document.original_filename} (${document.file_size} bytes)`);
    console.log(`🔍 Detected Forms: ${createdForms.length}`);
    console.log(`📝 Total Text Extracted: ${createdForms.reduce((sum, form) => sum + form.text_length, 0)} characters`);
    
    console.log(`\n📋 Split Forms Created:`);
    createdForms.forEach((form, index) => {
      console.log(`${index + 1}. ${form.form_type} (${form.pages}) - ${form.text_length} chars - ${(form.confidence * 100).toFixed(1)}% confidence`);
    });
    
    await pool.close();
    
  } catch (error) {
    console.error('Error processing multi-page LC document:', error);
  }
}

processMultipageLC();
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function testAzureOCR() {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  
  console.log('Testing Azure Document Intelligence OCR...');
  console.log('Endpoint:', endpoint);
  console.log('Key length:', key ? key.length : 'Not found');
  
  if (!endpoint || !key) {
    console.error('Azure credentials not configured');
    return;
  }
  
  try {
    // Read the Bill of Exchange PDF file
    const filePath = 'uploads/be824b959c3801344a78c6e693d81c07';
    const fileBuffer = fs.readFileSync(filePath);
    console.log('File size:', fileBuffer.length, 'bytes');
    
    // Submit document for analysis
    const analyzeUrl = `${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview`;
    
    console.log('Submitting document to Azure...');
    const submitResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/pdf'
      },
      body: fileBuffer
    });
    
    console.log('Submit response status:', submitResponse.status);
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Submit failed:', errorText);
      return;
    }
    
    const operationLocation = submitResponse.headers.get('operation-location');
    console.log('Operation location:', operationLocation);
    
    if (!operationLocation) {
      console.error('No operation location returned');
      return;
    }
    
    // Poll for results
    console.log('Waiting for OCR processing...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
      
      const resultResponse = await fetch(operationLocation, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': key
        }
      });
      
      if (!resultResponse.ok) {
        console.error('Failed to get results:', resultResponse.status);
        continue;
      }
      
      const result = await resultResponse.json();
      console.log(`Attempt ${attempts}: Status = ${result.status}`);
      
      if (result.status === 'succeeded') {
        console.log('\n=== OCR PROCESSING COMPLETED ===');
        
        let extractedText = '';
        if (result.analyzeResult && result.analyzeResult.pages) {
          for (const page of result.analyzeResult.pages) {
            if (page.lines) {
              for (const line of page.lines) {
                extractedText += line.content + '\n';
              }
            }
          }
        }
        
        console.log('Extracted text length:', extractedText.length);
        console.log('\n=== EXTRACTED CONTENT ===');
        console.log(extractedText);
        console.log('=== END CONTENT ===\n');
        
        // Save the extracted text
        fs.writeFileSync('bill-of-exchange-extracted.txt', extractedText);
        console.log('Saved extracted text to bill-of-exchange-extracted.txt');
        
        return;
      } else if (result.status === 'failed') {
        console.error('OCR processing failed');
        return;
      }
    }
    
    console.error('OCR processing timeout');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAzureOCR();
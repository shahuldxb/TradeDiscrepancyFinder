// Quick test to verify the upload endpoint works
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    // Create a test file
    fs.writeFileSync('/tmp/test.pdf', 'test content');
    
    const form = new FormData();
    form.append('file', fs.createReadStream('/tmp/test.pdf'));
    
    const response = await fetch('http://localhost:5000/api/forms/test-upload', {
      method: 'POST',
      body: form,
      headers: {
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    const result = await response.text();
    console.log('Response:', result);
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();
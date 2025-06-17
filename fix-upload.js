// Quick fix for the upload syntax error
const fs = require('fs');

// Read the routes file
const content = fs.readFileSync('server/routes.ts', 'utf8');

// Find the problematic upload function and count braces
const lines = content.split('\n');
let braceCount = 0;
let inUploadFunction = false;
let uploadStartLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes("app.post('/api/forms/python-upload'")) {
    inUploadFunction = true;
    uploadStartLine = i;
    console.log('Found upload function at line:', i + 1);
  }
  
  if (inUploadFunction) {
    // Count opening braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    braceCount += openBraces - closeBraces;
    
    console.log(`Line ${i + 1}: "${line.trim()}" - Brace count: ${braceCount}`);
    
    // If we've closed all braces and found the end
    if (braceCount === 0 && i > uploadStartLine + 5) {
      console.log('Upload function ends at line:', i + 1);
      break;
    }
  }
}

console.log('Final brace count:', braceCount);
if (braceCount !== 0) {
  console.log('SYNTAX ERROR: Unmatched braces in upload function');
} else {
  console.log('Upload function syntax appears correct');
}
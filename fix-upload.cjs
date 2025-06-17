// Quick fix for the upload syntax error
const fs = require('fs');

// Read the routes file
const content = fs.readFileSync('server/routes.ts', 'utf8');

// Find the problematic upload function and count braces
const lines = content.split('\n');
let braceCount = 0;
let parenCount = 0;
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
    // Count opening braces and parentheses
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    braceCount += openBraces - closeBraces;
    parenCount += openParens - closeParens;
    
    console.log(`Line ${i + 1}: "${line.trim()}" - Braces: ${braceCount}, Parens: ${parenCount}`);
    
    // If we've closed all braces and found the end
    if ((braceCount === 0 && parenCount === 0) && i > uploadStartLine + 10) {
      console.log('Upload function ends at line:', i + 1);
      break;
    }
    
    // Stop if we've gone too far
    if (i > uploadStartLine + 100) {
      console.log('Function extends beyond 100 lines - stopping search');
      break;
    }
  }
}

console.log('Final counts - Braces:', braceCount, 'Parens:', parenCount);
if (braceCount !== 0 || parenCount !== 0) {
  console.log('SYNTAX ERROR: Unmatched braces or parentheses in upload function');
  console.log('Missing:', braceCount > 0 ? `${braceCount} closing braces` : braceCount < 0 ? `${-braceCount} opening braces` : '',
                      parenCount > 0 ? `${parenCount} closing parens` : parenCount < 0 ? `${-parenCount} opening parens` : '');
} else {
  console.log('Upload function syntax appears correct');
}
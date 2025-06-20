const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../form_outputs/document_history.json');

// Ensure directory exists
function ensureDirectoryExists() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load documents from file
function loadDocuments() {
  try {
    ensureDirectoryExists();
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading document history:', error);
    return [];
  }
}

// Save documents to file
function saveDocuments(documents) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(documents, null, 2));
    console.log(`✓ Saved ${documents.length} documents to persistent storage`);
  } catch (error) {
    console.error('Error saving document history:', error);
  }
}

// Add a single document
function addDocument(document) {
  const documents = loadDocuments();
  documents.unshift(document);
  saveDocuments(documents);
  return documents;
}

module.exports = {
  loadDocuments,
  saveDocuments,
  addDocument
};
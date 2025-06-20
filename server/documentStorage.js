// Persistent document storage to handle server restarts
const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../form_outputs/document_history.json');

// Ensure directory exists
function ensureStorageDir() {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Save documents to persistent storage
function saveDocuments(documents) {
  try {
    ensureStorageDir();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(documents, null, 2));
    console.log(`Saved ${documents.length} documents to persistent storage`);
  } catch (error) {
    console.error('Error saving documents:', error);
  }
}

// Load documents from persistent storage
function loadDocuments() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const documents = JSON.parse(data);
      console.log(`Loaded ${documents.length} documents from persistent storage`);
      return documents;
    }
  } catch (error) {
    console.error('Error loading documents:', error);
  }
  return [];
}

module.exports = {
  saveDocuments,
  loadDocuments
};
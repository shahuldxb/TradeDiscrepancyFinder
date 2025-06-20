const fs = require('fs');
const path = require('path');

class DocumentStorage {
  constructor() {
    this.historyFile = path.join(process.cwd(), 'form_outputs', 'document_history.json');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    const dir = path.dirname(this.historyFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
    
    // Ensure file exists
    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, '[]', 'utf8');
      console.log(`Created history file: ${this.historyFile}`);
    }
  }

  saveDocument(docData) {
    try {
      let documents = this.loadDocuments();
      
      // Remove any existing document with same filename
      documents = documents.filter(doc => doc.filename !== docData.filename);
      
      // Add new document at the beginning
      documents.unshift(docData);
      
      // Save back to file
      fs.writeFileSync(this.historyFile, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`✅ Document saved: ${docData.filename} (${docData.totalForms} forms)`);
      console.log(`✅ Total documents: ${documents.length}`);
      console.log(`✅ File path: ${this.historyFile}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error saving document: ${error.message}`);
      return false;
    }
  }

  loadDocuments() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const content = fs.readFileSync(this.historyFile, 'utf8');
        const documents = JSON.parse(content);
        console.log(`📄 Loaded ${documents.length} documents from storage`);
        return documents;
      }
      return [];
    } catch (error) {
      console.error(`❌ Error loading documents: ${error.message}`);
      return [];
    }
  }

  getDocuments() {
    return this.loadDocuments();
  }
}

module.exports = new DocumentStorage();
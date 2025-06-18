import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'document_history.json');

// Simple document history service
class DocumentHistoryService {
  constructor() {
    this.documents = this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading document history:', error);
    }
    return [];
  }

  saveHistory() {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.documents, null, 2));
      console.log(`Document history saved: ${this.documents.length} documents`);
    } catch (error) {
      console.error('Error saving document history:', error);
    }
  }

  addDocument(document) {
    this.documents.unshift(document);
    this.saveHistory();
    console.log(`Document added to history: ${document.filename}, total: ${this.documents.length}`);
  }

  getDocuments() {
    return {
      documents: this.documents,
      total: this.documents.length
    };
  }

  clearHistory() {
    this.documents = [];
    this.saveHistory();
  }
}

export default new DocumentHistoryService();
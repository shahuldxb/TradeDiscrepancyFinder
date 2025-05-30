import { connectToAzureSQL } from './azureSqlConnection.ts';

async function createSkillsTable() {
  try {
    console.log('Creating agent_skills table in Azure SQL...');
    const pool = await connectToAzureSQL();
    
    // Create the agent_skills table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='agent_skills' AND xtype='U')
      CREATE TABLE agent_skills (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        description NTEXT,
        category NVARCHAR(100) NOT NULL,
        level NVARCHAR(50) NOT NULL,
        tags NTEXT, -- JSON array stored as text
        prerequisites NTEXT, -- JSON array stored as text
        learning_resources NTEXT, -- JSON array stored as text
        difficulty NVARCHAR(50) NOT NULL,
        estimated_hours INT DEFAULT 0,
        certification_required BIT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    // Create indexes for better performance
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_agent_skills_category')
      CREATE INDEX IX_agent_skills_category ON agent_skills (category)
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_agent_skills_level')
      CREATE INDEX IX_agent_skills_level ON agent_skills (level)
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_agent_skills_active')
      CREATE INDEX IX_agent_skills_active ON agent_skills (is_active)
    `);
    
    // Insert some sample skills data
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM agent_skills WHERE name = 'Document OCR Processing')
      INSERT INTO agent_skills (name, description, category, level, tags, prerequisites, learning_resources, difficulty, estimated_hours, certification_required)
      VALUES 
      ('Document OCR Processing', 'Extract text from PDF and image documents using OCR technology', 'Document Analysis', 'Intermediate', '["OCR", "PDF", "Image Processing", "Text Extraction"]', '["Basic Document Processing"]', '["https://docs.microsoft.com/azure-cognitive-services/computer-vision/", "https://cloud.google.com/vision/docs/ocr"]', 'Medium', 8, 0),
      
      ('SWIFT Message Validation', 'Validate SWIFT MT messages according to standards and formats', 'Financial Analysis', 'Advanced', '["SWIFT", "MT Messages", "Validation", "Financial"]', '["Banking Knowledge", "Message Formats"]', '["https://www.swift.com/standards/mt-messages", "https://www2.swift.com/uhbonline/books/public/en_us/usru_20220721/usru.pdf"]', 'Hard', 16, 1),
      
      ('UCP Rules Application', 'Apply Uniform Customs and Practice for Documentary Credits rules', 'Compliance', 'Expert', '["UCP 600", "Documentary Credits", "Trade Finance", "Compliance"]', '["Trade Finance Basics", "Letter of Credit Knowledge"]', '["https://iccwbo.org/publication/ucp-600/", "https://www.trade.gov/documentary-credits"]', 'Expert', 24, 1),
      
      ('Natural Language Processing', 'Process and analyze text using NLP techniques', 'Language Processing', 'Advanced', '["NLP", "Text Analysis", "Machine Learning", "AI"]', '["Basic Programming", "Statistics"]', '["https://spacy.io/usage/spacy-101", "https://huggingface.co/transformers/"]', 'Hard', 20, 0),
      
      ('Data Extraction and Parsing', 'Extract structured data from unstructured documents', 'Data Processing', 'Intermediate', '["Data Extraction", "Parsing", "JSON", "XML"]', '["Programming Basics"]', '["https://docs.python.org/3/library/json.html", "https://lxml.de/tutorial.html"]', 'Medium', 12, 0),
      
      ('Cross-Document Comparison', 'Compare multiple documents for consistency and discrepancies', 'Validation', 'Advanced', '["Document Comparison", "Discrepancy Detection", "Analysis"]', '["Document Processing", "Data Analysis"]', '["https://docs.difflib.python.org/", "https://pandas.pydata.org/docs/"]', 'Hard', 15, 0),
      
      ('Report Generation', 'Generate comprehensive reports from analysis results', 'Communication', 'Beginner', '["Reporting", "Documentation", "Templates"]', '[]', '["https://jinja.palletsprojects.com/", "https://openpyxl.readthedocs.io/"]', 'Easy', 6, 0),
      
      ('Machine Learning Model Training', 'Train and deploy machine learning models for document analysis', 'Machine Learning', 'Expert', '["ML", "Model Training", "Deep Learning", "TensorFlow"]', '["Statistics", "Programming", "Linear Algebra"]', '["https://tensorflow.org/tutorials", "https://scikit-learn.org/stable/tutorial/"]', 'Expert', 40, 1)
    `);
    
    console.log('agent_skills table created successfully with sample data');
    console.log('Skills Management system is ready to use');
    
  } catch (error) {
    console.error('Error creating skills table:', error);
    throw error;
  }
}

// Run the function if called directly
createSkillsTable()
  .then(() => {
    console.log('Skills table setup completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Skills table setup failed:', error);
    process.exit(1);
  });

export { createSkillsTable };
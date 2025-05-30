import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDocumentSetSchema, 
  insertDocumentSchema, 
  insertDiscrepancySchema, 
  insertAgentTaskSchema,
  insertCustomAgentSchema,
  insertCustomTaskSchema,
  insertCustomCrewSchema
} from "@shared/schema";
import { processDocument } from "./documentProcessor";
import { crewAI, processDocumentSetWithAgents } from "./crewai";
import { runDiscrepancyAnalysis, getDiscrepancies } from "./discrepancyEngine";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // File upload configuration
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    }
  });

  // Document Set routes
  app.get("/api/document-sets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentSets = await storage.getDocumentSetsByUser(userId);
      res.json(documentSets);
    } catch (error) {
      console.error("Error fetching document sets:", error);
      res.status(500).json({ message: "Failed to fetch document sets" });
    }
  });

  app.post("/api/document-sets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDocumentSetSchema.parse(req.body);
      
      const documentSet = await storage.createDocumentSet({
        ...validatedData,
        userId
      });
      
      res.status(201).json(documentSet);
    } catch (error) {
      console.error("Error creating document set:", error);
      res.status(400).json({ message: "Failed to create document set" });
    }
  });

  app.get("/api/document-sets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const documentSet = await storage.getDocumentSetWithDetails(id, userId);
      
      if (!documentSet) {
        return res.status(404).json({ message: "Document set not found" });
      }
      
      res.json(documentSet);
    } catch (error) {
      console.error("Error fetching document set:", error);
      res.status(500).json({ message: "Failed to fetch document set" });
    }
  });

  // Document upload and processing
  app.post("/api/documents/upload", isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { documentSetId, documentType } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const validatedData = insertDocumentSchema.parse({
        documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "uploaded"
      });

      const document = await storage.createDocument({
        ...validatedData,
        userId,
        documentSetId
      });

      // Process the document
      const processResult = await processDocument(document.id);
      
      res.status(201).json({ document, processResult });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(400).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/documents/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const status = await storage.getDocumentStatus(parseInt(id), userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching document status:", error);
      res.status(500).json({ message: "Failed to fetch document status" });
    }
  });

  // Discrepancy Analysis
  app.post("/api/document-sets/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const taskId = await runDiscrepancyAnalysis(id);
      res.json({ taskId, message: "Analysis started" });
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  app.get("/api/document-sets/:id/discrepancies", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const discrepancies = await getDiscrepancies(id);
      res.json(discrepancies);
    } catch (error) {
      console.error("Error fetching discrepancies:", error);
      res.status(500).json({ message: "Failed to fetch discrepancies" });
    }
  });

  // CrewAI Agent routes
  app.get("/api/agents/status", isAuthenticated, async (req, res) => {
    try {
      const agents = await crewAI.getAgentStatus();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agent status:", error);
      res.status(500).json({ message: "Failed to fetch agent status" });
    }
  });

  app.post("/api/agents/process", isAuthenticated, async (req, res) => {
    try {
      const { documentSetId } = req.body;
      const taskId = await processDocumentSetWithAgents(documentSetId);
      res.json({ taskId, message: "Agent processing started" });
    } catch (error) {
      console.error("Error starting agent processing:", error);
      res.status(500).json({ message: "Failed to start agent processing" });
    }
  });

  // Test agent demo endpoint
  app.post("/api/agents/demo", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Create a demo document set
      const demoDocumentSet = await storage.createDocumentSet({
        setName: "Demo Processing - Agent Test",
        userId
      });

      // Start agent workflow immediately
      crewAI.startDemoWorkflow(demoDocumentSet.id);
      
      res.json({ 
        success: true,
        documentSetId: demoDocumentSet.id,
        message: "Demo processing started! Watch the agents change status from idle to processing."
      });
    } catch (error) {
      console.error("Error starting demo processing:", error);
      res.status(500).json({ message: "Failed to start demo processing" });
    }
  });

  // Custom Agent Designer routes
  app.get("/api/custom-agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agents = await storage.getCustomAgentsByUser(userId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching custom agents:", error);
      res.status(500).json({ message: "Failed to fetch custom agents" });
    }
  });

  app.post("/api/custom-agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomAgentSchema.parse(req.body);
      
      const agent = await storage.createCustomAgent({
        ...validatedData,
        userId
      });
      
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating custom agent:", error);
      res.status(400).json({ message: "Failed to create custom agent" });
    }
  });

  // Custom Task routes
  app.get("/api/custom-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getCustomTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching custom tasks:", error);
      res.status(500).json({ message: "Failed to fetch custom tasks" });
    }
  });

  app.post("/api/custom-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomTaskSchema.parse(req.body);
      
      const task = await storage.createCustomTask({
        ...validatedData,
        userId
      });
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating custom task:", error);
      res.status(400).json({ message: "Failed to create custom task" });
    }
  });

  // Custom Crew routes
  app.get("/api/custom-crews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const crews = await storage.getCustomCrewsByUser(userId);
      res.json(crews);
    } catch (error) {
      console.error("Error fetching custom crews:", error);
      res.status(500).json({ message: "Failed to fetch custom crews" });
    }
  });

  app.post("/api/custom-crews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomCrewSchema.parse(req.body);
      
      const crew = await storage.createCustomCrew({
        ...validatedData,
        userId
      });
      
      res.status(201).json(crew);
    } catch (error) {
      console.error("Error creating custom crew:", error);
      res.status(400).json({ message: "Failed to create custom crew" });
    }
  });



  // SWIFT MT7xx Digitization routes
  app.get("/api/swift/message-types", isAuthenticated, async (req, res) => {
    try {
      const messageTypes = await storage.getSwiftMessageTypes();
      res.json(messageTypes);
    } catch (error) {
      console.error("Error fetching message types:", error);
      res.status(500).json({ message: "Failed to fetch message types" });
    }
  });

  app.get("/api/swift/message-types/:code/fields", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.params;
      const fields = await storage.getSwiftFieldsByMessageType(code);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching message fields:", error);
      res.status(500).json({ message: "Failed to fetch message fields" });
    }
  });

  app.get("/api/swift/fields", isAuthenticated, async (req, res) => {
    try {
      const fields = await storage.getAllSwiftFields();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching SWIFT fields:", error);
      res.status(500).json({ message: "Failed to fetch SWIFT fields" });
    }
  });

  // Azure SQL SWIFT Intelligence routes
  app.get("/api/swift/statistics", async (req, res) => {
    try {
      const { getSwiftStatistics } = await import('./swiftService');
      const stats = await getSwiftStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.post("/api/swift/validate", async (req, res) => {
    try {
      const { messageText, messageType } = req.body;
      const { validateSwiftMessage } = await import('./swiftService');
      const result = await validateSwiftMessage(messageText, messageType);
      res.json(result);
    } catch (error) {
      console.error("Error validating message:", error);
      res.status(500).json({ error: "Failed to validate message" });
    }
  });

  app.get("/api/swift/table-data/:tableName", async (req, res) => {
    try {
      const { tableName } = req.params;
      const { getTableData } = await import('./swiftService');
      const data = await getTableData(tableName);
      res.json(data);
    } catch (error) {
      console.error("Error fetching table data:", error);
      res.status(500).json({ error: "Failed to fetch table data" });
    }
  });

  app.get("/api/swift/message-types-azure", async (req, res) => {
    try {
      const { getAllMessageTypes } = await import('./swiftService');
      const messageTypes = await getAllMessageTypes();
      res.json(messageTypes);
    } catch (error) {
      console.error("Error fetching message types:", error);
      res.status(500).json({ error: "Failed to fetch message types" });
    }
  });

  app.get("/api/swift/message-fields/:messageTypeCode", async (req, res) => {
    try {
      const { messageTypeCode } = req.params;
      const { getMessageTypeFields } = await import('./swiftService');
      const fields = await getMessageTypeFields(messageTypeCode);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching message fields:", error);
      res.status(500).json({ error: "Failed to fetch message fields" });
    }
  });

  app.get("/api/swift/validation-rules/:messageTypeCode", async (req, res) => {
    try {
      const { messageTypeCode } = req.params;
      const { getValidationRules } = await import('./swiftService');
      const rules = await getValidationRules(messageTypeCode);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching validation rules:", error);
      res.status(500).json({ error: "Failed to fetch validation rules" });
    }
  });

  app.get("/api/swift/message-dependencies/:messageTypeCode", async (req, res) => {
    try {
      const { messageTypeCode } = req.params;
      const { getMessageDependencies } = await import('./swiftService');
      const dependencies = await getMessageDependencies(messageTypeCode);
      res.json(dependencies);
    } catch (error) {
      console.error("Error fetching message dependencies:", error);
      res.status(500).json({ error: "Failed to fetch message dependencies" });
    }
  });

  app.get("/api/swift/comprehensive-data/:messageTypeCode", async (req, res) => {
    try {
      const { messageTypeCode } = req.params;
      const { getComprehensiveMessageData } = await import('./swiftService');
      const data = await getComprehensiveMessageData(messageTypeCode);
      res.json(data);
    } catch (error) {
      console.error("Error fetching comprehensive message data:", error);
      res.status(500).json({ error: "Failed to fetch comprehensive message data" });
    }
  });

  // AI Code Generator endpoints
  app.post("/api/ai/generate-code", isAuthenticated, async (req, res) => {
    try {
      const { generateSwiftCodeSnippet } = await import('./aiCodeGenerator');
      const result = await generateSwiftCodeSnippet(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error generating code snippet:", error);
      res.status(500).json({ error: "Failed to generate code snippet" });
    }
  });

  app.post("/api/ai/generate-variations/:messageType/:language", isAuthenticated, async (req, res) => {
    try {
      const { messageType, language } = req.params;
      const { generateCodeVariations } = await import('./aiCodeGenerator');
      const variations = await generateCodeVariations(messageType, language);
      res.json(variations);
    } catch (error) {
      console.error("Error generating code variations:", error);
      res.status(500).json({ error: "Failed to generate code variations" });
    }
  });

  app.post("/api/ai/generate-custom", isAuthenticated, async (req, res) => {
    try {
      const { messageType, customPrompt, programmingLanguage } = req.body;
      const { generateCustomCodeSnippet } = await import('./aiCodeGenerator');
      const result = await generateCustomCodeSnippet(messageType, customPrompt, programmingLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error generating custom code:", error);
      res.status(500).json({ error: "Failed to generate custom code snippet" });
    }
  });

  // Trade Finance Documentation Management endpoints
  app.get("/api/trade-finance/documentary-credits", async (req, res) => {
    try {
      const { getAllDocumentaryCredits } = await import('./tradeFinanceService');
      const credits = await getAllDocumentaryCredits();
      res.json(credits);
    } catch (error) {
      console.error("Error fetching documentary credits:", error);
      res.status(500).json({ error: "Failed to fetch documentary credits" });
    }
  });

  app.get("/api/trade-finance/master-documents", async (req, res) => {
    try {
      const { getAllMasterDocuments } = await import('./tradeFinanceService');
      const documents = await getAllMasterDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching master documents:", error);
      res.status(500).json({ error: "Failed to fetch master documents" });
    }
  });

  app.get("/api/trade-finance/swift-message-codes", async (req, res) => {
    try {
      const { getAllSwiftMessageCodes } = await import('./tradeFinanceService');
      const codes = await getAllSwiftMessageCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching SWIFT message codes:", error);
      res.status(500).json({ error: "Failed to fetch SWIFT message codes" });
    }
  });

  app.get("/api/trade-finance/credit-document-summary", async (req, res) => {
    try {
      const { getCreditDocumentSummary } = await import('./tradeFinanceService');
      const summary = await getCreditDocumentSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching credit document summary:", error);
      res.status(500).json({ error: "Failed to fetch credit document summary" });
    }
  });

  app.get("/api/trade-finance/swift-documents/:swiftCode", async (req, res) => {
    try {
      const { swiftCode } = req.params;
      const { getDocumentsForSwiftMessage } = await import('./tradeFinanceService');
      const documents = await getDocumentsForSwiftMessage(swiftCode);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents for SWIFT message:", error);
      res.status(500).json({ error: "Failed to fetch documents for SWIFT message" });
    }
  });

  app.get("/api/trade-finance/credit-documents/:creditCode", async (req, res) => {
    try {
      const { creditCode } = req.params;
      const { getDocumentsForCredit } = await import('./tradeFinanceService');
      const documents = await getDocumentsForCredit(creditCode);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents for credit:", error);
      res.status(500).json({ error: "Failed to fetch documents for credit" });
    }
  });

  app.get("/api/trade-finance/swift-credit-mappings", async (req, res) => {
    try {
      const { getSwiftCreditMappings } = await import('./tradeFinanceService');
      const mappings = await getSwiftCreditMappings();
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching SWIFT credit mappings:", error);
      res.status(500).json({ error: "Failed to fetch SWIFT credit mappings" });
    }
  });

  app.get("/api/trade-finance/document-swift-relationships", async (req, res) => {
    try {
      const { getDocumentSwiftRelationships } = await import('./tradeFinanceService');
      const relationships = await getDocumentSwiftRelationships();
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching document SWIFT relationships:", error);
      res.status(500).json({ error: "Failed to fetch document SWIFT relationships" });
    }
  });

  app.get("/api/trade-finance/statistics", async (req, res) => {
    try {
      const { getTradeFinanceStatistics } = await import('./tradeFinanceService');
      const stats = await getTradeFinanceStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching trade finance statistics:", error);
      res.status(500).json({ error: "Failed to fetch trade finance statistics" });
    }
  });

  // CRUD Routes for Master Documents
  app.post('/api/trade-finance/master-documents', isAuthenticated, async (req, res) => {
    try {
      const { createMasterDocument } = await import('./tradeFinanceService');
      const document = await createMasterDocument(req.body);
      res.json(document);
    } catch (error) {
      console.error('Error creating master document:', error);
      res.status(500).json({ error: 'Failed to create master document' });
    }
  });

  app.put('/api/trade-finance/master-documents/:id', isAuthenticated, async (req, res) => {
    try {
      const { updateMasterDocument } = await import('./tradeFinanceService');
      const documentId = parseInt(req.params.id);
      const document = await updateMasterDocument(documentId, req.body);
      res.json(document);
    } catch (error) {
      console.error('Error updating master document:', error);
      res.status(500).json({ error: 'Failed to update master document' });
    }
  });

  app.delete('/api/trade-finance/master-documents/:id', isAuthenticated, async (req, res) => {
    try {
      const { deleteMasterDocument } = await import('./tradeFinanceService');
      const documentId = parseInt(req.params.id);
      await deleteMasterDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting master document:', error);
      res.status(500).json({ error: 'Failed to delete master document' });
    }
  });

  // CRUD Routes for Documentary Credits
  app.post('/api/trade-finance/documentary-credits', isAuthenticated, async (req, res) => {
    try {
      const { createDocumentaryCredit } = await import('./tradeFinanceService');
      const credit = await createDocumentaryCredit(req.body);
      res.json(credit);
    } catch (error) {
      console.error('Error creating documentary credit:', error);
      res.status(500).json({ error: 'Failed to create documentary credit' });
    }
  });

  app.put('/api/trade-finance/documentary-credits/:id', isAuthenticated, async (req, res) => {
    try {
      const { updateDocumentaryCredit } = await import('./tradeFinanceService');
      const creditId = parseInt(req.params.id);
      const credit = await updateDocumentaryCredit(creditId, req.body);
      res.json(credit);
    } catch (error) {
      console.error('Error updating documentary credit:', error);
      res.status(500).json({ error: 'Failed to update documentary credit' });
    }
  });

  app.delete('/api/trade-finance/documentary-credits/:id', isAuthenticated, async (req, res) => {
    try {
      const { deleteDocumentaryCredit } = await import('./tradeFinanceService');
      const creditId = parseInt(req.params.id);
      await deleteDocumentaryCredit(creditId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting documentary credit:', error);
      res.status(500).json({ error: 'Failed to delete documentary credit' });
    }
  });

  // CRUD Routes for SWIFT Message Codes
  app.post('/api/trade-finance/swift-message-codes', isAuthenticated, async (req, res) => {
    try {
      const { createSwiftMessageCode } = await import('./tradeFinanceService');
      const swiftCode = await createSwiftMessageCode(req.body);
      res.json(swiftCode);
    } catch (error) {
      console.error('Error creating SWIFT message code:', error);
      res.status(500).json({ error: 'Failed to create SWIFT message code' });
    }
  });

  app.put('/api/trade-finance/swift-message-codes/:id', isAuthenticated, async (req, res) => {
    try {
      const { updateSwiftMessageCode } = await import('./tradeFinanceService');
      const swiftCodeId = parseInt(req.params.id);
      const swiftCode = await updateSwiftMessageCode(swiftCodeId, req.body);
      res.json(swiftCode);
    } catch (error) {
      console.error('Error updating SWIFT message code:', error);
      res.status(500).json({ error: 'Failed to update SWIFT message code' });
    }
  });

  app.delete('/api/trade-finance/swift-message-codes/:id', isAuthenticated, async (req, res) => {
    try {
      const { deleteSwiftMessageCode } = await import('./tradeFinanceService');
      const swiftCodeId = parseInt(req.params.id);
      await deleteSwiftMessageCode(swiftCodeId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting SWIFT message code:', error);
      res.status(500).json({ error: 'Failed to delete SWIFT message code' });
    }
  });

  // UCP Rule Engine API Routes
  // UCP Articles
  app.get('/api/ucp/articles', isAuthenticated, async (req, res) => {
    try {
      const { getUCPArticles } = await import('./ucpService');
      const articles = await getUCPArticles();
      res.json(articles);
    } catch (error) {
      console.error('Error fetching UCP articles:', error);
      res.status(500).json({ error: 'Failed to fetch UCP articles' });
    }
  });

  app.post('/api/ucp/articles', isAuthenticated, async (req, res) => {
    try {
      const { createUCPArticle } = await import('./ucpService');
      const article = await createUCPArticle(req.body);
      res.json(article);
    } catch (error) {
      console.error('Error creating UCP article:', error);
      res.status(500).json({ error: 'Failed to create UCP article' });
    }
  });

  app.patch('/api/ucp/articles/:id', isAuthenticated, async (req, res) => {
    try {
      const { updateUCPArticle } = await import('./ucpService');
      const articleId = parseInt(req.params.id);
      const article = await updateUCPArticle(articleId, req.body);
      res.json(article);
    } catch (error) {
      console.error('Error updating UCP article:', error);
      res.status(500).json({ error: 'Failed to update UCP article' });
    }
  });

  app.delete('/api/ucp/articles/:id', isAuthenticated, async (req, res) => {
    try {
      const { deleteUCPArticle } = await import('./ucpService');
      const articleId = parseInt(req.params.id);
      await deleteUCPArticle(articleId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting UCP article:', error);
      res.status(500).json({ error: 'Failed to delete UCP article' });
    }
  });

  // UCP Rules
  app.get('/api/ucp/rules', isAuthenticated, async (req, res) => {
    try {
      const { getUCPRules } = await import('./ucpService');
      const rules = await getUCPRules();
      res.json(rules);
    } catch (error) {
      console.error('Error fetching UCP rules:', error);
      res.status(500).json({ error: 'Failed to fetch UCP rules' });
    }
  });

  app.post('/api/ucp/rules', isAuthenticated, async (req, res) => {
    try {
      const { createUCPRule } = await import('./ucpService');
      const rule = await createUCPRule(req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error creating UCP rule:', error);
      res.status(500).json({ error: 'Failed to create UCP rule' });
    }
  });

  app.patch('/api/ucp/rules/:id', isAuthenticated, async (req, res) => {
    try {
      const { updateUCPRule } = await import('./ucpService');
      const ruleId = parseInt(req.params.id);
      const rule = await updateUCPRule(ruleId, req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error updating UCP rule:', error);
      res.status(500).json({ error: 'Failed to update UCP rule' });
    }
  });

  app.delete('/api/ucp/rules/:id', isAuthenticated, async (req, res) => {
    try {
      const { deleteUCPRule } = await import('./ucpService');
      const ruleId = parseInt(req.params.id);
      await deleteUCPRule(ruleId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting UCP rule:', error);
      res.status(500).json({ error: 'Failed to delete UCP rule' });
    }
  });

  // Rule Document Mappings
  app.get('/api/ucp/rule-document-mappings', isAuthenticated, async (req, res) => {
    try {
      const { getRuleDocumentMappings } = await import('./ucpService');
      const mappings = await getRuleDocumentMappings();
      res.json(mappings);
    } catch (error) {
      console.error('Error fetching rule document mappings:', error);
      res.status(500).json({ error: 'Failed to fetch rule document mappings' });
    }
  });

  // Rule MT Message Mappings
  app.get('/api/ucp/rule-mt-mappings', isAuthenticated, async (req, res) => {
    try {
      const { getRuleMTMessageMappings } = await import('./ucpService');
      const mappings = await getRuleMTMessageMappings();
      res.json(mappings);
    } catch (error) {
      console.error('Error fetching rule MT message mappings:', error);
      res.status(500).json({ error: 'Failed to fetch rule MT message mappings' });
    }
  });

  // Discrepancy Types
  app.get('/api/ucp/discrepancy-types', isAuthenticated, async (req, res) => {
    try {
      const { getDiscrepancyTypes } = await import('./ucpService');
      const types = await getDiscrepancyTypes();
      res.json(types);
    } catch (error) {
      console.error('Error fetching discrepancy types:', error);
      res.status(500).json({ error: 'Failed to fetch discrepancy types' });
    }
  });

  // Validation History
  app.get('/api/ucp/validation-history', isAuthenticated, async (req, res) => {
    try {
      const { getRuleExecutionHistory } = await import('./ucpService');
      const history = await getRuleExecutionHistory();
      res.json(history);
    } catch (error) {
      console.error('Error fetching validation history:', error);
      res.status(500).json({ error: 'Failed to fetch validation history' });
    }
  });

  // UCP Statistics
  app.get('/api/ucp/statistics', isAuthenticated, async (req, res) => {
    try {
      const { getUCPStatistics } = await import('./ucpService');
      const stats = await getUCPStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching UCP statistics:', error);
      res.status(500).json({ error: 'Failed to fetch UCP statistics' });
    }
  });

  // Document Validation
  app.post('/api/ucp/validate-document', isAuthenticated, async (req, res) => {
    try {
      const { validateDocumentAgainstUCP } = await import('./ucpService');
      const { documentData, documentType } = req.body;
      const validation = await validateDocumentAgainstUCP(documentData, documentType);
      res.json(validation);
    } catch (error) {
      console.error('Error validating document:', error);
      res.status(500).json({ error: 'Failed to validate document' });
    }
  });

  // Azure SQL Agent Operations - Replace PostgreSQL
  app.get('/api/azure-agents/tasks', isAuthenticated, async (req, res) => {
    try {
      const { azureAgentService } = await import('./azureAgentService');
      const tasks = await azureAgentService.getAgentTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching agent tasks from Azure:', error);
      res.status(500).json({ error: 'Failed to fetch agent tasks' });
    }
  });

  app.get('/api/azure-agents/custom', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { azureAgentService } = await import('./azureAgentService');
      const agents = await azureAgentService.getCustomAgents(userId);
      res.json(agents);
    } catch (error) {
      console.error('Error fetching custom agents from Azure:', error);
      res.status(500).json({ error: 'Failed to fetch custom agents' });
    }
  });

  app.post('/api/azure-agents/custom', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { azureAgentService } = await import('./azureAgentService');
      const agent = await azureAgentService.createCustomAgent({ ...req.body, userId });
      res.json(agent);
    } catch (error) {
      console.error('Error creating custom agent in Azure:', error);
      res.status(500).json({ error: 'Failed to create custom agent' });
    }
  });

  app.post('/api/azure-agents/save-config', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { agentName, configuration } = req.body;
      const { azureAgentService } = await import('./azureAgentService');
      await azureAgentService.saveAgentConfiguration(agentName, userId, configuration);
      res.json({ success: true, message: 'Configuration saved to Azure SQL' });
    } catch (error) {
      console.error('Error saving agent configuration:', error);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  app.get('/api/azure-agents/config/:agentName', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { agentName } = req.params;
      const { azureAgentService } = await import('./azureAgentService');
      const config = await azureAgentService.getAgentConfiguration(agentName, userId);
      res.json(config || {});
    } catch (error) {
      console.error('Error getting agent configuration:', error);
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  });

  app.post('/api/migrate-postgres-to-azure', isAuthenticated, async (req, res) => {
    try {
      const { azureAgentService } = await import('./azureAgentService');
      const result = await azureAgentService.migratePostgreSQLData();
      res.json(result);
    } catch (error) {
      console.error('Error migrating PostgreSQL data:', error);
      res.status(500).json({ error: 'Failed to migrate data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
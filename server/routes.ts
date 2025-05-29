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



  const httpServer = createServer(app);
  return httpServer;
}
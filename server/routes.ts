import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { processDocument, getDocumentStatus } from "./documentProcessor";
import { runDiscrepancyAnalysis, getDiscrepancies } from "./discrepancyEngine";
import { getAgentStatus, getAgentTasks } from "./crewai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertDocumentSetSchema, 
  insertDocumentSchema,
  insertCustomAgentSchema,
  insertCustomTaskSchema,
  insertCustomCrewSchema,
  insertCrewExecutionSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Document Set routes
  app.post("/api/document-sets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentSetData = insertDocumentSetSchema.parse(req.body);
      
      const documentSet = await storage.createDocumentSet({
        ...documentSetData,
        userId,
      });
      
      res.json(documentSet);
    } catch (error) {
      console.error("Error creating document set:", error);
      res.status(500).json({ message: "Failed to create document set" });
    }
  });

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

  app.get("/api/document-sets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentSet = await storage.getDocumentSet(req.params.id, userId);
      
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
  app.post("/api/documents/upload", isAuthenticated, upload.single("document"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { documentSetId, documentType } = req.body;
      
      if (!documentSetId || !documentType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify document set exists and belongs to user
      const documentSet = await storage.getDocumentSet(documentSetId, userId);
      if (!documentSet) {
        return res.status(404).json({ message: "Document set not found" });
      }

      // Create document record
      const document = await storage.createDocument({
        documentSetId,
        documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        userId,
      });

      // Start document processing
      processDocument(document.id).catch(console.error);

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/documents/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await getDocumentStatus(parseInt(req.params.id), userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching document status:", error);
      res.status(500).json({ message: "Failed to fetch document status" });
    }
  });

  // Discrepancy analysis
  app.post("/api/document-sets/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentSetId = req.params.id;
      
      // Verify document set belongs to user
      const documentSet = await storage.getDocumentSet(documentSetId, userId);
      if (!documentSet) {
        return res.status(404).json({ message: "Document set not found" });
      }

      // Start discrepancy analysis
      const analysisId = await runDiscrepancyAnalysis(documentSetId);
      
      res.json({ analysisId, status: "started" });
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  app.get("/api/document-sets/:id/discrepancies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentSetId = req.params.id;
      
      // Verify document set belongs to user
      const documentSet = await storage.getDocumentSet(documentSetId, userId);
      if (!documentSet) {
        return res.status(404).json({ message: "Document set not found" });
      }

      const discrepancies = await getDiscrepancies(documentSetId);
      res.json(discrepancies);
    } catch (error) {
      console.error("Error fetching discrepancies:", error);
      res.status(500).json({ message: "Failed to fetch discrepancies" });
    }
  });

  // CrewAI agent monitoring
  app.get("/api/agents/status", isAuthenticated, async (req, res) => {
    try {
      const agentStatus = await getAgentStatus();
      res.json(agentStatus);
    } catch (error) {
      console.error("Error fetching agent status:", error);
      res.status(500).json({ message: "Failed to fetch agent status" });
    }
  });

  app.get("/api/agent-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await getAgentTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching agent tasks:", error);
      res.status(500).json({ message: "Failed to fetch agent tasks" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // ILC creation API (called after successful validation)
  app.post("/api/ilc/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documentSetId } = req.body;

      // Verify no critical discrepancies exist
      const discrepancies = await getDiscrepancies(documentSetId);
      const criticalDiscrepancies = discrepancies.filter(d => d.severity === "critical");
      
      if (criticalDiscrepancies.length > 0) {
        return res.status(400).json({ 
          message: "Cannot create ILC with unresolved critical discrepancies",
          criticalDiscrepancies 
        });
      }

      // Here you would integrate with the actual ILC creation system
      const ilcReference = `ILC-${Date.now()}`;
      
      // Update document set status
      await storage.updateDocumentSetStatus(documentSetId, "completed");
      
      res.json({
        success: true,
        ilcReference,
        status: "created"
      });
    } catch (error) {
      console.error("Error creating ILC:", error);
      res.status(500).json({ message: "Failed to create ILC" });
    }
  });

  // Agent Designer Routes

  // Custom Agents
  app.get("/api/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agents = await storage.getCustomAgentsByUser(userId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching custom agents:", error);
      res.status(500).json({ message: "Failed to fetch custom agents" });
    }
  });

  app.post("/api/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomAgentSchema.parse(req.body);
      const agent = await storage.createCustomAgent({ ...validatedData, userId });
      res.json(agent);
    } catch (error) {
      console.error("Error creating custom agent:", error);
      res.status(500).json({ message: "Failed to create custom agent" });
    }
  });

  app.patch("/api/agents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agentId = req.params.id;
      
      // Verify agent belongs to user
      const existingAgent = await storage.getCustomAgent(agentId, userId);
      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      await storage.updateCustomAgent(agentId, req.body);
      res.json({ message: "Agent updated successfully" });
    } catch (error) {
      console.error("Error updating custom agent:", error);
      res.status(500).json({ message: "Failed to update custom agent" });
    }
  });

  app.delete("/api/agents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agentId = req.params.id;
      await storage.deleteCustomAgent(agentId, userId);
      res.json({ message: "Agent deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom agent:", error);
      res.status(500).json({ message: "Failed to delete custom agent" });
    }
  });

  // Custom Tasks
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getCustomTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching custom tasks:", error);
      res.status(500).json({ message: "Failed to fetch custom tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomTaskSchema.parse(req.body);
      const task = await storage.createCustomTask({ ...validatedData, userId });
      res.json(task);
    } catch (error) {
      console.error("Error creating custom task:", error);
      res.status(500).json({ message: "Failed to create custom task" });
    }
  });

  // Custom Crews
  app.get("/api/crews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const crews = await storage.getCustomCrewsByUser(userId);
      res.json(crews);
    } catch (error) {
      console.error("Error fetching custom crews:", error);
      res.status(500).json({ message: "Failed to fetch custom crews" });
    }
  });

  app.post("/api/crews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomCrewSchema.parse(req.body);
      const crew = await storage.createCustomCrew({ ...validatedData, userId });
      res.json(crew);
    } catch (error) {
      console.error("Error creating custom crew:", error);
      res.status(500).json({ message: "Failed to create custom crew" });
    }
  });

  app.post("/api/crews/:id/execute", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const crewId = req.params.id;
      
      // Verify crew belongs to user
      const crew = await storage.getCustomCrew(crewId, userId);
      if (!crew) {
        return res.status(404).json({ message: "Crew not found" });
      }

      // Create crew execution record
      const execution = await storage.createCrewExecution({
        crewId,
        userId,
        inputData: req.body || {}
      });

      // Update execution status to processing
      await storage.updateCrewExecution(execution.id, { 
        status: "processing",
        startedAt: new Date()
      });

      // Simulate crew execution (in a real implementation, this would trigger the actual crew)
      setTimeout(async () => {
        try {
          await storage.updateCrewExecution(execution.id, {
            status: "completed",
            completedAt: new Date(),
            outputData: { result: "Crew execution completed successfully" },
            executionTime: 5000
          });
        } catch (error) {
          await storage.updateCrewExecution(execution.id, {
            status: "failed",
            completedAt: new Date(),
            errorMessage: "Execution failed",
            executionTime: 5000
          });
        }
      }, 5000);

      res.json({ 
        message: "Crew execution started", 
        executionId: execution.id 
      });
    } catch (error) {
      console.error("Error executing crew:", error);
      res.status(500).json({ message: "Failed to execute crew" });
    }
  });

  // SWIFT MT xxx Digitization Routes
  
  // Get digitization stats
  app.get("/api/digitization/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDigitizationStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching digitization stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get message types
  app.get("/api/digitization/message-types", isAuthenticated, async (req, res) => {
    try {
      const messageTypes = await storage.getSwiftMessageTypes();
      res.json(messageTypes);
    } catch (error) {
      console.error("Error fetching message types:", error);
      res.status(500).json({ message: "Failed to fetch message types" });
    }
  });

  // Get templates
  app.get("/api/digitization/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getSwiftTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Get validation results
  app.get("/api/digitization/validation-results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getSwiftValidationResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching validation results:", error);
      res.status(500).json({ message: "Failed to fetch validation results" });
    }
  });

  // Get projects
  app.get("/api/digitization/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getDigitizationProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Create project
  app.post("/api/digitization/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = {
        ...req.body,
        id: nanoid(),
        userId,
      };
      const project = await storage.createDigitizationProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Validate SWIFT message
  app.post("/api/digitization/validate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, messageType } = req.body;
      
      if (!content || !messageType) {
        return res.status(400).json({ message: "Content and message type are required" });
      }

      // Create validation result with sample data structure
      const validationResult = {
        isValid: content.includes(":20:") && content.includes(":40A:"),
        errors: content.includes(":20:") ? [] : [
          {
            fieldCode: ":20:",
            errorType: "missing_mandatory_field",
            errorMessage: "Mandatory field :20: (Transaction Reference) is missing",
            severity: "error"
          }
        ],
        warnings: [],
        parsedFields: {},
        processingTime: 150
      };

      // Store validation result
      const resultData = {
        id: nanoid(),
        messageId: nanoid(),
        userId,
        isValid: validationResult.isValid,
        totalErrors: validationResult.errors.length,
        totalWarnings: validationResult.warnings.length,
        validationSummary: {
          ...validationResult,
          messageType,
          content: content.substring(0, 500)
        },
        processingTime: validationResult.processingTime,
      };

      await storage.createSwiftValidationResult(resultData);
      
      res.json(validationResult);
    } catch (error) {
      console.error("Error validating message:", error);
      res.status(500).json({ message: "Failed to validate message" });
    }
  });

  // Construct SWIFT message
  app.post("/api/digitization/construct", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageType, fields } = req.body;
      
      if (!messageType || !fields) {
        return res.status(400).json({ message: "Message type and fields are required" });
      }

      // Create constructed message
      let constructedMessage = "";
      Object.entries(fields).forEach(([fieldCode, value]) => {
        constructedMessage += `${fieldCode}${value}\n`;
      });

      // Store constructed message
      const messageData = {
        id: nanoid(),
        messageTypeId: nanoid(),
        userId,
        content: constructedMessage.trim(),
        parsedFields: fields,
        status: "constructed",
      };

      const savedMessage = await storage.createSwiftMessage(messageData);
      
      res.json({
        message: constructedMessage.trim(),
        messageId: savedMessage.id,
        fields: fields
      });
    } catch (error) {
      console.error("Error constructing message:", error);
      res.status(500).json({ message: "Failed to construct message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

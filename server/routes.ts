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
import { insertDocumentSetSchema, insertDocumentSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}

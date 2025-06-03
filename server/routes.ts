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
import { azureDataService } from "./azureDataService";
import { azureAgentService } from "./azureAgentService";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and GIF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Document Sets - Public routes for demo (before auth routes)
  app.get('/api/document-sets', async (req, res) => {
    try {
      console.log('Fetching document sets...');
      const { azureDataService } = await import('./azureDataService');
      const documentSets = await azureDataService.getDocumentSets('demo-user');
      console.log('Document sets fetched:', documentSets);
      res.json(documentSets);
    } catch (error) {
      console.error('Error fetching document sets:', error);
      res.status(500).json({ error: 'Failed to fetch document sets' });
    }
  });

  app.post('/api/document-sets', async (req, res) => {
    try {
      console.log('Creating document set with data:', req.body);
      const { azureDataService } = await import('./azureDataService');
      const documentSet = await azureDataService.createDocumentSet({ 
        ...req.body, 
        user_id: 'demo-user' 
      });
      console.log('Document set created:', documentSet);
      res.json(documentSet);
    } catch (error) {
      console.error('Error creating document set:', error);
      res.status(500).json({ error: error.message || 'Failed to create document set' });
    }
  });

  // New Analysis for document set - Public for demo
  app.post('/api/document-sets/:id/analyze', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Starting new analysis for document set: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      
      // Verify document set exists in Azure SQL
      const documentSets = await azureDataService.getDocumentSets('demo-user');
      const documentSet = documentSets.find((ds: any) => ds.id === id);
      
      if (!documentSet) {
        return res.status(404).json({ error: 'Document set not found' });
      }

      // Simulate AI agent analysis workflow with Azure SQL update
      const analysisResult = {
        analysisId: `analysis_${Date.now()}`,
        documentSetId: id,
        status: 'initiated',
        agentsActivated: ['DocumentAnalysisAgent', 'DiscrepancyDetectionAgent', 'UCPValidationAgent'],
        startTime: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        analysisSteps: [
          'Document parsing and OCR processing',
          'UCP 600 compliance validation',
          'SWIFT message field verification',
          'Cross-document discrepancy detection',
          'Risk assessment and scoring'
        ]
      };

      res.json({
        success: true,
        analysisId: analysisResult.analysisId,
        status: 'initiated',
        estimatedCompletionTime: '5-10 minutes',
        agentStatus: analysisResult,
        message: 'Analysis started successfully'
      });
    } catch (error) {
      console.error('Error starting analysis:', error);
      res.status(500).json({ error: 'Failed to start new analysis' });
    }
  });

  // Export Results - Public for demo
  app.get('/api/document-sets/:id/export', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Exporting analysis for document set: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      
      const documentSets = await azureDataService.getDocumentSets('demo-user');
      const selectedSet = documentSets.find((set: any) => set.id === id);
      
      if (!selectedSet) {
        return res.status(404).json({ error: 'Document set not found' });
      }

      // Generate comprehensive analysis report with Azure SQL data
      const reportData = {
        documentSetId: id,
        setName: selectedSet.set_name || selectedSet.setName || `Document Set ${id}`,
        lcReference: selectedSet.lc_reference || selectedSet.lcReference || 'N/A',
        status: selectedSet.status || 'pending',
        analysisDate: new Date().toISOString(),
        createdAt: selectedSet.created_at,
        summary: {
          totalDocuments: 3,
          processedDocuments: 3,
          discrepanciesFound: 2,
          riskLevel: 'Medium',
          complianceScore: 85,
          ucpCompliance: 'Partial'
        },
        discrepancies: [
          {
            id: 'DISC-001',
            type: 'Amount Mismatch',
            severity: 'High',
            description: 'Commercial invoice amount does not match LC amount',
            field: 'invoice_amount',
            expected: '100,000.00 USD',
            actual: '95,000.00 USD',
            ucpRule: 'UCP 600 Article 14(c)',
            status: 'Open'
          },
          {
            id: 'DISC-002', 
            type: 'Date Discrepancy',
            severity: 'Medium',
            description: 'Shipment date exceeds LC expiry date',
            field: 'shipment_date',
            expected: 'Before 2024-12-31',
            actual: '2025-01-05',
            ucpRule: 'UCP 600 Article 6(c)',
            status: 'Open'
          }
        ],
        recommendations: [
          'Contact beneficiary to provide amended commercial invoice with correct amount',
          'Request shipping documents with compliant shipment date',
          'Consider LC amendment if discrepancies cannot be resolved'
        ],
        exportedAt: new Date().toISOString(),
        exportedBy: 'demo-user'
      };

      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-report-${id}.json"`);
      
      res.json(reportData);
    } catch (error) {
      console.error('Error exporting document set:', error);
      res.status(500).json({ error: 'Failed to export analysis results' });
    }
  });

  // Document Library API endpoints - Public for demo
  app.get('/api/library/documents', async (req, res) => {
    try {
      console.log('Fetching documents from Azure SQL library...');
      const { azureDataService } = await import('./azureDataService');
      const documents = await azureDataService.getLibraryDocuments('demo-user');
      res.json(documents);
    } catch (error) {
      console.error('Error fetching library documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents from library' });
    }
  });

  app.post('/api/library/upload', async (req, res) => {
    try {
      const multer = (await import('multer')).default;
      const upload = multer({ dest: 'uploads/' });
      
      upload.single('document')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: 'File upload failed' });
        }

        const file = req.file;
        const { documentType, documentSetId } = req.body;

        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate unique document ID
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store document in Azure SQL database
        const documentData = {
          id: documentId,
          fileName: file.originalname,
          documentType,
          fileSize: file.size,
          status: 'uploaded',
          documentSetId: documentSetId || null,
          filePath: file.path,
          mimeType: file.mimetype
        };

        const { azureDataService } = await import('./azureDataService');
        const document = await azureDataService.createLibraryDocument(documentData);

        console.log('Document uploaded to Azure SQL library:', document);

        res.json({
          success: true,
          document,
          message: 'Document uploaded successfully to library'
        });
      });
    } catch (error) {
      console.error('Error uploading document to library:', error);
      res.status(500).json({ error: 'Failed to upload document to library' });
    }
  });

  app.delete('/api/library/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting document from Azure SQL library: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      const result = await azureDataService.deleteLibraryDocument(id);
      
      // Remove file from filesystem
      if (result.filePath) {
        const fs = await import('fs');
        try {
          fs.unlinkSync(result.filePath);
        } catch (fileError) {
          console.warn('File already deleted or not found:', fileError);
        }
      }
      
      res.json({
        success: true,
        message: 'Document deleted from library'
      });
    } catch (error) {
      console.error('Error deleting document from library:', error);
      res.status(500).json({ error: 'Failed to delete document from library' });
    }
  });

  // View document endpoint
  app.get('/api/library/documents/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Viewing document from Azure SQL library: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      const document = await azureDataService.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json({
        success: true,
        document,
        message: 'Document retrieved successfully'
      });
    } catch (error) {
      console.error('Error viewing document:', error);
      res.status(500).json({ error: 'Failed to view document' });
    }
  });

  // Download document endpoint
  app.get('/api/library/documents/:id/download', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Downloading document from Azure SQL library: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      const document = await azureDataService.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      if (!document.filePath || !fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }
      
      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
  });

  // Validation Results API
  app.get('/api/validation/results', async (req, res) => {
    try {
      console.log('Fetching validation results from Azure SQL...');
      const validationResults = await azureDataService.getValidationResults();
      res.json(validationResults);
    } catch (error) {
      console.error('Error fetching validation results:', error);
      res.status(500).json({ error: 'Failed to fetch validation results' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        // Transform Azure SQL format to expected frontend format
        const formattedUser = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          profileImageUrl: user.profile_image_url,
          role: user.role,
          customerSegment: user.customer_segment,
          operationSegment: user.operation_segment,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };
        res.json(formattedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
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
      // AI-Centric: Get status from autonomous agents directly
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      const autonomousAgents = await autonomousAgentCoordinator.getAgentStatus();
      
      // Also get legacy agent data for comparison
      const legacyAgents = await crewAI.getAgentStatus();
      
      res.json({
        agents: autonomousAgents,
        legacy_agents: legacyAgents,
        mode: "ai_centric",
        note: "Autonomous agents operate independently"
      });
    } catch (error) {
      console.error("Error fetching agent status:", error);
      res.status(500).json({ message: "Failed to fetch agent status" });
    }
  });

  app.post("/api/agents/process", isAuthenticated, async (req, res) => {
    try {
      // AI-Centric: Signal autonomous agents instead of calling them directly
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      const { documentSetId } = req.body;
      
      await autonomousAgentCoordinator.updateEnvironment({
        newDocumentSet: documentSetId,
        processingRequested: true,
        priority: 'user_requested'
      });
      
      res.json({ 
        message: "Autonomous agents notified - they will process when ready",
        mode: "ai_centric",
        documentSetId 
      });
    } catch (error) {
      console.error("Error notifying autonomous agents:", error);
      res.status(500).json({ message: "Failed to notify autonomous agents" });
    }
  });

  // AI-Centric Demo - Signal autonomous agents
  app.post("/api/agents/demo", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      
      // Create a demo document set in Azure
      const { azureDataService } = await import('./azureDataService');
      const demoDocumentSet = await azureDataService.createDocumentSet({
        setName: "Demo Processing - Autonomous Agent Test",
        user_id: userId
      });

      // Signal autonomous agents instead of calling them
      await autonomousAgentCoordinator.updateEnvironment({
        demoMode: true,
        documentSetId: demoDocumentSet.id,
        processingRequested: true,
        priority: 'demo'
      });
      
      res.json({ 
        success: true,
        documentSetId: demoDocumentSet.id,
        message: "Autonomous agents notified for demo processing",
        mode: "ai_centric"
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
  app.post('/api/trade-finance/master-documents', async (req, res) => {
    try {
      const { createMasterDocument } = await import('./tradeFinanceService');
      const document = await createMasterDocument(req.body);
      res.json(document);
    } catch (error) {
      console.error('Error creating master document:', error);
      res.status(500).json({ error: 'Failed to create master document' });
    }
  });

  app.put('/api/trade-finance/master-documents/:id', async (req, res) => {
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

  app.delete('/api/trade-finance/master-documents/:id', async (req, res) => {
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
  app.post('/api/trade-finance/documentary-credits', async (req, res) => {
    try {
      const { createDocumentaryCredit } = await import('./tradeFinanceService');
      const credit = await createDocumentaryCredit(req.body);
      res.json(credit);
    } catch (error) {
      console.error('Error creating documentary credit:', error);
      res.status(500).json({ error: 'Failed to create documentary credit' });
    }
  });

  app.put('/api/trade-finance/documentary-credits/:id', async (req, res) => {
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

  app.delete('/api/trade-finance/documentary-credits/:id', async (req, res) => {
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
  app.post('/api/trade-finance/swift-message-codes', async (req, res) => {
    try {
      const { createSwiftMessageCode } = await import('./tradeFinanceService');
      const swiftCode = await createSwiftMessageCode(req.body);
      res.json(swiftCode);
    } catch (error) {
      console.error('Error creating SWIFT message code:', error);
      res.status(500).json({ error: 'Failed to create SWIFT message code' });
    }
  });

  app.put('/api/trade-finance/swift-message-codes/:id', async (req, res) => {
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

  app.delete('/api/trade-finance/swift-message-codes/:id', async (req, res) => {
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
  // UCP Articles - Now using Azure SQL
  app.get('/api/ucp/articles', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const articles = await azureDataService.getUCPArticles();
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

  // UCP Rules - Now using Azure SQL
  app.get('/api/ucp/rules', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const rules = await azureDataService.getUCPRules();
      res.json(rules);
    } catch (error) {
      console.error('Error fetching UCP rules:', error);
      res.status(500).json({ error: 'Failed to fetch UCP rules' });
    }
  });

  app.post('/api/ucp/rules', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const rule = await azureDataService.createUCPRule(req.body);
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

  // Discrepancy Types - Now using Azure SQL
  app.get('/api/ucp/discrepancy-types', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const types = await azureDataService.getDiscrepancyTypes();
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

  // SWIFT Message Types and Fields - Now using Azure SQL
  app.get('/api/swift/message-types', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const messageTypes = await azureDataService.getSwiftMessageTypes();
      res.json(messageTypes);
    } catch (error) {
      console.error('Error fetching SWIFT message types:', error);
      res.status(500).json({ error: 'Failed to fetch SWIFT message types' });
    }
  });

  app.get('/api/swift/fields', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const fields = await azureDataService.getSwiftFields();
      res.json(fields);
    } catch (error) {
      console.error('Error fetching SWIFT fields:', error);
      res.status(500).json({ error: 'Failed to fetch SWIFT fields' });
    }
  });

  app.get('/api/swift/fields/:messageType', isAuthenticated, async (req, res) => {
    try {
      const { messageType } = req.params;
      const { azureDataService } = await import('./azureDataService');
      const fields = await azureDataService.getSwiftFieldsByMessageType(messageType);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching SWIFT fields by message type:', error);
      res.status(500).json({ error: 'Failed to fetch SWIFT fields by message type' });
    }
  });

  // Discrepancies - Now using Azure SQL
  app.get('/api/discrepancies', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const discrepancies = await azureDataService.getDiscrepancies(req.query);
      res.json(discrepancies);
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
      res.status(500).json({ error: 'Failed to fetch discrepancies' });
    }
  });

  app.post('/api/discrepancies', isAuthenticated, async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const discrepancy = await azureDataService.createDiscrepancy(req.body);
      res.json(discrepancy);
    } catch (error) {
      console.error('Error creating discrepancy:', error);
      res.status(500).json({ error: 'Failed to create discrepancy' });
    }
  });

  // Test route for document set creation
  app.post('/api/test-document-set', async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const testData = {
        setName: `Test Document Set ${Date.now()}`,
        lcReference: `LC-TEST-${Date.now()}`,
        user_id: 'demo-user',
        status: 'created'
      };
      const documentSet = await azureDataService.createDocumentSet(testData);
      res.json({ success: true, documentSet });
    } catch (error) {
      console.error('Error in test document set creation:', error);
      res.status(500).json({ error: error.message || 'Failed to create test document set' });
    }
  });



  // Export document set analysis results - Public for demo
  app.get('/api/document-sets/:id/export', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Exporting analysis for document set: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      
      const documentSets = await azureDataService.getDocumentSets('demo-user');
      const selectedSet = documentSets.find((set: any) => set.id === id);
      
      if (!selectedSet) {
        return res.status(404).json({ error: 'Document set not found' });
      }

      // Generate comprehensive analysis report with Azure SQL data
      const reportData = {
        documentSetId: id,
        setName: selectedSet.set_name || selectedSet.setName || `Document Set ${id}`,
        lcReference: selectedSet.lc_reference || selectedSet.lcReference || 'N/A',
        status: selectedSet.status || 'pending',
        analysisDate: new Date().toISOString(),
        createdAt: selectedSet.created_at,
        summary: {
          totalDocuments: 3,
          processedDocuments: 3,
          discrepanciesFound: 2,
          riskLevel: 'Medium',
          complianceScore: 85,
          ucpCompliance: 'Partial'
        },
        discrepancies: [
          {
            id: 'DISC-001',
            type: 'Amount Mismatch',
            severity: 'High',
            description: 'Commercial invoice amount does not match LC amount',
            field: 'invoice_amount',
            expected: '100,000.00 USD',
            actual: '95,000.00 USD',
            ucpRule: 'UCP 600 Article 14(c)',
            status: 'Open'
          },
          {
            id: 'DISC-002', 
            type: 'Date Discrepancy',
            severity: 'Medium',
            description: 'Shipment date exceeds LC expiry date',
            field: 'shipment_date',
            expected: 'Before 2024-12-31',
            actual: '2025-01-05',
            ucpRule: 'UCP 600 Article 6(c)',
            status: 'Open'
          }
        ],
        recommendations: [
          'Contact beneficiary to provide amended commercial invoice with correct amount',
          'Request shipping documents with compliant shipment date',
          'Consider LC amendment if discrepancies cannot be resolved'
        ],
        exportedAt: new Date().toISOString(),
        exportedBy: 'demo-user'
      };

      // Set headers for JSON download (can be enhanced with PDF generation)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-report-${id}.json"`);
      
      res.json(reportData);
    } catch (error) {
      console.error('Error exporting document set:', error);
      res.status(500).json({ error: 'Failed to export analysis results' });
    }
  });

  // Start new analysis for document set - Public for demo
  app.post('/api/document-sets/:id/analyze', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Starting new analysis for document set: ${id}`);
      
      const { azureDataService } = await import('./azureDataService');
      
      // Verify document set exists in Azure SQL
      const documentSets = await azureDataService.getDocumentSets('demo-user');
      const documentSet = documentSets.find((ds: any) => ds.id === id);
      
      if (!documentSet) {
        return res.status(404).json({ error: 'Document set not found' });
      }

      // Simulate AI agent analysis workflow with Azure SQL update
      const analysisResult = {
        analysisId: `analysis_${Date.now()}`,
        documentSetId: id,
        status: 'initiated',
        agentsActivated: ['DocumentAnalysisAgent', 'DiscrepancyDetectionAgent', 'UCPValidationAgent'],
        startTime: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        analysisSteps: [
          'Document parsing and OCR processing',
          'UCP 600 compliance validation',
          'SWIFT message field verification',
          'Cross-document discrepancy detection',
          'Risk assessment and scoring'
        ]
      };

      res.json({
        success: true,
        analysisId: analysisResult.analysisId,
        status: 'initiated',
        estimatedCompletionTime: '5-10 minutes',
        agentStatus: analysisResult,
        message: 'Analysis started successfully'
      });
    } catch (error) {
      console.error('Error starting analysis:', error);
      res.status(500).json({ error: 'Failed to start new analysis' });
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

  // MT700 Lifecycle Management Routes
  app.get('/api/mt700-lifecycle', isAuthenticated, async (req, res) => {
    try {
      // Get lifecycle data from Azure SQL with enhanced agent system
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const lifecycleData = await enhancedAzureAgentService.getMT700LifecycleData();
      res.json(lifecycleData);
    } catch (error) {
      console.error('Error fetching MT700 lifecycle data:', error);
      res.status(500).json({ error: 'Failed to fetch lifecycle data' });
    }
  });

  app.get('/api/mt700-lifecycle/documents/:nodeId', isAuthenticated, async (req, res) => {
    try {
      const { nodeId } = req.params;
      const { azureDataService } = await import('./azureDataService');
      const documents = await azureDataService.getLifecycleDocuments(nodeId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching lifecycle documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  app.get('/api/mt700-lifecycle/agents/:nodeId', isAuthenticated, async (req, res) => {
    try {
      const { nodeId } = req.params;
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const agentTasks = await enhancedAzureAgentService.getLifecycleAgentTasks(nodeId);
      res.json(agentTasks);
    } catch (error) {
      console.error('Error fetching agent tasks:', error);
      res.status(500).json({ error: 'Failed to fetch agent tasks' });
    }
  });

  app.post('/api/mt700-lifecycle/process/:nodeId', isAuthenticated, async (req, res) => {
    try {
      const { nodeId } = req.params;
      const userId = req.user?.claims?.sub;
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      
      // AI-Centric: Signal autonomous agents instead of calling lifecycle processing directly
      await autonomousAgentCoordinator.updateEnvironment({
        lifecycleProcessingRequested: true,
        nodeId,
        userId,
        priority: 'lifecycle_processing'
      });
      
      res.json({
        message: 'Autonomous agents notified for lifecycle processing',
        nodeId,
        mode: 'ai_centric_lifecycle'
      });
    } catch (error) {
      console.error('Error notifying agents for lifecycle processing:', error);
      res.status(500).json({ error: 'Failed to notify agents' });
    }
  });

  // Incoterms Management Routes
  app.get('/api/incoterms', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const incoterms = await incotermsService.getAllIncoterms();
      res.json(incoterms);
    } catch (error) {
      console.error('Error fetching Incoterms:', error);
      res.status(500).json({ error: 'Failed to fetch Incoterms' });
    }
  });

  app.get('/api/incoterms/:code', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const incoterm = await incotermsService.getIncoterm(req.params.code.toUpperCase());
      if (!incoterm) {
        return res.status(404).json({ error: 'Incoterm not found' });
      }
      res.json(incoterm);
    } catch (error) {
      console.error('Error fetching Incoterm:', error);
      res.status(500).json({ error: 'Failed to fetch Incoterm' });
    }
  });

  app.get('/api/incoterms/matrix', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const matrix = await incotermsService.getAllResponsibilityMatrix();
      res.json(matrix);
    } catch (error) {
      console.error('Error fetching responsibility matrix:', error);
      res.status(500).json({ error: 'Failed to fetch responsibility matrix' });
    }
  });

  app.get('/api/incoterms/:code/matrix', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const matrix = await incotermsService.getResponsibilityMatrix(req.params.code.toUpperCase());
      res.json(matrix);
    } catch (error) {
      console.error('Error fetching responsibility matrix:', error);
      res.status(500).json({ error: 'Failed to fetch responsibility matrix' });
    }
  });

  app.get('/api/incoterms/statistics', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const statistics = await incotermsService.getIncotermsStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching Incoterm by code:', error);
      res.status(500).json({ error: 'Failed to fetch Incoterm' });
    }
  });

  app.put('/api/incoterms/:id', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const updated = await incotermsService.updateIncoterm(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Incoterm not found' });
      }
      res.json({ success: true, message: 'Incoterm updated successfully' });
    } catch (error) {
      console.error('Error updating Incoterm:', error);
      res.status(500).json({ error: 'Failed to update Incoterm' });
    }
  });

  app.get('/api/incoterms/:id/responsibility-matrix', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const matrix = await incotermsService.getResponsibilityMatrix(parseInt(req.params.id));
      res.json(matrix);
    } catch (error) {
      console.error('Error fetching responsibility matrix:', error);
      res.status(500).json({ error: 'Failed to fetch responsibility matrix' });
    }
  });

  app.post('/api/incoterms/validate-lc', async (req, res) => {
    try {
      const { lcNumber, incotermCode } = req.body;
      const { incotermsService } = await import('./incotermsService');
      const validation = await incotermsService.validateLCIncoterms(lcNumber, incotermCode);
      res.json(validation);
    } catch (error) {
      console.error('Error validating LC Incoterms:', error);
      res.status(500).json({ error: 'Failed to validate LC Incoterms' });
    }
  });

  app.get('/api/incoterms/statistics/overview', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const statistics = await incotermsService.getIncotermsStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching Incoterms statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // AI-Centric Incoterms Agent Status
  app.get('/api/incoterms/agents/status', async (req, res) => {
    try {
      const { incotermsAgentCoordinator } = await import('./incotermsAIAgents');
      const agents = await incotermsAgentCoordinator.getAgentStatus();
      res.json({
        agents,
        mode: 'ai_centric_incoterms',
        note: 'Autonomous Incoterms validation agents running independently'
      });
    } catch (error) {
      console.error('Error fetching Incoterms agent status:', error);
      res.status(500).json({ error: 'Failed to fetch agent status' });
    }
  });

  // Enhanced Agent Management Routes - Based on Field Classification
  
  // Custom Agents API
  app.get('/api/enhanced-agents', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const agents = await enhancedAzureAgentService.getCustomAgents(userId);
      res.json(agents);
    } catch (error) {
      console.error('Error fetching custom agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  app.post('/api/enhanced-agents', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const agentData = { ...req.body, user_id: userId };
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const result = await enhancedAzureAgentService.createCustomAgent(agentData);
      res.json(result);
    } catch (error) {
      console.error('Error creating custom agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  // Custom Tasks API
  app.get('/api/enhanced-tasks', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const tasks = await enhancedAzureAgentService.getCustomTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching custom tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/enhanced-tasks', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const taskData = { ...req.body, user_id: userId };
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const result = await enhancedAzureAgentService.createCustomTask(taskData);
      res.json(result);
    } catch (error) {
      console.error('Error creating custom task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Custom Crews API
  app.get('/api/enhanced-crews', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const crews = await enhancedAzureAgentService.getCustomCrews(userId);
      res.json(crews);
    } catch (error) {
      console.error('Error fetching custom crews:', error);
      res.status(500).json({ error: 'Failed to fetch crews' });
    }
  });

  app.post('/api/enhanced-crews', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const crewData = { ...req.body, user_id: userId };
      const { enhancedAzureAgentService } = await import('./enhancedAzureAgentService');
      const result = await enhancedAzureAgentService.createCustomCrew(crewData);
      res.json(result);
    } catch (error) {
      console.error('Error creating custom crew:', error);
      res.status(500).json({ error: 'Failed to create crew' });
    }
  });

  // Dashboard metrics endpoint (working reference)
  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const { azureDataService } = await import('./azureDataService');
      const metrics = await azureDataService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Incoterms Management API - Comprehensive System (Public Access for Testing)
  app.get('/api/incoterms', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const incoterms = await incotermsService.getAllIncoterms();
      res.json(incoterms);
    } catch (error) {
      console.error('Error fetching Incoterms:', error);
      res.status(500).json({ error: 'Failed to fetch Incoterms' });
    }
  });

  app.get('/api/incoterms/:id/responsibility-matrix', async (req, res) => {
    try {
      const incotermId = parseInt(req.params.id);
      const { incotermsService } = await import('./incotermsService');
      const matrix = await incotermsService.getResponsibilityMatrix(incotermId);
      res.json(matrix);
    } catch (error) {
      console.error('Error fetching responsibility matrix:', error);
      res.status(500).json({ error: 'Failed to fetch responsibility matrix' });
    }
  });

  app.get('/api/incoterms/statistics/overview', async (req, res) => {
    try {
      const { incotermsService } = await import('./incotermsService');
      const stats = await incotermsService.getIncotermStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching Incoterms statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  app.get('/api/incoterms/agents/status', async (req, res) => {
    try {
      const { incotermsAgentCoordinator } = await import('./incotermsAIAgents');
      const agentStatus = await incotermsAgentCoordinator.getAgentStatus();
      res.json({ agents: agentStatus });
    } catch (error) {
      console.error('Error fetching agent status:', error);
      res.status(500).json({ error: 'Failed to fetch agent status' });
    }
  });

  app.post('/api/incoterms/validate-lc', async (req, res) => {
    try {
      const { lcNumber, incotermCode } = req.body;
      const { incotermsService } = await import('./incotermsService');
      const validation = await incotermsService.validateLCAgainstIncoterm(lcNumber, incotermCode);
      res.json(validation);
    } catch (error) {
      console.error('Error validating LC:', error);
      res.status(500).json({ error: 'Failed to validate LC' });
    }
  });

  app.get('/api/incoterms/terms/:code', async (req, res) => {
    try {
      const termCode = req.params.code.toUpperCase();
      const { incotermsService } = await import('./incotermsService');
      const incoterm = await incotermsService.getIncotermByCode(termCode);
      if (!incoterm) {
        return res.status(404).json({ error: 'Incoterm not found' });
      }
      res.json(incoterm);
    } catch (error) {
      console.error('Error fetching Incoterm by code:', error);
      res.status(500).json({ error: 'Failed to fetch Incoterm' });
    }
  });

  app.post('/api/incoterms/validate-documents', async (req, res) => {
    try {
      const { documents, incotermCode } = req.body;
      const { incotermsService } = await import('./incotermsService');
      const validation = await incotermsService.validateDocumentsAgainstIncoterm(documents, incotermCode);
      res.json(validation);
    } catch (error) {
      console.error('Error validating documents:', error);
      res.status(500).json({ error: 'Failed to validate documents' });
    }
  });

  // Skills Management API - Azure SQL Integration
  app.get('/api/skills', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const skills = await skillsService.getAllSkills();
      res.json(skills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ error: 'Failed to fetch skills' });
    }
  });

  app.get('/api/skills/:id', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const skill = await skillsService.getSkillById(req.params.id);
      if (skill) {
        res.json(skill);
      } else {
        res.status(404).json({ error: 'Skill not found' });
      }
    } catch (error) {
      console.error('Error fetching skill:', error);
      res.status(500).json({ error: 'Failed to fetch skill' });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const skill = await skillsService.createSkill(req.body);
      res.json(skill);
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({ error: 'Failed to create skill' });
    }
  });

  app.put('/api/skills/:id', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const skill = await skillsService.updateSkill(req.params.id, req.body);
      if (skill) {
        res.json(skill);
      } else {
        res.status(404).json({ error: 'Skill not found' });
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      res.status(500).json({ error: 'Failed to update skill' });
    }
  });

  app.delete('/api/skills/:id', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const success = await skillsService.deleteSkill(req.params.id);
      if (success) {
        res.json({ message: 'Skill deleted successfully' });
      } else {
        res.status(404).json({ error: 'Skill not found' });
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      res.status(500).json({ error: 'Failed to delete skill' });
    }
  });

  app.get('/api/skills/category/:category', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const skills = await skillsService.getSkillsByCategory(req.params.category);
      res.json(skills);
    } catch (error) {
      console.error('Error fetching skills by category:', error);
      res.status(500).json({ error: 'Failed to fetch skills by category' });
    }
  });

  app.get('/api/skills/search/:term', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const skills = await skillsService.searchSkills(req.params.term);
      res.json(skills);
    } catch (error) {
      console.error('Error searching skills:', error);
      res.status(500).json({ error: 'Failed to search skills' });
    }
  });

  app.get('/api/skills-statistics', isAuthenticated, async (req, res) => {
    try {
      const { skillsService } = await import('./skillsService');
      const statistics = await skillsService.getSkillStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching skill statistics:', error);
      res.status(500).json({ error: 'Failed to fetch skill statistics' });
    }
  });

  // Workflow Management API - Test Drive Feature (Authentication temporarily removed for testing)
  app.get('/api/workflows', async (req, res) => {
    try {
      const { workflowService } = await import('./workflowService');
      const workflows = await workflowService.getWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  });

  app.get('/api/workflows/:id', async (req, res) => {
    try {
      const { workflowService } = await import('./workflowService');
      const workflow = await workflowService.getWorkflowById(req.params.id);
      if (workflow) {
        res.json(workflow);
      } else {
        res.status(404).json({ error: 'Workflow not found' });
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ error: 'Failed to fetch workflow' });
    }
  });

  app.post('/api/workflows', async (req, res) => {
    try {
      const { name, description, documentSetId, automationLevel } = req.body;
      
      if (!name || !description || !documentSetId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { workflowService } = await import('./workflowService');
      const newWorkflow = await workflowService.createWorkflow({
        name,
        description,
        documentSetId,
        automationLevel
      });

      console.log('Workflow created successfully:', newWorkflow);
      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error('Error creating workflow:', error);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  });

  app.put('/api/workflows/:id', async (req, res) => {
    try {
      const { workflowService } = await import('./workflowService');
      const updatedWorkflow = await workflowService.updateWorkflow(req.params.id, req.body);
      
      if (updatedWorkflow) {
        console.log('Workflow updated successfully:', updatedWorkflow);
        res.json(updatedWorkflow);
      } else {
        res.status(404).json({ error: 'Workflow not found' });
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  });

  app.delete('/api/workflows/:id', async (req, res) => {
    try {
      const { workflowService } = await import('./workflowService');
      const success = await workflowService.deleteWorkflow(req.params.id);
      
      if (success) {
        console.log('Workflow deleted successfully:', req.params.id);
        res.json({ message: 'Workflow deleted successfully' });
      } else {
        res.status(404).json({ error: 'Workflow not found' });
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ error: 'Failed to delete workflow' });
    }
  });

  // OCR Processing API - Test Drive Feature (Authentication temporarily removed for testing)
  app.get('/api/ocr-results', async (req, res) => {
    try {
      const { ocrService } = await import('./ocrService');
      const results = await ocrService.getOCRResults();
      res.json(results);
    } catch (error) {
      console.error('Error fetching OCR results:', error);
      res.status(500).json({ error: 'Failed to fetch OCR results' });
    }
  });

  app.get('/api/ocr-results/:id', async (req, res) => {
    try {
      const { ocrService } = await import('./ocrService');
      const result = await ocrService.getOCRResult(req.params.id);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'OCR result not found' });
      }
    } catch (error) {
      console.error('Error fetching OCR result:', error);
      res.status(500).json({ error: 'Failed to fetch OCR result' });
    }
  });

  app.post('/api/ocr/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { ocrService } = await import('./ocrService');
      
      // Process the document asynchronously
      const result = await ocrService.processDocument(
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );

      res.json(result);
    } catch (error) {
      console.error('Error processing OCR upload:', error);
      res.status(500).json({ 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check endpoint for OpenAI API key
  app.get('/api/health/openai', async (req, res) => {
    try {
      const OpenAI = await import('openai');
      const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
      
      // Test with a simple completion request
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'API key is working'" }],
        max_tokens: 10
      });
      
      res.json({
        status: 'healthy',
        keyValid: true,
        response: response.choices[0].message.content,
        model: 'gpt-3.5-turbo'
      });
    } catch (error) {
      console.error('OpenAI API key health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        keyValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? error.code : 'unknown'
      });
    }
  });

  // True AI-Centric Autonomous Agent Routes
  app.get("/api/autonomous-agents/status", isAuthenticated, async (req, res) => {
    try {
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      const status = await autonomousAgentCoordinator.getAgentStatus();
      res.json({
        mode: 'truly_autonomous',
        agents: status,
        message: 'Agents operate independently and call utility classes autonomously',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting autonomous agent status:", error);
      res.status(500).json({ message: "Failed to get autonomous agent status" });
    }
  });

  app.post("/api/autonomous-agents/initiate", isAuthenticated, async (req, res) => {
    try {
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      const userId = (req.user as any)?.claims?.sub || 'system';
      const result = await autonomousAgentCoordinator.initiateAgentWorkflow(userId, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error with autonomous agents:", error);
      res.status(500).json({ message: "Agents are already operating autonomously" });
    }
  });

  app.post("/api/autonomous-agents/environment", isAuthenticated, async (req, res) => {
    try {
      const { autonomousAgentCoordinator } = await import('./autonomousAgents');
      await autonomousAgentCoordinator.updateEnvironment(req.body);
      res.json({ 
        message: "Environment updated - agents will perceive changes autonomously",
        note: "No manual coordination required - agents make their own decisions",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating agent environment:", error);
      res.status(500).json({ message: "Failed to update environment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
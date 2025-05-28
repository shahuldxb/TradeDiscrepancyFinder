import { apiRequest } from "./queryClient";

export interface DocumentSet {
  id: string;
  userId: string;
  lcReference?: string;
  setName?: string;
  status: string;
  requiredDocuments?: string[];
  uploadedDocuments?: string[];
  analysisStatus: string;
  createdAt: string;
  completedAt?: string;
}

export interface Document {
  id: number;
  documentSetId?: string;
  userId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  status: string;
  extractedData?: any;
  uploadedAt: string;
  processedAt?: string;
}

export interface Discrepancy {
  id: number;
  documentSetId: string;
  discrepancyType: string;
  fieldName?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ucpReference?: string;
  description: string;
  ruleExplanation?: string;
  advice?: string;
  documentValues?: any;
  status: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface AgentStatus {
  name: string;
  role: string;
  status: 'idle' | 'processing' | 'error';
  currentTask?: string;
}

export interface DashboardMetrics {
  documentsProcessed: number;
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  highDiscrepancies: number;
  activeAnalyses: number;
  ilcCreated: number;
  successRate: number;
}

// Document Set API
export const documentSetApi = {
  create: async (data: Partial<DocumentSet>) => {
    const response = await apiRequest("POST", "/api/document-sets", data);
    return response.json();
  },

  list: async (): Promise<DocumentSet[]> => {
    const response = await apiRequest("GET", "/api/document-sets");
    return response.json();
  },

  get: async (id: string): Promise<DocumentSet> => {
    const response = await apiRequest("GET", `/api/document-sets/${id}`);
    return response.json();
  },

  startAnalysis: async (id: string) => {
    const response = await apiRequest("POST", `/api/document-sets/${id}/analyze`);
    return response.json();
  },

  getDiscrepancies: async (id: string): Promise<Discrepancy[]> => {
    const response = await apiRequest("GET", `/api/document-sets/${id}/discrepancies`);
    return response.json();
  },
};

// Document API
export const documentApi = {
  upload: async (file: File, documentType: string, documentSetId: string) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);
    formData.append("documentSetId", documentSetId);

    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  },

  getStatus: async (id: number) => {
    const response = await apiRequest("GET", `/api/documents/${id}/status`);
    return response.json();
  },
};

// Agent API
export const agentApi = {
  getStatus: async (): Promise<AgentStatus[]> => {
    const response = await apiRequest("GET", "/api/agents/status");
    return response.json();
  },

  getTasks: async () => {
    const response = await apiRequest("GET", "/api/agent-tasks");
    return response.json();
  },
};

// Dashboard API
export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return response.json();
  },
};

// ILC API
export const ilcApi = {
  create: async (documentSetId: string) => {
    const response = await apiRequest("POST", "/api/ilc/create", { documentSetId });
    return response.json();
  },
};

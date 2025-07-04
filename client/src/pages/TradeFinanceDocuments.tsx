import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  CreditCard, 
  Network,
  Plus,
  Edit,
  Trash2, 
  Search, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

// Form schemas for CRUD operations
const masterDocumentSchema = z.object({
  documentCode: z.string().min(1, "Document code is required"),
  documentName: z.string().min(1, "Document name is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean()
});

const documentaryCreditSchema = z.object({
  creditCode: z.string().min(1, "Credit code is required"),
  creditName: z.string().min(1, "Credit name is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean()
});

const swiftMessageSchema = z.object({
  swiftCode: z.string().min(1, "SWIFT code is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean()
});

const swiftCreditMappingSchema = z.object({
  creditCode: z.string().min(1, "Credit code is required"),
  swiftCode: z.string().min(1, "SWIFT code is required")
});

// Form component for Master Documents
function MasterDocumentForm({ onSubmit, isLoading, defaultValues }: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(masterDocumentSchema),
    defaultValues: defaultValues || {
      documentCode: "",
      documentName: "",
      description: "",
      isActive: true
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="documentCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Code</FormLabel>
              <FormControl>
                <Input placeholder="DOC001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="documentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="Commercial Invoice" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of the document..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable this document in the system
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Document"}
        </Button>
      </form>
    </Form>
  );
}

// Form component for Documentary Credits
function DocumentaryCreditForm({ onSubmit, isLoading, defaultValues }: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(documentaryCreditSchema),
    defaultValues: defaultValues || {
      creditCode: "",
      creditName: "",
      description: "",
      isActive: true
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="creditCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Code</FormLabel>
              <FormControl>
                <Input placeholder="LC001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="creditName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Name</FormLabel>
              <FormControl>
                <Input placeholder="Import Letter of Credit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of the credit type..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable this credit type in the system
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Credit"}
        </Button>
      </form>
    </Form>
  );
}

// Form component for SWIFT Message Codes
function SwiftMessageForm({ onSubmit, isLoading, defaultValues }: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(swiftMessageSchema),
    defaultValues: defaultValues || {
      swiftCode: "",
      description: "",
      isActive: true
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="swiftCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT Code</FormLabel>
              <FormControl>
                <Input placeholder="MT700" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of the SWIFT message..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable this SWIFT message in the system
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save SWIFT Code"}
        </Button>
      </form>
    </Form>
  );
}

// Form component for SWIFT Credit Mappings
function SwiftCreditMappingForm({ onSubmit, isLoading, defaultValues }: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(swiftCreditMappingSchema),
    defaultValues: defaultValues || {
      creditCode: "",
      swiftCode: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="creditCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Code</FormLabel>
              <FormControl>
                <Input placeholder="LC001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="swiftCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT Code</FormLabel>
              <FormControl>
                <Input placeholder="MT700" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Mapping"}
        </Button>
      </form>
    </Form>
  );
}

// Form component for Document Relationships
function DocumentRelationshipForm({ onSubmit, isLoading, defaultValues }: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(swiftCreditMappingSchema),
    defaultValues: defaultValues || {
      documentCode: "",
      swiftCode: "",
      creditCode: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="documentCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Code</FormLabel>
              <FormControl>
                <Input placeholder="DOC001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="swiftCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT Code</FormLabel>
              <FormControl>
                <Input placeholder="MT700" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="creditCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Code</FormLabel>
              <FormControl>
                <Input placeholder="LC001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Relationship"}
        </Button>
      </form>
    </Form>
  );
}

export default function TradeFinanceDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedView, setSelectedView] = useState("documents");
  const [selectedCredit, setSelectedCredit] = useState("");
  const [selectedSwift, setSelectedSwift] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation hooks for CRUD operations
  const createDocumentMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/trade-finance/master-documents', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/master-documents'] });
      toast({ title: "Document created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create document", variant: "destructive" });
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(`/api/trade-finance/master-documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/master-documents'] });
      toast({ title: "Document updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/trade-finance/master-documents/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/master-documents'] });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    }
  });

  // CRUD mutations for Documentary Credits
  const createCreditMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/trade-finance/documentary-credits', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/documentary-credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/credit-document-summary'] });
      toast({ title: "Credit created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create credit", variant: "destructive" });
    }
  });

  const updateCreditMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(`/api/trade-finance/documentary-credits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/documentary-credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/credit-document-summary'] });
      toast({ title: "Credit updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update credit", variant: "destructive" });
    }
  });

  const deleteCreditMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/trade-finance/documentary-credits/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/documentary-credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/credit-document-summary'] });
      toast({ title: "Credit deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete credit", variant: "destructive" });
    }
  });

  // CRUD mutations for SWIFT Message Codes
  const createSwiftMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/trade-finance/swift-message-codes', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/swift-message-codes'] });
      toast({ title: "SWIFT code created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create SWIFT code", variant: "destructive" });
    }
  });

  const updateSwiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(`/api/trade-finance/swift-message-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/swift-message-codes'] });
      toast({ title: "SWIFT code updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update SWIFT code", variant: "destructive" });
    }
  });

  const deleteSwiftMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/trade-finance/swift-message-codes/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/swift-message-codes'] });
      toast({ title: "SWIFT code deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete SWIFT code", variant: "destructive" });
    }
  });

  // CRUD mutations for SWIFT Credit Mappings
  const createMappingMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/trade-finance/swift-credit-mappings', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/swift-credit-mappings'] });
      toast({ title: "Mapping created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create mapping", variant: "destructive" });
    }
  });

  const updateMappingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(`/api/trade-finance/swift-credit-mappings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/swift-credit-mappings'] });
      toast({ title: "Mapping updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update mapping", variant: "destructive" });
    }
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/trade-finance/swift-credit-mappings/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/swift-credit-mappings'] });
      toast({ title: "Mapping deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete mapping", variant: "destructive" });
    }
  });

  // CRUD mutations for Document Relationships
  const createRelationshipMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/trade-finance/document-relationships', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/document-swift-relationships'] });
      toast({ title: "Relationship created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create relationship", variant: "destructive" });
    }
  });

  const updateRelationshipMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(`/api/trade-finance/document-relationships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/document-swift-relationships'] });
      toast({ title: "Relationship updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update relationship", variant: "destructive" });
    }
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/trade-finance/document-relationships/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-finance/document-swift-relationships'] });
      toast({ title: "Relationship deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete relationship", variant: "destructive" });
    }
  });

  // Fetch trade finance statistics
  const { data: statistics } = useQuery({
    queryKey: ["/api/trade-finance/statistics"],
  });

  // Fetch documentary credits
  const { data: credits, isLoading: loadingCredits } = useQuery({
    queryKey: ["/api/trade-finance/documentary-credits"],
  });

  // Fetch master documents
  const { data: documents, isLoading: loadingDocuments } = useQuery({
    queryKey: ["/api/trade-finance/master-documents"],
  });

  // Fetch SWIFT message codes
  const { data: swiftCodes, isLoading: loadingSwift } = useQuery({
    queryKey: ["/api/trade-finance/swift-message-codes"],
  });

  // Fetch credit document summary
  const { data: creditSummary } = useQuery({
    queryKey: ["/api/trade-finance/credit-document-summary"],
  });

  // Fetch documents for selected credit
  const { data: creditDocuments } = useQuery({
    queryKey: [`/api/trade-finance/credit-documents/${selectedCredit}`],
    enabled: !!selectedCredit,
  });

  // Fetch documents for selected SWIFT message
  const { data: swiftDocuments } = useQuery({
    queryKey: [`/api/trade-finance/swift-documents/${selectedSwift}`],
    enabled: !!selectedSwift,
  });

  // Fetch SWIFT credit mappings
  const { data: swiftCreditMappings } = useQuery({
    queryKey: ["/api/trade-finance/swift-credit-mappings"],
  });

  // Fetch document SWIFT relationships
  const { data: documentRelationships } = useQuery({
    queryKey: ["/api/trade-finance/document-swift-relationships"],
  });

  // Filter functions
  const filteredCredits = credits?.filter((credit: any) =>
    credit.creditCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credit.creditName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredDocuments = documents?.filter((doc: any) =>
    doc.documentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredSwiftCodes = swiftCodes?.filter((swift: any) =>
    swift.swiftCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swift.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Trade Finance Documentation Management</h1>
            <p className="text-lg text-gray-600 mt-1">
              Manage 18 documentary credit types, 40 document types, and 38 SWIFT message relationships
            </p>
          </div>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Documentary Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold">{statistics.totalCredits}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Master Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold">{statistics.totalDocuments}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">SWIFT Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-purple-600" />
                  <span className="text-2xl font-bold">{statistics.totalSwiftMessages}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Credit Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-2xl font-bold">{statistics.totalMappings}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span className="text-2xl font-bold">{statistics.totalRequirements}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search credits, documents, or SWIFT codes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="credits">Documentary Credits</SelectItem>
                  <SelectItem value="documents">Master Documents</SelectItem>
                  <SelectItem value="swift">SWIFT Messages</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">Master Documents</TabsTrigger>
            <TabsTrigger value="credits">Documentary Credits</TabsTrigger>
            <TabsTrigger value="swift">SWIFT Messages</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          {/* Master Documents Tab - First Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Master Documents ({documents?.length || 0})</CardTitle>
                    <CardDescription>
                      Click on any document to see which credits and SWIFT messages use it
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Master Document</DialogTitle>
                        <DialogDescription>
                          Add a new master document to the system
                        </DialogDescription>
                      </DialogHeader>
                      <MasterDocumentForm 
                        onSubmit={(data) => createDocumentMutation.mutate(data)}
                        isLoading={createDocumentMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Edit Dialog */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Master Document</DialogTitle>
                        <DialogDescription>
                          Update the master document information
                        </DialogDescription>
                      </DialogHeader>
                      {editingItem && (
                        <MasterDocumentForm 
                          onSubmit={(data) => updateDocumentMutation.mutate({ id: editingItem.documentId, data })}
                          isLoading={updateDocumentMutation.isPending}
                          defaultValues={editingItem}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Code</TableHead>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments
                        .sort((a: any, b: any) => a.documentCode.localeCompare(b.documentCode))
                        .map((document: any) => (
                        <TableRow 
                          key={document.documentId}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedDocument(document.documentCode)}
                        >
                          <TableCell className="font-mono font-medium">{document.documentCode}</TableCell>
                          <TableCell className="font-semibold">{document.documentName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{document.description}</TableCell>
                          <TableCell>
                            <Badge variant={document.isActive ? "default" : "secondary"}>
                              {document.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(document);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this document?')) {
                                    deleteDocumentMutation.mutate(document.documentId);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Show document relationships when document is selected */}
              {selectedDocument && (
                <Card>
                  <CardHeader>
                    <CardTitle>SWIFT Messages Using Document: {selectedDocument}</CardTitle>
                    <CardDescription>
                      All SWIFT message types that require this document
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SWIFT Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Credit Types</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentRelationships?.filter((rel: any) => 
                          rel.documentCode === selectedDocument
                        )
                        .sort((a: any, b: any) => a.swiftCode.localeCompare(b.swiftCode))
                        .map((rel: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono font-medium">{rel.swiftCode}</TableCell>
                            <TableCell>{rel.swiftDescription}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{rel.numberOfCreditTypes} credits</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Documentary Credits Tab - Second Tab */}
          <TabsContent value="credits">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Documentary Credit Summary ({creditSummary?.length || 0})</CardTitle>
                    <CardDescription>
                      Click on any credit to see required documents with details. Ordered by credit code.
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Credit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Documentary Credit</DialogTitle>
                        <DialogDescription>
                          Add a new documentary credit type to the system
                        </DialogDescription>
                      </DialogHeader>
                      <DocumentaryCreditForm 
                        onSubmit={(data) => createCreditMutation.mutate(data)}
                        isLoading={createCreditMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Edit Dialog for Credits */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Documentary Credit</DialogTitle>
                        <DialogDescription>
                          Update the documentary credit information
                        </DialogDescription>
                      </DialogHeader>
                      {editingItem && (
                        <DocumentaryCreditForm 
                          onSubmit={(data) => updateCreditMutation.mutate({ id: editingItem.creditId, data })}
                          isLoading={updateCreditMutation.isPending}
                          defaultValues={editingItem}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Credit Code</TableHead>
                        <TableHead>Credit Name</TableHead>
                        <TableHead>Mandatory Documents</TableHead>
                        <TableHead>Optional Documents</TableHead>
                        <TableHead>Total Documents</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditSummary?.sort((a: any, b: any) => a.creditCode.localeCompare(b.creditCode))
                        .map((summary: any, index: number) => (
                        <TableRow 
                          key={index}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedCredit(summary.creditCode)}
                        >
                          <TableCell className="font-mono font-medium">{summary.creditCode}</TableCell>
                          <TableCell className="font-semibold">{summary.creditName}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{summary.mandatoryDocumentCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{summary.optionalDocumentCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {summary.mandatoryDocumentCount + summary.optionalDocumentCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(summary);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this credit?')) {
                                    deleteCreditMutation.mutate(summary.creditId);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Selected Credit Documents */}
              {selectedCredit && creditDocuments && (
                <Card>
                  <CardHeader>
                    <CardTitle>Master Documents Required for {selectedCredit}</CardTitle>
                    <CardDescription>
                      Detailed document requirements grouped by mandatory/optional status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Mandatory Documents */}
                      <div>
                        <h4 className="font-semibold mb-3 text-red-700">Mandatory Documents</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Code</TableHead>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Conditional</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditDocuments
                              .filter((doc: any) => doc.status === 'Mandatory')
                              .sort((a: any, b: any) => a.documentCode.localeCompare(b.documentCode))
                              .map((doc: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono font-medium">{doc.documentCode}</TableCell>
                                <TableCell className="font-semibold">{doc.documentName}</TableCell>
                                <TableCell className="text-sm text-gray-600">{doc.description}</TableCell>
                                <TableCell>
                                  {doc.isConditional ? (
                                    <Badge variant="outline">Conditional</Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Optional Documents */}
                      <div>
                        <h4 className="font-semibold mb-3 text-blue-700">Optional Documents</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Code</TableHead>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Conditional</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditDocuments
                              .filter((doc: any) => doc.status === 'Optional')
                              .sort((a: any, b: any) => a.documentCode.localeCompare(b.documentCode))
                              .map((doc: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono font-medium">{doc.documentCode}</TableCell>
                                <TableCell className="font-semibold">{doc.documentName}</TableCell>
                                <TableCell className="text-sm text-gray-600">{doc.description}</TableCell>
                                <TableCell>
                                  {doc.isConditional ? (
                                    <Badge variant="outline">Conditional</Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Master Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Master Documents ({documents?.length || 0})</CardTitle>
                <CardDescription>
                  All 40 document types managed by the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((document: any) => (
                    <Card key={document.documentId} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="font-mono">
                              {document.documentCode}
                            </Badge>
                            <Badge variant="outline">
                              {document.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm">{document.documentName}</h3>
                          <p className="text-xs text-gray-600">{document.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SWIFT Messages Tab - Third Tab */}
          <TabsContent value="swift">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>SWIFT Message Codes ({swiftCodes?.length || 0})</CardTitle>
                    <CardDescription>
                      Click on any SWIFT message to see all relevant documents. Ordered by SWIFT code.
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add SWIFT Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create SWIFT Message Code</DialogTitle>
                        <DialogDescription>
                          Add a new SWIFT message code to the system
                        </DialogDescription>
                      </DialogHeader>
                      <SwiftMessageForm 
                        onSubmit={(data) => createSwiftMutation.mutate(data)}
                        isLoading={createSwiftMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Edit Dialog for SWIFT Messages */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit SWIFT Message Code</DialogTitle>
                        <DialogDescription>
                          Update the SWIFT message code information
                        </DialogDescription>
                      </DialogHeader>
                      {editingItem && (
                        <SwiftMessageForm 
                          onSubmit={(data) => updateSwiftMutation.mutate({ id: editingItem.swiftCodeId, data })}
                          isLoading={updateSwiftMutation.isPending}
                          defaultValues={editingItem}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSwiftCodes
                        .sort((a: any, b: any) => a.swiftCode.localeCompare(b.swiftCode))
                        .map((swift: any) => (
                        <TableRow 
                          key={swift.swiftCodeId}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedSwift(swift.swiftCode)}
                        >
                          <TableCell className="font-mono font-medium">{swift.swiftCode}</TableCell>
                          <TableCell className="font-semibold">{swift.description}</TableCell>
                          <TableCell>
                            <Badge variant={swift.isActive ? "default" : "secondary"}>
                              {swift.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Selected SWIFT Message Documents */}
              {selectedSwift && swiftDocuments && (
                <Card>
                  <CardHeader>
                    <CardTitle>Master Documents Required for {selectedSwift}</CardTitle>
                    <CardDescription>
                      All documents needed for this SWIFT message type grouped by mandatory/optional status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Mandatory Documents */}
                      {swiftDocuments.filter((doc: any) => doc.status === 'Mandatory').length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-red-700">
                            Mandatory Documents ({swiftDocuments.filter((doc: any) => doc.status === 'Mandatory').length})
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Document Code</TableHead>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {swiftDocuments
                                .filter((doc: any) => doc.status === 'Mandatory')
                                .sort((a: any, b: any) => a.documentCode.localeCompare(b.documentCode))
                                .map((doc: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono font-medium">{doc.documentCode}</TableCell>
                                  <TableCell className="font-semibold">{doc.documentName}</TableCell>
                                  <TableCell className="text-sm text-gray-600">{doc.description}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Optional Documents */}
                      {swiftDocuments.filter((doc: any) => doc.status === 'Optional').length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-blue-700">
                            Optional Documents ({swiftDocuments.filter((doc: any) => doc.status === 'Optional').length})
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Document Code</TableHead>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {swiftDocuments
                                .filter((doc: any) => doc.status === 'Optional')
                                .sort((a: any, b: any) => a.documentCode.localeCompare(b.documentCode))
                                .map((doc: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono font-medium">{doc.documentCode}</TableCell>
                                  <TableCell className="font-semibold">{doc.documentName}</TableCell>
                                  <TableCell className="text-sm text-gray-600">{doc.description}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships">
            <div className="space-y-6">
              {/* SWIFT Credit Mappings */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>SWIFT Credit Mappings ({swiftCreditMappings?.length || 0})</CardTitle>
                    <CardDescription>
                      Relationship between documentary credits and SWIFT messages. Ordered by SWIFT code and credit name.
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Mapping
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create SWIFT Credit Mapping</DialogTitle>
                        <DialogDescription>
                          Link a documentary credit with a SWIFT message
                        </DialogDescription>
                      </DialogHeader>
                      <SwiftCreditMappingForm 
                        onSubmit={(data) => createMappingMutation.mutate(data)}
                        isLoading={createMappingMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Edit Dialog for Mappings */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit SWIFT Credit Mapping</DialogTitle>
                        <DialogDescription>
                          Update the relationship between credit and SWIFT message
                        </DialogDescription>
                      </DialogHeader>
                      {editingItem && (
                        <SwiftCreditMappingForm 
                          onSubmit={(data) => updateMappingMutation.mutate({ id: editingItem.id, data })}
                          isLoading={updateMappingMutation.isPending}
                          defaultValues={editingItem}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>SWIFT Description</TableHead>
                        <TableHead>Credit Code</TableHead>
                        <TableHead>Credit Name</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {swiftCreditMappings
                        ?.sort((a: any, b: any) => {
                          const swiftCompare = a.swiftCode.localeCompare(b.swiftCode);
                          return swiftCompare !== 0 ? swiftCompare : a.creditName.localeCompare(b.creditName);
                        })
                        .slice(0, 20)
                        .map((mapping: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{mapping.swiftCode}</TableCell>
                          <TableCell className="text-sm">{mapping.swiftDescription}</TableCell>
                          <TableCell className="font-mono">{mapping.creditCode}</TableCell>
                          <TableCell>{mapping.creditName}</TableCell>
                          <TableCell className="text-sm">
                            {mapping.documentsText ? 
                              <span className="text-wrap">{mapping.documentsText}</span> : 
                              <span className="text-gray-500">No documents linked</span>
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(mapping);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this mapping?')) {
                                    deleteMappingMutation.mutate(mapping.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {swiftCreditMappings && swiftCreditMappings.length > 20 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline">
                        Showing 20 of {swiftCreditMappings.length} mappings
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document SWIFT Relationships */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Document-SWIFT Relationships ({documentRelationships?.length || 0})</CardTitle>
                    <CardDescription>
                      How documents relate to SWIFT messages through credit types. Ordered by SWIFT code and document code.
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Relationship
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Document-SWIFT Relationship</DialogTitle>
                        <DialogDescription>
                          Link a document with a SWIFT message through credit types
                        </DialogDescription>
                      </DialogHeader>
                      <DocumentRelationshipForm 
                        onSubmit={(data) => createRelationshipMutation.mutate(data)}
                        isLoading={createRelationshipMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>Document Code</TableHead>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Credit Types</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentRelationships
                        ?.sort((a: any, b: any) => {
                          const swiftCompare = a.swiftCode.localeCompare(b.swiftCode);
                          return swiftCompare !== 0 ? swiftCompare : a.documentCode.localeCompare(b.documentCode);
                        })
                        .slice(0, 20)
                        .map((rel: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{rel.swiftCode}</TableCell>
                          <TableCell className="font-mono">{rel.documentCode}</TableCell>
                          <TableCell>{rel.documentName}</TableCell>
                          <TableCell className="text-sm">{rel.description || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rel.numberOfCreditTypes}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(rel);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this relationship?')) {
                                    deleteRelationshipMutation.mutate(rel.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {documentRelationships && documentRelationships.length > 20 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline">
                        Showing 20 of {documentRelationships.length} relationships
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
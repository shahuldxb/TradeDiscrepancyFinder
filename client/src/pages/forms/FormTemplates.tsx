import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { CheckCircle, FileText, Settings, Eye, Search, Filter, Database, Download } from "lucide-react";

interface FormDefinition {
  form_id: string;
  form_name: string;
  form_category: string;
  form_description: string;
  form_version: string;
  approval_status: string;
  approval_date: string;
  approved_by: string;
  is_active: boolean;
  is_template: boolean;
  processing_rules: string;
  validation_rules: string;
  azure_model_preference: string;
  created_by: string;
  created_date: string;
  updated_date: string;
}

interface FormField {
  field_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  field_order: number;
  validation_pattern: string;
  default_value: string;
  azure_mapping: string;
  help_text: string;
  is_active: boolean;
}

interface PDFRecord {
  pdf_id: string;
  ingestion_id: string;
  original_filename: string;
  processing_status: string;
  confidence_score: number;
  created_date: string;
}

interface TXTRecord {
  txt_id: string;
  ingestion_id: string;
  original_filename: string;
  processing_status: string;
  confidence_score: number;
  created_date: string;
}

export default function FormTemplates() {
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch all forms
  const { data: allForms = [], isLoading: loadingForms } = useQuery({
    queryKey: ["/api/forms/definitions"],
    queryFn: () => fetch("/api/forms/definitions").then(res => res.json()),
  });

  // Fetch form fields for selected form
  const { data: formFields = [] } = useQuery({
    queryKey: ["/api/forms/definitions", selectedForm?.form_id, "fields"],
    queryFn: () => fetch(`/api/forms/definitions/${selectedForm?.form_id}/fields`).then(res => res.json()),
    enabled: !!selectedForm,
  });

  // Fetch PDF processing records
  const { data: pdfRecords = [] } = useQuery({
    queryKey: ["/api/forms/pdf-records"],
    queryFn: () => fetch("/api/forms/pdf-records").then(res => res.json()),
  });

  // Fetch TXT processing records
  const { data: txtRecords = [] } = useQuery({
    queryKey: ["/api/forms/txt-records"],
    queryFn: () => fetch("/api/forms/txt-records").then(res => res.json()),
  });

  // Filter forms based on search and status
  const filteredForms = allForms.filter((form: FormDefinition) => {
    const matchesSearch = form.form_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.form_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || form.approval_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === "approved" && isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (status === "approved" && !isActive) {
      return <Badge variant="secondary">Approved (Inactive)</Badge>;
    } else if (status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const parseJsonSafely = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Form Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage approved form definitions and field configurations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {allForms.filter((f: FormDefinition) => f.is_active).length} Active Forms
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            {pdfRecords.length + txtRecords.length} Documents Processed
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search forms by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="forms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forms">Form Definitions</TabsTrigger>
          <TabsTrigger value="processing">Processing Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-6">
          {/* Form Definitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span>Form Definitions</span>
              </CardTitle>
              <CardDescription>
                Manage form templates and field configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingForms ? (
                <div className="text-center py-8 text-gray-500">Loading forms...</div>
              ) : filteredForms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No forms found matching your criteria
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredForms.map((form: FormDefinition) => (
                    <div key={form.form_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium">{form.form_name}</h4>
                            <p className="text-sm text-gray-500">{form.form_category}</p>
                          </div>
                        </div>
                        {getStatusBadge(form.approval_status, form.is_active)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{form.form_description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Version {form.form_version}</span>
                        <span>Azure Model: {form.azure_model_preference}</span>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedForm(form)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{form.form_name}</DialogTitle>
                              <DialogDescription>{form.form_description}</DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="fields" className="space-y-4">
                              <TabsList>
                                <TabsTrigger value="fields">Fields</TabsTrigger>
                                <TabsTrigger value="rules">Rules</TabsTrigger>
                                <TabsTrigger value="config">Configuration</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="fields" className="space-y-4">
                                <div className="space-y-2">
                                  {formFields.map((field: FormField) => (
                                    <div key={field.field_id} className="flex items-center justify-between p-3 border rounded">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">{field.field_label}</span>
                                          <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                                          {field.is_required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                          Field: {field.field_name} | Azure: {field.azure_mapping}
                                        </p>
                                      </div>
                                      <span className="text-sm text-gray-400">Order: {field.field_order}</span>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="rules" className="space-y-4">
                                <div className="space-y-4">
                                  <div>
                                    <Label className="font-medium">Processing Rules</Label>
                                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                                      {JSON.stringify(parseJsonSafely(form.processing_rules), null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Validation Rules</Label>
                                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                                      {JSON.stringify(parseJsonSafely(form.validation_rules), null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="config" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="font-medium">Form ID</Label>
                                    <p className="text-gray-600">{form.form_id}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Azure Model</Label>
                                    <p className="text-gray-600">{form.azure_model_preference}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Created By</Label>
                                    <p className="text-gray-600">{form.created_by}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Approved By</Label>
                                    <p className="text-gray-600">{form.approved_by || "N/A"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Is Template</Label>
                                    <p className="text-gray-600">{form.is_template ? "Yes" : "No"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Active</Label>
                                    <p className="text-gray-600">{form.is_active ? "Yes" : "No"}</p>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                        
                        {form.is_active && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Ready for Processing
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          {/* Processing Records */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  <span>PDF Processing Records</span>
                </CardTitle>
                <CardDescription>
                  Individual PDF document processing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdfRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No PDF records found
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {pdfRecords.slice(0, 10).map((record: PDFRecord) => (
                      <div key={record.pdf_id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{record.original_filename}</p>
                          <p className="text-xs text-gray-500">ID: {record.pdf_id}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={record.processing_status === "completed" ? "default" : "secondary"} className="text-xs">
                            {record.processing_status}
                          </Badge>
                          {record.confidence_score && (
                            <p className="text-xs text-gray-400 mt-1">{record.confidence_score}% confidence</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <span>TXT Processing Records</span>
                </CardTitle>
                <CardDescription>
                  Individual TXT document processing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {txtRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No TXT records found
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {txtRecords.slice(0, 10).map((record: TXTRecord) => (
                      <div key={record.txt_id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{record.original_filename}</p>
                          <p className="text-xs text-gray-500">ID: {record.txt_id}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={record.processing_status === "completed" ? "default" : "secondary"} className="text-xs">
                            {record.processing_status}
                          </Badge>
                          {record.confidence_score && (
                            <p className="text-xs text-gray-400 mt-1">{record.confidence_score}% confidence</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Forms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{allForms.length}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {allForms.filter((f: FormDefinition) => f.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documents Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{pdfRecords.length + txtRecords.length}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {pdfRecords.length} PDF, {txtRecords.length} TXT
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {pdfRecords.length + txtRecords.length > 0 
                    ? Math.round(([...pdfRecords, ...txtRecords].filter((r: any) => r.processing_status === "completed").length / (pdfRecords.length + txtRecords.length)) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-gray-500 mt-1">Processing success</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
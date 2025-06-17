import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Eye, FileText, AlertCircle, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FormDefinition {
  form_id: string;
  form_name: string;
  form_category: string;
  form_description: string;
  form_version: string;
  approval_status: string;
  approval_date: string;
  approved_by: string;
  approval_notes: string;
  is_active: boolean;
  is_template: boolean;
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
}

export default function FormApproval() {
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Populate sample data mutation
  const populateDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/forms/populate-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    },
    onSuccess: () => {
      toast({
        title: "Sample Data Created",
        description: "Form definitions and processing records have been populated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forms/definitions'] });
    },
    onError: (error) => {
      toast({
        title: "Population Failed",
        description: "Failed to populate sample data. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Fetch pending forms
  const { data: pendingForms = [], isLoading: loadingForms } = useQuery({
    queryKey: ["/api/forms/definitions", "pending_approval"],
    queryFn: () => fetch("/api/forms/definitions?status=pending_approval").then(res => res.json()),
  });

  // Fetch approved forms
  const { data: approvedForms = [] } = useQuery({
    queryKey: ["/api/forms/definitions", "approved"],
    queryFn: () => fetch("/api/forms/definitions?status=approved").then(res => res.json()),
  });

  // Fetch form fields
  const { data: formFields = [] } = useQuery({
    queryKey: ["/api/forms/definitions", selectedForm?.form_id, "fields"],
    queryFn: () => fetch(`/api/forms/definitions/${selectedForm?.form_id}/fields`).then(res => res.json()),
    enabled: !!selectedForm,
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ formId, action, notes }: { formId: string; action: string; notes: string }) => {
      const response = await fetch(`/api/forms/definitions/${formId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes, approvedBy: "back_office_user" }),
      });
      if (!response.ok) throw new Error("Failed to update approval status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/definitions"] });
      setShowApprovalDialog(false);
      setSelectedForm(null);
      setApprovalNotes("");
      toast({
        title: "Form Status Updated",
        description: `Form has been ${approvalAction}d successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update form approval status.",
        variant: "destructive",
      });
    },
  });

  const handleApproval = (form: FormDefinition, action: "approve" | "reject") => {
    setSelectedForm(form);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const confirmApproval = () => {
    if (selectedForm) {
      approvalMutation.mutate({
        formId: selectedForm.form_id,
        action: approvalAction,
        notes: approvalNotes,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending_approval":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending_approval":
        return <Badge variant="secondary">Pending Approval</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Back Office Approval</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Approve or reject new form types for document processing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {pendingForms.length} Pending Approval
          </Badge>
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            {approvedForms.length} Approved
          </Badge>
        </div>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span>Pending Approvals</span>
          </CardTitle>
          <CardDescription>
            New form types awaiting Back Office approval before processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingForms ? (
            <div className="text-center py-8 text-gray-500">Loading pending forms...</div>
          ) : pendingForms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No forms pending approval
            </div>
          ) : (
            <div className="space-y-4">
              {pendingForms.map((form: FormDefinition) => (
                <div key={form.form_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{form.form_name}</h4>
                          <p className="text-sm text-gray-500">{form.form_category}</p>
                        </div>
                        {getStatusBadge(form.approval_status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-8">{form.form_description}</p>
                      <div className="text-xs text-gray-400 mt-1 ml-8">
                        Created by {form.created_by} • Version {form.form_version}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedForm(form)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{form.form_name}</DialogTitle>
                            <DialogDescription>{form.form_description}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="font-medium">Form Fields</Label>
                              <div className="mt-2 space-y-2">
                                {formFields.map((field: FormField) => (
                                  <div key={field.field_id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <span className="font-medium">{field.field_label}</span>
                                      <span className="text-sm text-gray-500 ml-2">({field.field_type})</span>
                                      {field.is_required && <Badge variant="outline" className="ml-2 text-xs">Required</Badge>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(form, "approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleApproval(form, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Approved Forms</span>
          </CardTitle>
          <CardDescription>
            Form types approved for document processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedForms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved forms yet
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedForms.map((form: FormDefinition) => (
                <div key={form.form_id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <h4 className="font-medium">{form.form_name}</h4>
                      <p className="text-sm text-gray-500">{form.form_category}</p>
                    </div>
                    {getStatusBadge(form.approval_status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{form.form_description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Approved by {form.approved_by} • {new Date(form.approval_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve" : "Reject"} Form
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve" 
                ? "This form will be activated for document processing"
                : "This form will be rejected and cannot process documents"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this decision..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              disabled={approvalMutation.isPending}
              className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={approvalAction === "reject" ? "destructive" : "default"}
            >
              {approvalMutation.isPending ? "Processing..." : `${approvalAction === "approve" ? "Approve" : "Reject"} Form`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
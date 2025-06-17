import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, Plus, FileText, Clock, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FormType {
  form_id: string;
  form_name: string;
  form_type: string;
  form_description: string;
  approval_status: string;
  created_date: string;
  template_data: string;
  field_definitions: string;
}

export default function BackOfficeApproval() {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [newFormData, setNewFormData] = useState({
    form_name: '',
    form_type: '',
    form_description: ''
  });

  const queryClient = useQueryClient();

  // Fetch pending forms requiring approval
  const { data: pendingForms, isLoading } = useQuery({
    queryKey: ['/api/forms/pending-forms'],
  });

  // Approve form mutation
  const approveMutation = useMutation({
    mutationFn: async ({ formId }: { formId: string }) => {
      return apiRequest(`/api/forms/approve/${formId}`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/pending-forms'] });
      toast({
        title: "Form approved",
        description: "Form has been approved and is now available for processing",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve form",
        variant: "destructive",
      });
    }
  });

  // Reject form mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ formId }: { formId: string }) => {
      return apiRequest(`/api/forms/reject/${formId}`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/pending-forms'] });
      toast({
        title: "Form rejected",
        description: "Form has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject form",
        variant: "destructive",
      });
    }
  });

  // Submit new form mutation
  const submitFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest('/api/forms/submit-new', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/pending-forms'] });
      setIsSubmitDialogOpen(false);
      setNewFormData({ form_name: '', form_type: '', form_description: '' });
      toast({
        title: "Form submitted",
        description: "New form type has been submitted for approval",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  });

  // Create sample data mutation
  const createSampleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/forms/create-sample-forms', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/pending-forms'] });
      toast({
        title: "Sample data created",
        description: "Sample form definitions have been created",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (formId: string) => {
    approveMutation.mutate({ formId });
  };

  const handleReject = (formId: string) => {
    rejectMutation.mutate({ formId });
  };

  const handleSubmitForm = () => {
    if (!newFormData.form_name || !newFormData.form_type) {
      toast({
        title: "Validation Error",
        description: "Form name and type are required",
        variant: "destructive",
      });
      return;
    }
    submitFormMutation.mutate(newFormData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Back Office Approval</h1>
            <p className="text-gray-600">Manage form type approvals and submissions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => createSampleMutation.mutate()}
            disabled={createSampleMutation.isPending}
            variant="outline"
          >
            Create Sample Data
          </Button>
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit New Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit New Form Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="form_name">Form Name</Label>
                  <Input
                    id="form_name"
                    value={newFormData.form_name}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, form_name: e.target.value }))}
                    placeholder="e.g., Insurance Certificate"
                  />
                </div>
                <div>
                  <Label htmlFor="form_type">Form Type</Label>
                  <Input
                    id="form_type"
                    value={newFormData.form_type}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, form_type: e.target.value }))}
                    placeholder="e.g., insurance_certificate"
                  />
                </div>
                <div>
                  <Label htmlFor="form_description">Description</Label>
                  <Textarea
                    id="form_description"
                    value={newFormData.form_description}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, form_description: e.target.value }))}
                    placeholder="Describe the form type and its purpose..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmitDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitForm}
                    disabled={submitFormMutation.isPending}
                  >
                    Submit for Approval
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Forms Requiring Approval ({(pendingForms as any[])?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pendingForms || (pendingForms as any[]).length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No forms pending approval</p>
              <p className="text-sm text-gray-400 mt-2">
                Use "Create Sample Data" button to populate sample forms
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Template Data</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pendingForms as FormType[]).map((form) => (
                  <TableRow key={form.form_id}>
                    <TableCell className="font-medium">{form.form_name}</TableCell>
                    <TableCell className="font-mono text-sm">{form.form_type}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={form.form_description}>
                        {form.form_description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(form.approval_status)}>
                        {form.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(form.created_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {form.template_data ? 'Template available' : 'No template'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {form.approval_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(form.form_id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(form.form_id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {form.approval_status === 'approved' && (
                        <Badge variant="default">Approved</Badge>
                      )}
                      {form.approval_status === 'rejected' && (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
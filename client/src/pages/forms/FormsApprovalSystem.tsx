import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Edit, 
  FileText,
  Settings,
  Database,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TFForm {
  form_id?: number;
  form_name: string;
  form_type: string;
  form_category: string;
  form_description: string;
  business_domain: string;
  compliance_requirements: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  approval_workflow_stage: string;
  risk_level: string;
  data_sensitivity: string;
  retention_period: string;
  processing_complexity: string;
  integration_requirements: string;
  validation_rules: string;
  field_mapping_schema: string;
  ocr_model_preference: string;
  ai_confidence_threshold: number;
  auto_processing_enabled: boolean;
  quality_control_level: string;
  exception_handling_rules: string;
  audit_trail_requirements: string;
  user_access_permissions: string;
  approval_comments: string;
  approved_by: string;
  approval_date: string;
  rejection_reason: string;
  version_number: string;
  last_modified_by: string;
  created_date: string;
  updated_date: string;
}

interface TFField {
  field_id?: number;
  form_id: number;
  field_name: string;
  field_type: string;
  field_description: string;
  data_type: string;
  field_category: string;
  is_mandatory: boolean;
  validation_pattern: string;
  extraction_priority: number;
  ocr_extraction_method: string;
  ai_model_hint: string;
  confidence_threshold: number;
  default_value: string;
  field_position: string;
  field_size_constraints: string;
  data_format_requirements: string;
  business_rules: string;
  dependent_fields: string;
  conditional_logic: string;
  error_handling_strategy: string;
  data_quality_checks: string;
  transformation_rules: string;
  output_format: string;
  integration_mapping: string;
  audit_requirements: string;
  privacy_classification: string;
  retention_policy: string;
  access_control_level: string;
  field_help_text: string;
  created_date: string;
  updated_date: string;
}

export default function FormsApprovalSystem() {
  const [activeTab, setActiveTab] = useState('forms');
  const [editingForm, setEditingForm] = useState<TFForm | null>(null);
  const [editingField, setEditingField] = useState<TFField | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch TF_forms data
  const { data: formsData, isLoading: formsLoading } = useQuery({
    queryKey: ['/api/forms/tf-forms'],
    refetchInterval: 3000,
  });

  // Fetch TF_fields data
  const { data: fieldsData, isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/forms/tf-fields'],
    refetchInterval: 3000,
  });

  // Approve/Reject form mutation
  const approvalMutation = useMutation({
    mutationFn: async (data: { formId: number; action: 'approve' | 'reject'; comments: string }) => {
      const response = await fetch(`/api/forms/approval/${data.formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: data.action, comments: data.comments })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/tf-forms'] });
      toast({ title: 'Success', description: 'Form approval status updated' });
    }
  });

  // Create/Update form mutation
  const formMutation = useMutation({
    mutationFn: async (data: { form: TFForm; isEdit: boolean }) => {
      const url = data.isEdit ? `/api/forms/tf-forms/${data.form.form_id}` : '/api/forms/tf-forms';
      const method = data.isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.form)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/tf-forms'] });
      toast({ title: 'Success', description: 'Form saved successfully' });
      setIsFormDialogOpen(false);
      setEditingForm(null);
    }
  });

  // Create/Update field mutation
  const fieldMutation = useMutation({
    mutationFn: async (data: { field: TFField; isEdit: boolean }) => {
      const url = data.isEdit ? `/api/forms/tf-fields/${data.field.field_id}` : '/api/forms/tf-fields';
      const method = data.isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.field)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms/tf-fields'] });
      toast({ title: 'Success', description: 'Field saved successfully' });
      setIsFieldDialogOpen(false);
      setEditingField(null);
    }
  });

  const handleApproveReject = (formId: number, action: 'approve' | 'reject') => {
    const comments = prompt(`Please enter ${action} comments:`);
    if (comments !== null) {
      approvalMutation.mutate({ formId, action, comments });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const form: TFForm = {
      form_name: formData.get('form_name') as string,
      form_type: formData.get('form_type') as string,
      form_category: formData.get('form_category') as string,
      form_description: formData.get('form_description') as string,
      business_domain: formData.get('business_domain') as string,
      compliance_requirements: formData.get('compliance_requirements') as string,
      approval_status: 'pending',
      created_by: 'current_user',
      approval_workflow_stage: 'initial_review',
      risk_level: formData.get('risk_level') as string,
      data_sensitivity: formData.get('data_sensitivity') as string,
      retention_period: formData.get('retention_period') as string,
      processing_complexity: formData.get('processing_complexity') as string,
      integration_requirements: formData.get('integration_requirements') as string,
      validation_rules: formData.get('validation_rules') as string,
      field_mapping_schema: formData.get('field_mapping_schema') as string,
      ocr_model_preference: formData.get('ocr_model_preference') as string,
      ai_confidence_threshold: parseFloat(formData.get('ai_confidence_threshold') as string) || 0.8,
      auto_processing_enabled: formData.get('auto_processing_enabled') === 'true',
      quality_control_level: formData.get('quality_control_level') as string,
      exception_handling_rules: formData.get('exception_handling_rules') as string,
      audit_trail_requirements: formData.get('audit_trail_requirements') as string,
      user_access_permissions: formData.get('user_access_permissions') as string,
      approval_comments: '',
      approved_by: '',
      approval_date: '',
      rejection_reason: '',
      version_number: '1.0',
      last_modified_by: 'current_user',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    if (editingForm?.form_id) {
      form.form_id = editingForm.form_id;
    }

    formMutation.mutate({ form, isEdit: !!editingForm?.form_id });
  };

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const field: TFField = {
      form_id: selectedFormId || parseInt(formData.get('form_id') as string),
      field_name: formData.get('field_name') as string,
      field_type: formData.get('field_type') as string,
      field_description: formData.get('field_description') as string,
      data_type: formData.get('data_type') as string,
      field_category: formData.get('field_category') as string,
      is_mandatory: formData.get('is_mandatory') === 'true',
      validation_pattern: formData.get('validation_pattern') as string,
      extraction_priority: parseInt(formData.get('extraction_priority') as string) || 1,
      ocr_extraction_method: formData.get('ocr_extraction_method') as string,
      ai_model_hint: formData.get('ai_model_hint') as string,
      confidence_threshold: parseFloat(formData.get('confidence_threshold') as string) || 0.8,
      default_value: formData.get('default_value') as string,
      field_position: formData.get('field_position') as string,
      field_size_constraints: formData.get('field_size_constraints') as string,
      data_format_requirements: formData.get('data_format_requirements') as string,
      business_rules: formData.get('business_rules') as string,
      dependent_fields: formData.get('dependent_fields') as string,
      conditional_logic: formData.get('conditional_logic') as string,
      error_handling_strategy: formData.get('error_handling_strategy') as string,
      data_quality_checks: formData.get('data_quality_checks') as string,
      transformation_rules: formData.get('transformation_rules') as string,
      output_format: formData.get('output_format') as string,
      integration_mapping: formData.get('integration_mapping') as string,
      audit_requirements: formData.get('audit_requirements') as string,
      privacy_classification: formData.get('privacy_classification') as string,
      retention_policy: formData.get('retention_policy') as string,
      access_control_level: formData.get('access_control_level') as string,
      field_help_text: formData.get('field_help_text') as string,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    if (editingField?.field_id) {
      field.field_id = editingField.field_id;
    }

    fieldMutation.mutate({ field, isEdit: !!editingField?.field_id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          TF_Forms Approval & Field Management System
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forms">TF_Forms Management ({formsData?.length || 0})</TabsTrigger>
          <TabsTrigger value="fields">TF_Fields Management ({fieldsData?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Form Approval Dashboard</span>
                <Button onClick={() => { setEditingForm(null); setIsFormDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Form
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Business Domain</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formsData?.map((form: TFForm) => (
                      <TableRow key={form.form_id}>
                        <TableCell className="font-medium">{form.form_name}</TableCell>
                        <TableCell>{form.form_type}</TableCell>
                        <TableCell>{form.form_category}</TableCell>
                        <TableCell>{form.business_domain}</TableCell>
                        <TableCell>
                          <Badge variant={form.risk_level === 'high' ? 'destructive' : form.risk_level === 'medium' ? 'default' : 'secondary'}>
                            {form.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            form.approval_status === 'approved' ? 'default' : 
                            form.approval_status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }>
                            {form.approval_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(form.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => { setEditingForm(form); setIsFormDialogOpen(true); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            {form.approval_status === 'pending' && (
                              <>
                                <Button size="sm" variant="default" onClick={() => handleApproveReject(form.form_id!, 'approve')}>
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleApproveReject(form.form_id!, 'reject')}>
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => { setSelectedFormId(form.form_id!); setActiveTab('fields'); }}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Field Definitions Management</span>
                <div className="flex gap-2">
                  <Select value={selectedFormId?.toString() || ""} onValueChange={(value) => setSelectedFormId(parseInt(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Form" />
                    </SelectTrigger>
                    <SelectContent>
                      {formsData?.filter((f: TFForm) => f.approval_status === 'approved').map((form: TFForm) => (
                        <SelectItem key={form.form_id} value={form.form_id!.toString()}>
                          {form.form_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => { setEditingField(null); setIsFieldDialogOpen(true); }} disabled={!selectedFormId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldsData?.filter((field: TFField) => !selectedFormId || field.form_id === selectedFormId).map((field: TFField) => (
                      <TableRow key={field.field_id}>
                        <TableCell className="font-medium">{field.field_name}</TableCell>
                        <TableCell>{field.field_type}</TableCell>
                        <TableCell>{field.field_category}</TableCell>
                        <TableCell>{field.data_type}</TableCell>
                        <TableCell>
                          <Badge variant={field.is_mandatory ? 'destructive' : 'secondary'}>
                            {field.is_mandatory ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>{field.extraction_priority}</TableCell>
                        <TableCell>{(field.confidence_threshold * 100).toFixed(0)}%</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => { setEditingField(field); setIsFieldDialogOpen(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? 'Edit' : 'Create'} TF_Form</DialogTitle>
            <DialogDescription>
              Comprehensive form definition with all business and technical attributes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Name *</Label>
                <Input name="form_name" defaultValue={editingForm?.form_name} required />
              </div>
              <div className="space-y-2">
                <Label>Form Type *</Label>
                <Select name="form_type" defaultValue={editingForm?.form_type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial_invoice">Commercial Invoice</SelectItem>
                    <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                    <SelectItem value="certificate_of_origin">Certificate of Origin</SelectItem>
                    <SelectItem value="packing_list">Packing List</SelectItem>
                    <SelectItem value="insurance_certificate">Insurance Certificate</SelectItem>
                    <SelectItem value="bill_of_exchange">Bill of Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Form Category</Label>
                <Select name="form_category" defaultValue={editingForm?.form_category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trade_finance">Trade Finance</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="customs">Customs</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="banking">Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Business Domain</Label>
                <Select name="business_domain" defaultValue={editingForm?.business_domain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international_trade">International Trade</SelectItem>
                    <SelectItem value="supply_chain">Supply Chain</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select name="risk_level" defaultValue={editingForm?.risk_level}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Sensitivity</Label>
                <Select name="data_sensitivity" defaultValue={editingForm?.data_sensitivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Form Description</Label>
              <Textarea name="form_description" defaultValue={editingForm?.form_description} rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Compliance Requirements</Label>
                <Textarea name="compliance_requirements" defaultValue={editingForm?.compliance_requirements} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Integration Requirements</Label>
                <Textarea name="integration_requirements" defaultValue={editingForm?.integration_requirements} rows={2} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formMutation.isPending}>
                {editingForm ? 'Update' : 'Create'} Form
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Field Create/Edit Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit' : 'Create'} TF_Field</DialogTitle>
            <DialogDescription>
              Comprehensive field definition with extraction and validation rules
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFieldSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field Name *</Label>
                <Input name="field_name" defaultValue={editingField?.field_name} required />
              </div>
              <div className="space-y-2">
                <Label>Field Type *</Label>
                <Select name="field_type" defaultValue={editingField?.field_type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="address">Address</SelectItem>
                    <SelectItem value="signature">Signature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Type</Label>
                <Select name="data_type" defaultValue={editingField?.data_type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="integer">Integer</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                    <SelectItem value="datetime">DateTime</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Field Category</Label>
                <Select name="field_category" defaultValue={editingField?.field_category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={fieldMutation.isPending}>
                {editingField ? 'Update' : 'Create'} Field
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
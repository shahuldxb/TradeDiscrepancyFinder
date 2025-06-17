import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewFormSubmission {
  form_id: string;
  form_name: string;
  form_type: string;
  description: string;
  status: string;
  confidence: number;
  source_text: string;
  source_ingestion_id: string;
  created_date: string;
}

interface DetectionStats {
  total_submissions: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  avg_confidence: number;
}

export default function NewFormDetection() {
  const [selectedForm, setSelectedForm] = useState<NewFormSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch new form submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/forms/new-submissions'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch detection statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/forms/detection-stats'],
    refetchInterval: 30000,
  });

  // Approve form mutation
  const approveMutation = useMutation({
    mutationFn: async (formId: string) => {
      await apiRequest(`/api/forms/approve/${formId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Form Approved",
        description: "The new form type has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forms/new-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forms/detection-stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve form. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject form mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ formId, reason }: { formId: string; reason: string }) => {
      await apiRequest(`/api/forms/reject/${formId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Form Rejected",
        description: "The new form type has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forms/new-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forms/detection-stats'] });
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (formId: string) => {
    approveMutation.mutate(formId);
  };

  const handleReject = (formId: string, reason: string) => {
    rejectMutation.mutate({ formId, reason });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const variant = percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "outline";
    return <Badge variant={variant}>{percentage}% confidence</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">New Form Detection</h1>
          <p className="text-muted-foreground">Automatic detection and approval workflow for unknown form types</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total_submissions || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statsLoading ? "..." : stats?.pending_count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsLoading ? "..." : stats?.approved_count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statsLoading ? "..." : stats?.rejected_count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.avg_confidence ? `${Math.round(stats.avg_confidence * 100)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>New Form Submissions</CardTitle>
          <CardDescription>
            Review and approve newly detected form types from document processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <Alert>
              <AlertDescription>
                No new form submissions found. New forms will appear here when the system detects unknown document types.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission: NewFormSubmission) => (
                <Card key={submission.form_id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{submission.form_name}</h3>
                          {getStatusBadge(submission.status)}
                          {getConfidenceBadge(submission.confidence)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Form Type:</span> {submission.form_type}
                          </div>
                          <div>
                            <span className="font-medium">Source:</span> {submission.source_ingestion_id}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {formatDate(submission.created_date)}
                          </div>
                          <div>
                            <span className="font-medium">Form ID:</span> {submission.form_id}
                          </div>
                        </div>
                        
                        <p className="text-sm">{submission.description}</p>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedForm(submission)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{submission.form_name}</DialogTitle>
                              <DialogDescription>
                                Review the detected form content and metadata
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Type:</span> {submission.form_type}</div>
                                <div><span className="font-medium">Confidence:</span> {Math.round(submission.confidence * 100)}%</div>
                                <div><span className="font-medium">Status:</span> {submission.status}</div>
                                <div><span className="font-medium">Source:</span> {submission.source_ingestion_id}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-sm mt-1">{submission.description}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Source Text Sample</Label>
                                <Textarea 
                                  value={submission.source_text} 
                                  readOnly 
                                  className="mt-1 h-32"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {submission.status === 'Pending Approval' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(submission.form_id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Form</DialogTitle>
                                  <DialogDescription>
                                    Provide a reason for rejecting this form type
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason">Rejection Reason</Label>
                                    <Textarea
                                      id="reason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Enter reason for rejection..."
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setRejectionReason("")}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleReject(submission.form_id, rejectionReason)}
                                      disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                    >
                                      Reject Form
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  FileText,
  Users,
  DollarSign,
  Calendar
} from "lucide-react";

interface LifecycleStage {
  id: string;
  name: string;
  description: string;
  status: "completed" | "current" | "pending";
  timestamp?: string;
  messageType?: string;
  documents?: string[];
}

export default function MT700Lifecycle() {
  const [selectedStage, setSelectedStage] = useState<string>("issuance");

  // Fetch lifecycle data
  const { data: lifecycleData, isLoading } = useQuery({
    queryKey: ["/api/mt700/lifecycle"],
    retry: false,
  });

  const stages: LifecycleStage[] = [
    {
      id: "issuance",
      name: "LC Issuance",
      description: "Documentary Credit issued by issuing bank",
      status: "completed",
      timestamp: "2024-01-15T10:00:00Z",
      messageType: "MT700",
      documents: ["Application Form", "Purchase Agreement"]
    },
    {
      id: "advice",
      name: "LC Advice",
      description: "Advising bank notifies beneficiary",
      status: "completed",
      timestamp: "2024-01-15T14:30:00Z",
      messageType: "MT710",
      documents: ["LC Copy", "Advice Notice"]
    },
    {
      id: "amendment",
      name: "LC Amendment",
      description: "Modifications to original LC terms",
      status: "current",
      timestamp: "2024-01-16T09:15:00Z",
      messageType: "MT707",
      documents: ["Amendment Request", "Updated Terms"]
    },
    {
      id: "documents",
      name: "Document Presentation",
      description: "Beneficiary presents documents for payment",
      status: "pending",
      messageType: "MT740",
      documents: ["Commercial Invoice", "Bill of Lading", "Insurance Certificate"]
    },
    {
      id: "examination",
      name: "Document Examination",
      description: "Bank examines documents for compliance",
      status: "pending",
      messageType: "MT750",
      documents: ["Examination Report", "Discrepancy Notice"]
    },
    {
      id: "payment",
      name: "Payment/Acceptance",
      description: "Payment made or acceptance given",
      status: "pending",
      messageType: "MT760",
      documents: ["Payment Instruction", "Acceptance Notice"]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "current":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const currentStageIndex = stages.findIndex(stage => stage.status === "current");
  const progress = ((currentStageIndex + 1) / stages.length) * 100;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">MT700 Lifecycle Management</h1>
          <p className="text-gray-600">
            Track and manage Documentary Credit lifecycle from issuance to payment
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              LC Progress Overview
            </CardTitle>
            <CardDescription>
              Current status: {stages[currentStageIndex]?.name || "Completed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Started</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle Stages */}
      <Tabs value={selectedStage} onValueChange={setSelectedStage} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {stages.map((stage) => (
            <TabsTrigger key={stage.id} value={stage.id} className="text-xs">
              {stage.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Stage Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage, index) => (
            <Card 
              key={stage.id} 
              className={`cursor-pointer transition-all ${
                selectedStage === stage.id ? 'ring-2 ring-blue-500' : ''
              } ${stage.status === 'current' ? 'border-blue-500' : ''}`}
              onClick={() => setSelectedStage(stage.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stage.status)}
                    <span className="text-sm font-medium">Step {index + 1}</span>
                  </div>
                  <Badge className={getStatusColor(stage.status)}>
                    {stage.status}
                  </Badge>
                </div>
                <CardTitle className="text-base">{stage.name}</CardTitle>
                <CardDescription className="text-sm">
                  {stage.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stage.messageType && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4" />
                      <span>{stage.messageType}</span>
                    </div>
                  )}
                  {stage.timestamp && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(stage.timestamp).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4" />
                    <span>{stage.documents?.length || 0} documents</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stage Details */}
        {stages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(stage.status)}
                  {stage.name} Details
                </CardTitle>
                <CardDescription>
                  {stage.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stage Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Stage Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Message Type:</span>
                        <Badge variant="outline">{stage.messageType}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(stage.status)}>
                          {stage.status}
                        </Badge>
                      </div>
                      {stage.timestamp && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timestamp:</span>
                          <span>{new Date(stage.timestamp).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Required Documents */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Required Documents</h3>
                    <div className="space-y-2">
                      {stage.documents?.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Documents
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Message
                  </Button>
                  {stage.status === "current" && (
                    <Button size="sm">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Proceed to Next Stage
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stages.filter(s => s.status === 'completed').length}</p>
                <p className="text-sm text-gray-600">Completed Stages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stages.filter(s => s.status === 'current').length}</p>
                <p className="text-sm text-gray-600">Current Stage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold">{stages.filter(s => s.status === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending Stages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stages.reduce((acc, s) => acc + (s.documents?.length || 0), 0)}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
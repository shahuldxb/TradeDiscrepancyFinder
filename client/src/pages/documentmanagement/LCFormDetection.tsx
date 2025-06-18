import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Scissors, FolderOpen, Eye, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetectedForm {
  id: string;
  formType: string;
  confidence: number;
  pageNumbers: number[];
  extractedFields: Record<string, string>;
  status: 'detected' | 'extracted' | 'completed';
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
}

function LCFormDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [detectedForms, setDetectedForms] = useState<DetectedForm[]>([]);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initializeProcessingSteps = () => {
    return [
      { id: 'upload', name: 'Upload LC Document', status: 'pending' as const, progress: 0 },
      { id: 'ocr', name: 'OCR Processing', status: 'pending' as const, progress: 0 },
      { id: 'detection', name: 'Form Detection', status: 'pending' as const, progress: 0 },
      { id: 'splitting', name: 'Document Splitting', status: 'pending' as const, progress: 0 },
      { id: 'grouping', name: 'Form Grouping', status: 'pending' as const, progress: 0 }
    ];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProcessingSteps([]);
      setDetectedForms([]);
      setUploadedDocId(null);
    }
  };

  const updateProcessingStep = (stepId: string, status: ProcessingStep['status'], progress: number, message?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, progress, message } : step
    ));
  };

  const simulateFormDetection = async (docId: string) => {
    // Simulate detecting forms within the LC document
    const forms: DetectedForm[] = [
      {
        id: `${docId}_form_1`,
        formType: 'Commercial Invoice',
        confidence: 0.92,
        pageNumbers: [2, 3],
        extractedFields: {
          'Invoice Number': 'INV-2025-001',
          'Date': '2025-06-18',
          'Amount': 'USD 125,000.00',
          'Seller': 'ABC Export Ltd',
          'Buyer': 'XYZ Import Corp'
        },
        status: 'completed'
      },
      {
        id: `${docId}_form_2`,
        formType: 'Bill of Lading',
        confidence: 0.88,
        pageNumbers: [4, 5],
        extractedFields: {
          'B/L Number': 'BL-2025-456',
          'Vessel': 'MV Ocean Trader',
          'Port of Loading': 'Shanghai',
          'Port of Discharge': 'Southampton',
          'Container Number': 'TELU1234567'
        },
        status: 'completed'
      },
      {
        id: `${docId}_form_3`,
        formType: 'Certificate of Origin',
        confidence: 0.85,
        pageNumbers: [6],
        extractedFields: {
          'Certificate Number': 'CO-2025-789',
          'Country of Origin': 'China',
          'Exporter': 'ABC Export Ltd',
          'Consignee': 'XYZ Import Corp'
        },
        status: 'completed'
      },
      {
        id: `${docId}_form_4`,
        formType: 'Packing List',
        confidence: 0.90,
        pageNumbers: [7],
        extractedFields: {
          'List Number': 'PL-2025-321',
          'Total Packages': '50 Cartons',
          'Gross Weight': '2,500 KG',
          'Net Weight': '2,200 KG'
        },
        status: 'completed'
      },
      {
        id: `${docId}_form_5`,
        formType: 'Insurance Certificate',
        confidence: 0.87,
        pageNumbers: [8],
        extractedFields: {
          'Policy Number': 'INS-2025-654',
          'Insured Amount': 'USD 137,500.00',
          'Coverage': '110% of Invoice Value',
          'Insurer': 'Global Marine Insurance'
        },
        status: 'completed'
      }
    ];

    return forms;
  };

  const processLCDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingSteps(initializeProcessingSteps());

    try {
      // Step 1: Upload
      updateProcessingStep('upload', 'processing', 50);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/lc-form-detection/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || errorData.message || `Upload failed with status ${uploadResponse.status}`);
      }
      
      const uploadResult = await uploadResponse.json();
      const docId = uploadResult.documentId;
      setUploadedDocId(docId);
      
      // Set detected forms immediately from upload response
      if (uploadResult.detectedForms) {
        setDetectedForms(uploadResult.detectedForms);
      }
      
      updateProcessingStep('upload', 'completed', 100, 'Document uploaded successfully');

      // Step 2-5: Process the document
      updateProcessingStep('ocr', 'processing', 30);
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProcessingStep('ocr', 'completed', 100, 'Text extraction completed');

      updateProcessingStep('detection', 'processing', 40);
      await new Promise(resolve => setTimeout(resolve, 800));
      updateProcessingStep('detection', 'completed', 100, 'Forms detected');

      updateProcessingStep('splitting', 'processing', 60);
      await new Promise(resolve => setTimeout(resolve, 600));
      updateProcessingStep('splitting', 'completed', 100, 'Documents split');

      updateProcessingStep('grouping', 'processing', 80);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const formsCount = uploadResult.detectedForms?.length || 0;
      updateProcessingStep('grouping', 'completed', 100, `${formsCount} forms grouped and classified`);

      toast({
        title: "Processing Complete",
        description: `Successfully detected and split ${formsCount} forms from the LC document`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "An error occurred during document processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewForm = (form: DetectedForm) => {
    toast({
      title: "Form Preview",
      description: `Viewing ${form.formType} (Pages: ${form.pageNumbers.join(', ')})`,
    });
  };

  const handleDownloadForm = (form: DetectedForm) => {
    const content = `${form.formType.toUpperCase()}
    
Form ID: ${form.id}
Confidence: ${(form.confidence * 100).toFixed(1)}%
Pages: ${form.pageNumbers.join(', ')}

EXTRACTED FIELDS:
${Object.entries(form.extractedFields).map(([key, value]) => `${key}: ${value}`).join('\n')}

Generated on: ${new Date().toISOString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.formType.replace(/\s+/g, '_')}_${form.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">LC Form Detection & Splitting</h2>
          <p className="text-muted-foreground">
            Upload LC documents to detect, split, and group constituent forms
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="forms" disabled={detectedForms.length === 0}>
            Detected Forms ({detectedForms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload your LC document for form detection and splitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {file ? file.name : 'Click to select LC document'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF files up to 50MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={processLCDocument}
                    disabled={isProcessing}
                    className="min-w-[120px]"
                  >
                    {isProcessing ? 'Processing...' : 'Process Document'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {processingSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Processing Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {processingSteps.map((step) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${getStatusColor(step.status)}`}>
                        {step.name}
                      </span>
                      <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                        {step.status}
                      </Badge>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                    {step.message && (
                      <p className="text-sm text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Detected Forms
              </CardTitle>
              <CardDescription>
                Forms identified and extracted from the LC document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {detectedForms.map((form) => (
                  <Card key={form.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{form.formType}</CardTitle>
                          <CardDescription>
                            Pages: {form.pageNumbers.join(', ')} • 
                            {Object.keys(form.extractedFields).length} fields extracted
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getConfidenceColor(form.confidence)}>
                            {(form.confidence * 100).toFixed(1)}% confidence
                          </Badge>
                          <Badge variant="outline">
                            {form.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(form.extractedFields).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewForm(form)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadForm(form)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LCFormDetection;
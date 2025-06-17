import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, FileText, Settings, Upload } from 'lucide-react';

interface FormProgressStep {
  step: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
  timestamp: string;
  formNumber?: number;
  stepType?: string;
}

interface FormProgressDisplayProps {
  processingSteps: FormProgressStep[];
  totalForms?: number;
}

export function FormProgressDisplay({ processingSteps, totalForms = 1 }: FormProgressDisplayProps) {
  // Group steps by form number
  const formSteps = processingSteps.reduce((acc, step) => {
    if (step.formNumber) {
      if (!acc[step.formNumber]) {
        acc[step.formNumber] = [];
      }
      acc[step.formNumber].push(step);
    }
    return acc;
  }, {} as Record<number, FormProgressStep[]>);

  // Get overall progress steps
  const overallSteps = processingSteps.filter(step => !step.formNumber);

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'ocr':
        return <FileText className="w-4 h-4" />;
      case 'text_extraction':
        return <FileText className="w-4 h-4" />;
      case 'json_generation':
        return <Settings className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const calculateFormProgress = (steps: FormProgressStep[]) => {
    const expectedSteps = ['upload', 'ocr', 'text_extraction', 'json_generation'];
    const completedSteps = steps.filter(step => step.status === 'completed' && expectedSteps.includes(step.stepType || '')).length;
    return (completedSteps / expectedSteps.length) * 100;
  };

  const getFormStepProgress = (steps: FormProgressStep[], stepType: string) => {
    const step = steps.find(s => s.stepType === stepType);
    return step?.status === 'completed' ? 100 : step?.status === 'processing' ? 50 : 0;
  };

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Overall Processing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overallSteps.map((step, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(step.status)}
                  <span className="font-medium capitalize">{step.step.replace(/_/g, ' ')}</span>
                </div>
                <Badge variant={step.status === 'completed' ? 'default' : step.status === 'processing' ? 'secondary' : 'destructive'}>
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Form Progress */}
      {totalForms > 0 && Object.keys(formSteps).length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Individual Form Processing</h3>
          {Array.from({ length: totalForms }, (_, i) => i + 1).map(formNumber => {
            const steps = formSteps[formNumber] || [];
            const progress = calculateFormProgress(steps);
            
            return (
              <Card key={formNumber}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Form {formNumber}</span>
                    <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
                  </CardTitle>
                  <Progress value={progress} className="h-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Upload Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStepIcon('upload')}
                        <span className="text-sm font-medium">Upload</span>
                      </div>
                      <Progress 
                        value={getFormStepProgress(steps, 'upload')} 
                        className={`h-2 ${getStatusColor(steps.find(s => s.stepType === 'upload')?.status || 'pending')}`}
                      />
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(steps.find(s => s.stepType === 'upload')?.status || 'pending')}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {steps.find(s => s.stepType === 'upload')?.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* OCR Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStepIcon('ocr')}
                        <span className="text-sm font-medium">OCR</span>
                      </div>
                      <Progress 
                        value={getFormStepProgress(steps, 'ocr')} 
                        className={`h-2 ${getStatusColor(steps.find(s => s.stepType === 'ocr')?.status || 'pending')}`}
                      />
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(steps.find(s => s.stepType === 'ocr')?.status || 'pending')}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {steps.find(s => s.stepType === 'ocr')?.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Text Extraction Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStepIcon('text_extraction')}
                        <span className="text-sm font-medium">Text Extract</span>
                      </div>
                      <Progress 
                        value={getFormStepProgress(steps, 'text_extraction')} 
                        className={`h-2 ${getStatusColor(steps.find(s => s.stepType === 'text_extraction')?.status || 'pending')}`}
                      />
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(steps.find(s => s.stepType === 'text_extraction')?.status || 'pending')}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {steps.find(s => s.stepType === 'text_extraction')?.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* JSON Generation Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStepIcon('json_generation')}
                        <span className="text-sm font-medium">JSON Gen</span>
                      </div>
                      <Progress 
                        value={getFormStepProgress(steps, 'json_generation')} 
                        className={`h-2 ${getStatusColor(steps.find(s => s.stepType === 'json_generation')?.status || 'pending')}`}
                      />
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(steps.find(s => s.stepType === 'json_generation')?.status || 'pending')}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {steps.find(s => s.stepType === 'json_generation')?.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Processing Details */}
                  {steps.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Processing Timeline</h4>
                      <div className="space-y-1">
                        {steps
                          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                          .map((step, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(step.status)}
                                <span>{step.stepType?.replace(/_/g, ' ')}</span>
                              </span>
                              <span className="text-gray-500">
                                {new Date(step.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowDown, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Eye,
  Shield,
  Activity,
  TrendingUp,
  Workflow,
  RefreshCw,
  Download,
  Play,
  Pause,
  FastForward
} from "lucide-react";

export default function LCLifecycle() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Sample data for demonstration
  const lcStates = [
    { id: 'pre-advised', name: 'Pre-Advised', stage: 1, type: 'initiation', color: 'blue' },
    { id: 'issued', name: 'Issued', stage: 1, type: 'initiation', color: 'green' },
    { id: 'advised', name: 'Advised', stage: 1, type: 'initiation', color: 'purple' },
    { id: 'acknowledged', name: 'Acknowledged', stage: 2, type: 'confirmation', color: 'amber' },
    { id: 'confirmed', name: 'Confirmed', stage: 2, type: 'confirmation', color: 'indigo' },
    { id: 'transferred', name: 'Transferred', stage: 2, type: 'confirmation', color: 'teal' },
    { id: 'amendment-requested', name: 'Amendment Requested', stage: 3, type: 'amendment', color: 'orange' },
    { id: 'amended', name: 'Amended', stage: 3, type: 'amendment', color: 'green' },
    { id: 'amendment-rejected', name: 'Amendment Rejected', stage: 3, type: 'amendment', color: 'red' },
    { id: 'documents-presented', name: 'Documents Presented', stage: 4, type: 'processing', color: 'blue' },
    { id: 'under-examination', name: 'Under Examination', stage: 4, type: 'processing', color: 'yellow' },
    { id: 'examination-completed', name: 'Examination Completed', stage: 4, type: 'processing', color: 'purple' },
    { id: 'complying-presentation', name: 'Complying Presentation', stage: 4, type: 'processing', color: 'green' },
    { id: 'discrepant-presentation', name: 'Discrepant Presentation', stage: 4, type: 'processing', color: 'red' },
    { id: 'discrepancy-waived', name: 'Discrepancy Waived', stage: 4, type: 'processing', color: 'amber' },
    { id: 'documents-refused', name: 'Documents Refused', stage: 4, type: 'processing', color: 'gray' },
    { id: 'authorized-to-pay', name: 'Authorized to Pay', stage: 5, type: 'payment', color: 'blue' },
    { id: 'negotiated', name: 'Negotiated', stage: 5, type: 'payment', color: 'indigo' },
    { id: 'accepted', name: 'Accepted', stage: 5, type: 'payment', color: 'purple' },
    { id: 'reimbursement-claimed', name: 'Reimbursement Claimed', stage: 5, type: 'payment', color: 'green' },
    { id: 'paid', name: 'Paid', stage: 5, type: 'payment', color: 'emerald' },
    { id: 'discharged', name: 'Discharged', stage: 5, type: 'payment', color: 'teal' },
    { id: 'expired', name: 'Expired', stage: 6, type: 'terminal', color: 'red' },
    { id: 'fully-utilized', name: 'Fully Utilized', stage: 6, type: 'terminal', color: 'blue' },
    { id: 'cancelled', name: 'Cancelled', stage: 6, type: 'terminal', color: 'gray' },
    { id: 'ceased', name: 'Ceased', stage: 6, type: 'terminal', color: 'orange' },
    { id: 'suspended', name: 'Suspended', stage: 6, type: 'terminal', color: 'yellow' },
    { id: 'under-investigation', name: 'Under Investigation', stage: 6, type: 'terminal', color: 'purple' },
    { id: 'blocked', name: 'Blocked', stage: 6, type: 'terminal', color: 'red' }
  ];

  const getStateColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 border-blue-300 text-blue-900',
      green: 'bg-green-100 border-green-300 text-green-900',
      purple: 'bg-purple-100 border-purple-300 text-purple-900',
      amber: 'bg-amber-100 border-amber-300 text-amber-900',
      indigo: 'bg-indigo-100 border-indigo-300 text-indigo-900',
      teal: 'bg-teal-100 border-teal-300 text-teal-900',
      orange: 'bg-orange-100 border-orange-300 text-orange-900',
      red: 'bg-red-100 border-red-300 text-red-900',
      yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
      gray: 'bg-gray-100 border-gray-300 text-gray-900',
      emerald: 'bg-emerald-100 border-emerald-300 text-emerald-900'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getStageTitle = (stage: number) => {
    const titles = {
      1: 'Initiation & Setup',
      2: 'Confirmation & Transfer',
      3: 'Amendment Process',
      4: 'Document Processing & Examination',
      5: 'Payment & Settlement',
      6: 'Terminal States & Special Conditions'
    };
    return titles[stage as keyof typeof titles];
  };

  const getStageIcon = (stage: number) => {
    const icons = {
      1: <Play className="w-5 h-5" />,
      2: <CheckCircle className="w-5 h-5" />,
      3: <RefreshCw className="w-5 h-5" />,
      4: <Eye className="w-5 h-5" />,
      5: <TrendingUp className="w-5 h-5" />,
      6: <Pause className="w-5 h-5" />
    };
    return icons[stage as keyof typeof icons];
  };

  const statesByStage = lcStates.reduce((acc, state) => {
    if (!acc[state.stage]) acc[state.stage] = [];
    acc[state.stage].push(state);
    return acc;
  }, {} as Record<number, typeof lcStates>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Letter of Credit Lifecycle
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive visualization of the complete LC processing pipeline with all states and transitions
          </p>
          
          {/* Control Panel */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
              <Play className="w-4 h-4 mr-2" />
              Simulate Flow
            </Button>
            <Button variant="outline" className="border-green-200 hover:bg-green-50">
              <Download className="w-4 h-4 mr-2" />
              Export Map
            </Button>
            <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
              <FastForward className="w-4 h-4 mr-2" />
              Quick Tour
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Total States</p>
                  <p className="text-3xl font-bold text-blue-900">{lcStates.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Process Stages</p>
                  <p className="text-3xl font-bold text-green-900">6</p>
                </div>
                <Workflow className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium">Active Flows</p>
                  <p className="text-3xl font-bold text-purple-900">156</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-amber-900">98.7%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive LC Processing Pipeline */}
        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Complete LC Processing Pipeline</CardTitle>
            <CardDescription>
              Interactive flow map showing all possible states and transitions in the Letter of Credit lifecycle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-12 p-6">
              
              {Object.entries(statesByStage).map(([stage, states]) => (
                <div key={stage} className="relative">
                  
                  {/* Stage Header */}
                  <div className="flex items-center mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {stage}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{getStageTitle(parseInt(stage))}</h3>
                        <p className="text-gray-600">{states.length} possible states</p>
                      </div>
                    </div>
                    <div className="ml-auto">
                      {getStageIcon(parseInt(stage))}
                    </div>
                  </div>

                  {/* States Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {states.map((state, index) => (
                      <div
                        key={state.id}
                        className={`
                          ${getStateColor(state.color)} 
                          border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105
                          ${selectedState === state.id ? 'ring-4 ring-blue-300 shadow-xl' : ''}
                        `}
                        onClick={() => setSelectedState(selectedState === state.id ? null : state.id)}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-sm mb-2">{state.name}</div>
                          <div className="text-xs opacity-75">{state.type}</div>
                          {selectedState === state.id && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-30">
                              <div className="text-xs space-y-1">
                                <div>Stage {state.stage}</div>
                                <div>ID: {state.id}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flow Arrows */}
                  {parseInt(stage) < 6 && (
                    <div className="flex justify-center mb-4">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <div className="h-px bg-gray-300 w-16"></div>
                        <ArrowDown className="w-6 h-6" />
                        <div className="h-px bg-gray-300 w-16"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Special Flow Patterns */}
              <div className="mt-12 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Special Flow Patterns</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-amber-700 mb-2">Amendment Cycle</div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">or</span>
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">Request → Approve/Reject</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-700 mb-2">Document Review</div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">Present → Examine → Complete</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium text-red-700 mb-2">Terminal Paths</div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">Any State → Terminal</div>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
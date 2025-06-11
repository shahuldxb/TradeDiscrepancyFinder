import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  // Comprehensive state explanations for tooltips
  const stateExplanations = {
    'pre-advised': {
      title: 'Pre-Advised LC',
      description: 'A preliminary notification that an LC will be issued. This serves as an early warning to the beneficiary that a formal LC is forthcoming.',
      purpose: 'Allows beneficiary to prepare documentation and plan shipment schedules',
      duration: 'Typically 1-7 days before formal issuance',
      keyActions: ['Beneficiary preparation', 'Initial compliance check', 'Documentation planning'],
      nextStates: ['Issued', 'Cancelled'],
      regulations: 'UCP 600 Article 10 - Amendments',
      requiredDocuments: ['Pre-advice notification', 'Draft LC terms', 'Preliminary shipment details']
    },
    'issued': {
      title: 'LC Issued',
      description: 'The issuing bank has formally created and authorized the Letter of Credit. The LC is now legally binding and funds are committed.',
      purpose: 'Establishes formal payment guarantee for international trade transaction',
      duration: 'Permanent until expiry or utilization',
      keyActions: ['Bank commitment', 'Fund reservation', 'Legal obligation creation'],
      nextStates: ['Advised', 'Transferred', 'Amended'],
      regulations: 'UCP 600 Article 6 - Availability, Expiry Date and Place for Presentation',
      requiredDocuments: ['Original LC document', 'LC application form', 'Credit agreement', 'Security documents', 'Margin deposit confirmation']
    },
    'advised': {
      title: 'LC Advised',
      description: 'The advising bank has notified the beneficiary of the LC terms and conditions. The beneficiary is now aware of payment obligations.',
      purpose: 'Formal notification to beneficiary with authentication of LC validity',
      duration: '1-3 business days for processing',
      keyActions: ['Authentication verification', 'Beneficiary notification', 'Terms communication'],
      nextStates: ['Acknowledged', 'Confirmed', 'Amendment Requested'],
      regulations: 'UCP 600 Article 9 - Advising of Credits and Amendments',
      requiredDocuments: ['Original LC from issuing bank', 'Advice cover letter', 'Authentication certificate', 'SWIFT MT700']
    },
    'acknowledged': {
      title: 'LC Acknowledged',
      description: 'The beneficiary has formally acknowledged receipt and acceptance of the LC terms. Ready to proceed with shipment preparation.',
      purpose: 'Confirms beneficiary understanding and acceptance of LC conditions',
      duration: 'Acknowledgment typically within 2-5 business days',
      keyActions: ['Terms acceptance', 'Compliance confirmation', 'Shipment planning'],
      nextStates: ['Documents Presented', 'Amendment Requested'],
      regulations: 'UCP 600 Article 16 - Complying Presentation',
      requiredDocuments: ['LC acknowledgment letter', 'Terms acceptance document', 'Shipping schedule confirmation', 'Compliance checklist']
    },
    'confirmed': {
      title: 'LC Confirmed',
      description: 'A confirming bank has added its undertaking to pay, providing additional security. The beneficiary now has two bank guarantees.',
      purpose: 'Adds payment security through second bank guarantee, reducing country risk',
      duration: 'Confirmation process: 2-7 business days',
      keyActions: ['Risk assessment', 'Additional guarantee', 'Enhanced security'],
      nextStates: ['Documents Presented', 'Transferred'],
      regulations: 'UCP 600 Article 8 - Confirmation',
      requiredDocuments: ['Confirmation request', 'Risk assessment report', 'Confirming bank undertaking', 'Additional security documentation']
    },
    'transferred': {
      title: 'LC Transferred',
      description: 'The LC has been transferred to a second beneficiary, typically used when the original beneficiary is an intermediary trader.',
      purpose: 'Enables supply chain financing through LC transfer to actual supplier',
      duration: 'Transfer processing: 3-10 business days',
      keyActions: ['Beneficiary substitution', 'Terms modification', 'New obligations'],
      nextStates: ['Documents Presented', 'Amendment Requested'],
      regulations: 'UCP 600 Article 38 - Transferable Credits',
      requiredDocuments: ['Transfer request', 'Second beneficiary details', 'Modified LC terms', 'Transfer fees documentation', 'Original transferable LC']
    },
    'amendment-requested': {
      title: 'Amendment Requested',
      description: 'A change to the LC terms has been requested by the applicant. All parties must agree to modifications before implementation.',
      purpose: 'Accommodates changes in commercial terms or shipping requirements',
      duration: 'Amendment processing: 2-10 business days',
      keyActions: ['Change proposal', 'Party consultation', 'Agreement negotiation'],
      nextStates: ['Amended', 'Amendment Rejected'],
      regulations: 'UCP 600 Article 10 - Amendments',
      requiredDocuments: ['Amendment request form', 'Justification for changes', 'Revised commercial terms', 'Party consent letters', 'Amendment fees']
    },
    'amended': {
      title: 'LC Amended',
      description: 'The LC terms have been successfully modified with agreement from all parties. New terms are now in effect.',
      purpose: 'Updates LC conditions to reflect changed commercial requirements',
      duration: 'Amendment becomes effective immediately upon acceptance',
      keyActions: ['Terms modification', 'Party agreement', 'Updated obligations'],
      nextStates: ['Documents Presented', 'Further Amendment Requested'],
      regulations: 'UCP 600 Article 10 - Amendments',
      requiredDocuments: ['Amended LC document', 'Party acceptance confirmations', 'Updated terms documentation', 'Amendment notification letter', 'SWIFT MT707']
    },
    'amendment-rejected': {
      title: 'Amendment Rejected',
      description: 'The proposed amendment has been rejected by one or more parties. Original LC terms remain in effect.',
      purpose: 'Maintains original terms when parties cannot agree on modifications',
      duration: 'Rejection is immediate, original terms continue',
      keyActions: ['Rejection notification', 'Original terms retention', 'Alternative solutions'],
      nextStates: ['Documents Presented', 'New Amendment Request', 'Cancelled'],
      regulations: 'UCP 600 Article 10 - Amendments',
      requiredDocuments: ['Rejection notice', 'Original LC terms confirmation', 'Reason for rejection', 'Alternative proposal suggestions']
    },
    'documents-presented': {
      title: 'Documents Presented',
      description: 'The beneficiary has submitted all required documents to the nominated bank for examination and payment processing.',
      purpose: 'Initiates payment process through document compliance verification',
      duration: 'Presentation window as specified in LC terms',
      keyActions: ['Document submission', 'Compliance check initiation', 'Payment request'],
      nextStates: ['Under Examination'],
      regulations: 'UCP 600 Article 14 - Standard for Examination of Documents',
      requiredDocuments: ['Commercial Invoice', 'Bill of Lading/Transport Document', 'Insurance Certificate', 'Certificate of Origin', 'Packing List', 'Inspection Certificate', 'Draft/Bill of Exchange', 'Beneficiary Certificate']
    },
    'under-examination': {
      title: 'Under Examination',
      description: 'Bank experts are reviewing submitted documents for compliance with LC terms. This is a critical quality control phase.',
      purpose: 'Ensures document compliance before authorizing payment',
      duration: 'Maximum 5 banking days from presentation (UCP 600)',
      keyActions: ['Document analysis', 'Compliance verification', 'Discrepancy identification'],
      nextStates: ['Examination Completed'],
      regulations: 'UCP 600 Article 14 - Standard for Examination of Documents'
    },
    'examination-completed': {
      title: 'Examination Completed',
      description: 'Document examination is finished. Results determine whether presentation complies with LC terms or contains discrepancies.',
      purpose: 'Concludes compliance assessment and determines next steps',
      duration: 'Completion within maximum examination period',
      keyActions: ['Final assessment', 'Decision communication', 'Next step determination'],
      nextStates: ['Complying Presentation', 'Discrepant Presentation'],
      regulations: 'UCP 600 Article 16 - Complying Presentation'
    },
    'complying-presentation': {
      title: 'Complying Presentation',
      description: 'All documents comply with LC terms. The bank is obligated to honor the LC and make payment to the beneficiary.',
      purpose: 'Confirms successful compliance and triggers payment obligation',
      duration: 'Payment processed according to LC terms',
      keyActions: ['Compliance confirmation', 'Payment authorization', 'Fund transfer'],
      nextStates: ['Authorized to Pay', 'Paid'],
      regulations: 'UCP 600 Article 16 - Complying Presentation'
    },
    'discrepant-presentation': {
      title: 'Discrepant Presentation',
      description: 'Documents contain discrepancies that do not comply with LC terms. Payment is conditional on applicant waiver or document correction.',
      purpose: 'Identifies non-compliance issues requiring resolution',
      duration: 'Resolution depends on discrepancy type and party response',
      keyActions: ['Discrepancy notification', 'Waiver request', 'Correction opportunity'],
      nextStates: ['Discrepancy Waived', 'Documents Refused', 'Documents Re-presented'],
      regulations: 'UCP 600 Article 16 - Complying Presentation'
    },
    'discrepancy-waived': {
      title: 'Discrepancy Waived',
      description: 'The applicant has accepted the discrepancies and authorized payment despite non-compliance. Commercial considerations override technical compliance.',
      purpose: 'Allows payment despite technical discrepancies when commercially acceptable',
      duration: 'Waiver decision typically within 1-3 business days',
      keyActions: ['Applicant decision', 'Waiver authorization', 'Payment approval'],
      nextStates: ['Authorized to Pay', 'Paid'],
      regulations: 'UCP 600 Article 16 - Complying Presentation'
    },
    'documents-refused': {
      title: 'Documents Refused',
      description: 'The applicant has refused to waive discrepancies and the bank declines payment. Documents are returned to the presenting bank.',
      purpose: 'Protects applicant from non-compliant presentation',
      duration: 'Refusal communicated within maximum examination period',
      keyActions: ['Refusal notification', 'Document return', 'Alternative solutions'],
      nextStates: ['Documents Re-presented', 'Expired', 'Cancelled'],
      regulations: 'UCP 600 Article 16 - Complying Presentation'
    },
    'authorized-to-pay': {
      title: 'Authorized to Pay',
      description: 'The bank has authorized payment to the beneficiary. Funds are committed and payment processing begins.',
      purpose: 'Confirms payment commitment and initiates fund transfer process',
      duration: 'Authorization immediate, payment per LC terms',
      keyActions: ['Payment authorization', 'Fund commitment', 'Transfer initiation'],
      nextStates: ['Paid', 'Negotiated'],
      regulations: 'UCP 600 Article 7 - Issuing Bank Undertaking'
    },
    'negotiated': {
      title: 'LC Negotiated',
      description: 'A nominated bank has examined documents and agreed to purchase/discount them, providing immediate funds to the beneficiary.',
      purpose: 'Provides immediate liquidity to beneficiary before maturity',
      duration: 'Negotiation can occur immediately upon compliant presentation',
      keyActions: ['Document purchase', 'Immediate payment', 'Risk assumption'],
      nextStates: ['Reimbursement Claimed', 'Paid'],
      regulations: 'UCP 600 Article 2 - Definitions (Negotiation)'
    },
    'accepted': {
      title: 'Draft Accepted',
      description: 'A time draft has been accepted by the drawee bank, creating a formal payment obligation at a future date.',
      purpose: 'Creates legally binding payment obligation for deferred payment',
      duration: 'Acceptance immediate, payment at maturity date',
      keyActions: ['Draft acceptance', 'Maturity date setting', 'Payment commitment'],
      nextStates: ['Paid at Maturity', 'Discharged'],
      regulations: 'UCP 600 Article 7 - Issuing Bank Undertaking'
    },
    'reimbursement-claimed': {
      title: 'Reimbursement Claimed',
      description: 'The nominated/confirming bank has claimed reimbursement from the issuing bank for payments made to the beneficiary.',
      purpose: 'Recovers funds paid to beneficiary from the issuing bank',
      duration: 'Claim processing: 1-5 business days',
      keyActions: ['Claim submission', 'Documentation verification', 'Fund recovery'],
      nextStates: ['Paid', 'Discharged'],
      regulations: 'UCP 600 Article 13 - Reimbursement Undertakings'
    },
    'paid': {
      title: 'LC Paid',
      description: 'Payment has been successfully made to the beneficiary. The commercial transaction is financially complete.',
      purpose: 'Completes financial obligation and confirms successful LC utilization',
      duration: 'Payment final and irrevocable',
      keyActions: ['Fund transfer completion', 'Payment confirmation', 'Transaction closure'],
      nextStates: ['Discharged', 'Fully Utilized'],
      regulations: 'UCP 600 Article 7 - Issuing Bank Undertaking'
    },
    'discharged': {
      title: 'LC Discharged',
      description: 'All obligations under the LC have been fulfilled and the LC is formally closed. No further claims can be made.',
      purpose: 'Formally closes LC and releases all party obligations',
      duration: 'Discharge is permanent and final',
      keyActions: ['Obligation completion', 'Formal closure', 'Record finalization'],
      nextStates: ['Terminal State'],
      regulations: 'UCP 600 Article 6 - Availability, Expiry Date and Place for Presentation'
    },
    'expired': {
      title: 'LC Expired',
      description: 'The LC has passed its expiry date without utilization. No further presentations can be made and the LC is void.',
      purpose: 'Automatic termination based on time limits',
      duration: 'Expiry is permanent based on specified date',
      keyActions: ['Automatic termination', 'Unused commitment release', 'Final status'],
      nextStates: ['Terminal State'],
      regulations: 'UCP 600 Article 6 - Availability, Expiry Date and Place for Presentation'
    },
    'fully-utilized': {
      title: 'Fully Utilized',
      description: 'The entire LC amount has been drawn and paid. The LC cannot be used for additional payments.',
      purpose: 'Indicates complete financial utilization of LC facility',
      duration: 'Utilization is final and complete',
      keyActions: ['Complete utilization', 'Amount exhaustion', 'Facility closure'],
      nextStates: ['Discharged'],
      regulations: 'UCP 600 Article 6 - Availability, Expiry Date and Place for Presentation'
    },
    'cancelled': {
      title: 'LC Cancelled',
      description: 'The LC has been formally cancelled by mutual agreement of all parties or due to specific circumstances.',
      purpose: 'Terminates LC by agreement rather than natural expiry',
      duration: 'Cancellation is immediate and final',
      keyActions: ['Formal cancellation', 'Party agreement', 'Obligation release'],
      nextStates: ['Terminal State'],
      regulations: 'UCP 600 Article 10 - Amendments'
    },
    'ceased': {
      title: 'LC Ceased',
      description: 'The LC has been terminated due to specific events or conditions that make continuation impossible or inappropriate.',
      purpose: 'Handles termination due to exceptional circumstances',
      duration: 'Cessation is immediate upon triggering event',
      keyActions: ['Event-triggered termination', 'Immediate cessation', 'Special handling'],
      nextStates: ['Terminal State'],
      regulations: 'UCP 600 Article 36 - Force Majeure'
    },
    'suspended': {
      title: 'LC Suspended',
      description: 'The LC operations are temporarily halted pending resolution of specific issues or investigations.',
      purpose: 'Temporary halt for investigation or issue resolution',
      duration: 'Suspension until issues resolved',
      keyActions: ['Temporary halt', 'Issue investigation', 'Resolution pending'],
      nextStates: ['Under Investigation', 'Resumed', 'Cancelled'],
      regulations: 'Banking regulations and internal procedures'
    },
    'under-investigation': {
      title: 'Under Investigation',
      description: 'The LC is subject to formal investigation for potential fraud, compliance issues, or other serious concerns.',
      purpose: 'Investigates potential irregularities or compliance breaches',
      duration: 'Investigation period varies by complexity',
      keyActions: ['Formal investigation', 'Evidence gathering', 'Compliance review'],
      nextStates: ['Blocked', 'Suspended', 'Cleared'],
      regulations: 'Anti-fraud and compliance regulations'
    },
    'blocked': {
      title: 'LC Blocked',
      description: 'The LC is formally blocked due to legal, regulatory, or security concerns. All operations are prohibited until clearance.',
      purpose: 'Prevents operations due to serious legal or security concerns',
      duration: 'Block remains until legal/regulatory clearance',
      keyActions: ['Formal blocking', 'Legal hold', 'Regulatory compliance'],
      nextStates: ['Under Investigation', 'Cancelled'],
      regulations: 'Sanctions, AML, and security regulations'
    }
  };

  // Sample data for demonstration with all states
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
        
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Letter of Credit Lifecycle
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Interactive visualization of the complete LC processing pipeline with contextual state explanations
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
                Interactive flow map with contextual explanations - hover over any state for detailed information
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

                    {/* States Grid with Tooltips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                      {states.map((state) => {
                        const explanation = stateExplanations[state.id as keyof typeof stateExplanations];
                        return (
                          <Tooltip key={state.id}>
                            <TooltipTrigger asChild>
                              <div
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
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm p-4 bg-white shadow-xl border border-gray-200 rounded-lg">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-bold text-gray-900 mb-1">{explanation?.title || state.name}</h4>
                                  <p className="text-sm text-gray-700 leading-relaxed">{explanation?.description}</p>
                                </div>
                                
                                {explanation?.purpose && (
                                  <div>
                                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Purpose</div>
                                    <div className="text-sm text-gray-600">{explanation.purpose}</div>
                                  </div>
                                )}
                                
                                {explanation?.duration && (
                                  <div>
                                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Duration</div>
                                    <div className="text-sm text-gray-600">{explanation.duration}</div>
                                  </div>
                                )}
                                
                                {explanation?.keyActions && explanation.keyActions.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Key Actions</div>
                                    <div className="flex flex-wrap gap-1">
                                      {explanation.keyActions.map((action, idx) => (
                                        <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                          {action}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {explanation?.nextStates && explanation.nextStates.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Next States</div>
                                    <div className="text-sm text-gray-600">{explanation.nextStates.join(', ')}</div>
                                  </div>
                                )}
                                
                                {explanation?.regulations && (
                                  <div>
                                    <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Regulations</div>
                                    <div className="text-xs text-gray-500 italic">{explanation.regulations}</div>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
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
    </TooltipProvider>
  );
}
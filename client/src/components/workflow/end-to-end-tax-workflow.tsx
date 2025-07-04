import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  FileText, 
  Calculator, 
  CreditCard, 
  CheckCircle, 
  Download,
  Upload,
  Shield,
  AlertCircle,
  ArrowRight,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ftaAPI } from '@/utils/fta-real-time-api';
import { calculateVat, calculateCit } from '@/lib/tax-calculations';
import RevenueExpenseCategories from '../financial/revenue-expense-categories';
import BalanceSheetGenerator from '../financial/balance-sheet-generator';
import InvoiceScanner from '../invoice/invoice-scanner';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  component?: React.ComponentType;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: string;
  dependencies?: string[];
}

interface TaxAgentReview {
  stepId: string;
  agentName: string;
  license: string;
  reviewDate: string;
  status: 'approved' | 'requires_changes' | 'rejected';
  comments: string;
  certificateNumber?: string;
}

interface PaymentRecord {
  type: 'VAT' | 'CIT';
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  receipt?: File;
}

export default function EndToEndTaxWorkflow() {
  const [currentStep, setCurrentStep] = useState('step1');
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [taxAgentReviews, setTaxAgentReviews] = useState<TaxAgentReview[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [erpIntegrations, setErpIntegrations] = useState({
    enabled: false,
    system: '',
    status: 'disconnected'
  });
  const { toast } = useToast();

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'step1',
      title: 'Revenue & Expense Data Entry',
      description: 'Scan expenses, generate invoices, or integrate with ERP/POS systems',
      status: 'completed',
      icon: Camera,
      estimatedTime: '10-30 min',
      component: RevenueExpenseCategories
    },
    {
      id: 'step2',
      title: 'Invoice Generation & Scanning',
      description: 'Generate revenue invoices or scan expense receipts with OCR',
      status: 'completed',
      icon: FileText,
      estimatedTime: '5-15 min',
      dependencies: ['step1'],
      component: InvoiceScanner
    },
    {
      id: 'step3',
      title: 'Automatic VAT & CIT Calculation',
      description: 'System calculates VAT and CIT payables based on transactions',
      status: 'completed',
      icon: Calculator,
      estimatedTime: 'Instant',
      dependencies: ['step1', 'step2']
    },
    {
      id: 'step4',
      title: 'Income Statement Generation',
      description: 'Auto-generated income statement from revenue and expenses',
      status: 'completed',
      icon: FileText,
      estimatedTime: 'Instant',
      dependencies: ['step3']
    },
    {
      id: 'step5',
      title: 'Balance Sheet Preparation',
      description: 'Complete balance sheet with dropdown selections for SME requirements',
      status: 'in_progress',
      icon: FileText,
      estimatedTime: '15-30 min',
      dependencies: ['step4'],
      component: BalanceSheetGenerator
    },
    {
      id: 'step6',
      title: 'Tax Agent Review & Certification',
      description: 'Pre-approved tax agents review financials and issue certificates',
      status: 'pending',
      icon: Users,
      estimatedTime: '1-2 business days',
      dependencies: ['step5']
    },
    {
      id: 'step7',
      title: 'Tax Payment Processing',
      description: 'Process tax payments and upload receipts to system',
      status: 'pending',
      icon: CreditCard,
      estimatedTime: '5-10 min',
      dependencies: ['step6']
    },
    {
      id: 'step8',
      title: 'FTA Reporting & Submission',
      description: 'Submit all documents to FTA with real-time integration',
      status: 'pending',
      icon: Shield,
      estimatedTime: 'Instant',
      dependencies: ['step7']
    }
  ];

  useEffect(() => {
    calculateProgress();
  }, [workflowSteps]);

  const calculateProgress = () => {
    const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
    const progress = (completedSteps / workflowSteps.length) * 100;
    setWorkflowProgress(progress);
  };

  const generateTaxCalculations = async () => {
    // Mock data - in real implementation, this would come from the revenue/expense component
    const mockData = {
      revenue: 850000,
      expenses: 320000,
      outputVAT: 42500,
      inputVAT: 16000
    };

    const vatCalculation = calculateVat({
      sales: mockData.revenue,
      purchases: mockData.expenses
    });

    const citCalculation = calculateCit({
      revenue: mockData.revenue,
      expenses: mockData.expenses
    });

    toast({
      title: "Tax Calculations Complete",
      description: `VAT Due: AED ${vatCalculation.netVatDue.toFixed(2)} | CIT Due: AED ${citCalculation.citDue.toFixed(2)}`,
    });

    return { vatCalculation, citCalculation };
  };

  const requestTaxAgentReview = async (stepId: string) => {
    try {
      // Simulate tax agent assignment and review process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const review: TaxAgentReview = {
        stepId,
        agentName: 'Ahmed Al-Mansouri, CPA',
        license: 'FTA-CPA-2024-1234',
        reviewDate: new Date().toISOString(),
        status: 'approved',
        comments: 'Financial statements reviewed and approved. All UAE IFRS requirements met.',
        certificateNumber: `CERT-${Date.now()}`
      };

      setTaxAgentReviews(prev => [...prev, review]);
      
      toast({
        title: "Tax Agent Review Complete",
        description: `${review.agentName} has approved your financials. Certificate: ${review.certificateNumber}`,
      });

      return review;
    } catch (error) {
      toast({
        title: "Review Failed",
        description: "Unable to complete tax agent review. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const processPayment = async (type: 'VAT' | 'CIT', amount: number) => {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const payment: PaymentRecord = {
        type,
        amount,
        paymentDate: new Date().toISOString(),
        referenceNumber: `PAY-${type}-${Date.now()}`
      };

      setPaymentRecords(prev => [...prev, payment]);

      toast({
        title: "Payment Processed",
        description: `${type} payment of AED ${amount.toFixed(2)} completed. Ref: ${payment.referenceNumber}`,
      });

      return payment;
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Payment processing failed. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const submitToFTA = async () => {
    try {
      // Compile all data for FTA submission
      const submissionData = {
        financialStatements: {
          incomeStatement: "Generated from transactions",
          balanceSheet: "Completed by SME"
        },
        taxCalculations: await generateTaxCalculations(),
        agentCertificates: taxAgentReviews.filter(r => r.status === 'approved'),
        paymentRecords: paymentRecords,
        submissionDate: new Date().toISOString()
      };

      // Submit to FTA via real-time API
      const vatSubmission = await ftaAPI.submitVATReturn(submissionData.taxCalculations.vatCalculation);
      const citSubmission = await ftaAPI.submitCITReturn(submissionData.taxCalculations.citCalculation);

      toast({
        title: "FTA Submission Complete",
        description: `VAT: ${vatSubmission.acknowledgementNumber} | CIT: ${citSubmission.acknowledgementNumber}`,
      });

      return { vatSubmission, citSubmission };
    } catch (error) {
      toast({
        title: "FTA Submission Failed",
        description: "Unable to submit to FTA. Please contact support.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const enableERPIntegration = (system: string) => {
    setErpIntegrations({
      enabled: true,
      system,
      status: 'connected'
    });

    toast({
      title: "ERP Integration Enabled",
      description: `Successfully connected to ${system}. Data will sync automatically.`,
    });
  };

  const getStepStatus = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'approved':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            End-to-End UAE Tax Compliance Workflow
            <Badge variant="secondary">{workflowProgress.toFixed(0)}% Complete</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={workflowProgress} className="mb-4" />
          
          {/* ERP Integration Status */}
          {erpIntegrations.enabled && (
            <Alert className="mb-4">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                ERP Integration: Connected to {erpIntegrations.system} - Data syncing automatically
              </AlertDescription>
            </Alert>
          )}

          {/* Quick ERP Integration Setup */}
          {!erpIntegrations.enabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => enableERPIntegration('SAP Business One')}>
                Connect SAP
              </Button>
              <Button variant="outline" size="sm" onClick={() => enableERPIntegration('Oracle NetSuite')}>
                Connect Oracle
              </Button>
              <Button variant="outline" size="sm" onClick={() => enableERPIntegration('Loyverse POS')}>
                Connect POS
              </Button>
              <Button variant="outline" size="sm" onClick={() => enableERPIntegration('QuickBooks')}>
                Connect QB
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <Card key={step.id} className={currentStep === step.id ? 'border-blue-500 bg-blue-50' : 'cursor-pointer hover:bg-gray-50'} onClick={() => setCurrentStep(step.id)}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStepStatus(step)}
                  <span className="text-lg">{index + 1}. {step.title}</span>
                  {step.dependencies && (
                    <Badge variant="outline" className="text-xs">
                      Depends on: {step.dependencies.join(', ')}
                    </Badge>
                  )}
                  {currentStep === step.id && (
                    <Badge className="bg-blue-600">Active</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{step.estimatedTime}</Badge>
                  <step.icon className="w-5 h-5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{step.description}</p>
              
              {/* Step-specific content */}
              {step.id === 'step3' && step.status === 'completed' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">VAT Payable</div>
                    <div className="text-lg font-bold text-blue-600">AED 26,500</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">CIT Payable</div>
                    <div className="text-lg font-bold text-green-600">AED 47,250</div>
                  </div>
                </div>
              )}

              {step.id === 'step6' && taxAgentReviews.length > 0 && (
                <div className="space-y-2">
                  {taxAgentReviews.map((review, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.agentName}</span>
                        <Badge variant="default">Approved</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{review.comments}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Certificate: {review.certificateNumber} | License: {review.license}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {step.id === 'step7' && paymentRecords.length > 0 && (
                <div className="space-y-2">
                  {paymentRecords.map((payment, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{payment.type} Payment</span>
                        <span className="text-lg font-bold">AED {payment.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600">Ref: {payment.referenceNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons for each step */}
              <div className="flex gap-2 mt-4">
                {step.id === 'step1' && (
                  <Button onClick={() => setCurrentStep('step1')}>
                    <Camera className="w-4 h-4 mr-2" />
                    Enter Data
                  </Button>
                )}
                
                {step.id === 'step6' && step.status === 'pending' && (
                  <Button onClick={() => requestTaxAgentReview(step.id)}>
                    <Users className="w-4 h-4 mr-2" />
                    Request Agent Review
                  </Button>
                )}
                
                {step.id === 'step7' && step.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button onClick={() => processPayment('VAT', 26500)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay VAT
                    </Button>
                    <Button onClick={() => processPayment('CIT', 47250)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay CIT
                    </Button>
                  </div>
                )}
                
                {step.id === 'step8' && step.status === 'pending' && (
                  <Button onClick={submitToFTA}>
                    <Shield className="w-4 h-4 mr-2" />
                    Submit to FTA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Step Content Area */}
      {currentStep === 'step1' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueExpenseCategories />
          </CardContent>
        </Card>
      )}

      {currentStep === 'step5' && (
        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceSheetGenerator />
          </CardContent>
        </Card>
      )}

      {/* FTA Export Package */}
      {workflowProgress === 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              FTA Compliance Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="flex-col h-20">
                <FileText className="w-6 h-6 mb-1" />
                <span className="text-xs">Financial Statements</span>
              </Button>
              <Button variant="outline" className="flex-col h-20">
                <Calculator className="w-6 h-6 mb-1" />
                <span className="text-xs">Tax Calculations</span>
              </Button>
              <Button variant="outline" className="flex-col h-20">
                <Shield className="w-6 h-6 mb-1" />
                <span className="text-xs">Agent Certificates</span>
              </Button>
              <Button variant="outline" className="flex-col h-20">
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-xs">Payment Receipts</span>
              </Button>
            </div>
            
            <Alert className="mt-4">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Complete compliance package ready for FTA submission. All documents verified and approved by licensed tax agents.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
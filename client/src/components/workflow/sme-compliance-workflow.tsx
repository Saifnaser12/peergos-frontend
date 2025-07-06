import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  UserCheck,
  CreditCard,
  Send,
  Flag,
  Shield,
  Building2,
  DollarSign,
  Receipt,
  AlertCircle,
  Download,
  Eye,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'requires-action';
  icon: any;
  dueDate?: string;
  assignee?: string;
  documents?: string[];
}

interface CompliancePeriod {
  id: string;
  period: string;
  revenue: number;
  expenses: number;
  vatDue: number;
  citDue: number;
  status: 'draft' | 'calculated' | 'agent-review' | 'payment-pending' | 'submitted';
  workflow: WorkflowStep[];
}

export default function SMEComplianceWorkflow() {
  const { user, company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState('2025-07');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState<{
    type: 'REVENUE' | 'EXPENSE';
    category: string;
    description: string;
    amount: number;
    date: string;
  }>({
    type: 'REVENUE',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // CIT and VAT workflows as per FTA requirements from PDF
  const compliancePeriods: CompliancePeriod[] = [
    {
      id: '2025-07',
      period: 'July 2025',
      revenue: 101680,
      expenses: 10500,
      vatDue: 4555,
      citDue: 0,
      status: 'calculated',
      workflow: [
        {
          id: 1,
          title: '1. Revenue Recording & Data Collection',
          description: 'Invoice Generation, POS Integration, Accounting System Integration, Manual Entry with proof evidence captured via phone',
          status: 'completed',
          icon: Receipt,
          assignee: 'SME Owner',
          documents: ['Invoice_001.pdf', 'Receipt_002.pdf', 'POS_Data.csv']
        },
        {
          id: 2,
          title: '2. Expense Management & Invoice Scanning',
          description: 'Invoice scanning, system integration, automated linkage to payment sources (TAQA, WPS). All backed with proof evidence',
          status: 'completed',
          icon: FileText,
          assignee: 'SME Owner',
          documents: ['Expense_Receipts.pdf', 'TAQA_Bill.pdf', 'WPS_Records.pdf']
        },
        {
          id: 3,
          title: '3. CIT & VAT Calculation & Reporting',
          description: 'Automated calculations as per FTA rules, generate detailed income statements, standardized balance sheet, VAT return generation',
          status: 'completed',
          icon: Calculator,
          documents: ['Income_Statement.pdf', 'Balance_Sheet.pdf', 'VAT_Return.xml']
        },
        {
          id: 4,
          title: '4. Verification & Payment (Tax Agent)',
          description: 'FTA approved Tax Agent selection, verification & confirmation with e-sign and stamp, SME processes payment of tax payable, upload certificates',
          status: 'in-progress',
          icon: UserCheck,
          assignee: 'Ahmed Al-Mansouri (FTA Licensed Tax Agent)',
          dueDate: '2025-07-15',
          documents: ['Tax_Agent_Certificate.pdf']
        },
        {
          id: 5,
          title: '5. Submission & Reporting to FTA',
          description: 'FTA real-time access, automatic submission, detailed financial reports, CIT/VAT payable, payment transfer slip submission',
          status: 'pending',
          icon: Send,
          documents: ['Payment_Transfer_Slip.pdf']
        }
      ]
    },
    {
      id: '2025-06',
      period: 'June 2025 (VAT Workflow Completed)',
      revenue: 95000,
      expenses: 12000,
      vatDue: 4150,
      citDue: 0,
      status: 'submitted',
      workflow: [
        {
          id: 1,
          title: '1. Data Collection (VAT)',
          description: 'POS Integration (Direct/Automated), Invoice Scanning for SMEs without POS, FTA Approved Accounting System Integration, Data Verification',
          status: 'completed',
          icon: Receipt,
          documents: ['POS_Integration_Report.pdf', 'Scanned_Invoices.pdf', 'Accounting_System_Data.xml']
        },
        {
          id: 2,
          title: '2. Expense Management (VAT)',
          description: 'Invoice scanning for expenses, system integration, all manual entry backed with proof evidence captured using phone',
          status: 'completed',
          icon: FileText,
          documents: ['Expense_Invoices.pdf', 'Phone_Captured_Receipts.pdf']
        },
        {
          id: 3,
          title: '3. VAT Calculation & Reporting',
          description: 'VAT Calculation Engine processing, VAT Return Generation, Detailed Reports with net VAT calculation, refund processing if applicable',
          status: 'completed',
          icon: Calculator,
          documents: ['VAT_Return_June2025.xml', 'VAT_Calculation_Report.pdf']
        },
        {
          id: 4,
          title: '4. VAT Settlement Calculation',
          description: 'Net VAT calculation processing, payment transfer slip preparation, bank slip upload system integration',
          status: 'completed',
          icon: CreditCard,
          documents: ['VAT_Settlement_June2025.pdf', 'Bank_Transfer_Slip.pdf']
        },
        {
          id: 5,
          title: '5. Submission & Reporting to FTA (VAT)',
          description: 'FTA real-time access established, automatic submission processed, detailed financial report submitted, VAT payable confirmed, payment transfer slip submitted',
          status: 'completed',
          icon: Send,
          documents: ['FTA_Submission_Confirmation.pdf', 'VAT_Payment_Receipt.pdf']
        }
      ]
    }
  ];

  const currentPeriod = compliancePeriods.find(p => p.id === selectedPeriod);
  
  // Calculate overall progress
  const getOverallProgress = (workflow: WorkflowStep[]) => {
    const completedSteps = workflow.filter(step => step.status === 'completed').length;
    return (completedSteps / workflow.length) * 100;
  };

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/transactions', {
        ...data,
        transactionDate: data.date,
        vatAmount: data.type === 'REVENUE' ? data.amount * 0.05 : data.amount * 0.05
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
      toast({
        title: 'Success',
        description: 'Transaction added successfully. VAT calculated automatically.',
      });
      setNewTransaction({
        type: 'REVENUE',
        category: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add transaction',
        variant: 'destructive',
      });
    },
  });

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    addTransactionMutation.mutate(newTransaction);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* UAE FTA Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-6 w-6 text-green-600" />
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
                UAE FTA
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">SME Compliance Workflow</span>
            </div>
          </div>
          <p className="text-gray-600">
            Complete end-to-end tax compliance workflow with pre-approved tax agent verification
          </p>
        </div>

        {/* Period Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Compliance Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compliancePeriods.map((period) => (
                <div
                  key={period.id}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all",
                    selectedPeriod === period.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedPeriod(period.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{period.period}</h3>
                    <Badge 
                      className={
                        period.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        period.status === 'calculated' ? 'bg-blue-100 text-blue-800' :
                        period.status === 'agent-review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {period.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Revenue: {formatCurrency(period.revenue, 'AED', 'en-AE')}</p>
                    <p>VAT Due: {formatCurrency(period.vatDue, 'AED', 'en-AE')}</p>
                  </div>
                  <Progress value={getOverallProgress(period.workflow)} className="mt-2 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {currentPeriod && (
          <>
            {/* Current Period Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Revenue</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatCurrency(currentPeriod.revenue, 'AED', 'en-AE')}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">Total Expenses</p>
                      <p className="text-xl font-bold text-red-900">
                        {formatCurrency(currentPeriod.expenses, 'AED', 'en-AE')}
                      </p>
                    </div>
                    <Receipt className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">VAT Due</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(currentPeriod.vatDue, 'AED', 'en-AE')}
                      </p>
                    </div>
                    <Calculator className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">CIT Due</p>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(currentPeriod.citDue, 'AED', 'en-AE')}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Compliance Workflow - {currentPeriod.period}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Overall Progress:</span>
                    <span className="font-semibold">{Math.round(getOverallProgress(currentPeriod.workflow))}%</span>
                  </div>
                </div>
                <Progress value={getOverallProgress(currentPeriod.workflow)} className="h-3" />
              </CardHeader>
              <CardContent className="space-y-6">
                {currentPeriod.workflow.map((step, index) => {
                  const Icon = step.icon;
                  const isLastStep = index === currentPeriod.workflow.length - 1;
                  
                  return (
                    <div key={step.id} className="relative">
                      <div className="flex items-start gap-4">
                        {/* Step Icon */}
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-full border-2",
                          step.status === 'completed' ? 'bg-green-100 border-green-500' :
                          step.status === 'in-progress' ? 'bg-blue-100 border-blue-500' :
                          step.status === 'requires-action' ? 'bg-yellow-100 border-yellow-500' :
                          'bg-gray-100 border-gray-300'
                        )}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : step.status === 'in-progress' ? (
                            <Clock className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Icon className={cn(
                              "h-6 w-6",
                              step.status === 'requires-action' ? 'text-yellow-600' : 'text-gray-400'
                            )} />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                            <Badge 
                              className={
                                step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                step.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                step.status === 'requires-action' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {step.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{step.description}</p>
                          
                          {/* Step Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {step.assignee && (
                              <div className="flex items-center gap-2 text-sm">
                                <UserCheck className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Assignee:</span>
                                <span className="font-medium">{step.assignee}</span>
                              </div>
                            )}
                            
                            {step.dueDate && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Due:</span>
                                <span className="font-medium">{step.dueDate}</span>
                              </div>
                            )}
                          </div>
                          
                          {step.documents && step.documents.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Documents:</h4>
                              <div className="space-y-2">
                                {step.documents.map((doc, docIndex) => (
                                  <div key={docIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm">{doc}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons for Current Step */}
                          {step.status === 'in-progress' && step.id === 1 && (
                            <div className="mt-4 space-y-3">
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => setShowAddTransaction(true)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Add Revenue/Expense
                                </Button>
                                <Button variant="outline">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Documents
                                </Button>
                              </div>
                              <Alert className="border-blue-200 bg-blue-50">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                  <strong>Data Collection Methods:</strong> Choose the most efficient method for your business:
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div className="p-2 bg-white rounded border">📱 Mobile Receipt Capture</div>
                                    <div className="p-2 bg-white rounded border">🏪 POS System Integration</div>
                                    <div className="p-2 bg-white rounded border">💳 Bank Feed Connection</div>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}

                          {step.status === 'in-progress' && step.id === 4 && (
                            <div className="mt-4 space-y-3">
                              <Alert className="border-yellow-200 bg-yellow-50">
                                <UserCheck className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                  <strong>FTA Approved Tax Agent Review:</strong> Ahmed Al-Mansouri is verifying calculations and will provide 
                                  e-signature and stamp as per FTA requirements. SME can then process tax payment.
                                </AlertDescription>
                              </Alert>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-medium text-blue-900 mb-2">Tax Agent Process (Per PDF):</h5>
                                <ul className="text-sm text-blue-800 space-y-1">
                                  <li>1. Selection from FTA approved list</li>
                                  <li>2. Verification & confirmation with e-sign and stamp</li>
                                  <li>3. SME processes payment of tax payable</li>
                                  <li>4. Upload tax agent certificate & bank slip</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {step.status === 'pending' && step.id === 5 && (
                            <Alert className="mt-4 border-purple-200 bg-purple-50">
                              <Send className="h-4 w-4 text-purple-600" />
                              <AlertDescription className="text-purple-800">
                                <strong>Ready for FTA Submission:</strong> All data stored in UAE cloud. FTA will have real-time access to all SME data via TRN number. 
                                Automatic submission will include detailed financials, tax payables, and payment transfer slips.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>

                      {/* Connector Line */}
                      {!isLastStep && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Add Transaction Modal */}
            {showAddTransaction && (
              <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Add Revenue/Expense Transaction</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={newTransaction.type === 'REVENUE' ? 'default' : 'outline'}
                          onClick={() => setNewTransaction(prev => ({ ...prev, type: 'REVENUE' }))}
                          className="flex-1"
                        >
                          Revenue
                        </Button>
                        <Button
                          variant={newTransaction.type === 'EXPENSE' ? 'default' : 'outline'}
                          onClick={() => setNewTransaction(prev => ({ ...prev, type: 'EXPENSE' }))}
                          className="flex-1"
                        >
                          Expense
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Category</option>
                        {newTransaction.type === 'REVENUE' ? (
                          <>
                            <option value="Service Revenue">Service Revenue</option>
                            <option value="Product Sales">Product Sales</option>
                            <option value="Consultation Fees">Consultation Fees</option>
                            <option value="Software Licensing">Software Licensing</option>
                            <option value="Subscription Revenue">Subscription Revenue</option>
                            <option value="Commission Income">Commission Income</option>
                            <option value="Rental Income">Rental Income</option>
                            <option value="Interest Income">Interest Income</option>
                            <option value="Other Revenue">Other Revenue</option>
                          </>
                        ) : (
                          <>
                            <optgroup label="Operating Expenses">
                              <option value="Office Rent">Office Rent</option>
                              <option value="Utilities">Utilities (DEWA, Etisalat, etc.)</option>
                              <option value="Office Supplies">Office Supplies</option>
                              <option value="Marketing & Advertising">Marketing & Advertising</option>
                              <option value="Professional Services">Professional Services</option>
                              <option value="Software & Technology">Software & Technology</option>
                            </optgroup>
                            <optgroup label="Staff & HR">
                              <option value="Salaries & Wages">Salaries & Wages</option>
                              <option value="Employee Benefits">Employee Benefits</option>
                              <option value="Training & Development">Training & Development</option>
                              <option value="Visa & Labor Costs">Visa & Labor Costs</option>
                            </optgroup>
                            <optgroup label="Business Operations">
                              <option value="Travel & Transportation">Travel & Transportation</option>
                              <option value="Business Insurance">Business Insurance</option>
                              <option value="License & Permits">License & Permits</option>
                              <option value="Bank Charges">Bank Charges</option>
                              <option value="Legal & Compliance">Legal & Compliance</option>
                            </optgroup>
                            <optgroup label="Assets & Equipment">
                              <option value="Equipment Purchase">Equipment Purchase</option>
                              <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                              <option value="Depreciation">Depreciation</option>
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter transaction description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount (AED)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="text-right"
                      />
                      {newTransaction.amount > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Amount (Excl. VAT):</span>
                            <span>AED {(newTransaction.amount / 1.05).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VAT (5%):</span>
                            <span>AED {(newTransaction.amount - (newTransaction.amount / 1.05)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Total (Incl. VAT):</span>
                            <span>AED {newTransaction.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the total amount including VAT. VAT will be calculated automatically.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="date">Transaction Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddTransaction(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddTransaction}
                      disabled={addTransactionMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {addTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Key Features from PDF */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Shield className="h-5 w-5" />
              PDF Workflow Features Implemented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-green-900 mb-3">Data Collection & Entry</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ Phone evidence capture for manual entry</li>
                  <li>✓ POS Integration (Direct/Omnivore)</li>
                  <li>✓ FTA Approved Accounting System Integration</li>
                  <li>✓ Invoice scanning for SMEs without POS</li>
                  <li>✓ TAQA & WPS payment source integration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Calculations & Reporting</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Automated CIT & VAT calculation engines</li>
                  <li>✓ Tax agent-approved rates implementation</li>
                  <li>✓ Standardized financial statements with notes</li>
                  <li>✓ VAT return generation and processing</li>
                  <li>✓ Net VAT calculation with refund support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-3">FTA Integration & Submission</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>✓ UAE cloud storage with FTA real-time access</li>
                  <li>✓ TRN-based data access for FTA</li>
                  <li>✓ Automatic submission capabilities</li>
                  <li>✓ Tax agent e-sign and stamp verification</li>
                  <li>✓ Payment gateway integration readiness</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Peergos Solutions • FTA's Reliable Partner for Tax Management</p>
          <p className="mt-1">Complete CIT & VAT Workflows • UAE Cloud • Pre-approved Tax Agent Integration</p>
        </div>
      </div>
    </div>
  );
}
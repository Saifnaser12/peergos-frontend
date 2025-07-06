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
  const [newTransaction, setNewTransaction] = useState({
    type: 'REVENUE' as const,
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Mock compliance periods (in real app, this would come from API)
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
          title: 'Revenue & Expense Entry',
          description: 'Record all business transactions with supporting documents',
          status: 'completed',
          icon: Receipt,
          assignee: 'SME Owner',
          documents: ['Invoice_001.pdf', 'Receipt_002.pdf']
        },
        {
          id: 2,
          title: 'Automatic VAT/CIT Calculation',
          description: 'System calculates tax obligations based on FTA rules',
          status: 'completed',
          icon: Calculator,
        },
        {
          id: 3,
          title: 'Tax Agent Review',
          description: 'Pre-approved tax agent verifies calculations and compliance',
          status: 'in-progress',
          icon: UserCheck,
          assignee: 'Ahmed Al-Mansouri (Licensed Tax Agent)',
          dueDate: '2025-07-15'
        },
        {
          id: 4,
          title: 'Payment Processing',
          description: 'Process tax payment through FTA payment gateway',
          status: 'pending',
          icon: CreditCard,
        },
        {
          id: 5,
          title: 'FTA Submission',
          description: 'Submit final returns and documentation to FTA',
          status: 'pending',
          icon: Send,
        }
      ]
    },
    {
      id: '2025-06',
      period: 'June 2025',
      revenue: 95000,
      expenses: 12000,
      vatDue: 4150,
      citDue: 0,
      status: 'submitted',
      workflow: [
        {
          id: 1,
          title: 'Revenue & Expense Entry',
          description: 'Record all business transactions with supporting documents',
          status: 'completed',
          icon: Receipt,
        },
        {
          id: 2,
          title: 'Automatic VAT/CIT Calculation',
          description: 'System calculates tax obligations based on FTA rules',
          status: 'completed',
          icon: Calculator,
        },
        {
          id: 3,
          title: 'Tax Agent Review',
          description: 'Pre-approved tax agent verifies calculations and compliance',
          status: 'completed',
          icon: UserCheck,
        },
        {
          id: 4,
          title: 'Payment Processing',
          description: 'Process tax payment through FTA payment gateway',
          status: 'completed',
          icon: CreditCard,
        },
        {
          id: 5,
          title: 'FTA Submission',
          description: 'Submit final returns and documentation to FTA',
          status: 'completed',
          icon: Send,
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
      return apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          transactionDate: data.date,
          vatAmount: data.type === 'REVENUE' ? data.amount * 0.05 : data.amount * 0.05
        }),
      });
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
                            <div className="mt-4 flex gap-2">
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
                          )}

                          {step.status === 'in-progress' && step.id === 3 && (
                            <Alert className="mt-4 border-blue-200 bg-blue-50">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800">
                                <strong>Tax Agent Review in Progress:</strong> Ahmed Al-Mansouri is currently reviewing your 
                                calculations and supporting documentation. You will be notified once the review is complete.
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
                      <Input
                        id="category"
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                        placeholder={newTransaction.type === 'REVENUE' ? 'Service Revenue' : 'Office Supplies'}
                      />
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
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">VAT will be calculated automatically at 5%</p>
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

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Peergos Solutions • Complete SME Tax Compliance Workflow</p>
          <p className="mt-1">Pre-approved Tax Agent Integration • FTA Direct Submission</p>
        </div>
      </div>
    </div>
  );
}
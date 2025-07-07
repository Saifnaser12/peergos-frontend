import { useState } from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/business-logic';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import ExpenseScanner, { ProcessedExpenseData } from '@/components/expense/expense-scanner';
import ExpenseAuditTrail from '@/components/expense/expense-audit-trail';
import POSIntegrationPanel from '@/components/integrations/pos-integration-panel';
import BankFeedPanel from '@/components/integrations/bank-feed-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TransactionForm from '@/components/accounting/transaction-form';
import FinancialStatements from '@/components/accounting/financial-statements';
import { 
  Plus, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  FileText,
  Info,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/i18n';

export default function Accounting() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'REVENUE' | 'EXPENSE'>('REVENUE');
  const [activeTab, setActiveTab] = useState('overview');
  const [scannedExpenses, setScannedExpenses] = useState<ProcessedExpenseData[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<ProcessedExpenseData | null>(null);
  const [filter, setFilter] = useState('all');
  const { company, user } = useAuth();
  const { language, t } = useLanguage();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: kpiData = [] } = useQuery({
    queryKey: ['/api/kpi-data', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Calculate metrics from real data using business logic
  const typedTransactions = transactions as any[];
  
  // Only calculate if we have real transactions
  const hasTransactions = typedTransactions.length > 0;
  const revenue = hasTransactions ? typedTransactions.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) : 0;
  const expenses = hasTransactions ? typedTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) : 0;
  const netIncome = revenue - expenses;
  const currentKpi = kpiData.length > 0 ? kpiData[0] : null;
  const vatDue = hasTransactions && currentKpi ? parseFloat(currentKpi.vatDue || '0') : 0;

  // Filter transactions
  const filteredTransactions = typedTransactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const openAddTransaction = (type: 'REVENUE' | 'EXPENSE') => {
    setTransactionType(type);
    setShowTransactionForm(true);
  };

  // Handle expense scanner events
  const handleExpenseExtracted = (expense: ProcessedExpenseData) => {
    setScannedExpenses(prev => [...prev, expense]);
    console.log('New expense scanned:', expense);
  };

  const handleViewOriginal = (expense: ProcessedExpenseData) => {
    setSelectedExpense(expense);
    const imageUrl = URL.createObjectURL(expense.originalFile);
    window.open(imageUrl, '_blank');
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Enhanced Header with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border">
        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounting & Bookkeeping</h1>
            <p className="text-gray-600 mb-4">Track your business income and expenses for accurate tax calculations</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {typedTransactions.length} Transactions
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                VAT: {formatCurrency(vatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => openAddTransaction('REVENUE')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <ArrowUpRight size={16} />
              Add Revenue
            </Button>
            <Button 
              onClick={() => openAddTransaction('EXPENSE')}
              variant="outline"
              className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
            >
              <ArrowDownRight size={16} />
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(revenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {typedTransactions.filter(t => t.type === 'REVENUE').length} transactions
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {typedTransactions.filter(t => t.type === 'EXPENSE').length} transactions
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Revenue - Expenses</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VAT Due</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(vatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      {typedTransactions.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Get Started:</strong> Record your first business transaction by clicking "Add Revenue" for income or "Add Expense" for business costs. 
            This will automatically calculate your VAT obligations and provide accurate financial reports.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <FileText size={16} />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Receipt size={16} />
            AI Scanner
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Filter size={16} />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <Receipt size={16} />
            POS
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <Filter size={16} />
            Bank Feed
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <Receipt size={16} />
            Statements
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Filter size={16} />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6">
          <ExpenseScanner
            onExpenseExtracted={handleExpenseExtracted}
            className="max-w-4xl mx-auto"
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <ExpenseAuditTrail
            expenses={scannedExpenses}
            onViewOriginal={handleViewOriginal}
            className="max-w-6xl mx-auto"
          />
        </TabsContent>

        <TabsContent value="pos" className="mt-6">
          <POSIntegrationPanel className="max-w-4xl mx-auto" />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <BankFeedPanel className="max-w-6xl mx-auto" />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Transaction Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Recent Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typedTransactions.filter(t => t.type === 'REVENUE').slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No revenue recorded yet</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => openAddTransaction('REVENUE')}
                    >
                      Add Your First Revenue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typedTransactions.filter(t => t.type === 'REVENUE').slice(0, 5).map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900">{transaction.description}</p>
                          <p className="text-sm text-green-600">{transaction.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">
                            {formatCurrency(parseFloat(transaction.amount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </p>
                          <p className="text-xs text-green-500">
                            {formatDate(new Date(transaction.transactionDate), language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown size={20} className="text-red-600" />
                  Recent Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typedTransactions.filter(t => t.type === 'EXPENSE').slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingDown size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No expenses recorded yet</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="mt-2"
                      onClick={() => openAddTransaction('EXPENSE')}
                    >
                      Add Your First Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typedTransactions.filter(t => t.type === 'EXPENSE').slice(0, 5).map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-900">{transaction.description}</p>
                          <p className="text-sm text-red-600">{transaction.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-700">
                            {formatCurrency(parseFloat(transaction.amount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </p>
                          <p className="text-xs text-red-500">
                            {formatDate(new Date(transaction.transactionDate), language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'REVENUE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('REVENUE')}
                    className="text-green-700"
                  >
                    Revenue
                  </Button>
                  <Button
                    variant={filter === 'EXPENSE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('EXPENSE')}
                    className="text-red-700"
                  >
                    Expenses
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 mb-6">Start by recording your business income and expenses</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => openAddTransaction('REVENUE')}>
                      Add Revenue
                    </Button>
                    <Button variant="outline" onClick={() => openAddTransaction('EXPENSE')}>
                      Add Expense  
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'REVENUE' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'REVENUE' ? 
                            <ArrowUpRight className="h-5 w-5 text-green-600" /> :
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{transaction.category}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(new Date(transaction.transactionDate), language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === 'REVENUE' ? 'text-green-700' : 'text-red-700'}`}>
                          {transaction.type === 'REVENUE' ? '+' : '-'}
                          {formatCurrency(parseFloat(transaction.amount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </p>
                        {parseFloat(transaction.vatAmount) > 0 && (
                          <p className="text-xs text-gray-500">
                            VAT: {formatCurrency(parseFloat(transaction.vatAmount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-1">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements">
          <FinancialStatements />
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Office Supplies', 'Marketing', 'Travel', 'Equipment', 'Software', 'Rent', 'Utilities', 'Professional Services'].map((category) => (
                  <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <p className="font-medium">{category}</p>
                      <p className="text-xs text-gray-500">
                        {typedTransactions.filter(t => t.category === category).length} transactions
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Form */}
      {showTransactionForm && (
        <TransactionForm 
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
          defaultType={transactionType}
        />
      )}
    </div>
  );
}

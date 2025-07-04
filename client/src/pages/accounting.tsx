import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TransactionForm from '@/components/accounting/transaction-form';
import FinancialStatements from '@/components/accounting/financial-statements';
import { Plus, Wallet, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

export default function Accounting() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const revenue = transactions?.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const expenses = transactions?.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
          <p className="text-gray-600">Manage your revenue and expenses</p>
        </div>
        <Button 
          onClick={() => setShowTransactionForm(true)}
          className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}
        >
          <Plus size={16} />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(revenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                <Wallet size={20} className="text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-error-600">
                  {formatCurrency(expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <div className="w-10 h-10 bg-error-50 rounded-lg flex items-center justify-center">
                <Receipt size={20} className="text-error-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={cn("text-2xl font-bold", revenue - expenses >= 0 ? "text-success-600" : "text-error-600")}>
                  {formatCurrency(revenue - expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", 
                revenue - expenses >= 0 ? "bg-success-50" : "bg-error-50")}>
                <Wallet size={20} className={revenue - expenses >= 0 ? "text-success-600" : "text-error-600"} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle>Accounting Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="statements">Financial Statements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-6">
              <FinancialStatements />
            </TabsContent>
            
            <TabsContent value="statements" className="mt-6">
              <FinancialStatements showStatements={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  );
}

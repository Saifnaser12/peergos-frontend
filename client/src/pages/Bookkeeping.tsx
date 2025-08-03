import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lazy } from 'react';

// Import existing page components
const Revenue = lazy(() => import('./financials'));
const Expenses = lazy(() => import('./accounting'));
const Invoicing = lazy(() => import('./invoicing'));
import TransactionForm from '@/components/accounting/transaction-form';

export default function Bookkeeping() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'REVENUE' | 'EXPENSE'>('EXPENSE');

  const handleAddTransaction = (type: 'REVENUE' | 'EXPENSE') => {
    setTransactionType(type);
    setShowTransactionForm(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookkeeping</h1>
          <p className="text-muted-foreground">
            Manage your revenue, expenses, and invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleAddTransaction('EXPENSE')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
          <Button
            onClick={() => handleAddTransaction('REVENUE')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Revenue
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="bg-white rounded-lg border">
            <Revenue />
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="bg-white rounded-lg border">
            <Expenses />
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <div className="bg-white rounded-lg border">
            <Invoicing />
          </div>
        </TabsContent>
      </Tabs>

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        defaultType={transactionType}
      />
    </div>
  );
}
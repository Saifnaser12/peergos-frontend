import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

import TransactionForm from '@/components/accounting/transaction-form';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Revenue Tab Component
function RevenueTab() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', 'REVENUE'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading revenue data...</div>
        </CardContent>
      </Card>
    );
  }

  const revenueTransactions = (transactions as any)?.filter((t: any) => t.type === 'REVENUE') || [];
  const totalRevenue = revenueTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Revenue Summary
          </CardTitle>
          <CardDescription>Total revenue: {totalRevenue.toLocaleString()} AED</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue transactions recorded yet.</p>
            ) : (
              revenueTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.transactionDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+{parseFloat(transaction.amount).toLocaleString()} AED</p>
                    <p className="text-xs text-gray-500">{transaction.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Expenses Tab Component
function ExpensesTab() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', 'EXPENSE'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading expense data...</div>
        </CardContent>
      </Card>
    );
  }

  const expenseTransactions = (transactions as any)?.filter((t: any) => t.type === 'EXPENSE') || [];
  const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-600" />
            Expenses Summary
          </CardTitle>
          <CardDescription>Total expenses: {totalExpenses.toLocaleString()} AED</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expense transactions recorded yet.</p>
            ) : (
              expenseTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.transactionDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">-{parseFloat(transaction.amount).toLocaleString()} AED</p>
                    <p className="text-xs text-gray-500">{transaction.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Invoices Tab Component  
function InvoicesTab() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading invoices data...</div>
        </CardContent>
      </Card>
    );
  }

  const invoiceList = (invoices as any) || [];
  const totalInvoiced = invoiceList.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Invoices Summary
          </CardTitle>
          <CardDescription>Total invoiced: {totalInvoiced.toLocaleString()} AED</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoiceList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invoices created yet.</p>
            ) : (
              invoiceList.map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{parseFloat(invoice.totalAmount).toLocaleString()} AED</p>
                    <p className="text-xs text-gray-500 capitalize">{invoice.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
          <RevenueTab />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpensesTab />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoicesTab />
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
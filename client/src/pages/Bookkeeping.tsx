import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt, FileText, Plus, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TransactionForm from '@/components/accounting/transaction-form';
import InvoiceScanner from '@/components/InvoiceScanner';
import { useQuery } from '@tanstack/react-query';

function formatAED(amount: number) {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 2 }).format(amount);
}

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray-200/80', className)} />;
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-[13px] text-gray-500">{message}</p>
    </div>
  );
}

function RevenueTab() {
  const { data: transactions, isLoading } = useQuery({ queryKey: ['/api/transactions', 'REVENUE'] });
  const revenueTransactions = (transactions as any)?.filter((t: any) => t.type === 'REVENUE') || [];
  const totalRevenue = revenueTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Total Revenue</p>
              {isLoading
                ? <Shimmer className="h-8 w-40 mt-2" />
                : <p className="text-[26px] font-bold text-gray-900 tabular-nums mt-1">{formatAED(totalRevenue)}</p>
              }
              <p className="text-[12px] mt-1" style={{ color: '#0E9F6E' }}>FY 2025-26</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(14,159,110,0.10)' }}>
              <TrendingUp size={20} style={{ color: '#0E9F6E' }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-[15px] font-semibold text-gray-900">Revenue Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex justify-between items-center p-3 border border-[#E5EAF0] rounded-lg">
                  <div className="space-y-1.5"><Shimmer className="h-4 w-36" /><Shimmer className="h-3 w-24" /></div>
                  <Shimmer className="h-5 w-28" />
                </div>
              ))}
            </div>
          ) : revenueTransactions.length === 0 ? (
            <EmptyState icon={TrendingUp} message="No revenue recorded yet. Add your first transaction." />
          ) : (
            <div className="space-y-2">
              {revenueTransactions.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center p-3.5 border border-[#E5EAF0] rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{t.description}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(t.transactionDate).toLocaleDateString('en-AE')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold tabular-nums" style={{ color: '#0E9F6E' }}>
                      +{formatAED(parseFloat(t.amount))}
                    </p>
                    <p className="text-[11px] text-gray-400">{t.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpensesTab() {
  const { data: transactions, isLoading } = useQuery({ queryKey: ['/api/transactions', 'EXPENSE'] });
  const expenseTransactions = (transactions as any)?.filter((t: any) => t.type === 'EXPENSE') || [];
  const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Total Expenses</p>
              {isLoading
                ? <Shimmer className="h-8 w-40 mt-2" />
                : <p className="text-[26px] font-bold text-gray-900 tabular-nums mt-1">{formatAED(totalExpenses)}</p>
              }
              <p className="text-[12px] mt-1 text-amber-600">FY 2025-26</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(180,83,9,0.10)' }}>
              <Receipt size={20} style={{ color: '#B45309' }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-[15px] font-semibold text-gray-900">Expense Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex justify-between items-center p-3 border border-[#E5EAF0] rounded-lg">
                  <div className="space-y-1.5"><Shimmer className="h-4 w-36" /><Shimmer className="h-3 w-24" /></div>
                  <Shimmer className="h-5 w-28" />
                </div>
              ))}
            </div>
          ) : expenseTransactions.length === 0 ? (
            <EmptyState icon={Receipt} message="No expenses recorded yet. Add your first expense." />
          ) : (
            <div className="space-y-2">
              {expenseTransactions.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center p-3.5 border border-[#E5EAF0] rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{t.description}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(t.transactionDate).toLocaleDateString('en-AE')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold tabular-nums text-red-600">
                      -{formatAED(parseFloat(t.amount))}
                    </p>
                    <p className="text-[11px] text-gray-400">{t.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoicesTab() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ['/api/invoices'] });
  const invoiceList = (invoices as any) || [];
  const totalInvoiced = invoiceList.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0);

  const statusColor = (status: string) => {
    if (status === 'paid') return { color: '#0E9F6E' };
    if (status === 'overdue') return { color: '#B91C1C' };
    return { color: '#B45309' };
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Total Invoiced</p>
              {isLoading
                ? <Shimmer className="h-8 w-40 mt-2" />
                : <p className="text-[26px] font-bold text-gray-900 tabular-nums mt-1">{formatAED(totalInvoiced)}</p>
              }
              <p className="text-[12px] mt-1 text-blue-600">All invoices</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(37,99,235,0.10)' }}>
              <FileText size={20} style={{ color: '#2563EB' }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-[15px] font-semibold text-gray-900">Invoice List</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex justify-between items-center p-3 border border-[#E5EAF0] rounded-lg">
                  <div className="space-y-1.5"><Shimmer className="h-4 w-36" /><Shimmer className="h-3 w-24" /></div>
                  <Shimmer className="h-5 w-28" />
                </div>
              ))}
            </div>
          ) : invoiceList.length === 0 ? (
            <EmptyState icon={FileText} message="No invoices created yet. Create your first invoice." />
          ) : (
            <div className="space-y-2">
              {invoiceList.map((inv: any) => (
                <div key={inv.id} className="flex justify-between items-center p-3.5 border border-[#E5EAF0] rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString('en-AE')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold tabular-nums text-gray-900">{formatAED(parseFloat(inv.totalAmount))}</p>
                    <p className="text-[11px] font-medium capitalize mt-0.5" style={statusColor(inv.status)}>{inv.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Bookkeeping</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage your revenue, expenses, and invoices</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <InvoiceScanner onOpenManualForm={() => handleAddTransaction('EXPENSE')} />
          <Button
            onClick={() => handleAddTransaction('EXPENSE')}
            className="flex items-center gap-2 h-9 text-[13px] font-semibold text-white focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3A5C]"
            style={{ backgroundColor: '#0A3A5C' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0D4A75')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0A3A5C')}
          >
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
          <Button
            onClick={() => handleAddTransaction('REVENUE')}
            variant="outline"
            className="flex items-center gap-2 h-9 text-[13px] font-semibold border-[#E5EAF0] text-gray-700 hover:border-[#0A3A5C] hover:text-[#0A3A5C]"
          >
            <Plus className="h-4 w-4" /> Add Revenue
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-gray-100/70 p-1 rounded-xl h-auto">
          <TabsTrigger value="revenue" className="flex items-center gap-1.5 rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">
            <DollarSign className="h-3.5 w-3.5" /> Revenue
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-1.5 rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">
            <Receipt className="h-3.5 w-3.5" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-1.5 rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">
            <FileText className="h-3.5 w-3.5" /> Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue"><RevenueTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
      </Tabs>

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        defaultType={transactionType}
      />
    </div>
  );
}

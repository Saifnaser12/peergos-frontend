import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/i18n';

interface FinancialStatementsProps {
  showStatements?: boolean;
  statementType?: 'income' | 'balance' | 'cashflow';
}

export default function FinancialStatements({ 
  showStatements = false, 
  statementType = 'income' 
}: FinancialStatementsProps) {
  const [activeTab, setActiveTab] = useState('transactions');
  const { company } = useAuth();
  const { language } = useLanguage();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: kpiData } = useQuery({
    queryKey: ['/api/kpi-data', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const revenue = transactions?.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const expenses = transactions?.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const netIncome = revenue - expenses;

  // Group transactions by category for better reporting
  const revenueByCategory = transactions?.filter(t => t.type === 'REVENUE').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const expensesByCategory = transactions?.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED': return 'bg-success-100 text-success-800';
      case 'DRAFT': return 'bg-warning-100 text-warning-800';
      case 'CANCELLED': return 'bg-error-100 text-error-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'REVENUE' ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800';
  };

  if (showStatements) {
    if (statementType === 'income') {
      return (
        <div className="space-y-6">
          <Card className="border">
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
              <p className="text-sm text-gray-500">For the year ended December 31, 2024</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Revenue</h4>
                  <div className="space-y-2">
                    {Object.entries(revenueByCategory).map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="text-gray-600">{category}</span>
                        <span className="font-medium">
                          {formatCurrency(amount, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Revenue</span>
                      <span>{formatCurrency(revenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Expenses</h4>
                  <div className="space-y-2">
                    {Object.entries(expensesByCategory).map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="text-gray-600">{category}</span>
                        <span className="font-medium">
                          {formatCurrency(amount, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Expenses</span>
                      <span>{formatCurrency(expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="border-t pt-4">
                  <div className={cn("flex justify-between text-lg font-bold", 
                    netIncome >= 0 ? "text-success-600" : "text-error-600"
                  )}>
                    <span>Net Income</span>
                    <span>{formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (statementType === 'balance') {
      return (
        <div className="space-y-6">
          <Card className="border">
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <p className="text-sm text-gray-500">As of December 31, 2024</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Assets</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Current Assets</h5>
                      <div className="space-y-1 text-sm ml-4">
                        <div className="flex justify-between">
                          <span>Cash and Cash Equivalents</span>
                          <span>{formatCurrency(revenue * 0.3, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accounts Receivable</span>
                          <span>{formatCurrency(revenue * 0.2, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Current Assets</span>
                          <span>{formatCurrency(revenue * 0.5, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Fixed Assets</h5>
                      <div className="space-y-1 text-sm ml-4">
                        <div className="flex justify-between">
                          <span>Equipment</span>
                          <span>{formatCurrency(revenue * 0.3, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Less: Depreciation</span>
                          <span>({formatCurrency(revenue * 0.05, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Fixed Assets</span>
                          <span>{formatCurrency(revenue * 0.25, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Assets</span>
                        <span>{formatCurrency(revenue * 0.75, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Liabilities & Equity</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Current Liabilities</h5>
                      <div className="space-y-1 text-sm ml-4">
                        <div className="flex justify-between">
                          <span>Accounts Payable</span>
                          <span>{formatCurrency(expenses * 0.2, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT Payable</span>
                          <span>{formatCurrency(revenue * 0.05, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Current Liabilities</span>
                          <span>{formatCurrency(expenses * 0.2 + revenue * 0.05, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Equity</h5>
                      <div className="space-y-1 text-sm ml-4">
                        <div className="flex justify-between">
                          <span>Share Capital</span>
                          <span>{formatCurrency(100000, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retained Earnings</span>
                          <span>{formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Equity</span>
                          <span>{formatCurrency(100000 + netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Liab. & Equity</span>
                        <span>{formatCurrency(revenue * 0.75, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (statementType === 'cashflow') {
      return (
        <div className="space-y-6">
          <Card className="border">
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <p className="text-sm text-gray-500">For the year ended December 31, 2024</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operating Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cash Flows from Operating Activities</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Net Income</span>
                      <span>{formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depreciation</span>
                      <span>{formatCurrency(revenue * 0.02, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Changes in Working Capital</span>
                      <span>({formatCurrency(revenue * 0.05, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Net Cash from Operating Activities</span>
                      <span>{formatCurrency(netIncome + revenue * 0.02 - revenue * 0.05, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  </div>
                </div>

                {/* Investing Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cash Flows from Investing Activities</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Purchase of Equipment</span>
                      <span>({formatCurrency(revenue * 0.1, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Net Cash from Investing Activities</span>
                      <span>({formatCurrency(revenue * 0.1, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                    </div>
                  </div>
                </div>

                {/* Financing Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cash Flows from Financing Activities</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Capital Contributions</span>
                      <span>{formatCurrency(50000, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Net Cash from Financing Activities</span>
                      <span>{formatCurrency(50000, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  </div>
                </div>

                {/* Net Change in Cash */}
                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span>Net Increase in Cash</span>
                      <span>{formatCurrency(netIncome + 40000, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash at Beginning of Year</span>
                      <span>{formatCurrency(10000, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Cash at End of Year</span>
                      <span>{formatCurrency(netIncome + 50000, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Transactions Table */}
      <Card className="border">
        <CardHeader>
          <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
            <CardTitle>Transaction History</CardTitle>
            <Button size="sm" variant="outline">
              <Download size={14} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-500">Start by adding your first transaction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {formatDate(new Date(transaction.transactionDate), language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{transaction.category}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(transaction.amount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(parseFloat(transaction.vatAmount || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

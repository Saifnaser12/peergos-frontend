import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// UAE FTA Standard Chart of Accounts for SMEs
export const REVENUE_CATEGORIES = [
  { code: '4000', name: 'Sales Revenue - Goods', vatRate: 5, description: 'Sale of physical products' },
  { code: '4010', name: 'Sales Revenue - Services', vatRate: 5, description: 'Professional services provided' },
  { code: '4020', name: 'Rental Income', vatRate: 5, description: 'Property rental revenue' },
  { code: '4030', name: 'Commission Income', vatRate: 5, description: 'Sales commissions earned' },
  { code: '4040', name: 'Interest Income', vatRate: 0, description: 'Bank interest and investments' },
  { code: '4050', name: 'Export Sales', vatRate: 0, description: 'Zero-rated export sales' },
  { code: '4060', name: 'Free Zone Sales', vatRate: 0, description: 'Qualifying free zone transactions' },
  { code: '4070', name: 'Franchise Fees', vatRate: 5, description: 'Franchise income' },
  { code: '4080', name: 'Royalty Income', vatRate: 5, description: 'Intellectual property income' },
  { code: '4090', name: 'Other Operating Revenue', vatRate: 5, description: 'Miscellaneous business income' }
];

export const EXPENSE_CATEGORIES = [
  { code: '5000', name: 'Cost of Goods Sold', vatRate: 5, description: 'Direct costs of products sold' },
  { code: '6000', name: 'Salaries and Wages', vatRate: 0, description: 'Employee compensation' },
  { code: '6010', name: 'Employee Benefits', vatRate: 0, description: 'Health insurance, end of service' },
  { code: '6020', name: 'Rent Expense', vatRate: 5, description: 'Office and warehouse rent' },
  { code: '6030', name: 'Utilities', vatRate: 5, description: 'Electricity, water, internet' },
  { code: '6040', name: 'Office Supplies', vatRate: 5, description: 'Stationery, equipment' },
  { code: '6050', name: 'Professional Services', vatRate: 5, description: 'Legal, accounting, consulting' },
  { code: '6060', name: 'Marketing and Advertising', vatRate: 5, description: 'Promotional expenses' },
  { code: '6070', name: 'Travel and Transportation', vatRate: 5, description: 'Business travel costs' },
  { code: '6080', name: 'Vehicle Expenses', vatRate: 5, description: 'Fuel, maintenance, insurance' },
  { code: '6090', name: 'Insurance', vatRate: 0, description: 'Business insurance premiums' },
  { code: '6100', name: 'Bank Charges', vatRate: 0, description: 'Banking fees and charges' },
  { code: '6110', name: 'Depreciation', vatRate: 0, description: 'Asset depreciation expense' },
  { code: '6120', name: 'Repairs and Maintenance', vatRate: 5, description: 'Equipment and facility maintenance' },
  { code: '6130', name: 'Communication', vatRate: 5, description: 'Phone, mobile, internet' },
  { code: '6140', name: 'Training and Development', vatRate: 5, description: 'Employee training costs' },
  { code: '6150', name: 'License and Permits', vatRate: 0, description: 'Government fees and licenses' },
  { code: '6160', name: 'Meals and Entertainment', vatRate: 5, description: 'Business meals (50% deductible)' },
  { code: '6170', name: 'IT and Software', vatRate: 5, description: 'Software licenses, IT support' },
  { code: '6180', name: 'Other Operating Expenses', vatRate: 5, description: 'Miscellaneous business costs' }
];

interface TransactionEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  vatAmount: number;
  type: 'revenue' | 'expense';
  reference?: string;
}

export default function RevenueExpenseCategories() {
  const { company, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: 0,
    type: 'revenue' as 'revenue' | 'expense',
    reference: ''
  });

  // Fetch transactions from API
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      
      // Reset form
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        amount: 0,
        type: 'revenue',
        reference: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTransaction = () => {
    if (!newTransaction.description || !newTransaction.category || newTransaction.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const category = newTransaction.type === 'revenue' 
      ? REVENUE_CATEGORIES.find(c => c.code === newTransaction.category)
      : EXPENSE_CATEGORIES.find(c => c.code === newTransaction.category);

    if (!category) return;

    const vatAmount = (newTransaction.amount * category.vatRate) / 100;
    
    const transactionData = {
      companyId: company?.id,
      type: newTransaction.type.toUpperCase(), // REVENUE or EXPENSE
      category: `${category.code} - ${category.name}`,
      description: newTransaction.description,
      amount: newTransaction.amount.toString(),
      vatAmount: vatAmount.toString(),
      transactionDate: new Date(newTransaction.date).toISOString(),
      attachments: [],
      status: 'PROCESSED',
      createdBy: user?.id
    };

    createTransactionMutation.mutate(transactionData);
  };

  const removeTransaction = (id: number) => {
    // Add delete mutation here if needed
  };

  const calculateTotals = () => {
    const revenue = transactions
      .filter((t: any) => t.type === 'REVENUE')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    
    const expenses = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const outputVAT = transactions
      .filter((t: any) => t.type === 'REVENUE')
      .reduce((sum: number, t: any) => sum + parseFloat(t.vatAmount || 0), 0);

    const inputVAT = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + parseFloat(t.vatAmount || 0), 0);

    const netIncome = revenue - expenses;
    const netVAT = outputVAT - inputVAT;

    return { revenue, expenses, netIncome, outputVAT, inputVAT, netVAT };
  };

  const totals = calculateTotals();

  const exportToExcel = () => {
    // Create CSV content for FTA reporting
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (AED)', 'VAT Amount (AED)', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.date,
        t.type,
        `"${t.category}"`,
        `"${t.description}"`,
        t.amount.toFixed(2),
        t.vatAmount.toFixed(2),
        t.reference || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Transaction Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Revenue/Expense Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={newTransaction.type} onValueChange={(value: 'revenue' | 'expense') => 
                setNewTransaction({...newTransaction, type: value, category: ''})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
              />
            </div>

            <div>
              <Label>Amount (AED)</Label>
              <Input
                type="number"
                value={newTransaction.amount || ''}
                onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Reference</Label>
              <Input
                value={newTransaction.reference}
                onChange={(e) => setNewTransaction({...newTransaction, reference: e.target.value})}
                placeholder="Invoice #, Receipt #"
              />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={newTransaction.category} onValueChange={(value) => 
              setNewTransaction({...newTransaction, category: value})
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(newTransaction.type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.code} - {cat.name} ({cat.vatRate}% VAT)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              placeholder="Transaction description"
            />
          </div>

          <Button onClick={addTransaction} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Financial Summary
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export for FTA
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Total Revenue</h3>
              <p className="text-2xl font-bold text-green-600">AED {totals.revenue.toFixed(2)}</p>
              <p className="text-sm text-green-600">Output VAT: AED {totals.outputVAT.toFixed(2)}</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-600">AED {totals.expenses.toFixed(2)}</p>
              <p className="text-sm text-red-600">Input VAT: AED {totals.inputVAT.toFixed(2)}</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Net Income</h3>
              <p className="text-2xl font-bold text-blue-600">AED {totals.netIncome.toFixed(2)}</p>
              <p className="text-sm text-blue-600">Net VAT: AED {totals.netVAT.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History ({transactions.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={transaction.type === 'revenue' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                    <span className="text-sm text-gray-600">{transaction.date}</span>
                    {transaction.reference && (
                      <span className="text-sm text-gray-500">#{transaction.reference}</span>
                    )}
                  </div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-gray-600">{transaction.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">AED {transaction.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">VAT: AED {transaction.vatAmount.toFixed(2)}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTransaction(transaction.id)}
                  className="ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions added yet. Start by adding your first revenue or expense entry.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
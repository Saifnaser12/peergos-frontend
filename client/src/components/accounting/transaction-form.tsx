import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChartOfAccounts, useAccountByCode } from '@/hooks/useChartOfAccounts';
import { getVatRate } from '@shared/chart-of-accounts';
import { HintBanner } from './HintBanner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  type: z.enum(['REVENUE', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  accountCode: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  vatRate: z.number().min(0).max(1),
  includesVat: z.boolean(),
  nonDeductible: z.boolean().optional(),
  transactionDate: z.string(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
  defaultType?: 'REVENUE' | 'EXPENSE';
}

export default function TransactionForm({ isOpen, onClose, transaction, defaultType }: TransactionFormProps) {
  const [includesVat, setIncludesVat] = useState(false);
  const { user, company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Chart of Accounts integration
  const { data: chartOfAccounts, isLoading: isLoadingAccounts } = useChartOfAccounts();
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('');
  const { data: selectedAccount } = useAccountByCode(selectedAccountCode);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type || defaultType || 'REVENUE',
      category: transaction?.category || '',
      accountCode: transaction?.accountCode || '',
      description: transaction?.description || '',
      amount: transaction?.amount || '',
      vatRate: 0.05, // 5% VAT rate
      includesVat: false,
      nonDeductible: false,
      transactionDate: transaction?.transactionDate 
        ? new Date(transaction.transactionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  // Auto-update VAT rate and deductibility when account is selected
  useEffect(() => {
    if (selectedAccount) {
      const vatRate = getVatRate(selectedAccount.vatCode);
      form.setValue('vatRate', vatRate);
      form.setValue('nonDeductible', !selectedAccount.citDeductible);
      
      // Force VAT amount to 0 for exempt/blocked accounts
      if (selectedAccount.vatCode === 'EXEMPT' || selectedAccount.vatCode === 'BLOCKED') {
        form.setValue('includesVat', false);
        setIncludesVat(false);
      }
    }
  }, [selectedAccount, form]);

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Transaction Created',
        description: 'Transaction has been recorded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create transaction. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/transactions/${transaction.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Transaction Updated',
        description: 'Transaction has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update transaction. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    const amount = parseFloat(data.amount);
    let vatAmount = 0;
    let netAmount = amount;

    if (company?.vatRegistered && data.vatRate > 0) {
      if (data.includesVat) {
        // Amount includes VAT, so we need to extract it
        vatAmount = amount - (amount / (1 + data.vatRate));
        netAmount = amount - vatAmount;
      } else {
        // Amount excludes VAT, so we add it
        vatAmount = amount * data.vatRate;
        netAmount = amount;
      }
    }

    const transactionData = {
      companyId: company?.id,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: netAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      transactionDate: new Date(data.transactionDate).toISOString(),
      status: 'PROCESSED',
      createdBy: user?.id,
    };

    if (transaction) {
      updateTransactionMutation.mutate(transactionData);
    } else {
      createTransactionMutation.mutate(transactionData);
    }
  };

  const revenueCategories = [
    'Sales Revenue',
    'Service Revenue',
    'Consulting Revenue',
    'Interest Income',
    'Other Revenue',
  ];

  const expenseCategories = [
    'Office Supplies',
    'Rent & Utilities',
    'Professional Services',
    'Marketing & Advertising',
    'Travel & Entertainment',
    'Equipment',
    'Insurance',
    'Other Expenses',
  ];

  const selectedType = form.watch('type');
  const selectedAmount = form.watch('amount');
  const vatRate = form.watch('vatRate');

  const calculateVatPreview = () => {
    const amount = parseFloat(selectedAmount || '0');
    if (!amount || !company?.vatRegistered || vatRate === 0) return null;

    if (includesVat) {
      const vatAmount = amount - (amount / (1 + vatRate));
      const netAmount = amount - vatAmount;
      return { vatAmount, netAmount, totalAmount: amount };
    } else {
      const vatAmount = amount * vatRate;
      const totalAmount = amount + vatAmount;
      return { vatAmount, netAmount: amount, totalAmount };
    }
  };

  const vatPreview = calculateVatPreview();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md", language === 'ar' && "rtl:text-right")}>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="REVENUE">Revenue</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Extract account code from the value (format: "code|name")
                      const accountCode = value.split('|')[0];
                      setSelectedAccountCode(accountCode);
                      form.setValue('accountCode', accountCode);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            isLoadingAccounts 
                              ? 'Loading accounts...'
                              : 'Select expense category'
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chartOfAccounts?.map((account) => (
                        <SelectItem 
                          key={account.code} 
                          value={`${account.code}|${account.name}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{account.code} - {account.name}</span>
                            <span className="text-xs text-muted-foreground">
                              VAT: {account.vatCode} • CIT: {account.citDeductible ? 'Deductible' : 'Non-deductible'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Real-time Tax Hint Banner */}
            {selectedAccount && (
              <HintBanner account={selectedAccount} />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter transaction description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (AED)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {company?.vatRegistered && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">VAT Information</h4>
                
                <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                  <div>
                    <label className="text-sm font-medium">Amount includes VAT</label>
                    <p className="text-xs text-gray-500">Toggle if the entered amount already includes VAT</p>
                  </div>
                  <Switch
                    checked={includesVat}
                    onCheckedChange={(checked) => {
                      setIncludesVat(checked);
                      form.setValue('includesVat', checked);
                    }}
                  />
                </div>

                {vatPreview && (
                  <div className="text-xs space-y-1 bg-white p-2 rounded border">
                    <div className="flex justify-between">
                      <span>Net Amount:</span>
                      <span>AED {vatPreview.netAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (5%):</span>
                      <span>AED {vatPreview.vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total Amount:</span>
                      <span>AED {vatPreview.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={cn("flex gap-3 pt-4", language === 'ar' && "rtl:flex-row-reverse")}>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
              >
                {(createTransactionMutation.isPending || updateTransactionMutation.isPending) 
                  ? 'Saving...' 
                  : (transaction ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EnhancedInput } from './enhanced-input';
import { EnhancedForm } from './enhanced-form';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PlusCircle, Upload, DollarSign, Calendar, FileText } from 'lucide-react';

// Enhanced validation schema with detailed rules
const transactionSchema = z.object({
  type: z.enum(['REVENUE', 'EXPENSE'], {
    errorMap: () => ({ message: 'Please select transaction type' })
  }),
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a valid number'
  }).positive('Amount must be greater than 0').max(1000000000, 'Amount exceeds maximum limit'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description cannot exceed 200 characters'),
  category: z.string().min(1, 'Category is required'),
  transactionDate: z.string().min(1, 'Transaction date is required'),
  reference: z.string().optional(),
  vatAmount: z.number().min(0, 'VAT amount cannot be negative').optional(),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
  currency: z.string().default('AED'),
  attachmentUrl: z.string().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
}).refine((data) => {
  // Auto-calculate VAT if not provided
  if (data.type === 'REVENUE' && !data.vatAmount) {
    return true; // Will calculate 5% VAT
  }
  return true;
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const CATEGORIES = {
  REVENUE: [
    'Sales Revenue',
    'Service Revenue', 
    'Consulting Revenue',
    'Subscription Revenue',
    'Interest Income',
    'Other Revenue'
  ],
  EXPENSE: [
    'Office Rent',
    'Utilities',
    'Marketing',
    'Professional Services',
    'Travel',
    'Equipment',
    'Software Licenses',
    'Insurance',
    'Bank Charges',
    'Other Expenses'
  ]
};

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

interface EnhancedTransactionFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<TransactionFormData>;
  mode?: 'create' | 'edit';
  transactionId?: number;
}

export default function EnhancedTransactionForm({ 
  onSuccess, 
  defaultValues,
  mode = 'create',
  transactionId 
}: EnhancedTransactionFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      currency: 'AED',
      exchangeRate: 1,
      transactionDate: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const watchedType = form.watch('type');
  const watchedAmount = form.watch('amount');
  const watchedCurrency = form.watch('currency');

  // Auto-calculate VAT for UAE transactions
  React.useEffect(() => {
    if (watchedType === 'REVENUE' && watchedAmount && watchedCurrency === 'AED') {
      const vatAmount = watchedAmount * 0.05; // 5% UAE VAT
      form.setValue('vatAmount', Number(vatAmount.toFixed(2)));
    }
  }, [watchedType, watchedAmount, watchedCurrency, form]);

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const endpoint = mode === 'edit' && transactionId 
        ? `/api/transactions/${transactionId}` 
        : '/api/transactions';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      return apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          ...data,
          companyId: 1, // TODO: Get from auth context
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
      toast({
        title: mode === 'edit' ? "Transaction updated" : "Transaction created",
        description: "Transaction has been saved successfully",
      });
      onSuccess?.();
      if (mode === 'create') {
        form.reset();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save transaction",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: TransactionFormData) => {
    mutation.mutate(data);
  };

  const formatCurrency = (value: string) => {
    const currency = form.getValues('currency');
    const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
    return value ? `${symbol} ${value}` : value;
  };

  const validateTRN = (value: string) => {
    if (!value) return null;
    const trnRegex = /^\d{15}$/;
    return trnRegex.test(value) ? null : 'TRN must be exactly 15 digits';
  };

  const validateAmount = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > 1000000000) return 'Amount exceeds maximum limit';
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Transaction' : 'Add New Transaction'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <SelectItem value="REVENUE">Revenue (Income)</SelectItem>
                          <SelectItem value="EXPENSE">Expense (Outgoing)</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <EnhancedInput
                          type="date"
                          {...field}
                          hint="Date when the transaction occurred"
                          validationRules={{ required: true }}
                          realTimeValidation
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          hint="Enter the transaction amount"
                          example="1500.00"
                          format="Decimal number with up to 2 decimal places"
                          formatDisplay={formatCurrency}
                          validationRules={{
                            required: true,
                            custom: validateAmount
                          }}
                          realTimeValidation
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        placeholder="Enter transaction description"
                        hint="Provide a clear description of the transaction"
                        example="Office rent payment for January 2025"
                        validationRules={{
                          required: true,
                          minLength: 3,
                          maxLength: 200
                        }}
                        realTimeValidation
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES[watchedType]?.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number (Optional)</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          {...field}
                          placeholder="INV-001, REF-2025-001"
                          hint="Invoice number, receipt number, or other reference"
                          example="INV-2025-001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Advanced Fields */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mb-4"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </Button>

                {showAdvanced && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="vatAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT Amount</FormLabel>
                            <FormControl>
                              <EnhancedInput
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                hint="VAT amount (auto-calculated for AED revenue at 5%)"
                                formatDisplay={formatCurrency}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchedCurrency !== 'AED' && (
                        <FormField
                          control={form.control}
                          name="exchangeRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exchange Rate to AED</FormLabel>
                              <FormControl>
                                <EnhancedInput
                                  type="number"
                                  step="0.0001"
                                  placeholder="1.0000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                                  hint={`How many AED per 1 ${watchedCurrency}`}
                                  example="3.6725 (for USD to AED)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes or comments..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="min-w-[120px]"
                >
                  {mutation.isPending ? 'Saving...' : mode === 'edit' ? 'Update Transaction' : 'Add Transaction'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
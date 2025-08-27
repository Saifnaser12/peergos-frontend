import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EnhancedForm } from '@/components/forms/enhanced-form';
import { EnhancedInput } from '@/components/forms/enhanced-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save } from 'lucide-react';

// Enhanced transaction schema with UAE-specific validation
const enhancedTransactionSchema = z.object({
  type: z.enum(['REVENUE', 'EXPENSE'], {
    required_error: 'Transaction type is required'
  }),
  category: z.string().min(1, 'Category is required'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description cannot exceed 200 characters'),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number')
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 999999.99;
    }, 'Amount cannot exceed AED 999,999.99'),
  vatAmount: z.string().optional(),
  transactionDate: z.string().min(1, 'Transaction date is required'),
  attachments: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type EnhancedTransactionFormData = z.infer<typeof enhancedTransactionSchema>;

const UAE_CATEGORIES = {
  REVENUE: [
    'Sales Revenue',
    'Service Revenue',
    'Consulting Revenue',
    'Rental Income',
    'Interest Income',
    'Other Revenue'
  ],
  EXPENSE: [
    'Office Supplies',
    'Marketing & Advertising',
    'Travel & Entertainment',
    'Professional Services',
    'Utilities',
    'Rent',
    'Insurance',
    'Banking Fees',
    'Technology',
    'Equipment',
    'Other Expenses'
  ]
};

interface EnhancedTransactionFormProps {
  onSuccess?: () => void;
}

export default function EnhancedTransactionForm({ onSuccess }: EnhancedTransactionFormProps) {
  const [autoCalculatedVAT, setAutoCalculatedVAT] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EnhancedTransactionFormData>({
    resolver: zodResolver(enhancedTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      category: '',
      description: '',
      amount: '',
      vatAmount: '',
      transactionDate: new Date().toISOString().split('T')[0],
      attachments: [],
      notes: '',
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: EnhancedTransactionFormData) => {
      const transactionData = {
        ...data,
        vatAmount: autoCalculatedVAT || data.vatAmount || '0',
        attachments: data.attachments || [],
      };
      return apiRequest('/api/transactions', transactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
      toast({
        title: 'Success',
        description: 'Transaction created successfully with enhanced validation',
      });
      form.reset();
      setAutoCalculatedVAT('');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
    },
  });

  // Auto-calculate VAT (5% for UAE)
  const watchedAmount = form.watch('amount');
  React.useEffect(() => {
    if (watchedAmount) {
      const amount = parseFloat(watchedAmount);
      if (!isNaN(amount) && amount > 0) {
        const vat = (amount * 0.05).toFixed(2);
        setAutoCalculatedVAT(vat);
      } else {
        setAutoCalculatedVAT('');
      }
    }
  }, [watchedAmount]);

  const onSubmit = async (data: EnhancedTransactionFormData) => {
    await createTransactionMutation.mutateAsync(data);
  };

  const selectedType = form.watch('type');
  const availableCategories = UAE_CATEGORIES[selectedType] || [];

  return (
    <EnhancedForm
      form={form}
      onSubmit={onSubmit}
      title="Enhanced Transaction Entry"
      description="Create transactions with real-time validation and auto-save"
      autoSaveKey="enhanced-transaction-form"
      enableAutoSave={true}
      showProgress={false}
    >
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mobile-form-group">
          {/* Transaction Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="mobile-input h-12 text-base">
                      <SelectValue placeholder="Select transaction type" />
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

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="mobile-input h-12 text-base">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableCategories.map((category) => (
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

          {/* Amount with VAT Auto-calculation */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (AED) *</FormLabel>
                  <FormControl>
                    <EnhancedInput
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      hint="Enter amount in AED"
                      example="1500.00"
                      format="AED 0.00"
                      realTimeValidation={true}
                      className="mobile-input h-12 text-base"
                      validationRules={{
                        required: true,
                        custom: (value) => {
                          const num = parseFloat(value);
                          if (isNaN(num) || num <= 0) return 'Amount must be positive';
                          if (num > 999999.99) return 'Amount too large';
                          return null;
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-calculated VAT Display */}
            {autoCalculatedVAT && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Auto-calculated VAT (5%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        AED {autoCalculatedVAT}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Transaction Date */}
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Date *</FormLabel>
                <FormControl>
                  <EnhancedInput
                    {...field}
                    type="date"
                    hint="Date when transaction occurred"
                    realTimeValidation={true}
                    validationRules={{
                      required: true,
                      custom: (value) => {
                        const date = new Date(value);
                        const today = new Date();
                        if (date > today) return 'Transaction date cannot be in the future';
                        return null;
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <EnhancedInput
                      {...field}
                      placeholder="Enter transaction description"
                      hint="Provide clear details about the transaction"
                      example="Office supplies from ABC Stationery"
                      realTimeValidation={true}
                      className="mobile-input h-12 text-base"
                      validationRules={{
                        required: true,
                        minLength: 3,
                        maxLength: 200
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Manual VAT Override */}
          <FormField
            control={form.control}
            name="vatAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Amount Override (Optional)</FormLabel>
                <FormControl>
                  <EnhancedInput
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder={autoCalculatedVAT || "0.00"}
                    hint="Leave empty to use auto-calculated VAT"
                    format="AED 0.00"
                    realTimeValidation={true}
                    validationRules={{
                      custom: (value) => {
                        if (!value) return null;
                        const num = parseFloat(value);
                        if (isNaN(num) || num < 0) return 'VAT amount cannot be negative';
                        return null;
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <EnhancedInput
                    {...field}
                    placeholder="Optional additional notes"
                    hint="Any additional information about this transaction"
                    validationRules={{
                      maxLength: 500
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={createTransactionMutation.isPending}
            className="min-w-[120px]"
          >
            {createTransactionMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Transaction
              </div>
            )}
          </Button>
        </div>
      </Form>
    </EnhancedForm>
  );
}
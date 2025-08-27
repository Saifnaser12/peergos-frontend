import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCitCalculation } from '@/hooks/use-tax-calculations';
import { Calculator, Building2, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UAE_TAX_CONFIG } from '@/constants/taxRates';
import { formatCurrency } from '@/lib/i18n';

const citCalculationSchema = z.object({
  revenue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Revenue must be a valid positive number',
  }),
  expenses: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Expenses must be a valid positive number',
  }),
  freeZone: z.boolean(),
  eligibleIncome: z.string().optional(),
});

type CitCalculationFormData = z.infer<typeof citCalculationSchema>;

export default function CitCalculator() {
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { company } = useAuth();
  const { language } = useLanguage();

  const form = useForm<CitCalculationFormData>({
    resolver: zodResolver(citCalculationSchema),
    defaultValues: {
      revenue: '',
      expenses: '',
      freeZone: company?.freeZone || false,
      eligibleIncome: '',
    },
  });

  const citCalculationMutation = useCitCalculation();

  const onSubmit = (data: CitCalculationFormData) => {
    const revenue = parseFloat(data.revenue);
    const expenses = parseFloat(data.expenses);
    const eligibleIncome = data.eligibleIncome ? parseFloat(data.eligibleIncome) : revenue;

    citCalculationMutation.mutate(
      {
        revenue,
        expenses,
        freeZone: data.freeZone,
        eligibleIncome,
      },
      {
        onSuccess: (result) => {
          setCalculationResult(result);
        },
      }
    );
  };

  const watchedRevenue = form.watch('revenue');
  const watchedExpenses = form.watch('expenses');
  const watchedFreeZone = form.watch('freeZone');

  const previewNetIncome = watchedRevenue && watchedExpenses 
    ? parseFloat(watchedRevenue) - parseFloat(watchedExpenses)
    : 0;

  return (
    <div className="space-y-6">
      {/* Calculator Form */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
            <Calculator size={20} />
            CIT Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Revenue (AED)</FormLabel>
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
                  name="expenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Expenses (AED)</FormLabel>
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
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="freeZone"
                  render={({ field }) => (
                    <FormItem>
                      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                        <div>
                          <FormLabel>Free Zone Entity</FormLabel>
                          <p className="text-sm text-gray-500">
                            Check if your business operates in a UAE free zone
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedFreeZone && (
                  <FormField
                    control={form.control}
                    name="eligibleIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible Income for QFZP (AED)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="Enter eligible income"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          Income that qualifies for Qualified Free Zone Person (QFZP) benefits
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Preview */}
              {previewNetIncome !== 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Quick Preview</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span>{formatCurrency(parseFloat(watchedRevenue || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses:</span>
                      <span>{formatCurrency(parseFloat(watchedExpenses || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Net Income:</span>
                      <span className={previewNetIncome >= 0 ? "text-success-600" : "text-error-600"}>
                        {formatCurrency(previewNetIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={citCalculationMutation.isPending}
              >
                {citCalculationMutation.isPending ? 'Calculating...' : 'Calculate CIT'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Calculation Results */}
      {calculationResult && (
        <Card className="material-elevation-1 border-primary-200">
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
              <Building2 size={20} className="text-primary-500" />
              CIT Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net Income</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(calculationResult.netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">CIT Rate</p>
                  <p className="text-xl font-bold text-primary-600">
                    {calculationResult.citRate}%
                  </p>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total CIT Due</p>
                  <p className="text-xl font-bold text-success-600">
                    {formatCurrency(calculationResult.citDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium">Calculation Breakdown</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Net Income:</span>
                    <span className="font-medium">
                      {formatCurrency(calculationResult.netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Small Business Relief (First AED 375,000):</span>
                    <span className="font-medium text-success-600">
                      -{formatCurrency(calculationResult.smallBusinessRelief, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span className="font-medium">
                      {formatCurrency(calculationResult.taxableIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>CIT at {calculationResult.citRate}%:</span>
                    <span className="font-medium">
                      {formatCurrency(calculationResult.citDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Conditions */}
              <div className="space-y-3">
                {calculationResult.freeZoneApplied && (
                  <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg">
                    <Shield size={16} className="text-primary-500" />
                    <div className="text-sm">
                      <p className="font-medium text-primary-900">QFZP Benefit Applied</p>
                      <p className="text-primary-700">
                        Qualified Free Zone Person with eligible income under AED 3M - 0% CIT rate applies
                      </p>
                    </div>
                  </div>
                )}

                {calculationResult.netIncome <= 375000 && (
                  <div className="flex items-center gap-2 p-3 bg-success-50 rounded-lg">
                    <Shield size={16} className="text-success-500" />
                    <div className="text-sm">
                      <p className="font-medium text-success-900">Small Business Relief</p>
                      <p className="text-success-700">
                        Your taxable income qualifies for the small business relief - 0% CIT rate applies
                      </p>
                    </div>
                  </div>
                )}

                {calculationResult.netIncome > 375000 && !calculationResult.freeZoneApplied && (
                  <div className="flex items-center gap-2 p-3 bg-warning-50 rounded-lg">
                    <AlertCircle size={16} className="text-warning-500" />
                    <div className="text-sm">
                      <p className="font-medium text-warning-900">CIT Liability</p>
                      <p className="text-warning-700">
                        Your business has a CIT liability. Ensure to file your CIT return by the deadline.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className={cn("flex gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                <Button variant="outline" size="sm">
                  Save Calculation
                </Button>
                <Button variant="outline" size="sm">
                  Generate Report
                </Button>
                <Button size="sm">
                  Create CIT Filing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Panel */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg">CIT Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Small Business Relief</h4>
              <p>
                The UAE offers Small Business Relief where the first AED 375,000 of taxable income 
                is subject to 0% Corporate Income Tax rate. Income above this threshold is taxed at 9%.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Qualified Free Zone Person (QFZP)</h4>
              <p>
                Free zone entities may qualify for QFZP status if their qualifying income is 
                less than AED 3 million, maintaining the 0% CIT rate on eligible income.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Filing Requirements</h4>
              <p>
                CIT returns must be filed within 9 months from the end of the financial year. 
                For calendar year entities, this means filing by September 30th of the following year.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

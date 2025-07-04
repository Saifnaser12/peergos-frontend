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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useVatCalculation } from '@/hooks/use-tax-calculations';
import { Calculator, Receipt, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

const vatCalculationSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  totalSales: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Total sales must be a valid positive number',
  }),
  exemptSales: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Exempt sales must be a valid positive number',
  }),
  totalPurchases: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Total purchases must be a valid positive number',
  }),
  exemptPurchases: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Exempt purchases must be a valid positive number',
  }),
});

type VatCalculationFormData = z.infer<typeof vatCalculationSchema>;

export default function VatCalculator() {
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { company } = useAuth();
  const { language } = useLanguage();

  const form = useForm<VatCalculationFormData>({
    resolver: zodResolver(vatCalculationSchema),
    defaultValues: {
      period: '',
      totalSales: '',
      exemptSales: '0',
      totalPurchases: '',
      exemptPurchases: '0',
    },
  });

  const vatCalculationMutation = useVatCalculation();

  const onSubmit = (data: VatCalculationFormData) => {
    const totalSales = parseFloat(data.totalSales);
    const exemptSales = parseFloat(data.exemptSales);
    const totalPurchases = parseFloat(data.totalPurchases);
    const exemptPurchases = parseFloat(data.exemptPurchases);

    // Create mock transactions for calculation
    const transactions = [
      {
        type: 'REVENUE',
        amount: (totalSales - exemptSales).toString(),
        vatAmount: ((totalSales - exemptSales) * 0.05).toString(),
      },
      {
        type: 'EXPENSE',
        amount: (totalPurchases - exemptPurchases).toString(),
        vatAmount: ((totalPurchases - exemptPurchases) * 0.05).toString(),
      }
    ];

    vatCalculationMutation.mutate(
      {
        transactions,
        period: data.period,
      },
      {
        onSuccess: (result) => {
          setCalculationResult({
            ...result,
            exemptSales,
            exemptPurchases,
            totalSales,
            totalPurchases,
          });
        },
      }
    );
  };

  const watchedSales = form.watch('totalSales');
  const watchedExemptSales = form.watch('exemptSales');
  const watchedPurchases = form.watch('totalPurchases');
  const watchedExemptPurchases = form.watch('exemptPurchases');

  const previewTaxableSales = watchedSales && watchedExemptSales
    ? parseFloat(watchedSales) - parseFloat(watchedExemptSales)
    : 0;

  const previewTaxablePurchases = watchedPurchases && watchedExemptPurchases
    ? parseFloat(watchedPurchases) - parseFloat(watchedExemptPurchases)
    : 0;

  const previewOutputVat = previewTaxableSales * 0.05;
  const previewInputVat = previewTaxablePurchases * 0.05;
  const previewNetVat = Math.max(0, previewOutputVat - previewInputVat);

  // Generate period options (last 12 months)
  const generatePeriods = () => {
    const periods = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthYear = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      const value = date.toISOString().substring(0, 7); // YYYY-MM format
      periods.push({ label: monthYear, value });
    }
    
    return periods;
  };

  const periods = generatePeriods();

  return (
    <div className="space-y-6">
      {/* VAT Registration Check */}
      {!company?.vatRegistered && (
        <Card className="material-elevation-1 border-warning-200 bg-warning-50">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
              <AlertCircle size={20} className="text-warning-500" />
              <div>
                <h4 className="font-medium text-warning-900">VAT Registration Required</h4>
                <p className="text-sm text-warning-700">
                  Your business is not registered for VAT. Registration is mandatory for businesses 
                  with taxable supplies exceeding AED 375,000 annually.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculator Form */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
            <Calculator size={20} />
            VAT Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sales Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Sales & Revenue</h4>
                  
                  <FormField
                    control={form.control}
                    name="totalSales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Sales (AED)</FormLabel>
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
                    name="exemptSales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exempt Sales (AED)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Sales exempt from VAT (e.g., financial services, residential rent)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Purchases Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Purchases & Expenses</h4>
                  
                  <FormField
                    control={form.control}
                    name="totalPurchases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Purchases (AED)</FormLabel>
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
                    name="exemptPurchases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exempt Purchases (AED)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Purchases exempt from VAT or not eligible for input VAT recovery
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Preview */}
              {(previewTaxableSales > 0 || previewTaxablePurchases > 0) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Quick Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Taxable Sales</p>
                      <p className="font-medium">
                        {formatCurrency(previewTaxableSales, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Output VAT: {formatCurrency(previewOutputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Taxable Purchases</p>
                      <p className="font-medium">
                        {formatCurrency(previewTaxablePurchases, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Input VAT: {formatCurrency(previewInputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Net VAT Due</p>
                      <p className="font-bold text-primary-600">
                        {formatCurrency(previewNetVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={vatCalculationMutation.isPending || !company?.vatRegistered}
              >
                {vatCalculationMutation.isPending ? 'Calculating...' : 'Calculate VAT'}
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
              <Receipt size={20} className="text-primary-500" />
              VAT Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-success-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(calculationResult.totalSales, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                </div>
                <div className="text-center p-4 bg-error-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(calculationResult.totalPurchases, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Output VAT</p>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(calculationResult.outputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                </div>
                <div className="text-center p-4 bg-warning-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net VAT Due</p>
                  <p className="text-xl font-bold text-warning-600">
                    {formatCurrency(calculationResult.netVatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium">VAT Calculation Breakdown</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sales Breakdown */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">Sales & Output VAT</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Sales:</span>
                        <span>{formatCurrency(calculationResult.totalSales, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: Exempt Sales:</span>
                        <span>({formatCurrency(calculationResult.exemptSales, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Taxable Sales:</span>
                        <span className="font-medium">
                          {formatCurrency(calculationResult.totalSales - calculationResult.exemptSales, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Output VAT (5%):</span>
                        <span className="font-medium text-primary-600">
                          {formatCurrency(calculationResult.outputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchases Breakdown */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">Purchases & Input VAT</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Purchases:</span>
                        <span>{formatCurrency(calculationResult.totalPurchases, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: Exempt Purchases:</span>
                        <span>({formatCurrency(calculationResult.exemptPurchases, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Taxable Purchases:</span>
                        <span className="font-medium">
                          {formatCurrency(calculationResult.totalPurchases - calculationResult.exemptPurchases, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Input VAT (5%):</span>
                        <span className="font-medium text-success-600">
                          {formatCurrency(calculationResult.inputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net VAT Calculation */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium mb-2">Net VAT Calculation</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Output VAT:</span>
                      <span>{formatCurrency(calculationResult.outputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Less: Input VAT:</span>
                      <span>({formatCurrency(calculationResult.inputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')})</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-bold text-lg">
                      <span>Net VAT Due:</span>
                      <span className="text-warning-600">
                        {formatCurrency(calculationResult.netVatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Information */}
              {calculationResult.netVatDue > 0 && (
                <div className="flex items-start gap-2 p-3 bg-warning-50 rounded-lg">
                  <AlertCircle size={16} className="text-warning-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning-900">VAT Payment Due</p>
                    <p className="text-warning-700">
                      You have a VAT liability of {formatCurrency(calculationResult.netVatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}.
                      VAT returns must be filed by the 28th of the following month.
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className={cn("flex gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                <Button variant="outline" size="sm">
                  Save Calculation
                </Button>
                <Button variant="outline" size="sm">
                  Generate VAT Form
                </Button>
                <Button size="sm">
                  Create VAT Return
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VAT Information */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg">VAT Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">VAT Rate in UAE</h4>
              <p>
                The standard VAT rate in the UAE is 5%. Some goods and services are zero-rated (0%) 
                or exempt from VAT. Zero-rated supplies allow you to recover input VAT, while 
                exempt supplies do not.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Filing Deadlines</h4>
              <p>
                VAT returns must be filed monthly by the 28th of the month following the tax period. 
                Late filing penalties apply for submissions after the deadline.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Record Keeping</h4>
              <p>
                Maintain detailed records of all transactions, including tax invoices, for at least 5 years. 
                This includes supporting documentation for both input and output VAT claims.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

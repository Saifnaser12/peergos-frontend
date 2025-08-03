import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Users, Calendar, TrendingUp, Info } from 'lucide-react';
import { useSetup } from '@/context/setup-context';
import { useTaxClassification } from '@/context/tax-classification-context';
import TaxCategoryDetector from '@/components/setup/tax-category-detector';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/business-logic';

const revenueInfoSchema = z.object({
  annualRevenue: z.number().min(0, 'Revenue cannot be negative'),
  employees: z.number().min(1, 'Must have at least 1 employee').max(10000, 'Employee count seems too high'),
  financialYearEnd: z.string().min(1, 'Financial year end is required'),
});

type RevenueInfoData = z.infer<typeof revenueInfoSchema>;

const FINANCIAL_YEAR_OPTIONS = [
  { value: '12-31', label: 'December 31 (Calendar Year)' },
  { value: '03-31', label: 'March 31' },
  { value: '06-30', label: 'June 30' },
  { value: '09-30', label: 'September 30' },
];

export default function RevenueInfoStep() {
  const { revenueDeclaration, updateRevenueDeclaration, updateStepValidation } = useSetup();
  const { setClassification } = useTaxClassification();

  const form = useForm<RevenueInfoData>({
    resolver: zodResolver(revenueInfoSchema),
    defaultValues: {
      annualRevenue: revenueDeclaration.expectedAnnualRevenue || 0,
      employees: 1,
      financialYearEnd: '12-31',
    },
  });

  const { watch, formState: { errors, isValid } } = form;
  const watchedValues = watch();

  // Update step validation
  useEffect(() => {
    updateStepValidation(2, isValid);
  }, [isValid, updateStepValidation]);

  // Auto-save form data as user types
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateRevenueDeclaration({
        expectedAnnualRevenue: value.annualRevenue,
        mainRevenueSource: 'Business Operations',
      });
    });
    return () => subscription.unsubscribe();
  }, [form, updateRevenueDeclaration]);

  const formatRevenue = (value: string) => {
    // Remove non-digits and format as number
    const number = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(number) ? 0 : number;
  };

  const getRevenueThresholdInfo = (revenue: number) => {
    if (revenue < 375000) {
      return {
        category: 'Micro Business',
        color: 'blue',
        obligations: ['CIT registration required', 'No VAT registration needed', '0% CIT rate (Small Business Relief)'],
      };
    } else if (revenue < 3000000) {
      return {
        category: 'Small Business',
        color: 'green',
        obligations: ['CIT and VAT registration required', '0% CIT rate (Small Business Relief)', '5% VAT rate'],
      };
    } else {
      return {
        category: 'Medium Business',
        color: 'purple',
        obligations: ['Full CIT and VAT obligations', '9% CIT rate', '5% VAT rate', 'Transfer pricing may apply'],
      };
    }
  };

  const thresholdInfo = getRevenueThresholdInfo(watchedValues.annualRevenue);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Revenue Classification:</strong> Your annual revenue determines your UAE tax obligations. 
          Enter your expected revenue for the current/upcoming financial year.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Expected Annual Revenue (AED) *</Label>
              <Input
                id="annualRevenue"
                type="number"
                {...form.register('annualRevenue', {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const value = parseFloat(e.target.value) || 0;
                    form.setValue('annualRevenue', value);
                  }
                })}
                placeholder="1000000"
                min="0"
                step="1000"
                className={errors.annualRevenue ? 'border-red-500' : ''}
              />
              {errors.annualRevenue && (
                <p className="text-sm text-red-600">{errors.annualRevenue.message}</p>
              )}
              {watchedValues.annualRevenue > 0 && (
                <p className="text-sm text-gray-600">
                  {formatCurrency(watchedValues.annualRevenue)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employees">Number of Employees *</Label>
              <Input
                id="employees"
                type="number"
                {...form.register('employees', {
                  valueAsNumber: true
                })}
                placeholder="5"
                min="1"
                max="10000"
                className={errors.employees ? 'border-red-500' : ''}
              />
              {errors.employees && (
                <p className="text-sm text-red-600">{errors.employees.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financialYearEnd">Financial Year End *</Label>
              <Select
                value={watchedValues.financialYearEnd}
                onValueChange={(value) => form.setValue('financialYearEnd', value)}
              >
                <SelectTrigger className={errors.financialYearEnd ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select financial year end" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCIAL_YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.financialYearEnd && (
                <p className="text-sm text-red-600">{errors.financialYearEnd.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Classification Preview */}
        <Card className={`border-2 border-${thresholdInfo.color}-200 bg-${thresholdInfo.color}-50/30`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tax Classification Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{thresholdInfo.category}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Based on revenue of {formatCurrency(watchedValues.annualRevenue)}
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Tax Obligations:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {thresholdInfo.obligations.map((obligation, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {obligation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Employee Impact */}
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employee Considerations
              </h4>
              <p className="text-sm text-gray-700">
                {watchedValues.employees === 1 
                  ? 'Single employee business - simplified compliance requirements'
                  : watchedValues.employees < 10
                  ? 'Small team - basic HR compliance requirements'
                  : watchedValues.employees < 50
                  ? 'Medium team - enhanced compliance and reporting'
                  : 'Large team - comprehensive HR and compliance requirements'
                }
              </p>
            </div>

            {/* Financial Year Impact */}
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Financial Year Impact
              </h4>
              <p className="text-sm text-gray-700">
                {watchedValues.financialYearEnd === '12-31'
                  ? 'Calendar year alignment - simplified reporting with most UAE businesses'
                  : 'Non-calendar year end - ensure compliance with UAE reporting deadlines'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Category Detector */}
      {watchedValues.annualRevenue > 0 && (
        <TaxCategoryDetector
          initialRevenue={watchedValues.annualRevenue}
          onClassificationChange={(classification) => {
            setClassification({
              ...classification,
              annualRevenue: watchedValues.annualRevenue,
            });
          }}
          className="mt-6"
        />
      )}

      {/* Threshold Warning */}
      {watchedValues.annualRevenue >= 375000 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <TrendingUp className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <strong>VAT Registration Required:</strong> With annual revenue of {formatCurrency(watchedValues.annualRevenue)}, 
            your business must register for VAT within 30 days of exceeding the AED 375,000 threshold.
          </AlertDescription>
        </Alert>
      )}

      {watchedValues.annualRevenue >= 3000000 && (
        <Alert className="border-purple-200 bg-purple-50">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <strong>Enhanced Compliance Required:</strong> Revenue above AED 3M requires accrual accounting, 
            enhanced record-keeping, and potential transfer pricing documentation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
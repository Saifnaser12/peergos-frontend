import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTaxCalculation, TaxCalculationResult } from '@/hooks/use-tax-calculation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { 
  Calculator, 
  Shield, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  DollarSign,
  Building2,
  Upload
} from 'lucide-react';
import TaxSubmissionModal from './tax-submission-modal';
import { formatCurrency } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SecureTaxCalculatorProps {
  type: 'CIT' | 'VAT';
  onResultUpdate?: (result: TaxCalculationResult | null) => void;
  className?: string;
}

export default function SecureTaxCalculator({ 
  type, 
  onResultUpdate, 
  className = '' 
}: SecureTaxCalculatorProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState(`${type} Calculation - ${new Date().getFullYear()}`);
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  
  const { company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const taxCalculation = useTaxCalculation();

  const handleCalculate = async () => {
    if (!company) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to calculate taxes',
        variant: 'destructive',
      });
      return;
    }

    try {
      const calculationResult = await taxCalculation.mutateAsync({
        type,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        period
      });

      setResult(calculationResult);
      onResultUpdate?.(calculationResult);

      toast({
        title: `${type} Calculation Complete`,
        description: `Tax calculation completed successfully for ${company.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Calculation Failed',
        description: error.message || 'Failed to calculate taxes',
        variant: 'destructive',
      });
    }
  };

  const resetCalculation = () => {
    setResult(null);
    onResultUpdate?.(null);
    setStartDate('');
    setEndDate('');
    setPeriod(`${type} Calculation - ${new Date().getFullYear()}`);
  };

  const getStatusIcon = () => {
    if (taxCalculation.isPending) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
    if (result) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Calculator className="h-5 w-5 text-gray-600" />;
  };

  const getStatusColor = () => {
    if (taxCalculation.isPending) return 'border-blue-200 bg-blue-50';
    if (result) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Secure {type} Calculator
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Backend Verified
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Server-side calculation with authentication and TRN verification
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!result ? (
          <>
            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date (Optional)</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date (Optional)</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>

            {/* Period Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Calculation Period</label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g., Q2 2025, Annual 2024"
              />
            </div>

            {/* Company Information */}
            <div className={cn("border rounded-lg p-4", getStatusColor())}>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Company Details</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {company?.name || 'Not specified'}</p>
                <p><strong>TRN:</strong> {company?.trnNumber || 'Not registered'}</p>
                <p><strong>Free Zone:</strong> {company?.freeZone ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={handleCalculate}
              disabled={taxCalculation.isPending}
              className="w-full"
              size="lg"
            >
              {taxCalculation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating {type}...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate {type}
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Calculation Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{type} Calculation Results</h3>
                <Badge variant="outline" className="text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(result.totalRevenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                  <p className="text-sm text-blue-600">Total Revenue</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg border">
                  <DollarSign className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(result.totalExpenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                  <p className="text-sm text-red-600">Total Expenses</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg border">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(result.netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                  <p className="text-sm text-green-600">Net Income</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg border">
                  <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(result.taxOwed, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                  </p>
                  <p className="text-sm text-purple-600">{type} Owed</p>
                </div>
              </div>

              {/* Tax Rate & Base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Tax Calculation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Taxable Base:</span>
                      <span className="font-medium">
                        {formatCurrency(result.taxableBase, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Rate:</span>
                      <span className="font-medium">{(result.taxRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Period:</span>
                      <span className="font-medium">{result.period}</span>
                    </div>
                  </div>
                </div>

                {/* Exemptions & Relief */}
                {(result.freeZoneStatus?.isEligible || result.smallBusinessRelief?.isEligible) && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Tax Benefits</h4>
                    <div className="space-y-2 text-sm">
                      {result.freeZoneStatus?.isEligible && (
                        <div className="text-green-700">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span className="font-medium">Free Zone Status</span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            {result.freeZoneStatus.explanation}
                          </p>
                        </div>
                      )}
                      {result.smallBusinessRelief?.isEligible && (
                        <div className="text-blue-700">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span className="font-medium">Small Business Relief</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            {result.smallBusinessRelief.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Explanation */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detailed Explanation
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {result.explanation}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetCalculation} className="flex-1">
                New Calculation
              </Button>
              <Button onClick={() => window.print()} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Print Results
              </Button>
            </div>

            {/* Submit Return Button */}
            <TaxSubmissionModal 
              type={type}
              calculationData={{
                totalRevenue: result.totalRevenue,
                totalExpenses: result.totalExpenses,
                netIncome: result.netIncome,
                taxOwed: result.taxOwed,
                period: result.period
              }}
            >
              <Button className="w-full" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Submit {type} Return
              </Button>
            </TaxSubmissionModal>
          </>
        )}

        {/* Security Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Secure Calculation:</strong> All tax calculations are performed on secure servers 
            with authentication verification and TRN validation. Your data is protected and complies 
            with UAE FTA requirements.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
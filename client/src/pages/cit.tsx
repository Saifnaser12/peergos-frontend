import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useNavigation, useFormNavigation } from '@/context/navigation-context';
import { useTaxCalculation, TaxCalculationResult } from '@/hooks/use-tax-calculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import ProgressTracker from '@/components/ui/progress-tracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CitCalculator from '@/components/tax/cit-calculator';
import CitReturnForm from '@/components/tax/cit-return-form';
import SecureTaxCalculator from '@/components/tax/secure-tax-calculator';
import TaxFilingStatus from '@/components/tax/tax-filing-status';
import FilingHistoryTable from '@/components/tax/filing-history-table';
import { Building2, Calculator, FileText, Download, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { ProgressPill } from '@/components/ProgressPill';

export default function CIT() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const { company } = useAuth();
  const { language, t } = useLanguage();
  const taxCalculation = useTaxCalculation();
  const navigation = useNavigation();
  const { submitWithNavigation } = useFormNavigation();

  const { data: taxFilings } = useQuery({
    queryKey: ['/api/tax-filings', { companyId: company?.id, type: 'CIT' }],
    enabled: !!company?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const currentYearRevenue = Array.isArray(transactions) ? transactions.filter((t: any) => 
    t.type === 'REVENUE' && 
    new Date(t.transactionDate).getFullYear() === new Date().getFullYear()
  ).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) : 0;

  const currentYearExpenses = Array.isArray(transactions) ? transactions.filter((t: any) => 
    t.type === 'EXPENSE' && 
    new Date(t.transactionDate).getFullYear() === new Date().getFullYear()
  ).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) : 0;

  const netIncome = currentYearRevenue - currentYearExpenses;
  // Use centralized tax configuration for CIT calculation
  const estimatedCIT = netIncome <= 375000 ? 0 : (netIncome - 375000) * 0.09; // UAE Small Business Relief + 9% CIT rate

  // UX Fallback checks for missing data
  if (!company) {
    console.warn('[CIT Page] Company data missing - user needs to complete setup');
    return (
      <div className="space-y-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Company Setup Required</strong><br />
            Please complete your company profile setup to access CIT management features.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Setup</h3>
            <p className="text-gray-600 mb-4">Set up your company profile to start managing CIT returns</p>
            <Button onClick={() => window.location.href = '/setup'}>
              Go to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    console.warn('[CIT Page] No transactions found - user needs to add financial data');
    return (
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>No Financial Data Found</strong><br />
            Add at least one transaction to begin CIT calculations and filing.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Your First Transaction</h3>
            <p className="text-gray-600 mb-4">Record revenue and expenses to start calculating your CIT liability</p>
            <Button onClick={() => window.location.href = '/transactions'}>
              Add Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for minimal data requirements
  if (currentYearRevenue === 0 && currentYearExpenses === 0) {
    console.warn('[CIT Page] No current year financial activity found');
    return (
      <div className="space-y-6">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>No Current Year Activity</strong><br />
            No revenue or expenses found for {new Date().getFullYear()}. CIT filing may not be required.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Record Current Year Activity</h3>
            <p className="text-gray-600 mb-4">Add {new Date().getFullYear()} transactions to determine CIT obligations</p>
            <Button onClick={() => window.location.href = '/transactions'}>
              Add {new Date().getFullYear()} Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Progress Tracker */}
      <ProgressTracker variant="header" showNavigation={true} />
      
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Corporate Income Tax</h1>
          <p className="text-gray-600">Calculate and file your CIT returns</p>
        </div>
        <EnhancedButton 
          navigationType="submit"
          loading={isSubmitting}
          requiresValidation={true}
          validationFn={() => {
            // Validate that required data exists for CIT filing
            return netIncome >= 0 && Array.isArray(transactions) && transactions.length > 0;
          }}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              // Simulate CIT filing submission
              await new Promise(resolve => setTimeout(resolve, 2000));
              navigation.markStepCompleted('/cit');
              await navigation.navigateTo('/vat', { showToast: true });
            } catch (error) {
              console.error('CIT submission failed:', error);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}
        >
          <FileText size={16} />
          Submit to FTA
        </EnhancedButton>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Year Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentYearRevenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Building2 size={20} className="text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentYearExpenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Calculator size={20} className="text-warning-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={cn("text-xl font-bold", netIncome >= 0 ? "text-success-600" : "text-error-600")}>
                  {formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <FileText size={20} className="text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Estimated CIT</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(estimatedCIT, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                {netIncome <= 375000 && (
                  <p className="text-xs text-success-600 mt-1">Small Business Relief Applied</p>
                )}
              </div>
              <Download size={20} className="text-primary-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle>CIT Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Quick Calculator
              </TabsTrigger>
              <TabsTrigger value="return" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CIT Return
              </TabsTrigger>
              <TabsTrigger value="filings" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Filing History
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Compliance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator" className="mt-6">
              <SecureTaxCalculator 
                type="CIT"
                onResultUpdate={setTaxResult}
                className="max-w-4xl mx-auto"
              />
            </TabsContent>

            <TabsContent value="return" className="mt-6">
              <CitReturnForm 
                initialData={{
                  accountingIncome: netIncome.toString(),
                }}
                mode="submit"
              />
            </TabsContent>
            
            <TabsContent value="filings" className="mt-6">
              <FilingHistoryTable 
                taxType="CIT" 
                companyId={company?.id || 1} 
              />
            </TabsContent>
            
            <TabsContent value="compliance" className="mt-6">
              <div className="space-y-4">
                <Card className="border-success-200 bg-success-50">
                  <CardContent className="p-4">
                    <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                      <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                        <Building2 size={16} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-success-900">CIT Registration Status</h4>
                        <p className="text-sm text-success-700">
                          {company?.vatRegistered ? 'Registered for CIT' : 'Registration required for taxable income above AED 375,000'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {company?.freeZone && (
                  <Card className="border-primary-200 bg-primary-50">
                    <CardContent className="p-4">
                      <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <Building2 size={16} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-900">Free Zone Status</h4>
                          <p className="text-sm text-primary-700">
                            Qualified Free Zone Person (QFZP) - 0% CIT rate may apply for eligible income under AED 3M
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useNavigation, useFormNavigation } from '@/context/navigation-context';
import { useTaxCalculation, TaxCalculationResult } from '@/hooks/use-tax-calculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import ProgressTracker from '@/components/ui/progress-tracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CitCalculator from '@/components/tax/cit-calculator';
import SecureTaxCalculator from '@/components/tax/secure-tax-calculator';
import { Building2, Calculator, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

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

  const currentYearRevenue = transactions?.filter(t => 
    t.type === 'REVENUE' && 
    new Date(t.transactionDate).getFullYear() === new Date().getFullYear()
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const currentYearExpenses = transactions?.filter(t => 
    t.type === 'EXPENSE' && 
    new Date(t.transactionDate).getFullYear() === new Date().getFullYear()
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const netIncome = currentYearRevenue - currentYearExpenses;
  const estimatedCIT = netIncome <= 375000 ? 0 : (netIncome - 375000) * 0.09;

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
            return netIncome >= 0 && transactions && transactions.length > 0;
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
            <TabsList>
              <TabsTrigger value="calculator">CIT Calculator</TabsTrigger>
              <TabsTrigger value="secure">Secure API</TabsTrigger>
              <TabsTrigger value="filings">Past Filings</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator" className="mt-6">
              <CitCalculator />
            </TabsContent>
            
            <TabsContent value="secure" className="mt-6">
              <SecureTaxCalculator 
                type="CIT"
                onResultUpdate={setTaxResult}
                className="max-w-4xl mx-auto"
              />
            </TabsContent>
            
            <TabsContent value="filings" className="mt-6">
              <div className="space-y-4">
                {taxFilings?.length === 0 || !taxFilings ? (
                  <div className="text-center py-8">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No CIT Filings Yet</h3>
                    <p className="text-gray-500">Your CIT filings will appear here once you create them.</p>
                  </div>
                ) : (
                  taxFilings.map((filing) => (
                    <Card key={filing.id} className="border">
                      <CardContent className="p-4">
                        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                          <div>
                            <h4 className="font-medium">{filing.period}</h4>
                            <p className="text-sm text-gray-500">
                              Due: {new Date(filing.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={cn("text-right", language === 'ar' && "rtl:text-left")}>
                            <p className="font-medium">
                              {formatCurrency(parseFloat(filing.totalTax), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              filing.status === 'SUBMITTED' ? "bg-success-100 text-success-800" :
                              filing.status === 'DRAFT' ? "bg-warning-100 text-warning-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {filing.status}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useNavigation } from '@/context/navigation-context';
import { useToast } from '@/hooks/use-toast';
import { useTaxCalculation, TaxCalculationResult } from '@/hooks/use-tax-calculation';
import { VAT201Data, VAT201Calculator } from '@/lib/vat-calculations';
import VAT201Form from '@/components/vat/vat201-form';
import { exportToPDF, exportToXML } from '@/lib/export-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VatCalculator from '@/components/tax/vat-calculator';
import SecureTaxCalculator from '@/components/tax/secure-tax-calculator';
import TaxFilingStatus from '@/components/tax/tax-filing-status';
import { FileText, Receipt, Calculator, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

export default function VAT() {
  const [activeTab, setActiveTab] = useState('vat201');
  const [currentVAT201, setCurrentVAT201] = useState<VAT201Data | null>(null);
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const { company } = useAuth();
  const { language, t } = useLanguage();
  const navigation = useNavigation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const taxCalculation = useTaxCalculation();

  const { data: taxFilings = [] } = useQuery({
    queryKey: ['/api/tax-filings', { companyId: company?.id, type: 'VAT' }],
    enabled: !!company?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions?.filter(t => {
    const date = new Date(t.transactionDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }) || [];

  const monthlySales = monthlyTransactions.filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const monthlyPurchases = monthlyTransactions.filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // VAT201 submission mutation
  const submitVAT201Mutation = useMutation({
    mutationFn: async (data: VAT201Data) => {
      // Simulate API call to submit VAT201
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, returnNumber: 'VAT201-2025-Q1-001' };
    },
    onSuccess: (result) => {
      toast({
        title: 'VAT201 Submitted',
        description: `Return ${result.returnNumber} submitted successfully to FTA.`,
      });
      navigation.markStepCompleted('/vat');
      navigation.navigateTo('/financials', { showToast: true });
      queryClient.invalidateQueries({ queryKey: ['/api/tax-filings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit VAT201 return.',
        variant: 'destructive',
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: VAT201Data) => {
      // Simulate saving draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Draft Saved',
        description: 'VAT201 return saved as draft.',
      });
    },
  });

  const outputVat = monthlySales * 0.05;
  const inputVat = monthlyPurchases * 0.05;
  const netVatDue = Math.max(0, outputVat - inputVat);

  // Handle VAT201 operations
  const handleVAT201Submit = (data: VAT201Data) => {
    submitVAT201Mutation.mutate(data);
  };

  const handleSaveDraft = (data: VAT201Data) => {
    setCurrentVAT201(data);
    saveDraftMutation.mutate(data);
  };

  const handleExport = async (format: 'pdf' | 'xml') => {
    if (!currentVAT201) {
      toast({
        title: 'No Data',
        description: 'Please complete the VAT201 form first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (format === 'pdf') {
        // Generate PDF-friendly content for VAT201
        const pdfContent = generateVAT201PDF(currentVAT201);
        await exportToPDF(pdfContent as any);
      } else if (format === 'xml') {
        const xmlContent = VAT201Calculator.generateVAT201XML(currentVAT201, company);
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VAT201_${currentVAT201.period.returnPeriod}.xml`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export Successful',
        description: `VAT201 exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export VAT201 return.',
        variant: 'destructive',
      });
    }
  };

  // Generate PDF content for VAT201
  const generateVAT201PDF = (data: VAT201Data) => {
    return {
      companyInfo: company,
      period: data.period,
      incomeStatement: {
        revenue: { totalRevenue: data.totalOutputVAT },
        expenses: { totalExpenses: data.totalInputVAT },
        netIncome: data.netVATPayable,
      },
      balanceSheet: { assets: { totalAssets: 0 }, liabilities: { totalLiabilities: 0 }, equity: { totalEquity: 0 } },
      cashFlow: { netCashFlow: 0, openingCash: 0, closingCash: 0 },
      notes: [`VAT201 Return - ${data.period.returnPeriod}`],
      generationDate: new Date().toISOString(),
    };
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VAT Returns</h1>
          <p className="text-gray-600">Manage your VAT calculations and submissions</p>
        </div>
        <Button className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
          <FileText size={16} />
          New VAT Return
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(monthlySales, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Receipt size={20} className="text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Purchases</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(monthlyPurchases, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
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
                <p className="text-sm font-medium text-gray-600">Output VAT</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(outputVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <FileText size={20} className="text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Net VAT Due</p>
                <p className="text-xl font-bold text-error-600">
                  {formatCurrency(netVatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Download size={20} className="text-error-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VAT Registration Status */}
      {company?.vatRegistered && (
        <Card className="material-elevation-1 border-success-200 bg-success-50">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
              <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                <Receipt size={16} className="text-white" />
              </div>
              <div>
                <h4 className="font-medium text-success-900">VAT Registered</h4>
                <p className="text-sm text-success-700">
                  TRN: {company.trn} • Required to file monthly VAT returns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle>VAT Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="vat201">VAT201 Return</TabsTrigger>
              <TabsTrigger value="calculator">VAT Calculator</TabsTrigger>
              <TabsTrigger value="secure">Secure API</TabsTrigger>
              <TabsTrigger value="returns">Filed Returns</TabsTrigger>
              <TabsTrigger value="registration">Registration Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vat201" className="mt-6">
              <VAT201Form
                initialData={currentVAT201 || undefined}
                onSubmit={handleVAT201Submit}
                onSaveDraft={handleSaveDraft}
                onExport={handleExport}
                isSubmitting={submitVAT201Mutation.isPending}
              />
            </TabsContent>
            
            <TabsContent value="calculator" className="mt-6">
              <VatCalculator />
            </TabsContent>
            
            <TabsContent value="secure" className="mt-6">
              <SecureTaxCalculator 
                type="VAT"
                onResultUpdate={setTaxResult}
                className="max-w-4xl mx-auto"
              />
            </TabsContent>
            
            <TabsContent value="returns" className="mt-6">
              <div className="space-y-4">
                {taxFilings?.length === 0 || !taxFilings ? (
                  <div className="text-center py-8">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No VAT Returns Filed</h3>
                    <p className="text-gray-500">Your VAT returns will appear here once you file them.</p>
                    <Button className="mt-4">File Your First Return</Button>
                  </div>
                ) : (
                  taxFilings.filter(filing => filing.type === 'VAT').map((filing) => (
                    <TaxFilingStatus
                      key={filing.id}
                      filing={{
                        ...filing,
                        taxAgentName: filing.metadata ? JSON.parse(filing.metadata)?.taxAgentName : undefined,
                        reference: filing.metadata ? JSON.parse(filing.metadata)?.reference : undefined,
                        attachments: filing.metadata ? JSON.parse(filing.metadata)?.attachments : undefined,
                      }}
                      canResubmit={new Date(filing.dueDate) > new Date() && filing.status !== 'ACCEPTED'}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="registration" className="mt-6">
              <div className="space-y-4">
                <Card className="border">
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4">VAT Registration Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tax Registration Number (TRN)</label>
                        <p className="text-sm text-gray-900">{company?.trn || 'Not registered'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">VAT Rate</label>
                        <p className="text-sm text-gray-900">5% (Standard Rate)</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Filing Frequency</label>
                        <p className="text-sm text-gray-900">Monthly</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Registration Status</label>
                        <p className={cn("text-sm font-medium", 
                          company?.vatRegistered ? "text-success-600" : "text-warning-600"
                        )}>
                          {company?.vatRegistered ? 'Active' : 'Not Registered'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary-200 bg-primary-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-primary-900 mb-2">VAT Registration Requirements</h4>
                    <ul className="text-sm text-primary-700 space-y-1">
                      <li>• Mandatory registration for businesses with taxable supplies {'>'}= AED 375,000</li>
                      <li>• Voluntary registration available for businesses with taxable supplies {'>'}= AED 187,500</li>
                      <li>• Monthly VAT returns due by 28th of following month</li>
                      <li>• Keep detailed records of all transactions for 5 years</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

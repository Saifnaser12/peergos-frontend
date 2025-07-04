import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VatCalculator from '@/components/tax/vat-calculator';
import { FileText, Receipt, Calculator, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

export default function VAT() {
  const [activeTab, setActiveTab] = useState('calculator');
  const { company } = useAuth();
  const { language, t } = useLanguage();

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

  const outputVat = monthlySales * 0.05;
  const inputVat = monthlyPurchases * 0.05;
  const netVatDue = Math.max(0, outputVat - inputVat);

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
              <TabsTrigger value="calculator">VAT Calculator</TabsTrigger>
              <TabsTrigger value="returns">Filed Returns</TabsTrigger>
              <TabsTrigger value="registration">Registration Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator" className="mt-6">
              <VatCalculator />
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
                  taxFilings.map((filing) => (
                    <Card key={filing.id} className="border">
                      <CardContent className="p-4">
                        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                          <div>
                            <h4 className="font-medium">{filing.period}</h4>
                            <p className="text-sm text-gray-500">
                              Due: {new Date(filing.dueDate).toLocaleDateString()}
                            </p>
                            {filing.ftaReference && (
                              <p className="text-xs text-gray-400">Ref: {filing.ftaReference}</p>
                            )}
                          </div>
                          <div className={cn("text-right", language === 'ar' && "rtl:text-left")}>
                            <p className="font-medium">
                              {formatCurrency(parseFloat(filing.totalTax), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              filing.status === 'SUBMITTED' ? "bg-success-100 text-success-800" :
                              filing.status === 'APPROVED' ? "bg-primary-100 text-primary-800" :
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

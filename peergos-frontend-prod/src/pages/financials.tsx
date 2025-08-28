import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { FinancialStatementsGenerator, CompanyInfo, OpeningBalance } from '@/lib/financial-statements';
import FinancialStatementViewer from '@/components/financial/financial-statement-viewer';
import { exportToPDF, exportToExcel, exportToJSON, exportToXML } from '@/lib/export-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinancialStatements from '@/components/accounting/financial-statements';
import FinancialNotesEditor from '@/components/financials/financial-notes-editor';
import ReportPackGenerator from '@/components/financials/report-pack-generator';
import { FinancialNote } from '@/lib/financial-reports';
import { BarChart3, Download, FileText, TrendingUp, AlertTriangle, Info, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

export default function Financials() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [incomeStatementNotes, setIncomeStatementNotes] = useState<FinancialNote[]>([]);
  const [balanceSheetNotes, setBalanceSheetNotes] = useState<FinancialNote[]>([]);
  const [cashFlowNotes, setCashFlowNotes] = useState<FinancialNote[]>([]);
  const [taxSummaryNotes, setTaxSummaryNotes] = useState<FinancialNote[]>([]);
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: kpiData } = useQuery({
    queryKey: ['/api/kpi-data', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Generate financial statements
  const financialStatements = useMemo(() => {
    if (!transactions || !Array.isArray(transactions) || !company) return null;

    const companyInfo: CompanyInfo = {
      name: company.name || 'Company Name',
      trn: company.trn || '',
      licenseNumber: (company as any).businessLicense || '',
      address: company.address || '',
      isFreeZone: (company as any).freeZone || false,
      freeZoneName: (company as any).freeZone ? 'DIFC' : undefined,
      accountingBasis: (company as any).annualRevenue && (company as any).annualRevenue < 3000000 ? 'cash' : 'accrual',
      fiscalYearEnd: '12-31',
    };

    // Sample opening balances - in production, this would come from user input
    const openingBalances: OpeningBalance[] = [
      { account: 'CASH', category: 'ASSET', amount: 50000, description: 'Opening cash balance' },
      { account: 'SHARE_CAPITAL', category: 'EQUITY', amount: 100000, description: 'Initial share capital' },
      { account: 'RETAINED_EARNINGS', category: 'EQUITY', amount: 25000, description: 'Previous year profits' },
    ];

    const generator = new FinancialStatementsGenerator(
      transactions,
      openingBalances,
      companyInfo
    );

    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    return {
      companyInfo,
      period: { startDate, endDate },
      incomeStatement: generator.generateIncomeStatement(startDate, endDate),
      balanceSheet: generator.generateBalanceSheet(endDate),
      cashFlow: generator.generateCashFlow(startDate, endDate),
      notes: generator.generateStandardNotes(),
      generationDate: new Date().toISOString(),
    };
  }, [transactions, company]);

  const currentKpi = Array.isArray(kpiData) && kpiData.length > 0 ? kpiData[0] : null;
  const revenue = parseFloat(currentKpi?.revenue || '0');
  const expenses = parseFloat(currentKpi?.expenses || '0');
  const netIncome = parseFloat(currentKpi?.netIncome || '0');

  const handleExport = async (format: 'pdf' | 'excel' | 'json' | 'xml') => {
    if (!financialStatements) return;

    try {
      switch (format) {
        case 'pdf':
          await exportToPDF(financialStatements);
          break;
        case 'excel':
          await exportToExcel(financialStatements);
          break;
        case 'json':
          await exportToJSON(financialStatements);
          break;
        case 'xml':
          await exportToXML(financialStatements);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // UX Fallback checks for missing data
  if (!company) {
    console.warn('[Financials Page] Company data missing - user needs to complete setup');
    return (
      <div className="space-y-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Company Setup Required</strong><br />
            Please complete your company profile setup to access financial reports and statements.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Setup</h3>
            <p className="text-gray-600 mb-4">Set up your company profile to generate financial statements</p>
            <Button onClick={() => window.location.href = '/setup'}>
              Go to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    console.warn('[Financials Page] No transactions found - user needs to add financial data');
    return (
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>No Financial Data Found</strong><br />
            Add transactions to your account to generate meaningful financial statements and reports.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Financial Data</h3>
            <p className="text-gray-600 mb-4">Record your business transactions to generate comprehensive financial reports</p>
            <Button onClick={() => window.location.href = '/bookkeeping'}>
              Add Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive financial statements and business reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleExport('pdf')}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(revenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-sm text-success-500 flex items-center mt-1">
                  <TrendingUp size={12} className={cn("mr-1", language === 'ar' && "rtl:mr-0 rtl:ml-1")} />
                  +12.8% YoY
                </p>
              </div>
              <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-success-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-error-600">
                  {formatCurrency(expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-sm text-gray-500 mt-1">Operating costs</p>
              </div>
              <div className="w-12 h-12 bg-error-50 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-error-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={cn("text-2xl font-bold", netIncome >= 0 ? "text-success-600" : "text-error-600")}>
                  {formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {((netIncome / revenue) * 100).toFixed(1)}% margin
                </p>
              </div>
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", 
                netIncome >= 0 ? "bg-success-50" : "bg-error-50")}>
                <FileText size={24} className={netIncome >= 0 ? "text-success-500" : "text-error-500"} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Assets</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(revenue * 1.2, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-sm text-gray-500 mt-1">Current + Fixed</p>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="material-elevation-1">
        <CardHeader>
          <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
            <CardTitle>Financial Statements</CardTitle>
            <div className={cn("flex gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <Download size={14} className={cn("mr-1", language === 'ar' && "rtl:mr-0 rtl:ml-1")} />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <Download size={14} className={cn("mr-1", language === 'ar' && "rtl:mr-0 rtl:ml-1")} />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Financial Statements Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Revenue</span>
                        <span className="font-semibold">{formatCurrency(revenue, 'AED', 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Expenses</span>
                        <span className="font-semibold">{formatCurrency(expenses, 'AED', 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Net Income</span>
                        <span className={cn("font-semibold", netIncome >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatCurrency(netIncome, 'AED', 'en-AE')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Profit Margin</span>
                        <span className="font-semibold">{((netIncome / revenue) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expense Ratio</span>
                        <span className="font-semibold">{((expenses / revenue) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue Growth</span>
                        <span className="font-semibold text-green-600">+12.8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="income" className="space-y-6">
              {financialStatements?.incomeStatement ? (
                <FinancialStatements 
                  statements={financialStatements}
                  activeTab="income"
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No financial data available to generate income statement</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="balance" className="space-y-6">
              {financialStatements?.balanceSheet ? (
                <FinancialStatements 
                  statements={financialStatements}
                  activeTab="balance"
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No financial data available to generate balance sheet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-6">
              {financialStatements?.cashFlow ? (
                <FinancialStatements 
                  statements={financialStatements}
                  activeTab="cashflow"
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No financial data available to generate cash flow statement</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { FinancialStatementsGenerator, CompanyInfo, OpeningBalance } from '@/lib/financial-statements';
import FinancialStatementViewer from '@/components/financial/financial-statement-viewer';
import { exportToPDF, exportToExcel, exportToJSON, exportToXML } from '@/lib/export-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinancialStatements from '@/components/accounting/financial-statements';
import FinancialNotesEditor from '@/components/financials/financial-notes-editor';
import ReportPackGenerator from '@/components/financials/report-pack-generator';
import { FinancialNote } from '@/lib/financial-reports';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
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
    if (!transactions || !company) return null;

    const companyInfo: CompanyInfo = {
      name: company.name || 'Company Name',
      trn: company.trn || '',
      licenseNumber: company.businessLicense || '',
      address: company.address || '',
      isFreeZone: company.freeZone || false,
      freeZoneName: company.freeZone ? 'DIFC' : undefined,
      accountingBasis: company.annualRevenue && company.annualRevenue < 3000000 ? 'cash' : 'accrual',
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

  const currentKpi = kpiData?.[0];
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
      console.error(`Export failed:`, error);
    }
  };

  const handleEdit = () => {
    // This would open an editing interface
    console.log('Edit financial statements');
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">View your financial statements and analysis</p>
        </div>
        <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download size={16} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
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
          {/* Financial Statements Viewer */}
          {financialStatements && (
            <div className="mb-6">
              <FinancialStatementViewer
                statements={financialStatements}
                onExport={handleExport}
                onEdit={handleEdit}
              />
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="reportpack">Report Pack</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sales Revenue</span>
                        <span className="font-medium">{formatCurrency(revenue * 0.85, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Service Revenue</span>
                        <span className="font-medium">{formatCurrency(revenue * 0.15, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold">
                        <span>Total Revenue</span>
                        <span>{formatCurrency(revenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Operating Expenses</span>
                        <span className="font-medium">{formatCurrency(expenses * 0.6, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Administrative</span>
                        <span className="font-medium">{formatCurrency(expenses * 0.25, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Other Expenses</span>
                        <span className="font-medium">{formatCurrency(expenses * 0.15, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="income" className="mt-6">
              <FinancialStatements showStatements={true} statementType="income" />
            </TabsContent>
            
            <TabsContent value="balance" className="mt-6">
              <FinancialStatements showStatements={true} statementType="balance" />
            </TabsContent>
            
            <TabsContent value="cashflow" className="mt-6">
              <FinancialStatements showStatements={true} statementType="cashflow" />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FinancialNotesEditor
                    reportType="INCOME_STATEMENT"
                    notes={incomeStatementNotes}
                    onNotesChange={setIncomeStatementNotes}
                  />
                  <FinancialNotesEditor
                    reportType="BALANCE_SHEET"
                    notes={balanceSheetNotes}
                    onNotesChange={setBalanceSheetNotes}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FinancialNotesEditor
                    reportType="CASH_FLOW"
                    notes={cashFlowNotes}
                    onNotesChange={setCashFlowNotes}
                  />
                  <FinancialNotesEditor
                    reportType="TAX_SUMMARY"
                    notes={taxSummaryNotes}
                    onNotesChange={setTaxSummaryNotes}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reportpack" className="mt-6">
              <ReportPackGenerator />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

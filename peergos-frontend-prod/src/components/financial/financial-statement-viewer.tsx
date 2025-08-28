import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  Calendar,
  Building2,
  Shield,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/business-logic';
import { FinancialStatements, IncomeStatementData, BalanceSheetData, CashFlowData } from '@/lib/financial-statements';

interface FinancialStatementViewerProps {
  statements: FinancialStatements;
  onExport: (format: 'pdf' | 'excel' | 'json') => void;
  onEdit: () => void;
  className?: string;
}

type StatementType = 'income' | 'balance' | 'cashflow' | 'notes';

export default function FinancialStatementViewer({
  statements,
  onExport,
  onEdit,
  className = '',
}: FinancialStatementViewerProps) {
  const [selectedStatement, setSelectedStatement] = useState<StatementType>('income');

  const renderHeader = () => (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{statements.companyInfo.name}</h1>
            <p className="text-gray-600">Financial Statements</p>
          </div>
        </div>
        {statements.companyInfo.isFreeZone && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Free Zone Entity
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">TRN:</span>
          <p className="font-medium">{statements.companyInfo.trn}</p>
        </div>
        <div>
          <span className="text-gray-500">License:</span>
          <p className="font-medium">{statements.companyInfo.licenseNumber}</p>
        </div>
        <div>
          <span className="text-gray-500">Period:</span>
          <p className="font-medium">
            {new Date(statements.period.startDate).toLocaleDateString()} - {new Date(statements.period.endDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Basis:</span>
          <p className="font-medium capitalize">{statements.companyInfo.accountingBasis}</p>
        </div>
      </div>
    </div>
  );

  const renderIncomeStatement = (data: IncomeStatementData) => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Income Statement</h2>
      
      {/* Revenue Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded">Revenue</h3>
        <div className="pl-4 space-y-2">
          <div className="flex justify-between">
            <span>Operating Revenue</span>
            <span className="font-medium">{formatCurrency(data.revenue.operatingRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span>Other Income</span>
            <span className="font-medium">{formatCurrency(data.revenue.otherIncome)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Revenue</span>
            <span>{formatCurrency(data.revenue.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded">Expenses</h3>
        <div className="pl-4 space-y-2">
          <div className="flex justify-between">
            <span>Cost of Sales</span>
            <span className="font-medium">({formatCurrency(data.expenses.costOfSales)})</span>
          </div>
          <div className="flex justify-between">
            <span>Operating Expenses</span>
            <span className="font-medium">({formatCurrency(data.expenses.operatingExpenses)})</span>
          </div>
          <div className="flex justify-between">
            <span>Administrative Expenses</span>
            <span className="font-medium">({formatCurrency(data.expenses.administrativeExpenses)})</span>
          </div>
          <div className="flex justify-between">
            <span>Finance Expenses</span>
            <span className="font-medium">({formatCurrency(data.expenses.financeExpenses)})</span>
          </div>
          <div className="flex justify-between">
            <span>Other Expenses</span>
            <span className="font-medium">({formatCurrency(data.expenses.otherExpenses)})</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Expenses</span>
            <span>({formatCurrency(data.expenses.totalExpenses)})</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between text-lg">
          <span>Gross Profit</span>
          <span className="font-semibold">{formatCurrency(data.grossProfit)}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span>Operating Profit</span>
          <span className="font-semibold">{formatCurrency(data.operatingProfit)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold border-t pt-3">
          <span>Net Income</span>
          <span className={data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.netIncome)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderBalanceSheet = (data: BalanceSheetData) => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Balance Sheet</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded">Assets</h3>
          
          {/* Current Assets */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Current Assets</h4>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cash and Bank</span>
                <span>{formatCurrency(data.assets.currentAssets.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Accounts Receivable</span>
                <span>{formatCurrency(data.assets.currentAssets.accountsReceivable)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory</span>
                <span>{formatCurrency(data.assets.currentAssets.inventory)}</span>
              </div>
              <div className="flex justify-between">
                <span>Prepaid Expenses</span>
                <span>{formatCurrency(data.assets.currentAssets.prepaidExpenses)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total Current Assets</span>
                <span>{formatCurrency(data.assets.currentAssets.totalCurrentAssets)}</span>
              </div>
            </div>
          </div>

          {/* Non-Current Assets */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Non-Current Assets</h4>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Property, Plant & Equipment</span>
                <span>{formatCurrency(data.assets.nonCurrentAssets.propertyPlantEquipment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Intangible Assets</span>
                <span>{formatCurrency(data.assets.nonCurrentAssets.intangibleAssets)}</span>
              </div>
              <div className="flex justify-between">
                <span>Investments</span>
                <span>{formatCurrency(data.assets.nonCurrentAssets.investments)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total Non-Current Assets</span>
                <span>{formatCurrency(data.assets.nonCurrentAssets.totalNonCurrentAssets)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Assets</span>
            <span>{formatCurrency(data.assets.totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities and Equity */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 bg-red-50 px-3 py-2 rounded">Liabilities & Equity</h3>
          
          {/* Current Liabilities */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Current Liabilities</h4>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Accounts Payable</span>
                <span>{formatCurrency(data.liabilities.currentLiabilities.accountsPayable)}</span>
              </div>
              <div className="flex justify-between">
                <span>Short-term Loans</span>
                <span>{formatCurrency(data.liabilities.currentLiabilities.shortTermLoans)}</span>
              </div>
              <div className="flex justify-between">
                <span>Accrued Expenses</span>
                <span>{formatCurrency(data.liabilities.currentLiabilities.accruedExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Payable</span>
                <span>{formatCurrency(data.liabilities.currentLiabilities.taxPayable)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total Current Liabilities</span>
                <span>{formatCurrency(data.liabilities.currentLiabilities.totalCurrentLiabilities)}</span>
              </div>
            </div>
          </div>

          {/* Non-Current Liabilities */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Non-Current Liabilities</h4>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Long-term Loans</span>
                <span>{formatCurrency(data.liabilities.nonCurrentLiabilities.longTermLoans)}</span>
              </div>
              <div className="flex justify-between">
                <span>Provisions</span>
                <span>{formatCurrency(data.liabilities.nonCurrentLiabilities.provisions)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total Non-Current Liabilities</span>
                <span>{formatCurrency(data.liabilities.nonCurrentLiabilities.totalNonCurrentLiabilities)}</span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Equity</h4>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Share Capital</span>
                <span>{formatCurrency(data.equity.shareCapital)}</span>
              </div>
              <div className="flex justify-between">
                <span>Retained Earnings</span>
                <span>{formatCurrency(data.equity.retainedEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Year Earnings</span>
                <span>{formatCurrency(data.equity.currentYearEarnings)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total Equity</span>
                <span>{formatCurrency(data.equity.totalEquity)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Liabilities & Equity</span>
            <span>{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCashFlow = (data: CashFlowData) => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Cash Flow Statement</h2>
      
      {/* Operating Activities */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 bg-green-50 px-3 py-2 rounded">Operating Activities</h3>
        <div className="pl-4 space-y-2">
          <div className="flex justify-between">
            <span>Net Income</span>
            <span className="font-medium">{formatCurrency(data.operatingActivities.netIncome)}</span>
          </div>
          <div className="pl-4 space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Depreciation</span>
              <span>{formatCurrency(data.operatingActivities.adjustments.depreciation)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change in Receivables</span>
              <span>({formatCurrency(Math.abs(data.operatingActivities.adjustments.changeInReceivables))})</span>
            </div>
            <div className="flex justify-between">
              <span>Change in Inventory</span>
              <span>({formatCurrency(Math.abs(data.operatingActivities.adjustments.changeInInventory))})</span>
            </div>
            <div className="flex justify-between">
              <span>Change in Payables</span>
              <span>{formatCurrency(data.operatingActivities.adjustments.changeInPayables)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Net Cash from Operating</span>
            <span>{formatCurrency(data.operatingActivities.netCashFromOperating)}</span>
          </div>
        </div>
      </div>

      {/* Investing Activities */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded">Investing Activities</h3>
        <div className="pl-4 space-y-2">
          <div className="flex justify-between">
            <span>Purchase of Assets</span>
            <span className="font-medium">({formatCurrency(data.investingActivities.purchaseOfAssets)})</span>
          </div>
          <div className="flex justify-between">
            <span>Sale of Assets</span>
            <span className="font-medium">{formatCurrency(data.investingActivities.saleOfAssets)}</span>
          </div>
          <div className="flex justify-between">
            <span>Investments</span>
            <span className="font-medium">({formatCurrency(data.investingActivities.investments)})</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Net Cash from Investing</span>
            <span>{formatCurrency(data.investingActivities.netCashFromInvesting)}</span>
          </div>
        </div>
      </div>

      {/* Financing Activities */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 bg-purple-50 px-3 py-2 rounded">Financing Activities</h3>
        <div className="pl-4 space-y-2">
          <div className="flex justify-between">
            <span>Borrowings</span>
            <span className="font-medium">{formatCurrency(data.financingActivities.borrowings)}</span>
          </div>
          <div className="flex justify-between">
            <span>Repayments</span>
            <span className="font-medium">({formatCurrency(data.financingActivities.repayments)})</span>
          </div>
          <div className="flex justify-between">
            <span>Dividends Paid</span>
            <span className="font-medium">({formatCurrency(data.financingActivities.dividends)})</span>
          </div>
          <div className="flex justify-between">
            <span>Share Capital</span>
            <span className="font-medium">{formatCurrency(data.financingActivities.shareCapital)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Net Cash from Financing</span>
            <span>{formatCurrency(data.financingActivities.netCashFromFinancing)}</span>
          </div>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between text-lg">
          <span>Net Cash Flow</span>
          <span className="font-semibold">{formatCurrency(data.netCashFlow)}</span>
        </div>
        <div className="flex justify-between">
          <span>Opening Cash Balance</span>
          <span className="font-medium">{formatCurrency(data.openingCash)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold border-t pt-3">
          <span>Closing Cash Balance</span>
          <span className="text-blue-600">{formatCurrency(data.closingCash)}</span>
        </div>
      </div>
    </div>
  );

  const renderNotes = (notes: string[]) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Notes to Financial Statements</h2>
      <div className="space-y-4">
        {notes.map((note, index) => {
          const lines = note.split('\n');
          const title = lines[0];
          const content = lines.slice(1).join('\n');
          
          return (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold text-gray-800">{title}</h3>
              {content && (
                <p className="text-gray-700 pl-4 whitespace-pre-line">{content}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financial Statements
            </CardTitle>
            <Select value={selectedStatement} onValueChange={(value: StatementType) => setSelectedStatement(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income Statement</SelectItem>
                <SelectItem value="balance">Balance Sheet</SelectItem>
                <SelectItem value="cashflow">Cash Flow</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('json')}>
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="max-h-[600px] overflow-y-auto">
        <div className="space-y-6">
          {renderHeader()}
          
          {selectedStatement === 'income' && renderIncomeStatement(statements.incomeStatement)}
          {selectedStatement === 'balance' && renderBalanceSheet(statements.balanceSheet)}
          {selectedStatement === 'cashflow' && renderCashFlow(statements.cashFlow)}
          {selectedStatement === 'notes' && renderNotes(statements.notes)}
        </div>
      </CardContent>
    </Card>
  );
}
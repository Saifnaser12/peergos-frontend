import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Download, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// UAE IFRS for SMEs Balance Sheet Items
interface BalanceSheetItem {
  code: string;
  name: string;
  category: 'current_assets' | 'non_current_assets' | 'current_liabilities' | 'non_current_liabilities' | 'equity';
  description: string;
  required: boolean;
  amount: number;
  notes?: string;
}

const BALANCE_SHEET_TEMPLATE: BalanceSheetItem[] = [
  // Current Assets
  { code: '1100', name: 'Cash and Cash Equivalents', category: 'current_assets', description: 'Bank accounts, petty cash', required: true, amount: 0 },
  { code: '1200', name: 'Trade Receivables', category: 'current_assets', description: 'Customer invoices pending', required: true, amount: 0 },
  { code: '1210', name: 'Other Receivables', category: 'current_assets', description: 'VAT refunds, deposits', required: false, amount: 0 },
  { code: '1300', name: 'Inventory', category: 'current_assets', description: 'Stock on hand', required: false, amount: 0 },
  { code: '1400', name: 'Prepaid Expenses', category: 'current_assets', description: 'Advance rent, insurance', required: false, amount: 0 },
  
  // Non-Current Assets  
  { code: '1500', name: 'Property, Plant & Equipment', category: 'non_current_assets', description: 'Office equipment, vehicles', required: true, amount: 0 },
  { code: '1600', name: 'Intangible Assets', category: 'non_current_assets', description: 'Software licenses, goodwill', required: false, amount: 0 },
  { code: '1700', name: 'Long-term Investments', category: 'non_current_assets', description: 'Investment securities', required: false, amount: 0 },
  
  // Current Liabilities
  { code: '2100', name: 'Trade Payables', category: 'current_liabilities', description: 'Supplier invoices', required: true, amount: 0 },
  { code: '2200', name: 'VAT Payable', category: 'current_liabilities', description: 'VAT due to FTA', required: true, amount: 0 },
  { code: '2300', name: 'Accrued Expenses', category: 'current_liabilities', description: 'Unpaid salaries, utilities', required: true, amount: 0 },
  { code: '2400', name: 'Short-term Borrowings', category: 'current_liabilities', description: 'Bank loans < 1 year', required: false, amount: 0 },
  { code: '2500', name: 'Provisions', category: 'current_liabilities', description: 'End of service gratuity', required: true, amount: 0 },
  
  // Non-Current Liabilities
  { code: '2600', name: 'Long-term Borrowings', category: 'non_current_liabilities', description: 'Bank loans > 1 year', required: false, amount: 0 },
  { code: '2700', name: 'Long-term Provisions', category: 'non_current_liabilities', description: 'Long-term employee benefits', required: false, amount: 0 },
  
  // Equity
  { code: '3000', name: 'Share Capital', category: 'equity', description: 'Authorized share capital', required: true, amount: 0 },
  { code: '3100', name: 'Retained Earnings', category: 'equity', description: 'Accumulated profits', required: true, amount: 0 },
  { code: '3200', name: 'Current Year Profit/Loss', category: 'equity', description: 'This year net income', required: true, amount: 0 }
];

export default function BalanceSheetGenerator() {
  const [balanceSheetItems, setBalanceSheetItems] = useState<BalanceSheetItem[]>(BALANCE_SHEET_TEMPLATE);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateItemAmount = (code: string, amount: number, notes?: string) => {
    setBalanceSheetItems(prev => prev.map(item => 
      item.code === code ? { ...item, amount, notes } : item
    ));
    calculateCompletion();
    validateBalance();
  };

  const calculateCompletion = () => {
    const requiredItems = balanceSheetItems.filter(item => item.required);
    const completedItems = requiredItems.filter(item => item.amount !== 0);
    const percentage = (completedItems.length / requiredItems.length) * 100;
    setCompletionPercentage(percentage);
  };

  const validateBalance = () => {
    const errors: string[] = [];
    
    const totalAssets = getTotalAssets();
    const totalLiabilitiesAndEquity = getTotalLiabilities() + getTotalEquity();
    
    const difference = Math.abs(totalAssets - totalLiabilitiesAndEquity);
    
    if (difference > 0.01) {
      errors.push(`Balance sheet doesn't balance. Difference: AED ${difference.toFixed(2)}`);
    }
    
    // Check for negative equity
    if (getTotalEquity() < 0) {
      errors.push('Negative equity detected. Company may be insolvent.');
    }
    
    // Check current ratio
    const currentRatio = getCurrentRatio();
    if (currentRatio < 1) {
      errors.push(`Low liquidity. Current ratio: ${currentRatio.toFixed(2)} (should be > 1.0)`);
    }
    
    setValidationErrors(errors);
  };

  const getTotalAssets = () => {
    return balanceSheetItems
      .filter(item => item.category.includes('assets'))
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalLiabilities = () => {
    return balanceSheetItems
      .filter(item => item.category.includes('liabilities'))
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalEquity = () => {
    return balanceSheetItems
      .filter(item => item.category === 'equity')
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const getCurrentAssets = () => {
    return balanceSheetItems
      .filter(item => item.category === 'current_assets')
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const getCurrentLiabilities = () => {
    return balanceSheetItems
      .filter(item => item.category === 'current_liabilities')
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const getCurrentRatio = () => {
    const currentLiab = getCurrentLiabilities();
    return currentLiab > 0 ? getCurrentAssets() / currentLiab : 0;
  };

  const getDebtToEquityRatio = () => {
    const equity = getTotalEquity();
    return equity > 0 ? getTotalLiabilities() / equity : 0;
  };

  const exportBalanceSheet = () => {
    const balanceSheetData = {
      companyName: 'SME Company Limited',
      reportDate: new Date().toISOString().split('T')[0],
      currency: 'AED',
      items: balanceSheetItems.map(item => ({
        code: item.code,
        name: item.name,
        category: item.category,
        amount: item.amount,
        notes: item.notes
      })),
      totals: {
        totalAssets: getTotalAssets(),
        totalLiabilities: getTotalLiabilities(),
        totalEquity: getTotalEquity(),
        currentRatio: getCurrentRatio(),
        debtToEquityRatio: getDebtToEquityRatio()
      }
    };

    const blob = new Blob([JSON.stringify(balanceSheetData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const categoryNames = {
    current_assets: 'Current Assets',
    non_current_assets: 'Non-Current Assets',
    current_liabilities: 'Current Liabilities',
    non_current_liabilities: 'Non-Current Liabilities',
    equity: 'Equity'
  };

  const groupedItems = balanceSheetItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BalanceSheetItem[]>);

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            UAE IFRS for SMEs Balance Sheet
            <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
              {completionPercentage.toFixed(0)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="mb-4" />
          
          {validationErrors.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Total Assets</div>
              <div className="text-xl font-bold text-blue-800">
                AED {getTotalAssets().toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">Total Liabilities</div>
              <div className="text-xl font-bold text-red-800">
                AED {getTotalLiabilities().toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600">Total Equity</div>
              <div className="text-xl font-bold text-green-800">
                AED {getTotalEquity().toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet Items by Category */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{categoryNames[category as keyof typeof categoryNames]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.code} className="grid grid-cols-12 gap-4 items-start p-3 border rounded-lg">
                  <div className="col-span-1">
                    <Badge variant="outline" className="text-xs">
                      {item.code}
                    </Badge>
                  </div>
                  
                  <div className="col-span-4">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                    {item.required && (
                      <Badge variant="destructive" className="text-xs mt-1">Required</Badge>
                    )}
                  </div>
                  
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateItemAmount(item.code, Number(e.target.value), item.notes)}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <Textarea
                      value={item.notes || ''}
                      onChange={(e) => updateItemAmount(item.code, item.amount, e.target.value)}
                      placeholder="Optional notes..."
                      className="h-16 text-sm"
                    />
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-semibold">
                <div className="col-span-5">
                  Total {categoryNames[category as keyof typeof categoryNames]}
                </div>
                <div className="col-span-3 text-right">
                  AED {items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </div>
                <div className="col-span-4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Key Financial Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600">Current Ratio</div>
              <div className="text-lg font-bold">{getCurrentRatio().toFixed(2)}</div>
              <div className="text-xs text-gray-500">Target: &gt; 1.0</div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600">Debt-to-Equity</div>
              <div className="text-lg font-bold">{getDebtToEquityRatio().toFixed(2)}</div>
              <div className="text-xs text-gray-500">Target: &lt; 2.0</div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600">Working Capital</div>
              <div className="text-lg font-bold">
                AED {(getCurrentAssets() - getCurrentLiabilities()).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Should be positive</div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600">Balance Check</div>
              <div className="flex items-center gap-2">
                {Math.abs(getTotalAssets() - (getTotalLiabilities() + getTotalEquity())) < 0.01 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">
                  {Math.abs(getTotalAssets() - (getTotalLiabilities() + getTotalEquity())) < 0.01 
                    ? 'Balanced' 
                    : 'Not Balanced'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={exportBalanceSheet} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export Balance Sheet
        </Button>
        <Button variant="outline" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  PieChart,
  Calculator,
  FileText,
  Lightbulb
} from 'lucide-react';

interface SmartExpenseAnalysis {
  category: string;
  confidence: number;
  taxDeductible: boolean;
  vatRate: number;
  suggestedSaving: number;
  optimizationTip: string;
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  analysis: SmartExpenseAnalysis;
  receiptImage?: string;
}

export default function SmartExpenseTracker() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Smart categorization rules for UAE businesses
  const smartCategorize = (description: string, amount: number): SmartExpenseAnalysis => {
    const desc = description.toLowerCase();
    
    // Office & Utilities
    if (desc.includes('dewa') || desc.includes('addc') || desc.includes('sewa') || desc.includes('electricity') || desc.includes('water')) {
      return {
        category: 'Utilities',
        confidence: 95,
        taxDeductible: true,
        vatRate: 5,
        suggestedSaving: amount * 0.05,
        optimizationTip: 'Consider energy-efficient solutions to reduce monthly utility costs'
      };
    }
    
    // Transportation & Fuel
    if (desc.includes('petrol') || desc.includes('fuel') || desc.includes('gas') || desc.includes('adnoc') || desc.includes('emarat')) {
      return {
        category: 'Transportation',
        confidence: 90,
        taxDeductible: true,
        vatRate: 5,
        suggestedSaving: amount * 0.05,
        optimizationTip: 'Track business vs personal mileage for maximum deduction'
      };
    }
    
    // Government & Legal
    if (desc.includes('visa') || desc.includes('emirates id') || desc.includes('license') || desc.includes('permit') || desc.includes('ministry')) {
      return {
        category: 'Government Fees',
        confidence: 100,
        taxDeductible: true,
        vatRate: 0,
        suggestedSaving: 0,
        optimizationTip: 'Government fees are 100% deductible and VAT-exempt'
      };
    }
    
    // Technology & Software
    if (desc.includes('microsoft') || desc.includes('software') || desc.includes('subscription') || desc.includes('saas') || desc.includes('cloud')) {
      return {
        category: 'Technology',
        confidence: 85,
        taxDeductible: true,
        vatRate: 5,
        suggestedSaving: amount * 0.05,
        optimizationTip: 'Software subscriptions are fully deductible business expenses'
      };
    }
    
    // Marketing & Advertising
    if (desc.includes('google ads') || desc.includes('facebook') || desc.includes('instagram') || desc.includes('marketing') || desc.includes('advertising')) {
      return {
        category: 'Marketing',
        confidence: 90,
        taxDeductible: true,
        vatRate: 5,
        suggestedSaving: amount * 0.05,
        optimizationTip: 'Digital marketing expenses can significantly reduce taxable income'
      };
    }
    
    // Professional Services
    if (desc.includes('consultant') || desc.includes('lawyer') || desc.includes('accounting') || desc.includes('audit') || desc.includes('legal')) {
      return {
        category: 'Professional Services',
        confidence: 95,
        taxDeductible: true,
        vatRate: 5,
        suggestedSaving: amount * 0.05,
        optimizationTip: 'Professional service fees are tax-deductible business expenses'
      };
    }
    
    // Office Supplies
    if (desc.includes('stationery') || desc.includes('office') || desc.includes('supplies') || desc.includes('paper') || desc.includes('pen')) {
      return {
        category: 'Office Supplies',
        confidence: 80,
        taxDeductible: true,
        vatRate: 5,
        suggestedSaving: amount * 0.05,
        optimizationTip: 'Keep receipts for all office supply purchases'
      };
    }
    
    // Default categorization
    return {
      category: 'General Business Expense',
      confidence: 60,
      taxDeductible: true,
      vatRate: 5,
      suggestedSaving: amount * 0.05,
      optimizationTip: 'Review this expense to ensure proper categorization for maximum tax benefit'
    };
  };

  const addExpense = () => {
    if (!newExpense.description || newExpense.amount <= 0) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const analysis = smartCategorize(newExpense.description, newExpense.amount);
      
      const expense: ExpenseItem = {
        id: Date.now().toString(),
        ...newExpense,
        category: analysis.category,
        analysis
      };
      
      setExpenses(prev => [expense, ...prev]);
      setNewExpense({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalTaxSavings = expenses.reduce((sum, exp) => sum + exp.analysis.suggestedSaving, 0);
  const deductibleExpenses = expenses.filter(exp => exp.analysis.taxDeductible).length;

  // Category analysis
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.analysis.category] = (acc[exp.analysis.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Smart Analysis Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Expense Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{expenses.length}</p>
              <p className="text-sm text-gray-600">Expenses Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">AED {totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{deductibleExpenses}</p>
              <p className="text-sm text-gray-600">Tax Deductible</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">AED {totalTaxSavings.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Tax Savings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Expense Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-500" />
            Quick Expense Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., DEWA electricity bill"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (AED)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={addExpense}
              disabled={isAnalyzing || !newExpense.description || newExpense.amount <= 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add & Analyze
                </>
              )}
            </Button>
            <Button variant="outline">
              <Smartphone className="h-4 w-4 mr-2" />
              Scan Receipt
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import File
            </Button>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Smart Features:</strong> Our AI automatically categorizes expenses, calculates VAT, 
              determines tax deductibility, and provides optimization tips for maximum savings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Top Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([category, amount], index) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-purple-500' : 'bg-green-500'
                    }`} />
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">AED {amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((amount / totalExpenses) * 100)}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No expenses tracked yet</p>
              <p className="text-sm">Add your first expense to get started with smart analysis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{expense.description}</h4>
                      <p className="text-sm text-gray-600">{expense.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">AED {expense.amount.toLocaleString()}</p>
                      <Badge variant="outline" className={`text-xs ${
                        expense.analysis.taxDeductible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {expense.analysis.taxDeductible ? 'Deductible' : 'Non-deductible'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{expense.analysis.category}</Badge>
                      <span className="text-gray-500">
                        {expense.analysis.confidence}% confidence
                      </span>
                    </div>
                    {expense.analysis.suggestedSaving > 0 && (
                      <span className="text-green-600 font-medium">
                        +AED {expense.analysis.suggestedSaving.toFixed(2)} tax benefit
                      </span>
                    )}
                  </div>
                  
                  {expense.analysis.optimizationTip && (
                    <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                      <Lightbulb className="h-3 w-3 text-yellow-600" />
                      <AlertDescription className="text-xs text-yellow-800">
                        <strong>Tip:</strong> {expense.analysis.optimizationTip}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
              
              {expenses.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View All {expenses.length} Expenses
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
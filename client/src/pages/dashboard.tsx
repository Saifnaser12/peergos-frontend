import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/hooks/use-auth';
import UAEFTA2025Alerts from '@/components/compliance/uae-fta-2025-alerts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Calculator, 
  FileText, 
  UserCheck, 
  Plus, 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/i18n';
import { Link } from 'wouter';

export default function Dashboard() {
  const { language } = useLanguage();
  const { company, user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('2025-07');

  // Fetch real data
  const { data: kpiData = [] } = useQuery({
    queryKey: ['/api/kpi-data', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/invoices', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: taxFilings = [] } = useQuery({
    queryKey: ['/api/tax-filings', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Calculate real metrics
  const currentKpi = kpiData.length > 0 ? kpiData[0] : null;
  const revenue = parseFloat(currentKpi?.revenue || '0');
  const expenses = parseFloat(currentKpi?.expenses || '0');
  const netIncome = parseFloat(currentKpi?.netIncome || '0');
  const vatDue = parseFloat(currentKpi?.vatDue || '0');
  const citDue = parseFloat(currentKpi?.citDue || '0');

  // Calculate completion percentages
  const vatThreshold = 187500; // AED 187,500 quarterly threshold
  const citThreshold = 375000; // AED 375,000 annual threshold
  const vatProgress = Math.min((revenue / vatThreshold) * 100, 100);
  const citProgress = Math.min((revenue / citThreshold) * 100, 100);

  // Determine next actions needed
  const nextVatDue = new Date('2025-07-28');
  const nextCitDue = new Date('2025-09-30');
  const today = new Date();
  const vatDaysLeft = Math.ceil((nextVatDue.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const citDaysLeft = Math.ceil((nextCitDue.getTime() - today.getTime()) / (1000 * 3600 * 24));

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Welcome Header with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
            <p className="text-lg opacity-90 mb-4">
              Managing tax compliance for {company?.name || 'Your Business'}
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {company?.freeZone ? 'Free Zone Entity' : 'Mainland Entity'}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {company?.vatRegistered ? 'VAT Registered' : 'VAT Exempt'}
              </Badge>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <Link href="/accounting">
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <Plus size={16} />
                Add Transaction
              </Button>
            </Link>
            <Link href="/invoicing">
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <FileText size={16} />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <Link href="/accounting">
          <Button className="w-full flex items-center gap-2">
            <Plus size={16} />
            Add Transaction
          </Button>
        </Link>
        <Link href="/invoicing">
          <Button variant="outline" className="w-full flex items-center gap-2">
            <FileText size={16} />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-100">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min((revenue / 200000) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(expenses, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-100">
              <div 
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${Math.min((expenses / 50000) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VAT Due</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(vatDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current quarter</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${vatProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(netIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500 mt-1">After expenses</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min((netIncome / 100000) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Tax Assistant Promotion */}
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">NEW: AI Tax Assistant</h3>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">AI-Powered</Badge>
              </div>
              <p className="text-gray-700 mb-3">
                Maximize your tax savings with our intelligent assistant featuring smart insights, 
                deduction optimization, and automated expense tracking.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Tax Health Score (95%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Smart Expense Categorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">UAE-Specific Deductions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Annual Tax Planning</span>
                </div>
              </div>
            </div>
            <div className="ml-6 text-center">
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600">
                  AED {Math.round(revenue * 0.05).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Potential Annual Savings</div>
              </div>
              <Link to="/tax-assistant">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Try AI Assistant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Compliance Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator size={20} />
              VAT Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Quarterly Revenue Progress</span>
                <span>{vatProgress.toFixed(1)}% of threshold</span>
              </div>
              <Progress value={vatProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                Threshold: {formatCurrency(vatThreshold, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                <span className="text-sm font-medium">Next VAT Filing</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">{vatDaysLeft} days left</p>
                <p className="text-xs text-gray-500">Due: July 28, 2025</p>
              </div>
            </div>

            <Link href="/vat">
              <Button className="w-full">
                Review VAT Return
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              CIT Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Annual Revenue Progress</span>
                <span>{citProgress.toFixed(1)}% of threshold</span>
              </div>
              <Progress value={citProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                Small Business Relief: {formatCurrency(citThreshold, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm font-medium">
                  {citDue === 0 ? 'No CIT Due' : 'CIT Calculation Ready'}
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  {formatCurrency(citDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
                <p className="text-xs text-gray-500">Current year</p>
              </div>
            </div>

            <Link href="/cit">
              <Button variant="outline" className="w-full">
                Review CIT Calculation
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence & Smart Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap size={20} />
            Business Intelligence & Tax Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tax Efficiency Analysis */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Tax Efficiency Score</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-700">
                  {revenue > 0 ? Math.min(Math.round((expenses / revenue) * 100), 100) : 0}%
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  Your expense-to-revenue ratio suggests {revenue > 0 && (expenses / revenue) > 0.6 ? 'excellent' : revenue > 0 && (expenses / revenue) > 0.4 ? 'good' : 'room for improvement in'} tax optimization.
                </p>
                {revenue > 0 && (expenses / revenue) < 0.3 && (
                  <p className="text-xs text-orange-600 mt-1">
                    💡 Consider reviewing deductible business expenses to optimize your tax position.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Smart Business Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <h5 className="font-medium text-green-900 mb-1">Revenue Trend</h5>
              <p className="text-sm text-green-700">
                {revenue > 100000 ? '📈 Strong performance this period' : 
                 revenue > 50000 ? '📊 Steady growth trajectory' :
                 revenue > 0 ? '🌱 Building momentum' : '🚀 Ready to launch'}
              </p>
            </div>
            
            <div className="p-3 bg-amber-50 rounded border border-amber-200">
              <h5 className="font-medium text-amber-900 mb-1">Cash Flow Health</h5>
              <p className="text-sm text-amber-700">
                {revenue - expenses > 50000 ? '💰 Excellent liquidity' :
                 revenue - expenses > 10000 ? '💵 Healthy cash flow' :
                 revenue - expenses > 0 ? '⚖️ Balanced operations' : '⚠️ Monitor expenses closely'}
              </p>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {revenue === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Start Your Financial Journey:</strong> Record your first business transaction to unlock personalized tax insights.
                <Link href="/accounting">
                  <Button size="sm" className="ml-3 bg-blue-600 hover:bg-blue-700">
                    Record First Transaction
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {revenue > 375000 && vatDue === 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>VAT Registration Required:</strong> Your revenue exceeds AED 375k. Ensure VAT registration is completed.
                <Link href="/setup">
                  <Button size="sm" variant="outline" className="ml-3">
                    Check Registration
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {vatDaysLeft <= 10 && vatDaysLeft > 0 && vatDue > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Urgent: VAT Filing Due in {vatDaysLeft} days</strong> - Amount due: AED {vatDue.toLocaleString()}
                <Link href="/workflow">
                  <Button size="sm" className="ml-3 bg-red-600 hover:bg-red-700">
                    File Now
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {revenue > 0 && expenses === 0 && (
            <Alert className="border-purple-200 bg-purple-50">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>Maximize Deductions:</strong> Recording business expenses can significantly reduce your tax liability.
                <Link href="/accounting">
                  <Button size="sm" variant="outline" className="ml-3">
                    Add Business Expenses
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/accounting">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Add Transaction</p>
              <p className="text-xs text-gray-500">Record income/expenses</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/invoicing">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">Create Invoice</p>
              <p className="text-xs text-gray-500">Generate UAE compliant invoices</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/credit-debit-notes">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="font-medium">Credit/Debit Notes</p>
              <p className="text-xs text-gray-500">Invoice adjustments</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/financials">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-medium">Financial Reports</p>
              <p className="text-xs text-gray-500">Income statements & balance sheets</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* UAE FTA 2025 Compliance Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">UAE FTA 2025 Compliance</h2>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Critical Updates
          </Badge>
        </div>
        
        <UAEFTA2025Alerts 
          revenue={revenue || 0}
          isNaturalPerson={user?.role === 'SME_CLIENT'}
          isMultinational={revenue >= 750000000}
          isFreeZone={company?.businessType?.includes('Free Zone')}
        />
      </div>
    </div>
  );
}

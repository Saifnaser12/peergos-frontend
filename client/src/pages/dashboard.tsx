import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/lib/business-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickActionButton } from '@/components/QuickActionButton';
import { 
  Calculator, 
  FileText, 
  Plus,
  DollarSign,
  Building2,
  Bot,
  Receipt
} from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

import SimplifiedDashboard from '@/components/dashboard/simplified-dashboard';

export default function Dashboard() {
  return <SimplifiedDashboard />;
}

function OriginalDashboard() {
  const { language } = useLanguage();
  const { company, user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch essential data only
  const { data: kpiData = [] } = useQuery({
    queryKey: ['/api/kpi-data'],
    enabled: !!company?.id,
  });

  // Calculate key metrics
  const currentKpi = Array.isArray(kpiData) && kpiData.length > 0 ? kpiData[0] : null;
  const hasData = currentKpi && (parseFloat(currentKpi.revenue || '0') > 0);
  
  const revenue = hasData ? parseFloat(currentKpi.revenue || '0') : 0;
  const expenses = hasData ? parseFloat(currentKpi.expenses || '0') : 0;
  const netIncome = hasData ? parseFloat(currentKpi.netIncome || '0') : 0;
  const vatDue = hasData ? parseFloat(currentKpi.vatDue || '0') : 0;

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Peergos</h2>
          <p className="text-gray-600 mb-6">Start by adding your first transaction to see your tax overview</p>
          <Link href="/accounting">
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Add First Transaction
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user?.firstName ? `Welcome, ${user.firstName}` : 'Dashboard'}
          </h1>
          <p className="text-gray-600">{company?.name || 'Tax Compliance Overview'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {company?.freeZone && (
              <Badge variant="outline">Free Zone</Badge>
            )}
            {company?.vatRegistered && (
              <Badge variant="outline">VAT Registered</Badge>
            )}
          </div>
          
          {/* Quick Action Buttons */}
          <div className="hidden md:flex gap-2">
            <QuickActionButton
              icon={Plus}
              label="Add Expense"
              onClick={() => setLocation('/bookkeeping?tab=expenses')}
            />
            <QuickActionButton
              icon={FileText}
              label="File VAT"
              onClick={() => setLocation('/taxes?tab=vat')}
              variant="outline"
            />
            <QuickActionButton
              icon={Calculator}
              label="File CIT"
              onClick={() => setLocation('/taxes?tab=cit')}
              variant="outline"
            />
            <QuickActionButton
              icon={Bot}
              label="Ask AI"
              onClick={() => setLocation('/ai')}
              variant="secondary"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics - Clean & Simple */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(revenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-xl font-semibold text-orange-600">
                {formatCurrency(expenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Income</p>
              <p className={cn("text-xl font-semibold", netIncome >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(netIncome)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">VAT Due</p>
              <p className="text-xl font-semibold text-blue-600">
                {formatCurrency(vatDue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/accounting">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus size={20} />
                <span>Add Transaction</span>
              </Button>
            </Link>
            
            <Link href="/vat">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Calculator size={20} />
                <span>VAT Return</span>
              </Button>
            </Link>
            
            <Link href="/cit">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText size={20} />
                <span>CIT Filing</span>
              </Button>
            </Link>
            
            <Link href="/invoicing">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <DollarSign size={20} />
                <span>Invoices</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status - Simple */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">VAT Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Registration Status</span>
                <Badge variant={company?.vatRegistered ? "default" : "secondary"}>
                  {company?.vatRegistered ? "Registered" : "Not Required"}
                </Badge>
              </div>
              {company?.vatRegistered && (
                <div className="flex justify-between">
                  <span>Current VAT Due</span>
                  <span className="font-semibold">{formatCurrency(vatDue)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Next Filing Due</span>
                <span className="text-sm text-gray-600">28th of next month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CIT Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Annual Revenue</span>
                <span className="font-semibold">{formatCurrency(revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>CIT Rate</span>
                <Badge variant={netIncome <= 375000 ? "secondary" : "default"}>
                  {netIncome <= 375000 ? "0% (Relief)" : "9%"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Next Filing Due</span>
                <span className="text-sm text-gray-600">March 31, 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
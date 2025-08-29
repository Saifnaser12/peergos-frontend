import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
// useLanguage context not available in this setup, using default English
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  FileText, 
  Building2, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  Bell,
  Target,
  Clock
} from 'lucide-react';
import { Link } from 'wouter';

interface DashboardMetric {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
  status?: 'good' | 'warning' | 'danger';
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  link: string;
}

export default function SimplifiedDashboard() {
  const language = 'en'; // Default to English
  const { company, user } = useAuth();

  // Fetch essential data
  const { data: kpiData = [] } = useQuery({
    queryKey: ['/api/kpi-data'],
    enabled: !!company?.id,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!company?.id,
  });

  const { data: workflowStatus } = useQuery({
    queryKey: ['/api/workflow-status'],
    enabled: !!company?.id,
  });

  // Process data
  const currentKpi = Array.isArray(kpiData) && kpiData.length > 0 ? kpiData[0] : null;
  const hasData = currentKpi && (parseFloat(currentKpi.revenue || '0') > 0);
  
  const revenue = hasData ? parseFloat(currentKpi.revenue || '0') : 0;
  const vatDue = hasData ? parseFloat(currentKpi.vatDue || '0') : 0;
  const citDue = hasData ? parseFloat(currentKpi.citDue || '0') : 0;
  
  const isSetupComplete = company?.trn && company?.name;
  const currentStep = workflowStatus?.currentStep || 0;
  const overallProgress = workflowStatus?.overallProgress || 0;

  // Dashboard metrics
  const metrics: DashboardMetric[] = [
    {
      label: 'Monthly Revenue',
      value: formatCurrency(revenue),
      icon: TrendingUp,
      color: 'text-green-600',
      status: revenue > 0 ? 'good' : 'warning'
    },
    {
      label: 'VAT Due',
      value: formatCurrency(vatDue),
      icon: Calculator,
      color: 'text-blue-600',
      status: vatDue > 0 ? 'warning' : 'good'
    },
    {
      label: 'CIT Due', 
      value: formatCurrency(citDue),
      icon: Building2,
      color: 'text-purple-600',
      status: citDue > 0 ? 'warning' : 'good'
    },
    {
      label: 'Compliance',
      value: isSetupComplete ? 'Compliant' : 'Setup Needed',
      icon: CheckCircle2,
      color: isSetupComplete ? 'text-green-600' : 'text-orange-600',
      status: isSetupComplete ? 'good' : 'warning'
    }
  ];

  // Next actions based on current state
  const getNextActions = (): TaskItem[] => {
    const actions: TaskItem[] = [];

    if (!isSetupComplete) {
      actions.push({
        id: 'setup',
        title: 'Complete Company Setup',
        description: 'Finish your business profile and tax registration',
        priority: 'high',
        link: '/setup'
      });
    }

    if (!hasData) {
      actions.push({
        id: 'first-transaction',
        title: 'Add Your First Transaction',
        description: 'Start tracking revenue and expenses for tax calculations',
        priority: 'high', 
        link: '/bookkeeping'
      });
    }

    if (hasData && vatDue > 0) {
      actions.push({
        id: 'vat-filing',
        title: 'File VAT Return',
        description: `VAT of ${formatCurrency(vatDue)} is due`,
        priority: 'medium',
        dueDate: '2025-01-28',
        link: '/taxes'
      });
    }

    if (hasData && citDue > 0) {
      actions.push({
        id: 'cit-filing',
        title: 'File CIT Return',
        description: `Corporate tax of ${formatCurrency(citDue)} is due`,
        priority: 'medium',
        dueDate: '2025-03-31',
        link: '/taxes'
      });
    }

    actions.push({
      id: 'reports',
      title: 'Review Financial Reports',
      description: 'Generate P&L and balance sheet for compliance',
      priority: 'low',
      link: '/reports'
    });

    return actions.slice(0, 3); // Show max 3 actions
  };

  const nextActions = getNextActions();
  const urgentNotifications = Array.isArray(notifications) 
    ? notifications.filter((n: any) => n.priority === 'high').slice(0, 2)
    : [];

  // Empty state for new users
  if (!isSetupComplete && !hasData) {
    return (
      <div className={cn("space-y-8", language === 'ar' && "rtl:text-right")}>
        {/* Welcome Header */}
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Peergos
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your UAE tax compliance journey starts here
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/setup">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Start Setup Wizard
              </Button>
            </Link>
            <Link href="/bookkeeping">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Add First Transaction
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <Calculator className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Smart Tax Calculations</h3>
            <p className="text-sm text-gray-600">Automated VAT and CIT calculations with UAE compliance</p>
          </Card>
          <Card className="text-center p-6">
            <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Easy Bookkeeping</h3>
            <p className="text-sm text-gray-600">Simple transaction entry with auto-categorization</p>
          </Card>
          <Card className="text-center p-6">
            <CheckCircle2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">FTA Compliance</h3>
            <p className="text-sm text-gray-600">Stay compliant with UAE Federal Tax Authority</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.firstName ? `Welcome back, ${user.firstName}` : 'Dashboard'}
          </h1>
          <p className="text-gray-600">{company?.name || 'Tax Compliance Overview'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            UAE FTA Ready
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      {!isSetupComplete && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Setup Required</strong><br />
                Complete your company setup to access full tax compliance features
              </div>
              <Link href="/setup">
                <Button size="sm" className="ml-4">
                  Continue Setup
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.label}
                  </p>
                  <p className={cn("text-2xl font-bold", metric.color)}>
                    {metric.value}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-full",
                  metric.status === 'good' && "bg-green-100",
                  metric.status === 'warning' && "bg-amber-100",
                  metric.status === 'danger' && "bg-red-100"
                )}>
                  <metric.icon className={cn("w-6 h-6", metric.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      {overallProgress > 0 && overallProgress < 100 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Tax Compliance Progress</h3>
                <p className="text-sm text-gray-600">Step {currentStep + 1} of 7</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{overallProgress}%</p>
                <p className="text-sm text-gray-600">Complete</p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3 mb-4" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Setup</span>
              <span>Data Entry</span>
              <span>Calculations</span>
              <span>Filing</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        action.priority === 'high' && "bg-red-500",
                        action.priority === 'medium' && "bg-yellow-500",
                        action.priority === 'low' && "bg-green-500"
                      )} />
                      <p className="font-medium text-gray-900">{action.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    {action.dueDate && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {action.dueDate}
                      </p>
                    )}
                  </div>
                  <Link href={action.link}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Tax Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentNotifications.length > 0 ? (
              <div className="space-y-3">
                {urgentNotifications.map((notification: any) => (
                  <div key={notification.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{notification.title}</p>
                        <p className="text-sm text-red-700">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900">All Clear!</p>
                <p className="text-sm text-gray-600">No urgent tax deadlines or issues</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/bookkeeping">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <Plus className="w-6 h-6" />
                <span className="text-sm">Add Transaction</span>
              </Button>
            </Link>
            <Link href="/tax-calculations">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <Calculator className="w-6 h-6" />
                <span className="text-sm">Calculate Taxes</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </Link>
            <Link href="/ai">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <Building2 className="w-6 h-6" />
                <span className="text-sm">Ask AI Assistant</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
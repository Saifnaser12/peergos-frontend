import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import EnhancedSetupWizard from '@/components/setup/enhanced-setup-wizard';
import { formatCurrency } from '@/lib/business-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { KeyMetricsWidget } from '@/components/dashboard/widgets/key-metrics-widget';
import { DeadlineAlertsWidget } from '@/components/dashboard/widgets/deadline-alerts-widget';
import { ProgressTrackingWidget } from '@/components/dashboard/widgets/progress-tracking-widget';
import { QuickActionsWidget } from '@/components/dashboard/widgets/quick-actions-widget';
import { CustomizableWidget } from '@/components/dashboard/widgets/customizable-widget';
import { WorkflowStatusWidget } from './workflow-status-widget';
import { NextStepRecommendations } from '@/components/navigation/next-step-recommendations';
import { WorkflowBreadcrumb } from '@/components/navigation/workflow-breadcrumb';
import { ContinueWorkflowButton } from '@/components/navigation/continue-workflow-button';
import { ContextualHelp } from '@/components/navigation/contextual-help';
import { ValidationWarnings } from '@/components/data-sync/validation-warnings';
import { RealTimeIndicator } from '@/components/data-sync/real-time-indicator';
import { AutoPopulationStatus } from '@/components/data-sync/auto-population-status';
import { 
  Settings, 
  Plus, 
  Grid3X3, 
  Eye, 
  EyeOff,
  Building2,
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Calculator,
  Rocket
} from 'lucide-react';
import { Link } from 'wouter';

interface DashboardWidget {
  id: string;
  type: 'metrics' | 'deadlines' | 'progress' | 'actions' | 'workflow' | 'custom';
  title: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'key-metrics', type: 'metrics', title: 'Key Metrics', visible: true, position: 0, size: 'large' },
  { id: 'workflow-status', type: 'workflow', title: 'Workflow Status', visible: true, position: 1, size: 'large' },
  { id: 'deadline-alerts', type: 'deadlines', title: 'Tax Deadlines', visible: true, position: 2, size: 'medium' },
  { id: 'progress-tracking', type: 'progress', title: 'Task Progress', visible: true, position: 3, size: 'medium' },
  { id: 'quick-actions', type: 'actions', title: 'Quick Actions', visible: true, position: 4, size: 'small' },
];

export default function EnhancedDashboard() {
  const { language } = useLanguage();
  const { company, user } = useAuth();
  const [customizeMode, setCustomizeMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Fetch dashboard data
  const { data: kpiData = [] } = useQuery({
    queryKey: ['/api/kpi-data'],
    enabled: !!company?.id,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!company?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    enabled: !!company?.id,
  });

  // Calculate overview metrics
  const currentKpi = Array.isArray(kpiData) && kpiData.length > 0 ? kpiData[0] : null;
  const hasData = currentKpi && (parseFloat(currentKpi.revenue || '0') > 0);
  
  // Check if company setup is complete
  const isSetupComplete = company?.setupCompleted || (company?.trn && company?.accountingMethod);
  const canSkipSetup = hasData || isSetupComplete;
  
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  
  const pendingTasks = tasksArray.filter((task: any) => task.status === 'pending').length;
  const overdueTasks = tasksArray.filter((task: any) => task.status === 'overdue').length;
  const upcomingDeadlines = notificationsArray.filter((n: any) => n.type === 'deadline').length;

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  // Handle setup wizard completion
  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    // Refresh user data
    window.location.reload();
  };

  const handleSetupSkip = () => {
    setShowSetupWizard(false);
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible) return null;

    const baseClasses = cn(
      "transition-all duration-200",
      widget.size === 'small' && "col-span-1",
      widget.size === 'medium' && "col-span-2",
      widget.size === 'large' && "col-span-3"
    );

    switch (widget.type) {
      case 'metrics':
        return (
          <div key={widget.id} className={baseClasses}>
            <KeyMetricsWidget kpiData={currentKpi} hasData={hasData} />
          </div>
        );
      case 'deadlines':
        return (
          <div key={widget.id} className={baseClasses}>
            <DeadlineAlertsWidget notifications={notifications} />
          </div>
        );
      case 'progress':
        return (
          <div key={widget.id} className={baseClasses}>
            <ProgressTrackingWidget tasks={tasks} />
          </div>
        );
      case 'actions':
        return (
          <div key={widget.id} className={baseClasses}>
            <QuickActionsWidget />
          </div>
        );
      case 'workflow':
        return (
          <div key={widget.id} className={baseClasses}>
            <WorkflowStatusWidget />
          </div>
        );
      case 'custom':
        return (
          <div key={widget.id} className={baseClasses}>
            <CustomizableWidget title={widget.title} />
          </div>
        );
      default:
        return null;
    }
  };

  // Show setup wizard for new users or if setup is not complete
  if (!isSetupComplete && !hasData) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Welcome to Peergos</h2>
              <p className="text-blue-100">Let's get your UAE tax compliance setup in just 5 minutes</p>
            </div>
          </div>
        </div>

        {/* Setup Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowSetupWizard(true)}>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Complete Setup Wizard</h3>
                <p className="text-sm text-gray-600 mb-3">Guided setup with auto-configuration for UAE tax requirements</p>
                <Button size="sm" className="w-full">
                  Start Setup Wizard
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Start with Transactions</h3>
                <p className="text-sm text-gray-600 mb-3">Jump right in and add your first business transaction</p>
                <Link href="/accounting">
                  <Button variant="outline" size="sm" className="w-full">
                    Add Transaction
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-sm text-gray-600">Minutes to Setup</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-gray-600">FTA Compliant</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">Auto</div>
            <div className="text-sm text-gray-600">Configuration</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Workflow Breadcrumb Navigation */}
      <WorkflowBreadcrumb currentPath="/" className="mb-4" />
      
      {/* Header with Customization Controls */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {user?.firstName ? `Welcome back, ${user.firstName}` : 'Dashboard'}
              </h1>
              <p className="text-gray-600">{company?.name || 'Tax Compliance Overview'}</p>
            </div>
            <div className="flex items-center gap-2">
              <RealTimeIndicator module="dashboard" />
              <ContextualHelp module="dashboard" className="self-start" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Badges */}
          <div className="flex gap-2">
            {company?.freeZone && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Free Zone
              </Badge>
            )}
            {company?.vatRegistered && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                VAT Registered
              </Badge>
            )}
            {overdueTasks > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle size={12} />
                {overdueTasks} Overdue
              </Badge>
            )}
          </div>

          {/* Customize Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCustomizeMode(!customizeMode)}
            className="flex items-center gap-2"
          >
            <Grid3X3 size={16} />
            {customizeMode ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Quick Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingDeadlines}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(parseFloat(currentKpi?.revenue || '0'))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tax Due</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(parseFloat(currentKpi?.vatDue || '0'))}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Customization Panel */}
      {customizeMode && (
        <Card className="p-4 border-dashed border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Customize Dashboard</h3>
            <p className="text-sm text-gray-600">Toggle widgets on/off</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {widgets.map(widget => (
              <Button
                key={widget.id}
                variant={widget.visible ? "default" : "outline"}
                size="sm"
                onClick={() => toggleWidgetVisibility(widget.id)}
                className="flex items-center gap-2"
              >
                {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                {widget.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Validation Warnings */}
      <ValidationWarnings module="dashboard" compact />

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets
          .sort((a, b) => a.position - b.position)
          .map(renderWidget)}
      </div>

      {/* Auto-Population Status */}
      <AutoPopulationStatus className="mt-6" />

      {/* Next Step Recommendations and Continue Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <NextStepRecommendations currentModule="dashboard" />
        </div>
        <div>
          <ContinueWorkflowButton currentModule="dashboard" />
        </div>
      </div>
      
      {/* Setup Wizard Modal/Overlay */}
      {showSetupWizard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <EnhancedSetupWizard
                onComplete={() => {
                  setShowSetupWizard(false);
                  window.location.reload();
                }}
                onSkip={() => setShowSetupWizard(false)}
                canSkip={canSkipSetup}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
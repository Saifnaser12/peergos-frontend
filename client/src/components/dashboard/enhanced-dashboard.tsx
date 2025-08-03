import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
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
  Calculator
} from 'lucide-react';
import { Link } from 'wouter';

interface DashboardWidget {
  id: string;
  type: 'metrics' | 'deadlines' | 'progress' | 'actions' | 'custom';
  title: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'key-metrics', type: 'metrics', title: 'Key Metrics', visible: true, position: 0, size: 'large' },
  { id: 'deadline-alerts', type: 'deadlines', title: 'Tax Deadlines', visible: true, position: 1, size: 'medium' },
  { id: 'progress-tracking', type: 'progress', title: 'Task Progress', visible: true, position: 2, size: 'medium' },
  { id: 'quick-actions', type: 'actions', title: 'Quick Actions', visible: true, position: 3, size: 'small' },
];

export default function EnhancedDashboard() {
  const { language } = useLanguage();
  const { company, user } = useAuth();
  const [customizeMode, setCustomizeMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets);

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

  // Empty state for new users
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Peergos</h2>
          <p className="text-gray-600 mb-6">Start by adding your first transaction to see your comprehensive tax dashboard</p>
          <div className="flex gap-3 justify-center">
            <Link href="/accounting">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Add First Transaction
              </Button>
            </Link>
            <Link href="/setup">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings size={16} />
                Complete Setup
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header with Customization Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user?.firstName ? `Welcome back, ${user.firstName}` : 'Dashboard'}
          </h1>
          <p className="text-gray-600">{company?.name || 'Tax Compliance Overview'}</p>
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

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets
          .sort((a, b) => a.position - b.position)
          .map(renderWidget)}
      </div>
    </div>
  );
}
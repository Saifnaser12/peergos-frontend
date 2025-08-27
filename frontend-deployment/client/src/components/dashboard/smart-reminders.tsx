import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUpcomingDeadlines } from '@/lib/date-utils';

export default function SmartReminders() {
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const upcomingDeadlines = getUpcomingDeadlines();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return AlertTriangle;
      case 'MEDIUM': return Clock;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-error-500 bg-error-50';
      case 'MEDIUM': return 'text-warning-500 bg-warning-50';
      default: return 'text-primary-500 bg-primary-50';
    }
  };

  const getBadgeColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'bg-error-100 text-error-800';
    if (daysLeft <= 14) return 'bg-warning-100 text-warning-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="material-elevation-1">
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
          <Bell size={20} />
          {t('dashboard.upcoming_deadlines')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-6">
              <Bell size={32} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Upcoming Deadlines</h3>
              <p className="text-xs text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            upcomingDeadlines.slice(0, 4).map((deadline, index) => {
              const Icon = getPriorityIcon(deadline.priority);
              const priorityColor = getPriorityColor(deadline.priority);
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-50",
                    priorityColor
                  )}
                >
                  <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                    <Icon size={16} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {deadline.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(deadline.date).toLocaleDateString(
                          language === 'ar' ? 'ar-AE' : 'en-AE',
                          { month: 'short', day: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={getBadgeColor(deadline.daysLeft)}>
                    {deadline.daysLeft} days
                  </Badge>
                </div>
              );
            })
          )}
          
          {upcomingDeadlines.length > 4 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-primary-600 hover:text-primary-500"
            >
              View All Deadlines
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        {upcomingDeadlines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              {upcomingDeadlines.some(d => d.type === 'VAT') && (
                <Button 
                  size="sm" 
                  className="w-full bg-primary-50 text-primary-700 hover:bg-primary-100"
                  style={{
                    backgroundColor: `${company?.primaryColor || '#1976d2'}20`,
                    color: company?.primaryColor || '#1976d2',
                  }}
                >
                  Prepare VAT Return
                </Button>
              )}
              {upcomingDeadlines.some(d => d.type === 'CIT') && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                >
                  Review CIT Filing
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

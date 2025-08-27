import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/i18n';

export default function RecentActivity() {
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: taxFilings } = useQuery({
    queryKey: ['/api/tax-filings', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Combine and sort recent activities
  const recentActivities = [
    ...(transactions?.slice(0, 10).map(t => ({
      id: `transaction-${t.id}`,
      date: new Date(t.transactionDate),
      type: t.type,
      description: t.description,
      amount: parseFloat(t.amount),
      status: t.status,
      category: 'Transaction',
    })) || []),
    ...(taxFilings?.slice(0, 5).map(f => ({
      id: `filing-${f.id}`,
      date: new Date(f.createdAt!),
      type: f.type,
      description: `${f.type} Filing - ${f.period}`,
      amount: parseFloat(f.totalTax),
      status: f.status,
      category: 'Tax Filing',
    })) || []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
      case 'SUBMITTED':
      case 'APPROVED': return 'bg-success-100 text-success-800';
      case 'DRAFT': return 'bg-warning-100 text-warning-800';
      case 'PENDING': return 'bg-primary-100 text-primary-800';
      case 'REJECTED': return 'bg-error-100 text-error-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REVENUE': return 'bg-success-100 text-success-800';
      case 'EXPENSE': return 'bg-error-100 text-error-800';
      case 'VAT': return 'bg-primary-100 text-primary-800';
      case 'CIT': return 'bg-warning-100 text-warning-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle>{t('dashboard.recent_activity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="material-elevation-1">
      <CardHeader>
        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
          <CardTitle>{t('dashboard.recent_activity')}</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-500">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Recent Activity</h3>
            <p className="text-gray-500">Your recent transactions and filings will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", language === 'ar' && "rtl:text-right")}>
                    Date
                  </th>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", language === 'ar' && "rtl:text-right")}>
                    Type
                  </th>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", language === 'ar' && "rtl:text-right")}>
                    Description
                  </th>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", language === 'ar' && "rtl:text-right")}>
                    Amount
                  </th>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", language === 'ar' && "rtl:text-right")}>
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(activity.date, language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTypeColor(activity.type)}>
                        {activity.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(activity.amount, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

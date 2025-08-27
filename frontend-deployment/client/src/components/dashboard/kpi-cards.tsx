import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n';
import { getUpcomingDeadlines } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface KpiCardData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ size?: number }>;
}

export default function KpiCards() {
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['/api/kpi-data', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="material-elevation-1">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentKpi = kpiData?.[0];
  const upcomingDeadlines = getUpcomingDeadlines();
  const nextDeadline = upcomingDeadlines[0];

  const cards: KpiCardData[] = [
    {
      label: t('dashboard.vat_due'),
      value: formatCurrency(parseFloat(currentKpi?.vatDue || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE'),
      change: '+5.2% from last month',
      trend: 'up',
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
      icon: TrendingUp,
    },
    {
      label: t('dashboard.cit_liability'),
      value: formatCurrency(parseFloat(currentKpi?.citDue || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE'),
      change: 'Small Business Relief Applied',
      trend: 'neutral',
      color: 'text-success-500',
      bgColor: 'bg-success-50',
      icon: CheckCircle,
    },
    {
      label: t('dashboard.revenue_ytd'),
      value: formatCurrency(parseFloat(currentKpi?.revenue || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE'),
      change: '+12.8% vs target',
      trend: 'up',
      color: 'text-warning-500',
      bgColor: 'bg-warning-50',
      icon: TrendingUp,
    },
    {
      label: t('dashboard.next_deadline'),
      value: nextDeadline?.daysLeft?.toString() || '0',
      change: nextDeadline ? `days until ${nextDeadline.title}` : 'No upcoming deadlines',
      trend: nextDeadline && nextDeadline.daysLeft <= 14 ? 'down' : 'neutral',
      color: nextDeadline && nextDeadline.daysLeft <= 14 ? 'text-error-500' : 'text-warning-500',
      bgColor: nextDeadline && nextDeadline.daysLeft <= 14 ? 'bg-error-50' : 'bg-warning-50',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="material-elevation-1 hover-elevation transition-elevation">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
                <div className={cn("flex items-center", language === 'ar' && "rtl:flex-row-reverse")}>
                  {card.trend === 'up' && <TrendingUp size={16} className={cn("mr-1", card.color, language === 'ar' && "rtl:mr-0 rtl:ml-1")} />}
                  {card.trend === 'down' && <TrendingDown size={16} className={cn("mr-1", card.color, language === 'ar' && "rtl:mr-0 rtl:ml-1")} />}
                  {card.trend === 'neutral' && <CheckCircle size={16} className={cn("mr-1", card.color, language === 'ar' && "rtl:mr-0 rtl:ml-1")} />}
                  <span className={cn("text-sm", card.color)}>{card.change}</span>
                </div>
              </div>
              
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", card.bgColor)}>
                <card.icon size={24} className={card.color} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

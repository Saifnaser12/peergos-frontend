import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business-logic';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  currency?: boolean;
  color?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
  hasData?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  currency = false,
  color = 'default',
  className,
  onClick,
  hasData = true
}: MetricCardProps) {
  const colorClasses = {
    default: 'border-gray-200 bg-white',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50'
  };

  const iconColorClasses = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const displayValue = hasData && value > 0 ? 
    (currency ? formatCurrency(value) : value.toLocaleString()) : 
    '';

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        colorClasses[color],
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        <Icon className={cn("h-5 w-5", iconColorClasses[color])} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hasData && value > 0 ? (
            <>
              <div className="text-2xl font-bold text-gray-900">
                {displayValue}
              </div>
              {trend && (
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={trend.direction === 'up' ? 'default' : 
                            trend.direction === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} 
                    {trend.value}%
                  </Badge>
                  <span className="text-xs text-gray-600">{trend.label}</span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-xl font-medium text-gray-400">
                No data yet
              </div>
              <div className="text-xs text-gray-500">
                Start by adding transactions
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
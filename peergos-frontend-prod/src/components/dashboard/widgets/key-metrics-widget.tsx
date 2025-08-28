import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator,
  Building2,
  Receipt,
  Target,
  Percent
} from 'lucide-react';

interface KeyMetricsWidgetProps {
  kpiData: any;
  hasData: boolean;
}

export function KeyMetricsWidget({ kpiData, hasData }: KeyMetricsWidgetProps) {
  if (!hasData || !kpiData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Key Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No financial data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const revenue = parseFloat(kpiData.revenue || '0');
  const expenses = parseFloat(kpiData.expenses || '0');
  const netIncome = parseFloat(kpiData.netIncome || '0');
  const vatDue = parseFloat(kpiData.vatDue || '0');
  const citDue = parseFloat(kpiData.citDue || '0');
  const profitMargin = revenue > 0 ? ((netIncome / revenue) * 100) : 0;

  const metrics = [
    {
      label: 'Revenue (YTD)',
      value: formatCurrency(revenue, 'AED'),
      change: '+12.8%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(expenses, 'AED'),
      change: '+8.2%',
      trend: 'up' as const,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Net Income',
      value: formatCurrency(netIncome, 'AED'),
      change: netIncome >= 0 ? '+15.4%' : '-5.2%',
      trend: netIncome >= 0 ? 'up' as const : 'down' as const,
      icon: Target,
      color: netIncome >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      label: 'VAT Due',
      value: formatCurrency(vatDue, 'AED'),
      change: 'Due in 15 days',
      trend: 'neutral' as const,
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Key Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              const isPositiveTrend = metric.trend === 'up';
              const TrendIcon = metric.trend === 'up' ? TrendingUp : 
                              metric.trend === 'down' ? TrendingDown : null;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${metric.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {metric.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-gray-900">
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-1">
                      {TrendIcon && (
                        <TrendIcon 
                          className={`h-3 w-3 ${isPositiveTrend ? 'text-green-500' : 'text-red-500'}`} 
                        />
                      )}
                      <span className={`text-xs ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 
                        'text-gray-500'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* VAT Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">VAT Due</p>
                <p className="text-sm text-gray-500">Next filing: March 31st</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(vatDue, 'AED')}
                </p>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Due Soon
                </Badge>
              </div>
            </div>

            {/* CIT Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Corporate Income Tax</p>
                <p className="text-sm text-gray-500">Annual filing required</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(citDue, 'AED')}
                </p>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Small Business Relief
                </Badge>
              </div>
            </div>

            {/* Profit Margin Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Profit Margin</span>
                <span className="text-sm font-bold text-gray-900">{profitMargin.toFixed(1)}%</span>
              </div>
              <Tooltip content={`Profit margin: ${profitMargin.toFixed(1)}%`}>
                <Progress 
                  value={Math.min(profitMargin, 100)} 
                  className="h-2"
                />
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
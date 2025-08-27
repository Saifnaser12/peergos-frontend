import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PeriodData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  taxes: number;
}

interface PeriodComparisonChartProps {
  data: PeriodData[];
  title?: string;
  currency?: string;
  height?: number;
  comparisonMode?: 'month' | 'quarter' | 'year';
}

export default function PeriodComparisonChart({
  data,
  title = "Period Comparison",
  currency = "AED",
  height = 400,
  comparisonMode = "month"
}: PeriodComparisonChartProps) {
  
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getComparisonStats = () => {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    return {
      revenue: calculateChange(current.revenue, previous.revenue),
      expenses: calculateChange(current.expenses, previous.expenses),
      profit: calculateChange(current.profit, previous.profit),
      taxes: calculateChange(current.taxes, previous.taxes)
    };
  };

  const stats = getComparisonStats();

  const chartData = {
    labels: data.map(d => d.period),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(d => d.revenue),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Expenses',
        data: data.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Profit',
        data: data.map(d => d.profit),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Taxes',
        data: data.map(d => d.taxes),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'rect',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const formattedValue = new Intl.NumberFormat('en-AE', {
              style: 'currency',
              currency: currency
            }).format(value);
            return `${label}: ${formattedValue}`;
          },
          footer: (tooltipItems: any[]) => {
            const periodIndex = tooltipItems[0].dataIndex;
            if (periodIndex > 0) {
              const current = data[periodIndex];
              const previous = data[periodIndex - 1];
              const change = calculateChange(current.profit, previous.profit);
              return `Profit change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          callback: (value: any) => {
            return new Intl.NumberFormat('en-AE', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getChangeBadge = (change: number) => {
    const changeText = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    return change > 0 ? 
      <Badge className="bg-green-100 text-green-800">{changeText}</Badge> :
      <Badge variant="destructive">{changeText}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {comparisonMode.charAt(0).toUpperCase() + comparisonMode.slice(1)}ly
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="relative">
          <Bar data={chartData} options={options} />
        </div>
        
        {/* Comparison Stats */}
        {stats && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              Period-over-Period Changes
              <Badge variant="outline" className="text-xs">
                vs Previous {comparisonMode}
              </Badge>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide">Revenue</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getChangeIcon(stats.revenue)}
                  {getChangeBadge(stats.revenue)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide">Expenses</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getChangeIcon(stats.expenses)}
                  {getChangeBadge(stats.expenses)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide">Profit</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getChangeIcon(stats.profit)}
                  {getChangeBadge(stats.profit)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide">Taxes</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getChangeIcon(stats.taxes)}
                  {getChangeBadge(stats.taxes)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Period Summary */}
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Latest Period ({data[data.length - 1].period})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Revenue:</span>
                <div className="font-semibold text-green-600">
                  {formatCurrency(data[data.length - 1].revenue)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Expenses:</span>
                <div className="font-semibold text-red-600">
                  {formatCurrency(data[data.length - 1].expenses)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Profit:</span>
                <div className="font-semibold text-blue-600">
                  {formatCurrency(data[data.length - 1].profit)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Taxes:</span>
                <div className="font-semibold text-purple-600">
                  {formatCurrency(data[data.length - 1].taxes)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
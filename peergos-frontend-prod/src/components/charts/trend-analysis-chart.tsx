import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendData {
  label: string;
  value: number;
  period: string;
}

interface DataSeries {
  name: string;
  data: TrendData[];
  color: string;
  fillColor?: string;
}

interface TrendAnalysisChartProps {
  series: DataSeries[];
  title?: string;
  currency?: string;
  height?: number;
  showFill?: boolean;
  showGrid?: boolean;
}

export default function TrendAnalysisChart({
  series,
  title = "Trend Analysis",
  currency = "AED",
  height = 350,
  showFill = true,
  showGrid = true
}: TrendAnalysisChartProps) {
  
  // Get all unique periods
  const allPeriods = Array.from(
    new Set(series.flatMap(s => s.data.map(d => d.period)))
  ).sort();

  const calculateTrend = (data: TrendData[]) => {
    if (data.length < 2) return 0;
    const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period));
    const firstValue = sortedData[0].value;
    const lastValue = sortedData[sortedData.length - 1].value;
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendBadge = (trend: number) => {
    const trendText = `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`;
    if (trend > 5) return <Badge className="bg-green-100 text-green-800">{trendText}</Badge>;
    if (trend < -5) return <Badge variant="destructive">{trendText}</Badge>;
    return <Badge variant="secondary">{trendText}</Badge>;
  };

  const chartData = {
    labels: allPeriods,
    datasets: series.map(s => ({
      label: s.name,
      data: allPeriods.map(period => {
        const dataPoint = s.data.find(d => d.period === period);
        return dataPoint ? dataPoint.value : null;
      }),
      borderColor: s.color,
      backgroundColor: showFill ? (s.fillColor || s.color + '20') : 'transparent',
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: s.color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      fill: showFill,
      tension: 0.4,
      spanGaps: true
    }))
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
          pointStyle: 'circle',
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
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.05)'
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
          display: showGrid,
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
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {series.map((s, index) => {
              const trend = calculateTrend(s.data);
              return (
                <div key={index} className="flex items-center gap-1">
                  {getTrendIcon(trend)}
                  {getTrendBadge(trend)}
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="relative">
          <Line data={chartData} options={options} />
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {series.map((s, index) => {
              const latestValue = s.data[s.data.length - 1]?.value || 0;
              const trend = calculateTrend(s.data);
              return (
                <div key={index} className="text-center">
                  <div className="text-gray-600 text-xs uppercase tracking-wide">
                    {s.name}
                  </div>
                  <div className="font-semibold text-lg" style={{ color: s.color }}>
                    {new Intl.NumberFormat('en-AE', {
                      style: 'currency',
                      currency: currency,
                      minimumFractionDigits: 0
                    }).format(latestValue)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getTrendIcon(trend)}
                    <span className="text-xs">{trend.toFixed(1)}% trend</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
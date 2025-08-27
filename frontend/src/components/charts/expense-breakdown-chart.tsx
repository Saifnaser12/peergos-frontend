import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseData[];
  title?: string;
  currency?: string;
  showLegend?: boolean;
  height?: number;
}

export default function ExpenseBreakdownChart({
  data,
  title = "Expense Breakdown",
  currency = "AED",
  showLegend = true,
  height = 300
}: ExpenseBreakdownChartProps) {
  
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
        hoverBackgroundColor: data.map(item => item.color),
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            return data.labels.map((label: string, index: number) => {
              const value = data.datasets[0].data[index];
              const percentage = ((value / total) * 100).toFixed(1);
              return {
                text: `${label}: ${new Intl.NumberFormat('en-AE', {
                  style: 'currency',
                  currency: currency
                }).format(value)} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[index],
                hidden: false,
                index: index
              };
            });
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
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            const formattedValue = new Intl.NumberFormat('en-AE', {
              style: 'currency',
              currency: currency
            }).format(value);
            return `${label}: ${formattedValue} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          {title}
          <span className="text-sm font-normal text-gray-600">
            Total: {formatCurrency(total)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="relative">
          <Pie data={chartData} options={options} />
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Largest Category:</span>
              <div className="font-medium">
                {data.length > 0 && data.reduce((max, item) => item.amount > max.amount ? item : max).category}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Categories:</span>
              <div className="font-medium">{data.length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
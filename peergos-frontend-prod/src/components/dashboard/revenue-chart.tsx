import { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RevenueChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['/api/kpi-data', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  useEffect(() => {
    const loadChart = async () => {
      if (!canvasRef.current || !kpiData || kpiData.length === 0) return;

      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Prepare data for the last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const revenueData = [180000, 220000, 285340, 195000, 240000, 305000];
      const taxData = [9000, 11000, 14267, 9750, 12000, 15250];

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Revenue (AED)',
              data: revenueData,
              borderColor: company?.primaryColor || '#1976d2',
              backgroundColor: `${company?.primaryColor || '#1976d2'}20`,
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Tax Liability (AED)',
              data: taxData,
              borderColor: '#dc004e',
              backgroundColor: '#dc004e20',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: language === 'ar' ? 'end' : 'start',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context) => {
                  const value = new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-AE', {
                    style: 'currency',
                    currency: 'AED',
                  }).format(context.parsed.y);
                  return `${context.dataset.label}: ${value}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-AE', {
                    style: 'currency',
                    currency: 'AED',
                    notation: 'compact',
                  }).format(value as number);
                },
              },
            },
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
          },
        },
      });
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [kpiData, company?.primaryColor, language]);

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 material-elevation-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('dashboard.revenue_chart')}</span>
            <Skeleton className="h-8 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 material-elevation-1">
      <CardHeader>
        <CardTitle className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
          <span>{t('dashboard.revenue_chart')}</span>
          <div className={cn("flex space-x-2", language === 'ar' && "rtl:flex-row-reverse rtl:space-x-reverse")}>
            <Button 
              size="sm" 
              className="bg-primary-50 text-primary-600 hover:bg-primary-100"
              style={{
                backgroundColor: `${company?.primaryColor || '#1976d2'}20`,
                color: company?.primaryColor || '#1976d2',
              }}
            >
              Monthly
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700">
              Quarterly
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {kpiData && kpiData.length > 0 ? (
            <canvas ref={canvasRef} className="w-full h-full" />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">{t('dashboard.revenue_chart')}</p>
                <p className="text-xs text-gray-400 mt-1">Chart will render when data is available</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import KpiCards from '@/components/dashboard/kpi-cards';
import RevenueChart from '@/components/dashboard/revenue-chart';
import QuickActions from '@/components/dashboard/quick-actions';
import SmartReminders from '@/components/dashboard/smart-reminders';
import RecentActivity from '@/components/dashboard/recent-activity';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { language } = useLanguage();

  return (
    <div className={cn("space-y-8", language === 'ar' && "rtl:text-right")}>
      {/* KPI Cards */}
      <KpiCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <RevenueChart />
        
        {/* Right Sidebar - Takes 1 column */}
        <div className="space-y-6">
          <QuickActions />
          <SmartReminders />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}

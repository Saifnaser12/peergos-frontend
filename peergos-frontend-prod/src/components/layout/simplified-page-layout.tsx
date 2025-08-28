import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SimplifiedPageLayoutProps {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export default function SimplifiedPageLayout({ 
  title, 
  children, 
  className = '',
  actions 
}: SimplifiedPageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function MetricCard({ title, value, icon, variant = 'default' }: MetricCardProps) {
  const variants = {
    default: 'border-gray-200 bg-white',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50'
  };

  return (
    <Card className={cn("transition-shadow hover:shadow-sm", variants[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SimpleTabs({ tabs, activeTab, onTabChange }: SimpleTabsProps) {
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
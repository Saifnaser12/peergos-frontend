import { Link } from 'wouter';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Wallet, 
  Receipt, 
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    title: 'File VAT Return',
    href: '/vat',
    icon: FileText,
    color: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
    description: 'Submit your monthly VAT return',
  },
  {
    title: 'Add Transaction',
    href: '/accounting',
    icon: Wallet,
    color: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    description: 'Record revenue or expense',
  },
  {
    title: 'Create Invoice',
    href: '/invoicing',
    icon: Receipt,
    color: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    description: 'Generate new invoice',
  },
  {
    title: 'Generate Report',
    href: '/financials',
    icon: BarChart3,
    color: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    description: 'View financial statements',
  },
];

export default function QuickActions() {
  const { language, t } = useLanguage();

  return (
    <Card className="material-elevation-1">
      <CardHeader>
        <CardTitle>{t('dashboard.quick_actions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between p-3 h-auto transition-colors",
                  action.color,
                  language === 'ar' && "rtl:flex-row-reverse"
                )}
              >
                <div className={cn("flex items-center", language === 'ar' && "rtl:flex-row-reverse")}>
                  <action.icon size={20} className={cn("mr-3", language === 'ar' && "rtl:mr-0 rtl:ml-3")} />
                  <div className={cn("text-left", language === 'ar' && "rtl:text-right")}>
                    <span className="font-medium block">{action.title}</span>
                    <span className="text-xs opacity-75">{action.description}</span>
                  </div>
                </div>
                <ArrowRight size={16} className={cn(language === 'ar' && "rtl:rotate-180")} />
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import LanguageSwitcher from '../common/language-switcher';
import NotificationBell from '../notifications/notification-bell';
import UserMenu from '../common/user-menu';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const pageTitle = t('dashboard.title');
  const pageSubtitle = t('dashboard.subtitle');

  return (
    <header className="bg-white material-elevation-1 border-b border-gray-200 px-6 py-4">
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div className={cn("flex items-center space-x-4", language === 'ar' && "rtl:flex-row-reverse rtl:space-x-reverse")}>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </Button>
          
          <div className={cn(language === 'ar' && "rtl:text-right")}>
            <h1 className="text-2xl font-medium text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-gray-500">{pageSubtitle}</p>
          </div>
        </div>
        
        <div className={cn("flex items-center space-x-4", language === 'ar' && "rtl:flex-row-reverse rtl:space-x-reverse")}>
          <LanguageSwitcher />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

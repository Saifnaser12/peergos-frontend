import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { language } = useLanguage();

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors",
            language === 'ar' && "rtl:flex-row-reverse rtl:space-x-reverse"
          )}
        >
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{initials}</span>
          </div>
          <div className={cn("hidden lg:block text-left", language === 'ar' && "rtl:text-right")}>
            <p className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className={cn("w-56 p-0", language === 'ar' && "rtl:text-right")} 
        align="end"
      >
        <div className="p-4">
          <div className={cn("flex items-center space-x-3", language === 'ar' && "rtl:flex-row-reverse rtl:space-x-reverse")}>
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="p-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-3 py-2 text-sm",
              language === 'ar' && "rtl:flex-row-reverse"
            )}
          >
            <User size={16} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
            Profile
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-3 py-2 text-sm",
              language === 'ar' && "rtl:flex-row-reverse"
            )}
          >
            <Settings size={16} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
            Settings
          </Button>
        </div>
        
        <Separator />
        
        <div className="p-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50",
              language === 'ar' && "rtl:flex-row-reverse"
            )}
            onClick={handleLogout}
          >
            <LogOut size={16} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

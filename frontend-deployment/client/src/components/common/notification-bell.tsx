import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, X } from 'lucide-react';
import { formatDateShort } from '@/lib/i18n';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { language } = useLanguage();

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className={cn("w-80 p-0", language === 'ar' && "rtl:text-right")} 
        align="end"
      >
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 transition-colors",
                    !notification.isRead && "bg-blue-50"
                  )}
                >
                  <div className={cn("flex items-start justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                    <div className="flex-1 min-w-0">
                      <div className={cn("flex items-center space-x-2", language === 'ar' && "rtl:flex-row-reverse rtl:space-x-reverse")}>
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {notification.priority === 'HIGH' && (
                          <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDateShort(new Date(notification.createdAt!), language === 'ar' ? 'ar-AE' : 'en-AE')}
                      </p>
                    </div>
                    
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 10 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <Button variant="ghost" size="sm" className="text-sm text-blue-600 hover:text-blue-500">
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

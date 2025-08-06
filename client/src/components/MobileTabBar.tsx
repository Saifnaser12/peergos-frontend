import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, BookOpen, FileText, BarChart3, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: BookOpen, label: 'Bookkeeping', href: '/bookkeeping' },
  { icon: FileText, label: 'Taxes', href: '/taxes' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Bot, label: 'AI', href: '/ai' },
];

export function MobileTabBar() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = location === href || (href !== '/' && location.startsWith(href));
          
          return (
            <Link key={href} href={href}>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all touch-target min-h-[48px] min-w-[48px]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "active:scale-95 transform transition-transform duration-150",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                aria-label={label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
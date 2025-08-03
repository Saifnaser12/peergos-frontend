import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useKeyboardNavigation, useFocusManagement, commonShortcuts } from '@/hooks/use-keyboard-navigation';
import Sidebar from './sidebar';
import Breadcrumb, { useBreadcrumb } from '@/components/navigation/breadcrumb';
import GlobalSearch from '@/components/navigation/global-search';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { 
  Search, 
  Menu, 
  X, 
  Bell, 
  Settings, 
  User, 
  HelpCircle,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface EnhancedMainLayoutProps {
  children: React.ReactNode;
}

// Page configuration for breadcrumbs and help
const pageConfig = {
  '/': { title: 'Dashboard', breadcrumb: [{ label: 'Dashboard', current: true }] },
  '/taxes/vat': { 
    title: 'VAT Calculator', 
    breadcrumb: [
      { label: 'Taxes', href: '/taxes' },
      { label: 'VAT Calculator', current: true }
    ],
    help: 'Calculate 5% VAT for your transactions according to UAE FTA regulations.'
  },
  '/taxes/cit': { 
    title: 'CIT Calculator', 
    breadcrumb: [
      { label: 'Taxes', href: '/taxes' },
      { label: 'CIT Calculator', current: true }
    ],
    help: 'Calculate 9% Corporate Income Tax with Small Business Relief and QFZP considerations.'
  },
  '/financials': { 
    title: 'Financial Reports', 
    breadcrumb: [{ label: 'Financial Reports', current: true }],
    help: 'Generate comprehensive financial statements and reports for tax compliance.'
  },
  '/admin/tax-settings': {
    title: 'Tax Settings',
    breadcrumb: [
      { label: 'Administration', href: '/admin' },
      { label: 'Tax Settings', current: true }
    ],
    help: 'Configure tax rates, thresholds, and compliance settings for your organization.'
  }
};

export default function EnhancedMainLayout({ children }: EnhancedMainLayoutProps) {
  const [location, navigate] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { language, direction, t } = useLanguage();
  const { items: breadcrumbItems, updateBreadcrumb } = useBreadcrumb();
  const { focusElement } = useFocusManagement();

  // Update breadcrumb based on current page
  useEffect(() => {
    const config = pageConfig[location as keyof typeof pageConfig];
    if (config?.breadcrumb) {
      updateBreadcrumb(config.breadcrumb);
    }
  }, [location, updateBreadcrumb]);

  // Keyboard shortcuts
  const shortcuts = [
    {
      ...commonShortcuts.search,
      action: () => setIsSearchOpen(true)
    },
    {
      ...commonShortcuts.dashboard,
      action: () => navigate('/')
    },
    {
      ...commonShortcuts.taxes,
      action: () => navigate('/taxes')
    },
    {
      ...commonShortcuts.cancel,
      action: () => {
        setIsSearchOpen(false);
        setShowUserMenu(false);
      }
    }
  ];

  useKeyboardNavigation({ shortcuts });

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when location changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const currentPageConfig = pageConfig[location as keyof typeof pageConfig];

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <div 
      className={cn(
        "min-h-screen bg-gray-50 flex",
        // RTL layout support
        language === 'ar' && "rtl"
      )}
      dir={direction}
    >
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        isCollapsed={isSidebarCollapsed}
        onCollapse={handleSidebarCollapse}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navigation bar */}
        <header className={cn(
          "bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between",
          // RTL adjustments
          language === 'ar' && "rtl:flex-row-reverse"
        )}>
          {/* Left section (Right in RTL) */}
          <div className={cn(
            "flex items-center space-x-4",
            language === 'ar' && "rtl:space-x-reverse rtl:flex-row-reverse"
          )}>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="md:hidden"
              aria-label={t('common.open')}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb */}
            {breadcrumbItems.length > 0 && (
              <Breadcrumb 
                items={breadcrumbItems}
                className="hidden md:flex"
              />
            )}

            {/* Page help */}
            {currentPageConfig?.help && (
              <Tooltip 
                content={currentPageConfig.help}
                className="hidden md:block"
              >
                <Button variant="ghost" size="sm" aria-label={t('common.help')}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Right section (Left in RTL) */}
          <div className={cn(
            "flex items-center space-x-3",
            language === 'ar' && "rtl:space-x-reverse rtl:flex-row-reverse"
          )}>
            {/* Search button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                "hidden md:flex items-center space-x-2 text-gray-600 hover:text-gray-900",
                language === 'ar' && "rtl:space-x-reverse"
              )}
              aria-label={t('common.search')}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">{t('common.search')}</span>
              <kbd className="hidden lg:inline px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">
                ⌘K
              </kbd>
            </Button>

            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden"
              aria-label={t('common.search')}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              aria-label={t('common.notifications')}
            >
              <Bell className="h-5 w-5" />
              <span className={cn(
                "absolute -top-1 h-3 w-3 bg-red-500 rounded-full",
                language === 'ar' ? "rtl:-left-1" : "-right-1"
              )}></span>
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={cn(
                "flex items-center space-x-2 text-gray-600 hover:text-gray-900",
                language === 'ar' && "rtl:space-x-reverse"
              )}
              aria-label={t('common.language')}
            >
              <span className="text-sm font-medium">
                {language === 'en' ? 'العربية' : 'English'}
              </span>
            </Button>

            {/* User menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUserMenuToggle}
                className={cn(
                  "flex items-center space-x-2",
                  language === 'ar' && "rtl:space-x-reverse"
                )}
                aria-label={t('common.profile')}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden lg:inline font-medium">
                  {user?.username || 'User'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className={cn(
                  "absolute mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50",
                  language === 'ar' ? "rtl:left-0" : "right-0"
                )}>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className={cn(
                      "text-sm font-medium text-gray-900",
                      language === 'ar' && "rtl:text-right"
                    )}>
                      {user?.username}
                    </p>
                    <p className={cn(
                      "text-xs text-gray-600",
                      language === 'ar' && "rtl:text-right"
                    )}>
                      {user?.email}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate('/admin');
                      setShowUserMenu(false);
                    }}
                    className={cn(
                      "w-full justify-start px-4 py-2 text-sm",
                      language === 'ar' && "rtl:justify-end rtl:flex-row-reverse"
                    )}
                  >
                    <Settings className={cn(
                      "h-4 w-4",
                      language === 'ar' ? "rtl:ml-3" : "mr-3"
                    )} />
                    {t('common.settings')}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsSearchOpen(true);
                      setShowUserMenu(false);
                    }}
                    className={cn(
                      "w-full justify-start px-4 py-2 text-sm",
                      language === 'ar' && "rtl:justify-end rtl:flex-row-reverse"
                    )}
                  >
                    <HelpCircle className={cn(
                      "h-4 w-4",
                      language === 'ar' ? "rtl:ml-3" : "mr-3"
                    )} />
                    {t('common.help')}
                  </Button>
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className={cn(
                        "w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50",
                        language === 'ar' && "rtl:justify-end rtl:flex-row-reverse"
                      )}
                    >
                      <LogOut className={cn(
                        "h-4 w-4",
                        language === 'ar' ? "rtl:ml-3" : "mr-3"
                      )} />
                      {t('common.logout')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-auto",
          // Add proper spacing based on sidebar state
          !isSidebarCollapsed ? "lg:pl-0" : "lg:pl-0"
        )}>
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}
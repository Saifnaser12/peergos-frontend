import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useKeyboardNavigation, useFocusManagement, commonShortcuts } from '@/hooks/use-keyboard-navigation';
import Sidebar from './sidebar';
import Breadcrumb, { useBreadcrumb } from '@/components/navigation/breadcrumb';
import GlobalSearch from '@/components/navigation/global-search';
import { WorkflowBreadcrumb } from '@/components/navigation/workflow-breadcrumb';
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

const pageConfig: Record<string, { title: string; breadcrumb: { label: string; href?: string; current?: boolean }[]; help?: string }> = {
  '/': { title: 'Dashboard', breadcrumb: [] },
  '/dashboard': { title: 'Dashboard', breadcrumb: [] },
  '/bookkeeping': { title: 'Bookkeeping', breadcrumb: [{ label: 'Bookkeeping', current: true }] },
  '/taxes': { title: 'Taxes', breadcrumb: [{ label: 'Taxes', current: true }] },
  '/taxes/vat': {
    title: 'VAT Calculator',
    breadcrumb: [{ label: 'Taxes', href: '/taxes' }, { label: 'VAT Calculator', current: true }],
    help: 'Calculate 5% VAT for your transactions according to UAE FTA regulations.'
  },
  '/taxes/cit': {
    title: 'CIT Calculator',
    breadcrumb: [{ label: 'Taxes', href: '/taxes' }, { label: 'CIT Calculator', current: true }],
    help: 'Calculate 9% Corporate Income Tax with Small Business Relief and QFZP considerations.'
  },
  '/vat': {
    title: 'VAT Returns',
    breadcrumb: [{ label: 'Taxes', href: '/taxes' }, { label: 'VAT Returns', current: true }],
    help: 'Calculate 5% VAT for your transactions according to UAE FTA regulations.'
  },
  '/cit': {
    title: 'Corporate Income Tax',
    breadcrumb: [{ label: 'Taxes', href: '/taxes' }, { label: 'Corporate Income Tax', current: true }],
    help: 'Calculate 9% Corporate Income Tax with Small Business Relief and QFZP considerations.'
  },
  '/documents': { title: 'Documents', breadcrumb: [{ label: 'Documents', current: true }] },
  '/workflows/templates': { title: 'Workflow Templates', breadcrumb: [{ label: 'Workflow Templates', current: true }] },
  '/enhanced-data-entry': { title: 'Data Entry', breadcrumb: [{ label: 'Data Entry', current: true }] },
  '/calculation-audit': { title: 'Calculation Audit', breadcrumb: [{ label: 'Calculation Audit', current: true }] },
  '/financials': {
    title: 'Financial Reports',
    breadcrumb: [{ label: 'Reports', current: true }],
    help: 'Generate comprehensive financial statements and reports for tax compliance.'
  },
  '/reports': { title: 'Financial Reports', breadcrumb: [{ label: 'Reports', current: true }] },
  '/tax-assistant': { title: 'AI Tax Assistant', breadcrumb: [{ label: 'AI Assistant', current: true }] },
  '/ai': { title: 'AI Tax Assistant', breadcrumb: [{ label: 'AI Assistant', current: true }] },
  '/admin': { title: 'Administration', breadcrumb: [{ label: 'Administration', current: true }] },
  '/admin/tax-settings': {
    title: 'Tax Settings',
    breadcrumb: [{ label: 'Administration', href: '/admin' }, { label: 'Tax Settings', current: true }],
    help: 'Configure tax rates, thresholds, and compliance settings for your organization.'
  },
  '/accounting': { title: 'Accounting', breadcrumb: [{ label: 'Accounting', current: true }] },
  '/invoicing': { title: 'Invoicing', breadcrumb: [{ label: 'Invoicing', current: true }] },
  '/compliance': { title: 'Compliance', breadcrumb: [{ label: 'Compliance', current: true }] },
  '/calendar': { title: 'Calendar', breadcrumb: [{ label: 'Calendar', current: true }] },
  '/transfer-pricing': { title: 'Transfer Pricing', breadcrumb: [{ label: 'Transfer Pricing', current: true }] },
  '/tax-calculations': { title: 'Tax Calculations', breadcrumb: [{ label: 'Tax Calculations', current: true }] },
};

export default function EnhancedMainLayout({ children }: EnhancedMainLayoutProps) {
  const [location, navigate] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { language, direction, setLanguage, t } = useLanguage();
  const { items: breadcrumbItems, updateBreadcrumb } = useBreadcrumb();
  const { focusElement } = useFocusManagement();

  useEffect(() => {
    const config = pageConfig[location];
    if (config) {
      updateBreadcrumb(config.breadcrumb);
    }
  }, [location, updateBreadcrumb]);

  const shortcuts = [
    { ...commonShortcuts.search, action: () => setIsSearchOpen(true) },
    { ...commonShortcuts.dashboard, action: () => navigate('/') },
    { ...commonShortcuts.taxes, action: () => navigate('/taxes') },
    {
      ...commonShortcuts.cancel,
      action: () => {
        setIsSearchOpen(false);
        setShowUserMenu(false);
      }
    }
  ];

  useKeyboardNavigation({ shortcuts });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const currentPageConfig = pageConfig[location as keyof typeof pageConfig];

  return (
    <div
      className={cn("min-h-[100svh] flex", language === 'ar' && "rtl")}
      style={{ backgroundColor: '#F6F8FA' }}
      dir={direction}
    >
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden pointer-events-auto"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
          data-testid="mobile-sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isCollapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* 3px signature gradient line — very top of app */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{ background: 'linear-gradient(to right, #0A3A5C, #0E9F6E)' }}
        />

        {/* Top navigation bar */}
        <header className={cn(
          "bg-white border-b px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between flex-shrink-0",
          "border-[#E5EAF0]",
          language === 'ar' && "rtl:flex-row-reverse"
        )}>
          {/* Left section */}
          <div className={cn(
            "flex items-center gap-4",
            language === 'ar' && "rtl:flex-row-reverse"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden h-9 w-9 p-0 text-gray-500 hover:text-gray-900"
              aria-label={t('common.open')}
              data-testid="mobile-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Breadcrumb items={breadcrumbItems} className="hidden md:flex" />

            {currentPageConfig?.help && (
              <Tooltip
                content={currentPageConfig.help}
                className="hidden md:block"
              >
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400" aria-label={t('common.help')}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Right section */}
          <div className={cn(
            "flex items-center gap-2",
            language === 'ar' && "rtl:flex-row-reverse"
          )}>
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                "hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-900 h-9 px-3",
              )}
              aria-label={t('common.search')}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline text-sm">{t('common.search')}</span>
              <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-gray-100 border border-gray-200 rounded font-mono">⌘K</kbd>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden h-9 w-9 p-0 text-gray-500"
              aria-label={t('common.search')}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 p-0 text-gray-500"
              aria-label={t('common.notifications')}
            >
              <Bell className="h-4 w-4" />
              <span className={cn(
                "absolute top-1.5 h-2 w-2 rounded-full bg-red-500",
                language === 'ar' ? "left-1.5" : "right-1.5"
              )} />
            </Button>

            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="h-9 px-3 text-sm font-medium text-gray-600 hover:text-[#0A3A5C]"
              aria-label={t('common.language')}
            >
              {language === 'en' ? 'العربية' : 'English'}
            </Button>

            {/* User menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "flex items-center gap-2 h-9 px-2",
                  language === 'ar' && "rtl:flex-row-reverse"
                )}
                aria-label={t('common.profile')}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#0A3A5C' }}
                >
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="hidden lg:inline text-sm font-medium text-gray-700">
                  {user?.username || 'User'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </Button>

              {showUserMenu && (
                <div className={cn(
                  "absolute top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E5EAF0] py-1 z-50",
                  language === 'ar' ? "left-0" : "right-0"
                )}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className={cn("text-sm font-semibold text-gray-900", language === 'ar' && "rtl:text-right")}>
                      {user?.username}
                    </p>
                    <p className={cn("text-xs text-gray-500 mt-0.5", language === 'ar' && "rtl:text-right")}>
                      {user?.email}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { navigate('/admin'); setShowUserMenu(false); }}
                    className={cn("w-full justify-start px-4 py-2 text-sm text-gray-700", language === 'ar' && "rtl:justify-end rtl:flex-row-reverse")}
                  >
                    <Settings className={cn("h-4 w-4", language === 'ar' ? "ml-3" : "mr-3")} />
                    {t('common.settings')}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsSearchOpen(true); setShowUserMenu(false); }}
                    className={cn("w-full justify-start px-4 py-2 text-sm text-gray-700", language === 'ar' && "rtl:justify-end rtl:flex-row-reverse")}
                  >
                    <HelpCircle className={cn("h-4 w-4", language === 'ar' ? "ml-3" : "mr-3")} />
                    {t('common.help')}
                  </Button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className={cn("w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50", language === 'ar' && "rtl:justify-end rtl:flex-row-reverse")}
                    >
                      <LogOut className={cn("h-4 w-4", language === 'ar' ? "ml-3" : "mr-3")} />
                      {t('common.logout')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}
    </div>
  );
}

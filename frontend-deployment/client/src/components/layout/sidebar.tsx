import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  BarChart3,
  Calendar,
  Wallet,
  Receipt,
  Building2,
  FileText,
  ArrowRightLeft,
  Bot,
  Settings,
  Home,
  Shield,
  GitBranch,
  FolderOpen,
  PlusCircle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Menu,
  BookTemplate
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ 
  isOpen, 
  onToggle, 
  isCollapsed = false, 
  onCollapse 
}: SidebarProps) {
  const [location] = useLocation();
  const { user, company } = useAuth();
  const { t, language } = useLanguage();

  const navigationItems = [
    {
      section: '',
      items: [
        { path: '/', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/bookkeeping', icon: Wallet, label: t('nav.bookkeeping'), roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/taxes', icon: FileText, label: t('nav.taxes'), roles: ['ADMIN', 'ACCOUNTANT', 'SME_CLIENT'] },
        { path: '/documents', icon: FolderOpen, label: t('nav.documents'), roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/workflows/templates', icon: BookTemplate, label: 'Workflow Templates', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/enhanced-data-entry', icon: PlusCircle, label: t('nav.data_entry'), roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/calculation-audit', icon: Calculator, label: t('nav.calculation_audit'), roles: ['ADMIN', 'ACCOUNTANT', 'SME_CLIENT'] },
        { path: '/financials', icon: BarChart3, label: t('nav.reports'), roles: ['ADMIN', 'ACCOUNTANT', 'SME_CLIENT'] },
        { path: '/tax-assistant', icon: Bot, label: t('nav.assistant'), roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/admin', icon: Settings, label: t('nav.admin'), roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
      ],
    },
    {
      section: 'Quick Links',
      items: [
        { path: '/visual-design-demo', icon: GitBranch, label: 'Design System', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/roadmap', icon: Calendar, label: 'See what\'s next', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
      ],
    },
  ];

  const isActive = (path: string) => location === path || (path !== '/' && location.startsWith(path));

  const hasRole = (requiredRoles: string[]) => user && requiredRoles.includes(user.role);

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col relative z-30",
        // Enhanced width logic: show icons+text by default, collapsed for icons-only
        isCollapsed ? "w-16" : "w-64",
        // Mobile behavior
        "fixed lg:relative inset-y-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // RTL support
        language === 'ar' && "rtl:right-0 rtl:left-auto rtl:border-r-0 rtl:border-l rtl:translate-x-0 rtl:lg:translate-x-0",
        language === 'ar' && !isOpen && "rtl:translate-x-full rtl:lg:translate-x-0"
      )}
    >
      {/* Header with Logo and Collapse Toggle */}
      <div className={cn("flex items-center justify-between p-4 border-b border-gray-200 h-16")}>
        <div className={cn("flex items-center", language === 'ar' && "rtl:flex-row-reverse")}>
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: company?.primaryColor || '#1976d2' }}
          >
            <Building2 className="text-white" size={16} />
          </div>
          {!isCollapsed && (
            <div className={cn("ml-3", language === 'ar' && "rtl:ml-0 rtl:mr-3")}>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {company?.name || 'Peergos'}
              </h1>
              <p className="text-xs text-gray-500">Tax Compliance</p>
            </div>
          )}
        </div>
        
        {/* Collapse Toggle Button - Desktop Only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse?.(!isCollapsed)}
          className={cn(
            "p-1 h-8 w-8 hidden lg:flex",
            language === 'ar' && "rtl:rotate-180"
          )}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
        
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1 h-8 w-8 lg:hidden"
        >
          <Menu size={16} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigationItems.map((section) => (
          <div key={section.section} className="space-y-1">
            {/* Section Header - Only show when not collapsed */}
            {!isCollapsed && section.section && (
              <h3 className={cn(
                "px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider",
                language === 'ar' && "rtl:text-right"
              )}>
                {section.section}
              </h3>
            )}
            
            {/* Navigation Items */}
            <div className="space-y-1">
              {section.items
                .filter(item => item.roles.includes(user?.role || 'SME_CLIENT'))
                .map((item) => {
                  const isItemActive = isActive(item.path);
                  const IconComponent = item.icon;

                  const navItem = (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full h-11 relative group transition-all duration-200',
                          // Layout: collapsed vs expanded
                          isCollapsed ? 'justify-center px-2' : 'justify-start px-3',
                          // Active state styling
                          isItemActive
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-r-2 border-blue-600 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                          // RTL support
                          language === 'ar' && 'rtl:justify-start',
                          language === 'ar' && isCollapsed && 'rtl:justify-center',
                          language === 'ar' && isItemActive && 'rtl:border-r-0 rtl:border-l-2'
                        )}
                      >
                        <IconComponent 
                          className={cn(
                            'h-5 w-5 flex-shrink-0',
                            !isCollapsed && 'mr-3',
                            language === 'ar' && !isCollapsed && 'rtl:mr-0 rtl:ml-3'
                          )} 
                        />
                        {!isCollapsed && (
                          <span className={cn(
                            "truncate text-sm font-medium",
                            language === 'ar' && "rtl:text-right"
                          )}>
                            {item.label}
                          </span>
                        )}
                      </Button>
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <TooltipProvider key={item.path}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {navItem}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return navItem;
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

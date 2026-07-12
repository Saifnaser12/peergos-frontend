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
        { path: '/roadmap', icon: Calendar, label: "See what's next", roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
      ],
    },
  ];

  const isActive = (path: string) => location === path || (path !== '/' && location.startsWith(path));
  const hasRole = (requiredRoles: string[]) => user && requiredRoles.includes(user.role);

  const companyInitials = company?.name
    ? company.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'CO';

  return (
    <aside
      className={cn(
        "transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col relative",
        "fixed lg:relative inset-y-0 left-0",
        isOpen ? "z-50" : "z-30",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        language === 'ar' && "rtl:right-0 rtl:left-auto rtl:border-r-0 rtl:border-l rtl:translate-x-0 rtl:lg:translate-x-0",
        language === 'ar' && !isOpen && "rtl:translate-x-full rtl:lg:translate-x-0"
      )}
      style={{ backgroundColor: '#0A3A5C' }}
      data-testid="sidebar"
    >
      {/* Header — PEERGOS wordmark */}
      <div className={cn(
        "flex items-center h-16 flex-shrink-0",
        isCollapsed ? "justify-center px-2" : "justify-between px-4",
        "border-b border-white/10"
      )}>
        {isCollapsed ? (
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-black text-base tracking-tight">P</span>
          </div>
        ) : (
          <div className={cn("min-w-0", language === 'ar' && "rtl:text-right")}>
            <h1 className="text-white font-black tracking-[0.18em] text-[13px] uppercase leading-tight">
              PEERGOS
            </h1>
            <p className="text-white/50 text-[10px] leading-tight mt-0.5">UAE SME Tax Compliance</p>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse?.(!isCollapsed)}
          className={cn(
            "p-1 h-8 w-8 hidden lg:flex text-white/40 hover:text-white hover:bg-white/10 flex-shrink-0",
            language === 'ar' && "rtl:rotate-180"
          )}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </Button>

        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1 h-8 w-8 lg:hidden text-white/60 hover:text-white hover:bg-white/10"
        >
          <Menu size={16} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto custom-scrollbar space-y-1">
        {navigationItems.map((section) => (
          <div key={section.section} className="space-y-0.5">
            {/* Section label */}
            {!isCollapsed && section.section && (
              <h3 className={cn(
                "px-3 pt-4 pb-1 text-[10px] font-semibold text-white/35 uppercase tracking-[0.12em]",
                language === 'ar' && "rtl:text-right"
              )}>
                {section.section}
              </h3>
            )}

            {section.items
              .filter(item => item.roles.includes(user?.role || 'SME_CLIENT'))
              .map((item) => {
                const isItemActive = isActive(item.path);
                const IconComponent = item.icon;

                const navItem = (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'relative flex items-center h-10 rounded-lg transition-all duration-150 select-none group',
                      isCollapsed ? 'justify-center px-0 mx-auto w-10' : 'px-3',
                      isItemActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/65 hover:text-white hover:bg-white/8',
                      language === 'ar' && !isCollapsed && 'rtl:flex-row-reverse',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                    )}
                    data-testid={`nav-link-${item.path.replace('/', '') || 'home'}`}
                    aria-label={item.label}
                    aria-current={isItemActive ? 'page' : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Emerald left accent bar for active item */}
                    {isItemActive && !isCollapsed && (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full",
                          language === 'ar' ? "right-0" : "left-0"
                        )}
                        style={{ backgroundColor: '#0E9F6E' }}
                      />
                    )}
                    {isItemActive && isCollapsed && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 left-0 w-[3px] h-6 rounded-full"
                        style={{ backgroundColor: '#0E9F6E' }}
                      />
                    )}

                    <IconComponent
                      className={cn(
                        'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                        isItemActive ? 'text-white' : 'text-white/55 group-hover:text-white/80',
                        !isCollapsed && (language === 'ar' ? 'ml-3' : 'mr-3')
                      )}
                    />
                    {!isCollapsed && (
                      <span className={cn(
                        "truncate text-[13px] font-medium",
                        language === 'ar' && "rtl:text-right"
                      )}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <TooltipProvider key={item.path}>
                      <Tooltip>
                        <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                        <TooltipContent side={language === 'ar' ? 'left' : 'right'} className="text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return navItem;
              })}
          </div>
        ))}
      </nav>

      {/* Bottom company section */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {isCollapsed ? (
          <div className="flex justify-center">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
              style={{ backgroundColor: 'rgba(14,159,110,0.25)' }}
            >
              {companyInitials.charAt(0)}
            </div>
          </div>
        ) : (
          <div className={cn("flex items-center gap-2.5", language === 'ar' && "rtl:flex-row-reverse")}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ backgroundColor: 'rgba(14,159,110,0.25)', color: '#0E9F6E' }}
            >
              {companyInitials}
            </div>
            <div className="min-w-0">
              <p className="text-white/75 text-[12px] font-semibold truncate leading-tight">
                {company?.name || 'Your Company'}
              </p>
              {(company as any)?.trn && (
                <p className="text-white/35 text-[10px] truncate leading-tight">
                  TRN: {(company as any).trn}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

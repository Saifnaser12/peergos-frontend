import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
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
  Menu
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
        { path: '/bookkeeping', icon: Wallet, label: 'Bookkeeping', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/taxes', icon: FileText, label: 'Taxes', roles: ['ADMIN', 'ACCOUNTANT', 'SME_CLIENT'] },
        { path: '/documents', icon: FolderOpen, label: 'Documents', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/enhanced-data-entry', icon: PlusCircle, label: 'Enhanced Data Entry', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/calculation-transparency', icon: Calculator, label: 'Calculation Audit', roles: ['ADMIN', 'ACCOUNTANT', 'SME_CLIENT'] },
        { path: '/financials', icon: BarChart3, label: 'Reports', roles: ['ADMIN', 'ACCOUNTANT', 'SME_CLIENT'] },
        { path: '/tax-assistant', icon: Bot, label: 'AI', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
        { path: '/admin', icon: Settings, label: 'Settings', roles: ['ADMIN', 'ACCOUNTANT', 'ASSISTANT', 'SME_CLIENT'] },
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
        "bg-white material-elevation-2 transition-all duration-300 ease-in-out flex-shrink-0 custom-scrollbar overflow-y-auto",
        isOpen ? "w-64" : "w-0 lg:w-16",
        language === 'ar' && "rtl:border-l rtl:border-r-0"
      )}
    >
      {/* Logo */}
      <div className={cn("p-6 border-b border-gray-200", !isOpen && "lg:p-3")}>
        <div className={cn("flex items-center", language === 'ar' && "rtl:flex-row-reverse", !isOpen && "lg:justify-center")}>
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: company?.primaryColor || '#1976d2' }}
          >
            <Building2 className="text-white text-xl" size={20} />
          </div>
          {(isOpen || !isOpen) && (
            <div className={cn("ml-3", language === 'ar' && "rtl:ml-0 rtl:mr-3", !isOpen && "lg:hidden")}>
              <h1 className="text-xl font-medium text-gray-900">
                {company?.name || 'Peergos'}
              </h1>
              <p className="text-xs text-gray-500">Tax Compliance</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
        {navigationItems.map((section) => (
          <div key={section.section}>
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {section.items
                .filter(item => item.roles.includes(user?.role || 'SME_CLIENT'))
                .map((item) => {
                  const isActive = location === item.path;
                  const IconComponent = item.icon;

                  const navItem = (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start h-10 px-3',
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        <IconComponent className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Button>
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.path} content={item.label} position="right">
                        {navItem}
                      </Tooltip>
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

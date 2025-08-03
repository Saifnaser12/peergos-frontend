import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
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
      <nav className={cn("p-4 space-y-2", !isOpen && "lg:p-2")}>
        {navigationItems.map((section) => (
          <div key={section.section} className="space-y-1">
            {(isOpen || !isOpen) && (
              <div className={cn(
                "px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider",
                !isOpen && "lg:hidden"
              )}>
                {section.section}
              </div>
            )}
            
            {section.items
              .filter(item => hasRole(item.roles))
              .map((item) => (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      language === 'ar' && "rtl:flex-row-reverse",
                      isActive(item.path)
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-100",
                      !isOpen && "lg:justify-center lg:px-2"
                    )}
                    style={{
                      backgroundColor: isActive(item.path) ? (company?.primaryColor || '#1976d2') : undefined,
                    }}
                  >
                    <item.icon className={cn("text-sm", (isOpen || !isOpen) && "mr-3", language === 'ar' && "rtl:mr-0 rtl:ml-3", !isOpen && "lg:mr-0")} size={18} />
                    {(isOpen || !isOpen) && (
                      <span className={cn("flex-1", !isOpen && "lg:hidden")}>
                        {item.label}
                      </span>
                    )}

                  </div>
                </Link>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

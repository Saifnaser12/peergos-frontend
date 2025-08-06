import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calculator, 
  FileText, 
  Upload,
  Receipt,
  Building2,
  Bot,
  Calendar,
  Settings,
  Download,
  Send,
  Search
} from 'lucide-react';
import { Link } from 'wouter';
import { WorkflowShortcuts } from '../workflow-shortcuts';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  variant: 'default' | 'outline' | 'secondary';
  color: string;
  badge?: string;
  urgent?: boolean;
}

export function QuickActionsWidget() {
  const quickActions: QuickAction[] = [
    {
      id: 'add-transaction',
      title: 'Add Transaction',
      description: 'Record income or expense',
      icon: Plus,
      href: '/accounting',
      variant: 'default',
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      id: 'calculate-vat',
      title: 'VAT Calculator',
      description: 'Calculate VAT liability',
      icon: Calculator,
      href: '/vat',
      variant: 'outline',
      color: 'border-green-200 text-green-600 hover:bg-green-50',
      badge: 'Due Soon',
      urgent: true
    },
    {
      id: 'upload-documents',
      title: 'Upload Documents',
      description: 'Add receipts and invoices',
      icon: Upload,
      href: '/documents',
      variant: 'outline',
      color: 'border-purple-200 text-purple-600 hover:bg-purple-50'
    },
    {
      id: 'generate-invoice',
      title: 'Create Invoice',
      description: 'Generate e-invoice',
      icon: FileText,
      href: '/invoicing',
      variant: 'outline',
      color: 'border-orange-200 text-orange-600 hover:bg-orange-50'
    },
    {
      id: 'ai-assistant',
      title: 'Tax Assistant',
      description: 'Get AI-powered help',
      icon: Bot,
      href: '/tax-assistant',
      variant: 'secondary',
      color: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
    },
    {
      id: 'view-calendar',
      title: 'Tax Calendar',
      description: 'View upcoming deadlines',
      icon: Calendar,
      href: '/calendar',
      variant: 'outline',
      color: 'border-red-200 text-red-600 hover:bg-red-50',
      badge: '3 Due'
    }
  ];

  const utilityActions = [
    {
      id: 'download-reports',
      title: 'Download Reports',
      icon: Download,
      href: '/financials'
    },
    {
      id: 'submit-filing',
      title: 'Submit Filing',
      icon: Send,
      href: '/taxes'
    },
    {
      id: 'search-transactions',
      title: 'Search Records',
      icon: Search,
      href: '/accounting'
    },
    {
      id: 'system-settings',
      title: 'Settings',
      icon: Settings,
      href: '/setup'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Primary Actions */}
          <div className="space-y-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              
              return (
                <Link key={action.id} href={action.href}>
                  <Button 
                    variant={action.variant}
                    className={`w-full justify-start h-auto p-3 ${action.color}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <IconComponent className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{action.title}</p>
                          {action.badge && (
                            <Badge 
                              variant={action.urgent ? "destructive" : "secondary"}
                              className="text-xs ml-2"
                            >
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-75">{action.description}</p>
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Utility Actions */}
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Quick Tools</h4>
            <div className="grid grid-cols-2 gap-2">
              {utilityActions.map((action) => {
                const IconComponent = action.icon;
                
                return (
                  <Link key={action.id} href={action.href}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start h-auto p-2 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">
                          {action.title}
                        </span>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-3 border-t">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium text-orange-900">Need Help?</p>
              </div>
              <p className="text-xs text-orange-700 mb-2">
                Contact our tax experts for urgent assistance
              </p>
              <Button size="sm" variant="outline" className="w-full text-orange-700 border-orange-300">
                Get Support
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
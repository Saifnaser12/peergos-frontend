import { ArrowRight, Settings, FileText, Calculator, Send, Plus, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WorkflowShortcut {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

const workflowShortcuts: WorkflowShortcut[] = [
  {
    id: 'complete-setup',
    title: 'Complete Setup',
    description: 'Finish configuring your tax compliance settings',
    path: '/setup',
    icon: Settings,
    priority: 'high',
    estimatedTime: '5 min'
  },
  {
    id: 'add-transaction',
    title: 'Add Transaction',
    description: 'Record a new business transaction',
    path: '/accounting',
    icon: Plus,
    priority: 'high',
    estimatedTime: '3 min'
  },
  {
    id: 'upload-documents',
    title: 'Upload Documents',
    description: 'Upload invoices and receipts',
    path: '/accounting/upload',
    icon: Upload,
    priority: 'medium',
    estimatedTime: '10 min'
  },
  {
    id: 'run-calculations',
    title: 'Calculate Taxes',
    description: 'Generate VAT and CIT calculations',
    path: '/tax-calculations',
    icon: Calculator,
    priority: 'medium',
    estimatedTime: '5 min'
  },
  {
    id: 'generate-reports',
    title: 'Generate Reports',
    description: 'Create financial reports and statements',
    path: '/reports',
    icon: FileText,
    priority: 'low',
    estimatedTime: '8 min'
  },
  {
    id: 'submit-filing',
    title: 'Submit Filing',
    description: 'Submit returns to FTA',
    path: '/filing',
    icon: Send,
    priority: 'low',
    estimatedTime: '10 min'
  }
];

export function WorkflowShortcuts() {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          Workflow Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workflowShortcuts.map((shortcut) => {
            const IconComponent = shortcut.icon;
            
            return (
              <Link key={shortcut.id} href={shortcut.path}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-start text-left hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <Badge variant="outline" className={getPriorityColor(shortcut.priority)}>
                      {shortcut.estimatedTime}
                    </Badge>
                  </div>
                  
                  <div className="w-full">
                    <h4 className="font-medium text-gray-900 mb-1 text-sm">
                      {shortcut.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {shortcut.description}
                    </p>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 text-gray-400 mt-2 self-end" />
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
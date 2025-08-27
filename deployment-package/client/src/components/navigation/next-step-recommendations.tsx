import { ArrowRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NextStepRecommendation {
  id: string;
  title: string;
  description: string;
  path: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  prerequisites?: string[];
  status: 'available' | 'blocked' | 'completed';
}

interface NextStepRecommendationsProps {
  currentModule: string;
  className?: string;
}

const getRecommendationsForModule = (module: string): NextStepRecommendation[] => {
  const recommendations: { [key: string]: NextStepRecommendation[] } = {
    'dashboard': [
      {
        id: 'complete-setup',
        title: 'Complete Initial Setup',
        description: 'Configure your company details and VAT registration for UAE compliance',
        path: '/setup',
        priority: 'high',
        estimatedTime: '5 minutes',
        status: 'available'
      },
      {
        id: 'add-transactions',
        title: 'Record First Transaction',
        description: 'Start by adding your business transactions to build your financial records',
        path: '/accounting',
        priority: 'medium',
        estimatedTime: '10 minutes',
        prerequisites: ['Complete setup wizard'],
        status: 'available'
      }
    ],
    'setup': [
      {
        id: 'verify-setup',
        title: 'Review Configuration',
        description: 'Verify all setup details are correct before proceeding',
        path: '/setup',
        priority: 'high',
        estimatedTime: '2 minutes',
        status: 'available'
      },
      {
        id: 'start-data-entry',
        title: 'Begin Data Entry',
        description: 'Start recording your business transactions and financial data',
        path: '/accounting',
        priority: 'high',
        estimatedTime: '15 minutes',
        status: 'available'
      }
    ],
    'accounting': [
      {
        id: 'upload-invoices',
        title: 'Upload Outstanding Invoices',
        description: 'Import or manually enter all pending invoices for complete records',
        path: '/accounting',
        priority: 'high',
        estimatedTime: '20 minutes',
        status: 'available'
      },
      {
        id: 'run-calculations',
        title: 'Calculate Tax Obligations',
        description: 'Generate VAT and CIT calculations based on your recorded transactions',
        path: '/tax-calculations',
        priority: 'medium',
        estimatedTime: '5 minutes',
        prerequisites: ['Record at least 5 transactions'],
        status: 'available'
      }
    ],
    'tax-calculations': [
      {
        id: 'review-calculations',
        title: 'Review Tax Calculations',
        description: 'Verify VAT and CIT calculations for accuracy before filing',
        path: '/tax-calculations',
        priority: 'high',
        estimatedTime: '10 minutes',
        status: 'available'
      },
      {
        id: 'generate-reports',
        title: 'Generate Financial Reports',
        description: 'Create financial statements and VAT returns for submission',
        path: '/reports',
        priority: 'high',
        estimatedTime: '5 minutes',
        status: 'available'
      }
    ],
    'reports': [
      {
        id: 'review-reports',
        title: 'Review Generated Reports',
        description: 'Check all financial reports and statements for completeness',
        path: '/reports',
        priority: 'high',
        estimatedTime: '15 minutes',
        status: 'available'
      },
      {
        id: 'prepare-filing',
        title: 'Prepare FTA Filing',
        description: 'Get ready to submit your VAT return to the Federal Tax Authority',
        path: '/filing',
        priority: 'high',
        estimatedTime: '10 minutes',
        status: 'available'
      }
    ],
    'filing': [
      {
        id: 'submit-returns',
        title: 'Submit VAT Return',
        description: 'Complete the final step by submitting your return to FTA',
        path: '/filing',
        priority: 'high',
        estimatedTime: '5 minutes',
        status: 'available'
      },
      {
        id: 'schedule-next-period',
        title: 'Prepare Next Tax Period',
        description: 'Set up for the next tax period and configure reminders',
        path: '/dashboard',
        priority: 'low',
        estimatedTime: '5 minutes',
        status: 'available'
      }
    ]
  };

  return recommendations[module] || [];
};

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-100 border-red-200';
    case 'medium': return 'text-amber-600 bg-amber-100 border-amber-200';
    case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
  }
};

const getStatusIcon = (status: 'available' | 'blocked' | 'completed') => {
  switch (status) {
    case 'available': return <ArrowRight className="w-4 h-4 text-blue-600" />;
    case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
};

export function NextStepRecommendations({ currentModule, className }: NextStepRecommendationsProps) {
  const recommendations = getRecommendationsForModule(currentModule);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={cn(
              "border rounded-lg p-4 transition-colors hover:shadow-sm",
              rec.status === 'blocked' && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {rec.title}
                  </h4>
                  <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {rec.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rec.estimatedTime}
                  </div>
                  {rec.prerequisites && rec.prerequisites.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Prerequisites: {rec.prerequisites.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(rec.status)}
                {rec.status === 'available' && (
                  <Link href={rec.path}>
                    <Button size="sm" className="text-xs">
                      Continue
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
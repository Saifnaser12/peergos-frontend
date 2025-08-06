import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NextWorkflowStep {
  title: string;
  path: string;
  description: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContinueWorkflowButtonProps {
  currentModule: string;
  className?: string;
}

const getNextStep = (currentModule: string): NextWorkflowStep | null => {
  const workflows: { [key: string]: NextWorkflowStep } = {
    'dashboard': {
      title: 'Complete Setup',
      path: '/setup',
      description: 'Configure your company details and tax settings',
      estimatedTime: '5 minutes',
      priority: 'high'
    },
    'setup': {
      title: 'Start Data Entry',
      path: '/accounting',
      description: 'Record your first business transactions',
      estimatedTime: '10 minutes',
      priority: 'high'
    },
    'accounting': {
      title: 'Calculate Taxes',
      path: '/tax-calculations',
      description: 'Generate VAT and CIT calculations',
      estimatedTime: '5 minutes',
      priority: 'medium'
    },
    'tax-calculations': {
      title: 'Generate Reports',
      path: '/reports',
      description: 'Create financial statements and tax returns',
      estimatedTime: '10 minutes',
      priority: 'high'
    },
    'reports': {
      title: 'Submit Filing',
      path: '/filing',
      description: 'Submit your returns to the FTA',
      estimatedTime: '15 minutes',
      priority: 'high'
    },
    'filing': {
      title: 'Back to Dashboard',
      path: '/',
      description: 'Review your compliance status',
      estimatedTime: '2 minutes',
      priority: 'low'
    }
  };

  return workflows[currentModule] || null;
};

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export function ContinueWorkflowButton({ currentModule, className }: ContinueWorkflowButtonProps) {
  const nextStep = getNextStep(currentModule);

  if (!nextStep) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Workflow Complete</h4>
              <p className="text-sm text-gray-600">You've completed this workflow step!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Next Step</h4>
          <Badge variant="outline" className={getPriorityColor(nextStep.priority)}>
            {nextStep.estimatedTime}
          </Badge>
        </div>
        
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-1">{nextStep.title}</h5>
          <p className="text-sm text-gray-600 mb-2">{nextStep.description}</p>
        </div>

        <Link href={nextStep.path}>
          <Button className="w-full" size="sm">
            Continue Workflow
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
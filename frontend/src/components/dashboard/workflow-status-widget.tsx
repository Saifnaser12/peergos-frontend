import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Settings, 
  FileText, 
  Calculator, 
  Send,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'current' | 'pending' | 'blocked';
  completionDate?: string;
  nextAction?: string;
  estimatedTime?: string;
}

interface WorkflowStatusData {
  currentStep: number;
  overallProgress: number;
  taxPeriod: string;
  nextDeadline: string;
  steps: WorkflowStep[];
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'setup',
    title: 'Initial Setup',
    description: 'Company registration, VAT setup, chart of accounts',
    icon: Settings,
    status: 'completed',
    completionDate: '2024-08-01',
    nextAction: 'Review company settings',
    estimatedTime: '5 min'
  },
  {
    id: 'data-entry',
    title: 'Data Entry',
    description: 'Record transactions, invoices, and expenses',
    icon: FileText,
    status: 'current',
    nextAction: 'Upload pending invoices and receipts',
    estimatedTime: '2 hours'
  },
  {
    id: 'calculation',
    title: 'Tax Calculation',
    description: 'VAT and CIT calculations, compliance checks',
    icon: Calculator,
    status: 'pending',
    nextAction: 'Review and validate calculations',
    estimatedTime: '30 min'
  },
  {
    id: 'filing',
    title: 'FTA Filing',
    description: 'Submit returns and maintain compliance',
    icon: Send,
    status: 'pending',
    nextAction: 'Submit VAT return by 28th',
    estimatedTime: '15 min'
  }
];

export function WorkflowStatusWidget() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const { data: workflowData, isLoading } = useQuery<WorkflowStatusData>({
    queryKey: ['/api/workflow-status'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });

  // Mock data for demonstration - in production this would come from the API
  const mockWorkflowData: WorkflowStatusData = {
    currentStep: 1, // Data Entry
    overallProgress: 45,
    taxPeriod: 'July 2024',
    nextDeadline: '2024-08-28',
    steps: workflowSteps
  };

  const data = workflowData || mockWorkflowData;
  const currentStep = data.steps[data.currentStep];
  const daysUntilDeadline = Math.ceil((new Date(data.nextDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getStepIcon = (step: WorkflowStep, index: number) => {
    const IconComponent = step.icon;
    
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (step.status === 'current' && IconComponent) {
      return <IconComponent className="w-5 h-5 text-blue-600" />;
    } else if (step.status === 'blocked') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'current':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Workflow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Workflow Status
          </div>
          <Badge variant="outline" className="text-xs">
            {data.taxPeriod}
          </Badge>
        </CardTitle>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span>{data.overallProgress}% Complete</span>
          </div>
          <Progress value={data.overallProgress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Next Deadline Alert */}
        <div className={cn(
          "mb-6 p-4 rounded-lg border-l-4",
          daysUntilDeadline <= 7 ? "bg-red-50 border-red-400 dark:bg-red-950" : "bg-amber-50 border-amber-400 dark:bg-amber-950"
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "w-4 h-4",
              daysUntilDeadline <= 7 ? "text-red-600" : "text-amber-600"
            )} />
            <span className="text-sm font-medium">
              Next Deadline: {daysUntilDeadline} days until VAT filing
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Due: {new Date(data.nextDeadline).toLocaleDateString('en-AE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Current Step Highlight */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
            {getStepIcon(currentStep, data.currentStep)}
            Currently: {currentStep.title}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            {currentStep.nextAction}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Estimated time: {currentStep.estimatedTime}
            </span>
            <Button size="sm" className="text-xs">
              Continue
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Tax Compliance Workflow
          </h4>
          
          {data.steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-sm",
                step.status === 'current' ? "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" :
                step.status === 'completed' ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" :
                step.status === 'blocked' ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800" :
                "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700",
                selectedStep === step.id && "ring-2 ring-blue-500 ring-opacity-50"
              )}
              onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getStepIcon(step, index)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {step.title}
                      </h5>
                      {getStepStatus(step)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {step.status === 'completed' && step.completionDate && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {new Date(step.completionDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {selectedStep === step.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Next Action:</strong> {step.nextAction}
                    </div>
                    {step.estimatedTime && (
                      <Badge variant="outline" className="text-xs">
                        {step.estimatedTime}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Line */}
              {index < data.steps.length - 1 && (
                <div className="absolute left-6 -bottom-1 w-0.5 h-2 bg-gray-300 dark:bg-gray-600" />
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Add Transaction
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Calculator className="w-3 h-3 mr-1" />
              Run Calculation
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Send className="w-3 h-3 mr-1" />
              Preview Filing
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
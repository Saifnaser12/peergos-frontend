import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useNavigation, useProgressTracking } from '@/context/navigation-context';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  variant?: 'sidebar' | 'header' | 'card';
  showDetails?: boolean;
  showNavigation?: boolean;
  className?: string;
}

const STEP_CONFIG = [
  {
    path: '/setup',
    title: 'Business Setup',
    description: 'Company information and tax classification',
    icon: '🏢',
    weight: 15,
  },
  {
    path: '/',
    title: 'Dashboard',
    description: 'Overview and compliance status',
    icon: '📊',
    weight: 5,
  },
  {
    path: '/accounting',
    title: 'Accounting',
    description: 'Transaction entry and bookkeeping',
    icon: '💰',
    weight: 20,
  },
  {
    path: '/cit',
    title: 'Corporate Tax',
    description: 'CIT calculations and filing',
    icon: '🏛️',
    weight: 20,
  },
  {
    path: '/vat',
    title: 'VAT Management',
    description: 'VAT returns and compliance',
    icon: '📋',
    weight: 20,
  },
  {
    path: '/financials',
    title: 'Financial Reports',
    description: 'P&L, balance sheet, and statements',
    icon: '📈',
    weight: 10,
  },
  {
    path: '/invoicing',
    title: 'E-Invoicing',
    description: 'FTA-compliant digital invoicing',
    icon: '🧾',
    weight: 10,
  },
];

export default function ProgressTracker({ 
  variant = 'card', 
  showDetails = true,
  showNavigation = true,
  className 
}: ProgressTrackerProps) {
  const navigation = useNavigation();
  const { getStepStatus, progressInfo } = useProgressTracking();

  const handleStepClick = (stepPath: string) => {
    if (navigation.canNavigate(stepPath)) {
      navigation.navigateTo(stepPath);
    }
  };

  const getStepIcon = (stepPath: string, stepConfig: typeof STEP_CONFIG[0]) => {
    const status = getStepStatus(stepPath);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Circle className="h-5 w-5 text-blue-600 fill-current" />;
      case 'available':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Lock className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStepColor = (stepPath: string) => {
    const status = getStepStatus(stepPath);
    
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 text-green-900';
      case 'current':
        return 'border-blue-500 bg-blue-50 text-blue-900';
      case 'available':
        return 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-400';
    }
  };

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={cn("w-64 bg-white border-r border-gray-200", className)}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Progress Overview</h3>
          <div className="space-y-2">
            <Progress value={progressInfo.percentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{progressInfo.percentage}% Complete</span>
              <span>{progressInfo.currentStep}/{progressInfo.totalSteps} Steps</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          {STEP_CONFIG.map((step, index) => {
            const status = getStepStatus(step.path);
            const isClickable = navigation.canNavigate(step.path);
            
            return (
              <button
                key={step.path}
                onClick={() => isClickable && handleStepClick(step.path)}
                disabled={!isClickable}
                className={cn(
                  "w-full p-3 rounded-lg border-2 transition-all duration-200 text-left",
                  getStepColor(step.path),
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  {getStepIcon(step.path, step)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{step.title}</div>
                    {showDetails && (
                      <div className="text-xs opacity-75 truncate">{step.description}</div>
                    )}
                  </div>
                  <div className="text-xs font-medium">{index + 1}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Header variant
  if (variant === 'header') {
    return (
      <div className={cn("bg-white border-b border-gray-200 px-6 py-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Progress</span>
            </div>
            <Progress value={progressInfo.percentage} className="w-48 h-2" />
            <span className="text-sm text-gray-600">
              {progressInfo.percentage}% ({progressInfo.currentStep}/{progressInfo.totalSteps})
            </span>
          </div>
          
          {showNavigation && progressInfo.nextStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigation.navigateTo(progressInfo.nextStep!)}
              disabled={!navigation.canNavigate(progressInfo.nextStep)}
              className="flex items-center gap-2"
            >
              Next Step
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Compliance Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{progressInfo.percentage}%</span>
          </div>
          <Progress value={progressInfo.percentage} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progressInfo.completedSteps.length} steps completed</span>
            <span>{progressInfo.currentStep} of {progressInfo.totalSteps}</span>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-900">Current Steps</h4>
            <div className="grid grid-cols-1 gap-2">
              {STEP_CONFIG.slice(0, 4).map((step) => {
                const status = getStepStatus(step.path);
                const isClickable = navigation.canNavigate(step.path);
                
                return (
                  <button
                    key={step.path}
                    onClick={() => isClickable && handleStepClick(step.path)}
                    disabled={!isClickable}
                    className={cn(
                      "p-2 rounded border transition-all text-left text-xs",
                      getStepColor(step.path),
                      isClickable && "cursor-pointer",
                      !isClickable && "cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getStepIcon(step.path, step)}
                      <span className="flex-1 font-medium">{step.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showNavigation && (
          <div className="flex gap-2 pt-2 border-t">
            {progressInfo.nextStep ? (
              <Button
                size="sm"
                onClick={() => navigation.navigateTo(progressInfo.nextStep!)}
                disabled={!navigation.canNavigate(progressInfo.nextStep)}
                className="flex-1 flex items-center gap-2"
              >
                Continue Setup
                <ArrowRight className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Setup Complete!</span>
              </div>
            )}
          </div>
        )}

        {navigation.state.lastError && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <span>{navigation.state.lastError}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { ChevronRight, Home, Info } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkflowStep {
  id: string;
  title: string;
  path: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  helpText?: string;
}

interface WorkflowBreadcrumbProps {
  currentPath: string;
  className?: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/',
    description: 'Overview and workflow status',
    isActive: false,
    isCompleted: false,
    helpText: 'Your central hub for monitoring tax compliance progress and key metrics'
  },
  {
    id: 'setup',
    title: 'Setup',
    path: '/setup',
    description: 'Company configuration and initial setup',
    isActive: false,
    isCompleted: false,
    helpText: 'Configure your company details, VAT registration, and accounting preferences for UAE FTA compliance'
  },
  {
    id: 'accounting',
    title: 'Data Entry',
    path: '/accounting',
    description: 'Transaction recording and data management',
    isActive: false,
    isCompleted: false,
    helpText: 'Record business transactions, upload invoices, and manage your financial data for accurate tax calculations'
  },
  {
    id: 'calculations',
    title: 'Tax Calculation',
    path: '/tax-calculations',
    description: 'VAT and CIT calculations',
    isActive: false,
    isCompleted: false,
    helpText: 'Review automated VAT and Corporate Income Tax calculations with UAE FTA compliance checks'
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    description: 'Financial reports and statements',
    isActive: false,
    isCompleted: false,
    helpText: 'Generate financial statements, VAT returns, and compliance reports ready for FTA submission'
  },
  {
    id: 'filing',
    title: 'FTA Filing',
    path: '/filing',
    description: 'Submit returns to FTA',
    isActive: false,
    isCompleted: false,
    helpText: 'Submit your VAT returns and other required filings directly to the UAE Federal Tax Authority'
  }
];

export function WorkflowBreadcrumb({ currentPath, className }: WorkflowBreadcrumbProps) {
  // Determine which step is currently active based on path
  const updatedSteps = workflowSteps.map(step => ({
    ...step,
    isActive: currentPath === step.path || 
             (step.path !== '/' && currentPath.startsWith(step.path))
  }));

  const currentStepIndex = updatedSteps.findIndex(step => step.isActive);
  const currentStep = currentStepIndex >= 0 ? updatedSteps[currentStepIndex] : null;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col space-y-2", className)}>
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:text-blue-600">
              <Home className="w-3 h-3 mr-1" />
              Home
            </Button>
          </Link>
          
          {currentStep && currentStep.path !== '/' && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {currentStep.title}
                    </span>
                    <Info className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">{currentStep.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </nav>

        {/* Workflow Progress Indicator */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {updatedSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={step.path}>
                    <Button
                      variant={step.isActive ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "text-xs whitespace-nowrap transition-colors",
                        step.isActive 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "hover:bg-blue-50 hover:text-blue-700",
                        step.isCompleted && "bg-green-100 text-green-800 hover:bg-green-200"
                      )}
                    >
                      <span className="mr-1 text-xs font-medium">
                        {index + 1}
                      </span>
                      {step.title}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div>
                    <p className="font-medium text-sm mb-1">{step.title}</p>
                    <p className="text-xs text-gray-600">{step.description}</p>
                    {step.helpText && (
                      <p className="text-xs text-blue-600 mt-1">{step.helpText}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              
              {index < updatedSteps.length - 1 && (
                <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
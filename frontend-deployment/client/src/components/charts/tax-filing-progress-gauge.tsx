import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TaxFilingStep {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  dueDate?: string;
  completedDate?: string;
}

interface TaxFilingProgressGaugeProps {
  steps: TaxFilingStep[];
  title?: string;
  period?: string;
  height?: number;
  showDetails?: boolean;
}

export default function TaxFilingProgressGauge({
  steps,
  title = "Tax Filing Progress",
  period,
  height = 300,
  showDetails = true
}: TaxFilingProgressGaugeProps) {
  
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
  const pendingSteps = steps.filter(step => step.status === 'pending').length;
  const overdueSteps = steps.filter(step => step.status === 'overdue').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#6b7280';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Calendar className="h-4 w-4 text-gray-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProgressColor = () => {
    if (progressPercentage >= 90) return '#22c55e';
    if (progressPercentage >= 70) return '#3b82f6';
    if (progressPercentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Create gauge chart data
  const remainingPercentage = 100 - progressPercentage;
  
  const chartData = {
    datasets: [
      {
        data: [progressPercentage, remainingPercentage],
        backgroundColor: [
          getProgressColor(),
          '#f3f4f6'
        ],
        borderWidth: 0,
        cutout: '75%',
        rotation: -90,
        circumference: 180,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
          {period && (
            <Badge variant="outline">{period}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Gauge Chart */}
        <div className="relative mb-6">
          <div style={{ height: `${height * 0.6}px` }} className="relative">
            <Doughnut data={chartData} options={options} />
          </div>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold" style={{ color: getProgressColor() }}>
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Complete</div>
            <div className="text-xs text-gray-500">
              {completedSteps} of {totalSteps} steps
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{completedSteps}/{totalSteps}</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            style={{ 
              '--progress-background': getProgressColor() 
            } as React.CSSProperties}
          />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressSteps}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{pendingSteps}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueSteps}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Overdue</div>
          </div>
        </div>

        {/* Detailed Steps */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Filing Steps</h4>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{step.name}</div>
                      {step.dueDate && (
                        <div className={`text-xs ${isOverdue(step.dueDate) ? 'text-red-600' : 'text-gray-600'}`}>
                          Due: {formatDate(step.dueDate)}
                        </div>
                      )}
                      {step.completedDate && (
                        <div className="text-xs text-green-600">
                          Completed: {formatDate(step.completedDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(step.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Next Actions</h4>
          {overdueSteps > 0 ? (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {overdueSteps} overdue step{overdueSteps > 1 ? 's' : ''} need immediate attention
            </div>
          ) : inProgressSteps > 0 ? (
            <div className="text-sm text-blue-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Continue with {inProgressSteps} in-progress step{inProgressSteps > 1 ? 's' : ''}
            </div>
          ) : pendingSteps > 0 ? (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start next step: {steps.find(s => s.status === 'pending')?.name}
            </div>
          ) : (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              All steps completed!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
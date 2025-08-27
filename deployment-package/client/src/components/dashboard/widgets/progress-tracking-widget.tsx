import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target,
  FileText,
  Calculator,
  Upload,
  Settings
} from 'lucide-react';
import { Link } from 'wouter';

interface ProgressTrackingWidgetProps {
  tasks: any[];
}

interface TaskCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  actionUrl: string;
}

export function ProgressTrackingWidget({ tasks }: ProgressTrackingWidgetProps) {
  // Generate task categories with progress
  const generateTaskCategories = (): TaskCategory[] => {
    return [
      {
        id: 'tax-filing',
        title: 'Tax Filing',
        description: 'VAT and CIT returns',
        icon: FileText,
        totalTasks: 8,
        completedTasks: 5,
        pendingTasks: 2,
        overdueTasks: 1,
        actionUrl: '/taxes'
      },
      {
        id: 'bookkeeping',
        title: 'Bookkeeping',
        description: 'Transaction entry and reconciliation',
        icon: Calculator,
        totalTasks: 12,
        completedTasks: 10,
        pendingTasks: 2,
        overdueTasks: 0,
        actionUrl: '/bookkeeping'
      },
      {
        id: 'document-management',
        title: 'Documents',
        description: 'Upload and organize records',
        icon: Upload,
        totalTasks: 6,
        completedTasks: 3,
        pendingTasks: 2,
        overdueTasks: 1,
        actionUrl: '/documents'
      },
      {
        id: 'compliance-setup',
        title: 'Compliance Setup',
        description: 'System configuration',
        icon: Settings,
        totalTasks: 4,
        completedTasks: 3,
        pendingTasks: 1,
        overdueTasks: 0,
        actionUrl: '/setup'
      }
    ];
  };

  const taskCategories = generateTaskCategories();
  
  const totalTasks = taskCategories.reduce((sum, cat) => sum + cat.totalTasks, 0);
  const totalCompleted = taskCategories.reduce((sum, cat) => sum + cat.completedTasks, 0);
  const totalPending = taskCategories.reduce((sum, cat) => sum + cat.pendingTasks, 0);
  const totalOverdue = taskCategories.reduce((sum, cat) => sum + cat.overdueTasks, 0);
  
  const overallProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Task Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Overall Completion</h4>
              <span className="text-sm font-bold text-gray-900">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{totalCompleted} of {totalTasks} tasks completed</span>
              {totalOverdue > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {totalOverdue} overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Task Categories */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">By Category</h4>
            {taskCategories.map((category) => {
              const IconComponent = category.icon;
              const progress = category.totalTasks > 0 
                ? (category.completedTasks / category.totalTasks) * 100 
                : 0;
              
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {category.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {category.completedTasks}/{category.totalTasks}
                        </p>
                        <div className="flex gap-1">
                          {category.pendingTasks > 0 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              <Clock className="h-2 w-2 mr-1" />
                              {category.pendingTasks}
                            </Badge>
                          )}
                          {category.overdueTasks > 0 && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              <AlertTriangle className="h-2 w-2 mr-1" />
                              {category.overdueTasks}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Link href={category.actionUrl}>
                        <Button size="sm" variant="outline" className="text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-lg font-bold text-green-600">{totalCompleted}</span>
              </div>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-lg font-bold text-blue-600">{totalPending}</span>
              </div>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-lg font-bold text-red-600">{totalOverdue}</span>
              </div>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from '@/components/ui/tooltip';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Calculator,
  Upload,
  Send,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime: string;
  resources?: string[];
  dependencies?: string[];
}

interface ComplianceChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'vat' | 'cit' | 'regulatory' | 'filing';
  status: 'compliant' | 'pending' | 'overdue' | 'warning';
  deadline?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completedSteps: number;
  totalSteps: number;
  steps: ChecklistStep[];
  lastUpdated: Date;
}

interface ComplianceChecklistProps {
  items: any[];
}

export function ComplianceChecklist({ items }: ComplianceChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'critical'>('all');

  // Generate detailed checklist items with steps
  const generateDetailedChecklists = (): ComplianceChecklistItem[] => {
    return [
      {
        id: 'vat-filing-q1',
        title: 'VAT Return Q1 2025',
        description: 'Complete quarterly VAT return submission',
        category: 'vat',
        status: 'pending',
        deadline: new Date('2025-04-28'),
        priority: 'high',
        completedSteps: 3,
        totalSteps: 6,
        lastUpdated: new Date(),
        steps: [
          {
            id: 'vat-1',
            title: 'Gather VAT Records',
            description: 'Collect all sales and purchase invoices for Q1',
            completed: true,
            required: true,
            estimatedTime: '2 hours',
            resources: ['Invoice records', 'Bank statements']
          },
          {
            id: 'vat-2',
            title: 'Reconcile VAT Accounts',
            description: 'Reconcile VAT input and output accounts',
            completed: true,
            required: true,
            estimatedTime: '3 hours',
            dependencies: ['vat-1']
          },
          {
            id: 'vat-3',
            title: 'Calculate VAT Liability',
            description: 'Calculate total VAT due for the quarter',
            completed: true,
            required: true,
            estimatedTime: '1 hour',
            dependencies: ['vat-2']
          },
          {
            id: 'vat-4',
            title: 'Complete VAT Return Form',
            description: 'Fill out FTA VAT return form online',
            completed: false,
            required: true,
            estimatedTime: '2 hours',
            dependencies: ['vat-3']
          },
          {
            id: 'vat-5',
            title: 'Review and Validate',
            description: 'Review return for accuracy and completeness',
            completed: false,
            required: true,
            estimatedTime: '1 hour',
            dependencies: ['vat-4']
          },
          {
            id: 'vat-6',
            title: 'Submit to FTA',
            description: 'Submit VAT return through FTA portal',
            completed: false,
            required: true,
            estimatedTime: '30 minutes',
            dependencies: ['vat-5']
          }
        ]
      },
      {
        id: 'cit-annual-2024',
        title: 'CIT Annual Return 2024',
        description: 'File annual Corporate Income Tax return',
        category: 'cit',
        status: 'compliant',
        deadline: new Date('2025-09-30'),
        priority: 'medium',
        completedSteps: 5,
        totalSteps: 5,
        lastUpdated: new Date(),
        steps: [
          {
            id: 'cit-1',
            title: 'Prepare Financial Statements',
            description: 'Prepare audited financial statements',
            completed: true,
            required: true,
            estimatedTime: '1 week'
          },
          {
            id: 'cit-2',
            title: 'Calculate Taxable Income',
            description: 'Determine taxable income and applicable reliefs',
            completed: true,
            required: true,
            estimatedTime: '1 day'
          },
          {
            id: 'cit-3',
            title: 'Complete CIT Return',
            description: 'Fill out CIT return form',
            completed: true,
            required: true,
            estimatedTime: '4 hours'
          },
          {
            id: 'cit-4',
            title: 'Review and Sign',
            description: 'Review return and obtain authorized signatures',
            completed: true,
            required: true,
            estimatedTime: '2 hours'
          },
          {
            id: 'cit-5',
            title: 'Submit Return',
            description: 'Submit CIT return to FTA',
            completed: true,
            required: true,
            estimatedTime: '1 hour'
          }
        ]
      },
      {
        id: 'regulatory-compliance',
        title: 'UAE Commercial License Renewal',
        description: 'Renew commercial license with DED',
        category: 'regulatory',
        status: 'overdue',
        deadline: new Date('2025-02-15'),
        priority: 'critical',
        completedSteps: 1,
        totalSteps: 4,
        lastUpdated: new Date(),
        steps: [
          {
            id: 'license-1',
            title: 'Prepare Documentation',
            description: 'Gather required documents for renewal',
            completed: true,
            required: true,
            estimatedTime: '2 hours'
          },
          {
            id: 'license-2',
            title: 'Pay Renewal Fees',
            description: 'Pay license renewal and penalty fees',
            completed: false,
            required: true,
            estimatedTime: '1 hour'
          },
          {
            id: 'license-3',
            title: 'Submit Application',
            description: 'Submit renewal application to DED',
            completed: false,
            required: true,
            estimatedTime: '1 hour'
          },
          {
            id: 'license-4',
            title: 'Receive New License',
            description: 'Collect renewed commercial license',
            completed: false,
            required: true,
            estimatedTime: '1 week'
          }
        ]
      }
    ];
  };

  const detailedChecklists = generateDetailedChecklists();

  const filteredChecklists = detailedChecklists.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'overdue') return item.status === 'overdue';
    if (filter === 'critical') return item.priority === 'critical';
    return true;
  });

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleStepCompleted = (itemId: string, stepId: string) => {
    // In a real implementation, this would update the backend
    console.log(`Toggle step ${stepId} in item ${itemId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vat':
        return Calculator;
      case 'cit':
        return Building2;
      case 'filing':
        return FileText;
      case 'regulatory':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Compliance Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {(['all', 'pending', 'overdue', 'critical'] as const).map(filterOption => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="capitalize"
              >
                {filterOption}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {filteredChecklists.map((item) => {
          const CategoryIcon = getCategoryIcon(item.category);
          const isExpanded = expandedItems.has(item.id);
          const progress = (item.completedSteps / item.totalSteps) * 100;
          const daysUntilDeadline = item.deadline 
            ? Math.ceil((item.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <Card key={item.id} className="border-l-4" style={{ 
              borderLeftColor: item.status === 'overdue' ? '#ef4444' : 
                              item.status === 'warning' ? '#f59e0b' : 
                              item.status === 'compliant' ? '#10b981' : '#3b82f6' 
            }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(item.id)}
                      className="p-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <CategoryIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`mb-1 ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`} />
                        <span className="text-xs text-gray-500 capitalize">{item.priority}</span>
                      </div>
                    </div>
                    
                    {item.deadline && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {item.deadline.toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${
                          daysUntilDeadline && daysUntilDeadline < 0 ? 'text-red-600' :
                          daysUntilDeadline && daysUntilDeadline <= 7 ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          {daysUntilDeadline && daysUntilDeadline < 0 
                            ? `${Math.abs(daysUntilDeadline)} days overdue`
                            : daysUntilDeadline === 0 
                            ? 'Due today'
                            : `${daysUntilDeadline} days left`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Progress: {item.completedSteps} of {item.totalSteps} completed
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent>
                  <div className="space-y-3">
                    {item.steps.map((step, index) => (
                      <div 
                        key={step.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Checkbox
                          checked={step.completed}
                          onChange={() => toggleStepCompleted(item.id, step.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-medium ${
                              step.completed ? 'text-green-800 line-through' : 'text-gray-900'
                            }`}>
                              {index + 1}. {step.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {step.required && (
                                <Badge variant="outline" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {step.estimatedTime}
                              </span>
                            </div>
                          </div>
                          
                          <p className={`text-sm ${
                            step.completed ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {step.description}
                          </p>
                          
                          {step.resources && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Required resources:</p>
                              <div className="flex flex-wrap gap-1">
                                {step.resources.map((resource, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {resource}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {step.dependencies && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">
                                Depends on: {step.dependencies.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-between">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" disabled={progress === 100}>
                      Continue Progress
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
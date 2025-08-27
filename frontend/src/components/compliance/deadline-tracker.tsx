import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Clock, CheckCircle2, Plus, Bell, Filter } from 'lucide-react';

interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  type: 'vat' | 'cit' | 'filing' | 'payment' | 'regulatory';
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reminderDays: number[];
  autoNotify: boolean;
  relatedTasks?: string[];
}

interface DeadlineTrackerProps {
  deadlines: any[];
}

export function DeadlineTracker({ deadlines }: DeadlineTrackerProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'critical'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Generate UAE FTA specific deadlines
  const generateDeadlines = (): Deadline[] => {
    const now = new Date();
    return [
      {
        id: 'vat-q1-2025',
        title: 'VAT Return Q1 2025',
        description: 'Submit quarterly VAT return to FTA',
        dueDate: new Date(2025, 3, 28), // April 28, 2025
        type: 'vat',
        status: 'upcoming',
        priority: 'high',
        reminderDays: [30, 15, 7, 3, 1],
        autoNotify: true,
        relatedTasks: ['vat-reconciliation', 'vat-calculation']
      },
      {
        id: 'cit-payment-2024',
        title: 'CIT Payment 2024',
        description: 'Pay Corporate Income Tax for 2024',
        dueDate: new Date(2025, 5, 30), // June 30, 2025
        type: 'payment',
        status: 'upcoming',
        priority: 'critical',
        reminderDays: [60, 30, 15, 7, 3],
        autoNotify: true
      },
      {
        id: 'audit-submission',
        title: 'Audited Financial Statements',
        description: 'Submit audited financial statements to FTA',
        dueDate: new Date(2025, 5, 30), // June 30, 2025
        type: 'filing',
        status: 'upcoming',
        priority: 'high',
        reminderDays: [90, 60, 30, 15, 7],
        autoNotify: true
      },
      {
        id: 'license-renewal',
        title: 'Trade License Renewal',
        description: 'Renew UAE trade license with DED',
        dueDate: new Date(2025, 1, 15), // February 15, 2025
        type: 'regulatory',
        status: 'overdue',
        priority: 'critical',
        reminderDays: [60, 30, 15, 7, 3, 1],
        autoNotify: true
      },
      {
        id: 'vat-feb-payment',
        title: 'VAT Payment February',
        description: 'VAT payment for February 2025 period',
        dueDate: new Date(2025, 2, 20), // March 20, 2025
        type: 'payment',
        status: 'due',
        priority: 'high',
        reminderDays: [15, 7, 3, 1],
        autoNotify: true
      },
      {
        id: 'transfer-pricing-doc',
        title: 'Transfer Pricing Documentation',
        description: 'Submit transfer pricing documentation for related party transactions',
        dueDate: new Date(2025, 8, 30), // September 30, 2025
        type: 'filing',
        status: 'upcoming',
        priority: 'medium',
        reminderDays: [90, 60, 30, 15],
        autoNotify: true
      }
    ];
  };

  const allDeadlines = generateDeadlines();

  const filteredDeadlines = allDeadlines.filter(deadline => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return deadline.status === 'upcoming';
    if (filter === 'overdue') return deadline.status === 'overdue';
    if (filter === 'critical') return deadline.priority === 'critical';
    return true;
  });

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string, priority: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'due') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority === 'critical') return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vat':
      case 'cit':
        return '💰';
      case 'filing':
        return '📄';
      case 'payment':
        return '💳';
      case 'regulatory':
        return '🏛️';
      default:
        return '📅';
    }
  };

  const setupReminder = (deadlineId: string) => {
    // In a real implementation, this would set up notification reminders
    console.log(`Setting up reminders for deadline: ${deadlineId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deadline Tracker
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                Calendar View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['all', 'upcoming', 'overdue', 'critical'] as const).map(filterOption => (
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

      {/* Deadlines List */}
      <div className="space-y-4">
        {filteredDeadlines.map((deadline) => {
          const daysUntil = getDaysUntilDeadline(deadline.dueDate);
          const isOverdue = daysUntil < 0;
          const isDueSoon = daysUntil <= 7 && daysUntil >= 0;

          return (
            <Card key={deadline.id} className={`border-l-4 ${
              isOverdue ? 'border-l-red-500' :
              isDueSoon ? 'border-l-orange-500' :
              deadline.priority === 'critical' ? 'border-l-purple-500' :
              'border-l-blue-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getTypeIcon(deadline.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {deadline.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{deadline.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Due: {deadline.dueDate.toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className={
                            isOverdue ? 'text-red-600 font-medium' :
                            isDueSoon ? 'text-orange-600 font-medium' :
                            'text-gray-600'
                          }>
                            {isOverdue 
                              ? `${Math.abs(daysUntil)} days overdue`
                              : daysUntil === 0 
                              ? 'Due today'
                              : `${daysUntil} days remaining`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-right space-y-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(deadline.status, deadline.priority)}
                      >
                        {deadline.status}
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          deadline.priority === 'critical' ? 'bg-red-500' :
                          deadline.priority === 'high' ? 'bg-orange-500' :
                          deadline.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <span className="text-xs text-gray-500 capitalize">
                          {deadline.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setupReminder(deadline.id)}
                        className="flex items-center gap-1"
                      >
                        <Bell className="h-3 w-3" />
                        Remind Me
                      </Button>
                      
                      {deadline.status !== 'completed' && (
                        <Button size="sm" className="w-full">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {deadline.relatedTasks && deadline.relatedTasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Related Tasks:</p>
                    <div className="flex flex-wrap gap-1">
                      {deadline.relatedTasks.map((task, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {task}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {deadline.autoNotify && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Auto-notifications enabled</span>
                      <span className="text-gray-400">•</span>
                      <span>Reminders: {deadline.reminderDays.join(', ')} days before</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDeadlines.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deadlines found</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'All deadlines are up to date'
                : `No ${filter} deadlines at this time`
              }
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Deadline
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
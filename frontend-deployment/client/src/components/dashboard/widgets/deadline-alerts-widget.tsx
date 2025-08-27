import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  FileText,
  Calculator,
  Receipt,
  Building2
} from 'lucide-react';
import { Link } from 'wouter';

interface DeadlineAlertsWidgetProps {
  notifications: any[];
}

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  type: 'vat' | 'cit' | 'filing' | 'payment';
  status: 'upcoming' | 'due' | 'overdue';
  description: string;
  actionUrl?: string;
}

export function DeadlineAlertsWidget({ notifications }: DeadlineAlertsWidgetProps) {
  // Generate upcoming tax deadlines
  const generateDeadlines = (): Deadline[] => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const deadlines: Deadline[] = [
      {
        id: 'vat-q1-2025',
        title: 'VAT Return Q1 2025',
        dueDate: new Date(2025, 3, 28), // April 28, 2025
        type: 'vat',
        status: 'upcoming',
        description: 'Quarterly VAT return submission deadline',
        actionUrl: '/vat'
      },
      {
        id: 'cit-annual-2024',
        title: 'CIT Annual Return 2024',
        dueDate: new Date(2025, 8, 30), // September 30, 2025
        type: 'cit',
        status: 'upcoming',
        description: 'Annual Corporate Income Tax return filing',
        actionUrl: '/cit'
      },
      {
        id: 'vat-payment-feb',
        title: 'VAT Payment February',
        dueDate: new Date(2025, 2, 28), // March 28, 2025
        type: 'payment',
        status: 'due',
        description: 'VAT payment for February period',
        actionUrl: '/vat'
      },
      {
        id: 'financial-statements',
        title: 'Annual Financial Statements',
        dueDate: new Date(2025, 5, 30), // June 30, 2025
        type: 'filing',
        status: 'upcoming',
        description: 'Submit audited financial statements',
        actionUrl: '/financials'
      }
    ];

    // Determine status based on current date
    return deadlines.map(deadline => {
      const daysUntil = Math.ceil((deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: 'upcoming' | 'due' | 'overdue';
      if (daysUntil < 0) {
        status = 'overdue';
      } else if (daysUntil <= 15) {
        status = 'due';
      } else {
        status = 'upcoming';
      }

      return { ...deadline, status };
    }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  const deadlines = generateDeadlines();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'due':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vat':
        return Calculator;
      case 'cit':
        return Building2;
      case 'filing':
        return FileText;
      case 'payment':
        return Receipt;
      default:
        return Calendar;
    }
  };

  const formatDaysUntil = (dueDate: Date) => {
    const now = new Date();
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} days overdue`;
    } else if (daysUntil === 0) {
      return 'Due today';
    } else if (daysUntil === 1) {
      return 'Due tomorrow';
    } else {
      return `${daysUntil} days remaining`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Tax Filing Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.slice(0, 4).map((deadline) => {
            const IconComponent = getTypeIcon(deadline.type);
            const daysText = formatDaysUntil(deadline.dueDate);
            
            return (
              <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{deadline.title}</p>
                    <p className="text-sm text-gray-500">{deadline.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {deadline.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(deadline.status)}
                  >
                    {daysText}
                  </Badge>
                  {deadline.actionUrl && (
                    <Link href={deadline.actionUrl}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Take Action
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          
          {deadlines.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">All deadlines up to date</p>
            </div>
          )}
          
          {deadlines.length > 4 && (
            <div className="text-center pt-2">
              <Link href="/calendar">
                <Button variant="outline" size="sm">
                  View All Deadlines ({deadlines.length})
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
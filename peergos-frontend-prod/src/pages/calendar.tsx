import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Bell, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUpcomingDeadlines } from '@/lib/date-utils';
import { formatDate } from '@/lib/i18n';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const upcomingDeadlines = getUpcomingDeadlines();
  
  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // Start from the first day of the week containing the first day of the month
    startDate.setDate(startDate.getDate() - startDate.getDay());
    // End at the last day of the week containing the last day of the month
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  
  const getEventsForDate = (date: Date) => {
    return upcomingDeadlines.filter(deadline => {
      const deadlineDate = new Date(deadline.date);
      return deadlineDate.toDateString() === date.toDateString();
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-error-500';
      case 'MEDIUM': return 'bg-warning-500';
      default: return 'bg-primary-500';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Track your tax deadlines and important dates</p>
        </div>
        <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "px-3 py-1 text-sm rounded-md",
                viewMode === 'month' ? "bg-white shadow-sm" : ""
              )}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "px-3 py-1 text-sm rounded-md",
                viewMode === 'list' ? "bg-white shadow-sm" : ""
              )}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
          <Button className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
            <Plus size={16} />
            Add Event
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-error-600">{upcomingDeadlines.length}</p>
              </div>
              <Clock size={20} className="text-error-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-warning-600">
                  {upcomingDeadlines.filter(d => d.priority === 'HIGH').length}
                </p>
              </div>
              <Bell size={20} className="text-warning-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-primary-600">
                  {upcomingDeadlines.filter(d => new Date(d.date).getMonth() === today.getMonth()).length}
                </p>
              </div>
              <CalendarIcon size={20} className="text-primary-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 material-elevation-1">
          <CardHeader>
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <CardTitle>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </CardTitle>
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  ‹
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'month' ? (
              <div className="grid grid-cols-7 gap-1">
                {/* Header */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                  const isToday = date.toDateString() === today.toDateString();
                  const events = getEventsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-20 p-1 border border-gray-100 relative",
                        !isCurrentMonth && "bg-gray-50 text-gray-400",
                        isToday && "bg-primary-50 border-primary-200"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium",
                        isToday && "text-primary-600"
                      )}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1 mt-1">
                        {events.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={cn(
                              "text-xs px-1 py-0.5 rounded text-white truncate",
                              getPriorityColor(event.priority)
                            )}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                        <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                          <div className={cn("w-3 h-3 rounded-full", getPriorityColor(deadline.priority))}></div>
                          <div>
                            <h4 className="font-medium">{deadline.title}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(new Date(deadline.date), language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn(
                          deadline.priority === 'HIGH' ? 'bg-error-100 text-error-800' :
                          deadline.priority === 'MEDIUM' ? 'bg-warning-100 text-warning-800' :
                          'bg-primary-100 text-primary-800'
                        )}>
                          {deadline.daysLeft} days left
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                  <div key={index} className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                    <div className={cn("w-3 h-3 rounded-full flex-shrink-0", getPriorityColor(deadline.priority))}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{deadline.title}</p>
                      <p className="text-xs text-gray-500">{deadline.daysLeft} days left</p>
                    </div>
                  </div>
                ))}
                
                {upcomingDeadlines.length === 0 && (
                  <div className="text-center py-4">
                    <CalendarIcon size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="text-lg">Priority Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                  <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                  <span className="text-sm">High Priority (≤7 days)</span>
                </div>
                <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <span className="text-sm">Medium Priority (≤14 days)</span>
                </div>
                <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span className="text-sm">Normal Priority ({'>'}14 days)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

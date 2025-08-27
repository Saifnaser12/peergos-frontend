import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isRead: boolean;
  createdAt: string;
  metadata?: string;
  snoozedUntil?: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: async ({ notificationId, hours }: { notificationId: number; hours: number }) => {
      const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const response = await fetch(`/api/notifications/${notificationId}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozeUntil }),
      });
      if (!response.ok) throw new Error('Failed to snooze');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Notification Snoozed',
        description: 'You will be reminded again in 24 hours.',
      });
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to dismiss');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Notification Dismissed',
        description: 'The notification has been removed.',
      });
    },
  });

  // Filter active notifications (not snoozed, not dismissed)
  const activeNotifications = notifications.filter((n: Notification) => {
    if (n.snoozedUntil && new Date(n.snoozedUntil) > new Date()) {
      return false; // Still snoozed
    }
    return true;
  });

  const unreadCount = activeNotifications.filter((n: Notification) => !n.isRead).length;

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleSnooze = (notificationId: number) => {
    snoozeMutation.mutate({ notificationId, hours: 24 });
  };

  const handleDismiss = (notificationId: number) => {
    dismissMutation.mutate(notificationId);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-50';
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getUrgencyBadge = (metadata?: string) => {
    if (!metadata) return null;
    
    try {
      const parsed = JSON.parse(metadata);
      const urgency = parsed.urgency;
      
      if (!urgency) return null;

      const urgencyConfig = {
        critical: { color: 'bg-red-600 text-white', label: 'CRITICAL' },
        high: { color: 'bg-red-500 text-white', label: 'HIGH' },
        medium: { color: 'bg-yellow-500 text-white', label: 'MEDIUM' },
        low: { color: 'bg-blue-500 text-white', label: 'LOW' },
      };

      const config = urgencyConfig[urgency as keyof typeof urgencyConfig];
      if (!config) return null;

      return (
        <Badge className={cn('text-xs font-bold', config.color)}>
          {config.label}
        </Badge>
      );
    } catch {
      return null;
    }
  };

  const getDeadlineInfo = (metadata?: string) => {
    if (!metadata) return null;
    
    try {
      const parsed = JSON.parse(metadata);
      if (parsed.deadlineDate) {
        const deadline = new Date(parsed.deadlineDate);
        const isOverdue = deadline < new Date();
        return (
          <div className={cn(
            'text-xs flex items-center gap-1',
            isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
          )}>
            <Clock className="h-3 w-3" />
            {isOverdue ? 'OVERDUE' : `Due ${formatDistanceToNow(deadline, { addSuffix: true })}`}
          </div>
        );
      }
    } catch {
      return null;
    }
    return null;
  };

  // Auto-open on new high priority notifications
  useEffect(() => {
    const highPriorityUnread = activeNotifications.filter(
      (n: Notification) => !n.isRead && n.priority === 'HIGH'
    );
    
    if (highPriorityUnread.length > 0 && !isOpen) {
      setIsOpen(true);
      // Show toast for critical notifications
      highPriorityUnread.forEach((n: Notification) => {
        const metadata = n.metadata ? JSON.parse(n.metadata) : {};
        if (metadata.urgency === 'critical') {
          toast({
            title: n.title,
            description: n.message,
            variant: 'destructive',
          });
        }
      });
    }
  }, [activeNotifications, isOpen, toast]);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide-over Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <Card className="h-full border-0 rounded-none">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white">
                        {unreadCount} new
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="p-6 text-center text-gray-500">
                      Loading notifications...
                    </div>
                  ) : activeNotifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No notifications</p>
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activeNotifications.map((notification: Notification, index) => (
                        <div key={notification.id}>
                          <div 
                            className={cn(
                              'p-4 border-l-4 hover:bg-gray-50 transition-colors',
                              getPriorityColor(notification.priority),
                              !notification.isRead && 'bg-opacity-80'
                            )}
                          >
                            <div className="space-y-2">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {getPriorityIcon(notification.priority)}
                                  <h3 className={cn(
                                    'text-sm font-medium',
                                    !notification.isRead && 'font-semibold'
                                  )}>
                                    {notification.title}
                                  </h3>
                                </div>
                                {getUrgencyBadge(notification.metadata)}
                              </div>

                              {/* Message */}
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {notification.message}
                              </p>

                              {/* Deadline Info */}
                              {getDeadlineInfo(notification.metadata)}

                              {/* Timestamp */}
                              <div className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2">
                                {!notification.isRead && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs h-7"
                                  >
                                    Mark Read
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSnooze(notification.id)}
                                  className="text-xs h-7"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Snooze 24h
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDismiss(notification.id)}
                                  className="text-xs h-7 text-gray-500 hover:text-red-600"
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                          {index < activeNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
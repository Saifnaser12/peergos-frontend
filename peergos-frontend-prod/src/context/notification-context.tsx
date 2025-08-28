import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Notification } from '../../shared/schema';
import { useAuth } from './auth-context';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const { user, company } = useAuth();

  const { data } = useQuery({
    queryKey: ['/api/notifications', { companyId: company?.id, userId: user?.id }],
    enabled: !!company?.id,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      createdAt: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for high priority notifications
    if (notification.priority === 'HIGH') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: "default",
      });
    }
  };

  // Smart reminders - check deadlines daily
  useEffect(() => {
    if (!company?.id) return;

    const checkDeadlines = () => {
      const today = new Date();
      const in12Days = new Date();
      in12Days.setDate(today.getDate() + 12);

      // Mock VAT deadline check
      if (company.vatRegistered) {
        const nextVatDue = new Date();
        nextVatDue.setDate(today.getDate() + 12); // 12 days from now
        
        addNotification({
          companyId: company.id,
          userId: user?.id,
          type: 'DEADLINE_REMINDER',
          title: 'VAT Filing Reminder',
          message: 'Your VAT return is due in 12 days. Start preparing now to avoid penalties.',
          priority: 'HIGH',
          scheduledFor: today,
          isRead: false,
        });
      }
    };

    // Check on component mount and then daily
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, [company, user]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      addNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

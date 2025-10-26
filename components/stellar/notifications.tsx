'use client';

/**
 * Notification UI components for real-time event updates
 */

import React, { useState, useEffect } from 'react';
import {
  getNotificationManager,
  Notification,
} from '@/lib/stellar/events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, Info, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Notification icon based on type
 */
function NotificationIcon({ type }: { type: Notification['type'] }) {
  const icons = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  return icons[type];
}

/**
 * Single notification item
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClear: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onClear }: NotificationItemProps) {
  return (
    <Card className={cn('relative', !notification.read && 'border-primary')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <NotificationIcon type={notification.type} />
            <div className="flex-1 space-y-1">
              <CardTitle className="text-sm font-medium">
                {notification.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {notification.timestamp.toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                onClick={() => onMarkAsRead(notification.id)}
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              onClick={() => onClear(notification.id)}
              variant="ghost"
              size="icon"
              className="h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      </CardContent>
      {!notification.read && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
      )}
    </Card>
  );
}

/**
 * Notification bell button with badge
 */
export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const manager = getNotificationManager();

  useEffect(() => {
    // Initial load
    setNotifications(manager.getNotifications());
    setUnreadCount(manager.getUnreadCount());

    // Subscribe to new notifications
    const subscription = manager.watchNotifications().subscribe(() => {
      setNotifications(manager.getNotifications());
      setUnreadCount(manager.getUnreadCount());
    });

    // Poll for updates (in case of missed events)
    const interval = setInterval(() => {
      setNotifications(manager.getNotifications());
      setUnreadCount(manager.getUnreadCount());
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = (id: string) => {
    manager.markAsRead(id);
    setNotifications(manager.getNotifications());
    setUnreadCount(manager.getUnreadCount());
  };

  const handleMarkAllAsRead = () => {
    manager.markAllAsRead();
    setNotifications(manager.getNotifications());
    setUnreadCount(manager.getUnreadCount());
  };

  const handleClear = (id: string) => {
    manager.clearNotification(id);
    setNotifications(manager.getNotifications());
    setUnreadCount(manager.getUnreadCount());
  };

  const handleClearAll = () => {
    manager.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No unread notifications'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Button onClick={handleClearAll} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 pr-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onClear={handleClear}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Notification toast component (for inline display)
 */
interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  duration?: number;
}

export function NotificationToast({
  notification,
  onDismiss,
  duration = 5000,
}: NotificationToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <NotificationIcon type={notification.type} />
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">
                {notification.title}
              </CardTitle>
            </div>
          </div>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Notification container for toast notifications
 */
export function NotificationContainer() {
  const [toasts, setToasts] = useState<Notification[]>([]);
  const manager = getNotificationManager();

  useEffect(() => {
    const subscription = manager.watchNotifications().subscribe(notification => {
      setToasts(prev => [...prev, notification]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(n => n.id !== id));
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.slice(-3).map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

/**
 * Connection status indicator
 */
interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
}

export function ConnectionStatusIndicator({ status }: ConnectionStatusProps) {
  const config = {
    connected: {
      color: 'bg-green-500',
      label: 'Connected',
      pulse: false,
    },
    disconnected: {
      color: 'bg-gray-500',
      label: 'Disconnected',
      pulse: false,
    },
    reconnecting: {
      color: 'bg-yellow-500',
      label: 'Reconnecting',
      pulse: true,
    },
    error: {
      color: 'bg-red-500',
      label: 'Error',
      pulse: false,
    },
  };

  const { color, label, pulse } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={cn('h-2 w-2 rounded-full', color)} />
        {pulse && (
          <div className={cn('absolute inset-0 h-2 w-2 rounded-full animate-ping', color)} />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

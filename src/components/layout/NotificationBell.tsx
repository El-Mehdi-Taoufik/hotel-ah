"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { notificationService, Notification } from "@/services/notification.service";
import { eventEmitter, EVENTS } from "@/lib/events";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { t, direction } = useTranslation();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications and automatically process expired stays.
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const result = await notificationService.getUnreadWithProcessing();
      setNotifications(result.data.slice(0, 5)); // Show latest 5 unread notifications

      // An expired stay changes the reservation to CheckedOut and the room to
      // Cleaning. Refresh calendar, rooms and dashboard immediately.
      if (result.processedExpiredReservations > 0) {
        eventEmitter.emit(EVENTS.RESERVATION_STATUS_CHANGED);
        eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
        eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'Error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'Warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-50 border-red-200';
    switch (type) {
      case 'Success':
        return 'bg-green-50 border-green-200';
      case 'Error':
        return 'bg-red-50 border-red-200';
      case 'Warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-lg hover:bg-[#F8F6F2] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#6B6258]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute top-full mt-2 w-80 sm:w-96 bg-white border border-[#E7DFD4] rounded-xl shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col ${
              direction === 'rtl' ? 'left-0' : 'right-0'
            }`}
          >
            <div className="p-4 border-b border-[#E7DFD4] flex items-center justify-between">
              <h3 className="font-semibold text-[#2F2A25]">Notifications</h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#6B6258] hover:text-[#2F2A25] flex items-center gap-1"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#6B6258] hover:text-[#2F2A25]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#6B6258]">
                  <Bell size={32} className="mx-auto mb-2 text-[#9A9085]" />
                  <p className="text-sm">No unread notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-[#E7DFD4] ${getNotificationColor(notification.type, notification.isOverdue)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2F2A25] mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-[#6B6258] mb-2 line-clamp-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#9A9085]">
                            {formatTime(notification.createdAt)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-[#6B6258] hover:text-[#2F2A25]"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-[#6B6258] hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-[#E7DFD4]">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-[#2F2A25] hover:text-[#6B6258] font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

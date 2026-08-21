"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Filter, Search, CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { notificationService, Notification } from "@/services/notification.service";
import { useTranslation } from "@/contexts/LanguageContext";

export default function NotificationsPage() {
  const { notifications: n, direction, common } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Information" | "Success" | "Warning" | "Error">("All");
  const [readFilter, setReadFilter] = useState<"All" | "Read" | "Unread">("All");

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, typeFilter, readFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "All") {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Read filter
    if (readFilter === "Read") {
      filtered = filtered.filter(n => n.isRead);
    } else if (readFilter === "Unread") {
      filtered = filtered.filter(n => !n.isRead);
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'Error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'Warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
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
    const locale = direction === 'rtl' ? 'ar-MA' : 'en-US';
    return date.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={n('title')}
        subtitle={n('subtitle')}
      />

      {/* Filters */}
      <div className="bg-white border border-[#E7DFD4] rounded-xl p-4 space-y-4" dir={direction}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className={`absolute top-1/2 -translate-y-1/2 text-[#9A9085] ${direction === 'rtl' ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={n('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 border border-[#E7DFD4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F2A25]/20 ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-[#E7DFD4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F2A25]/20 bg-white"
            >
              <option value="All">{n('allTypes')}</option>
              <option value="Information">{n('information')}</option>
              <option value="Success">{n('success')}</option>
              <option value="Warning">{n('warning')}</option>
              <option value="Error">{n('error')}</option>
            </select>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as any)}
              className="px-4 py-2 border border-[#E7DFD4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F2A25]/20 bg-white"
            >
              <option value="All">{n('allStatus')}</option>
              <option value="Read">{n('read')}</option>
              <option value="Unread">{n('unread')}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleMarkAllAsRead}
            disabled={notifications.filter(n => !n.isRead).length === 0}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Check size={16} />
            {n('markAllAsRead')}
          </Button>
          <Button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            {n('clearAll')}
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#E7DFD4] rounded-xl overflow-hidden" dir={direction}>
        {loading ? (
          <div className="p-8 text-center text-[#6B6258]">
            {n('loading')}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-[#6B6258]">
            <Bell size={48} className="mx-auto mb-4 text-[#9A9085]" />
            <p className="text-lg font-medium mb-2">{n('noNotificationsFound')}</p>
            <p className="text-sm">
              {searchQuery || typeFilter !== "All" || readFilter !== "All"
                ? n('tryAdjustingFilters')
                : n('allCaughtUp')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E7DFD4]">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${getNotificationColor(notification.type, notification.isOverdue)} ${
                  !notification.isRead ? (direction === 'rtl' ? 'border-r-4 border-r-[#2F2A25]' : 'border-l-4 border-l-[#2F2A25]') : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2F2A25] mb-1">
                          {notification.title}
                          {notification.isOverdue && (
                            <span className={`ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full ${direction === 'rtl' ? 'mr-2 ml-0' : ''}`}>
                              {n('overdue')}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-[#6B6258] mb-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-[#9A9085]">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            title={n('markAsRead')}
                          >
                            <Check size={18} className="text-[#6B6258]" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          title={common('delete')}
                        >
                          <Trash2 size={18} className="text-[#6B6258] hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" dir={direction}>
        <div className="bg-white border border-[#E7DFD4] rounded-xl p-4">
          <p className="text-sm text-[#6B6258]">{n('totalNotifications')}</p>
          <p className="text-2xl font-bold text-[#2F2A25]">{notifications.length}</p>
        </div>
        <div className="bg-white border border-[#E7DFD4] rounded-xl p-4">
          <p className="text-sm text-[#6B6258]">{n('unread')}</p>
          <p className="text-2xl font-bold text-[#2F2A25]">
            {notifications.filter(n => !n.isRead).length}
          </p>
        </div>
        <div className="bg-white border border-[#E7DFD4] rounded-xl p-4">
          <p className="text-sm text-[#6B6258]">{n('overdue')}</p>
          <p className="text-2xl font-bold text-red-500">
            {notifications.filter(n => n.isOverdue).length}
          </p>
        </div>
      </div>
    </div>
  );
}

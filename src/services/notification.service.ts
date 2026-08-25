import apiClient from './api';

export interface Notification {
  id: number;
  title: string;
  description: string;
  type: 'Information' | 'Success' | 'Warning' | 'Error';
  isRead: boolean;
  isOverdue: boolean;
  createdAt: string;
  userId?: number;
  reservationId?: number;
  roomId?: number;
}

export interface UnreadNotificationsResponse {
  data: Notification[];
  processedExpiredReservations: number;
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get<{ data: Notification[] }>('/notifications');
    return (response as any).data || [];
  },

  getUnread: async (): Promise<Notification[]> => {
    const response = await apiClient.get<UnreadNotificationsResponse>('/notifications/unread');
    return (response as any).data || [];
  },

  getUnreadWithProcessing: async (): Promise<UnreadNotificationsResponse> => {
    const response = await apiClient.get<UnreadNotificationsResponse>('/notifications/unread');
    return {
      data: (response as any).data || [],
      processedExpiredReservations: Number((response as any).processedExpiredReservations || 0),
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ data: number }>('/notifications/unread-count');
    return (response as any).data || 0;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/notifications/clear-all');
  }
};

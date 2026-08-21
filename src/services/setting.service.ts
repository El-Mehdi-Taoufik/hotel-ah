import apiClient from './api';

export interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
}

export interface HotelSettings {
  hotelName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timeZone: string;
  language: string;
}

export interface ReservationSettings {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  reservationPrefix: string;
  autoConfirmReservations: boolean;
  allowOverbooking: boolean;
}

export interface PaymentSettings {
  taxPercentage: number;
  depositPercentage: number;
  defaultPaymentMethod: string;
}

export interface SystemSettings {
  // Theme
  theme: string;
  
  // Appearance
  fontSize: string;
  compactMode: boolean;
  sidebarCollapsed: boolean;
  sidebarPosition: string;
  
  // Notifications
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSoundNotifications: boolean;
  enableDesktopNotifications: boolean;
  
  // Security
  autoLogoutTimeout: number;
  rememberMe: boolean;
  
  // System
  dateFormat: string;
  timeFormat: string;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultTax: number;
}

export interface AllSettings {
  hotel: HotelSettings;
  reservation: ReservationSettings;
  payment: PaymentSettings;
  system: SystemSettings;
}

export interface ProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatarColor: string;
}

export interface BackupSettings {
  backupType: string;
  includeImages: boolean;
  includeSettings: boolean;
}

export const settingService = {
  // Basic settings
  getAll: async (): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/settings');
    return response;
  },

  update: async (data: any): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings', data);
    return response;
  },

  // Hotel Settings
  getHotelSettings: async (): Promise<{ success: boolean; data: HotelSettings }> => {
    const response = await apiClient.get<{ success: boolean; data: HotelSettings }>('/settings/hotel');
    return response;
  },

  updateHotelSettings: async (data: HotelSettings): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/hotel', data);
    return response;
  },

  // Reservation Settings
  getReservationSettings: async (): Promise<{ success: boolean; data: ReservationSettings }> => {
    const response = await apiClient.get<{ success: boolean; data: ReservationSettings }>('/settings/reservations');
    return response;
  },

  updateReservationSettings: async (data: ReservationSettings): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/reservations', data);
    return response;
  },

  // Payment Settings
  getPaymentSettings: async (): Promise<{ success: boolean; data: PaymentSettings }> => {
    const response = await apiClient.get<{ success: boolean; data: PaymentSettings }>('/settings/payments');
    return response;
  },

  updatePaymentSettings: async (data: PaymentSettings): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/payments', data);
    return response;
  },

  // System Settings
  getSystemSettings: async (): Promise<{ success: boolean; data: SystemSettings }> => {
    const response = await apiClient.get<{ success: boolean; data: SystemSettings }>('/settings/system');
    return response;
  },

  updateSystemSettings: async (data: SystemSettings): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/system', data);
    return response;
  },

  // All Settings
  getAllSettings: async (): Promise<{ success: boolean; data: AllSettings }> => {
    const response = await apiClient.get<{ success: boolean; data: AllSettings }>('/settings/all');
    return response;
  },

  updateAllSettings: async (data: AllSettings): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/all', data);
    return response;
  },

  // Backup & Restore
  createBackup: async (): Promise<{ success: boolean; data: string; message: string }> => {
    const response = await apiClient.post<{ success: boolean; data: string; message: string }>('/settings/backup');
    return response;
  },

  restoreBackup: async (backupData: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/settings/restore', backupData);
    return response;
  },

  exportDatabase: async (): Promise<{ success: boolean; data: string; message: string }> => {
    const response = await apiClient.get<{ success: boolean; data: string; message: string }>('/settings/export');
    return response;
  },

  importDatabase: async (importData: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/settings/import', importData);
    return response;
  },
};

export default settingService;
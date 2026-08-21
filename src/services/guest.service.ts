import apiClient from './api';

export interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  nationality?: string;
  isVip: boolean;
  totalStays?: number;
  totalSpent?: number;
}

export interface CreateGuestRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  nationality?: string;
  isVip?: boolean;
}

export interface UpdateGuestRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  nationality?: string;
  isVip?: boolean;
}

export const guestService = {
  getAll: async (): Promise<{ success: boolean; data: Guest[] }> => {
    const response = await apiClient.get<{ success: boolean; data: Guest[] }>('/guests');
    return response;
  },

  getById: async (id: number): Promise<Guest> => {
    const response = await apiClient.get<{ success: boolean; data: Guest }>(`/guests/${id}`);
    return response.data;
  },

  create: async (data: CreateGuestRequest): Promise<Guest> => {
    const response = await apiClient.post<{ success: boolean; data: Guest; message?: string }>('/guests', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create guest');
    }
    return response.data;
  },

  searchByEmail: async (email: string): Promise<Guest | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Guest[] }>(`/guests?search=${encodeURIComponent(email)}`);
      if (response.success && response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error('Failed to search guest by email:', error);
      return null;
    }
  },

  update: async (id: number, data: UpdateGuestRequest): Promise<Guest> => {
    const response = await apiClient.put<{ success: boolean; data: Guest }>(`/guests/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`/guests/${id}`);
    return response;
  },
};

export default guestService;
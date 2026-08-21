import apiClient from './api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  avatarColor?: string;
  preferredLanguage?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
}

export interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  avatarColor?: string;
  preferredLanguage?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarColor?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserPreferences {
  preferredLanguage: string;
}

export const userService = {
  getAll: async (): Promise<{ success: boolean; data: User[] }> => {
    const response = await apiClient.get<{ success: boolean; data: User[] }>('/users');
    return response;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<{ success: boolean; data: User }>('/users', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`/users/${id}`);
    return response;
  },

  getProfile: async (): Promise<{ success: boolean; data: Profile }> => {
    const response = await apiClient.get<{ success: boolean; data: Profile }>('/users/profile');
    return response;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<{ success: boolean; data: Profile; message: string }> => {
    const response = await apiClient.put<{ success: boolean; data: Profile; message: string }>('/users/profile', data);
    return response;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', data);
    return response;
  },

  getPreferences: async (): Promise<{ success: boolean; data: UserPreferences }> => {
    const response = await apiClient.get<{ success: boolean; data: UserPreferences }>('/users/preferences');
    return response;
  },

  updatePreferences: async (data: UserPreferences): Promise<{ success: boolean; data: User; message: string }> => {
    const response = await apiClient.put<{ success: boolean; data: User; message: string }>('/users/preferences', data);
    return response;
  },
};

export default userService;
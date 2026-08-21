import apiClient from './api';

export interface RoomType {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  amenities?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface CreateRoomTypeRequest {
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  amenities?: string;
  imageUrl?: string;
}

export interface UpdateRoomTypeRequest {
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  amenities?: string;
  imageUrl?: string;
}

export const roomTypeService = {
  getAll: async (): Promise<{ success: boolean; data: RoomType[] }> => {
    const response = await apiClient.get<{ success: boolean; data: RoomType[] }>('/room-types');
    return response;
  },

  getById: async (id: number): Promise<{ success: boolean; data: RoomType }> => {
    const response = await apiClient.get<{ success: boolean; data: RoomType }>(`/room-types/${id}`);
    return response;
  },

  create: async (data: CreateRoomTypeRequest): Promise<{ success: boolean; data: RoomType; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; data: RoomType; message?: string }>('/room-types', data);
    return response;
  },

  update: async (id: number, data: UpdateRoomTypeRequest): Promise<{ success: boolean; data: RoomType; message?: string }> => {
    const response = await apiClient.put<{ success: boolean; data: RoomType; message?: string }>(`/room-types/${id}`, data);
    return response;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/room-types/${id}`);
    return response;
  },
};

export default roomTypeService;

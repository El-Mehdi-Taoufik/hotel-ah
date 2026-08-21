import apiClient from './api';
import { eventEmitter, EVENTS } from '@/lib/events';

export interface Room {
  id: number;
  roomNumber: string;
  floor: string;
  status: string;
  isAvailable: boolean;
  notes?: string;
  roomType?: {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
    maxOccupancy: number;
  };
  createdAt: string;
}

export interface CreateRoomRequest {
  roomNumber: string;
  roomTypeId: number;
  floor: string;
  status?: string;
  isAvailable?: boolean;
  notes?: string;
}

export interface UpdateRoomRequest {
  roomNumber?: string;
  roomTypeId?: number;
  floor?: string;
  status?: string;
  isAvailable?: boolean;
  notes?: string;
}

export const roomService = {
  getAll: async (): Promise<{ success: boolean; data: Room[] }> => {
    const response = await apiClient.get<{ success: boolean; data: Room[] }>('/rooms');
    return response;
  },

  getById: async (id: number): Promise<Room> => {
    const response = await apiClient.get<{ success: boolean; data: Room }>(`/rooms/${id}`);
    return response.data;
  },

  getAvailableRooms: async (checkInDate: Date, checkOutDate: Date): Promise<Room[]> => {
    const checkIn = checkInDate.toISOString().split('T')[0];
    const checkOut = checkOutDate.toISOString().split('T')[0];
    const response = await apiClient.get<{ success: boolean; data: Room[] }>(
      `/rooms/available?checkInDate=${checkIn}&checkOutDate=${checkOut}`
    );
    return response.data;
  },

  create: async (data: CreateRoomRequest): Promise<{ success: boolean; data: Room; message?: string; errors?: string[] }> => {
    const response = await apiClient.post<{ success: boolean; data: Room; message?: string; errors?: string[] }>('/rooms', data);
    if (response.success) {
      eventEmitter.emit(EVENTS.ROOM_CREATED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response;
  },

  update: async (id: number, data: UpdateRoomRequest): Promise<Room> => {
    const response = await apiClient.put<{ success: boolean; data: Room }>(`/rooms/${id}`, data);
    if (response.success) {
      eventEmitter.emit(EVENTS.ROOM_UPDATED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Room> => {
    const response = await apiClient.patch<{ success: boolean; data: Room }>(`/rooms/${id}/status`, { status });
    if (response.success) {
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`/rooms/${id}`);
    if (response.success) {
      eventEmitter.emit(EVENTS.ROOM_DELETED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response;
  },
};

export default roomService;

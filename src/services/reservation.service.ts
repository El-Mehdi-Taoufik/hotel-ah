import apiClient from './api';
import { eventEmitter, EVENTS } from '@/lib/events';

export interface Reservation {
  id: number;
  reservationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: string;
  totalAmount: number;
  depositAmount: number;
  specialRequests?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  guest: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    nationality: string;
    passportNumber?: string;
    address?: string;
    isVip: boolean;
    totalStays: number;
    totalSpent: number;
    notes?: string;
  };
  room?: {
    id: number;
    roomNumber: string;
    floor: string;
  };
  rooms: Array<{
    id: number;
    roomNumber: string;
    floor: string;
    status: string;
    notes?: string;
    roomType: {
      id: number;
      name: string;
      description: string;
      basePrice: number;
      maxOccupancy: number;
      imageUrl?: string;
    };
  }>;
  paymentStatus: string;
}

export interface CreateReservationRequest {
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  depositAmount: number;
  discountAmount: number;
  paymentMethod: string;
  status: string;
  specialRequests?: string;
}

export interface UpdateReservationRequest {
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  discountAmount: number;
  depositAmount: number;
  paymentMethod: string;
  specialRequests?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const reservationService = {
  getAll: async (
    pageNumber: number = 1,
    pageSize: number = 10,
    status?: string,
    search?: string
  ): Promise<PaginatedResponse<Reservation>> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await apiClient.get<PaginatedResponse<Reservation>>(`/reservations?${params.toString()}`);
    return response;
  },

  search: async (search: string): Promise<{ success: boolean; data: Reservation[] }> => {
    const response = await apiClient.get<{ success: boolean; data: Reservation[] }>(`/reservations/search?query=${encodeURIComponent(search)}`);
    return response;
  },

  getById: async (id: number): Promise<Reservation> => {
    const response = await apiClient.get<{ success: boolean; data: Reservation }>(`/reservations/${id}`);
    return response.data;
  },

  getByGuestId: async (guestId: number): Promise<Reservation[]> => {
    const response = await apiClient.get<{ success: boolean; data: Reservation[] }>(`/reservations/by-guest/${guestId}`);
    return response.data;
  },

  getByStatus: async (status: string): Promise<Reservation[]> => {
    const response = await apiClient.get<{ success: boolean; data: Reservation[] }>(`/reservations/by-status/${status}`);
    return response.data;
  },

  create: async (data: CreateReservationRequest): Promise<Reservation> => {
    const response = await apiClient.post<{ success: boolean; data: Reservation }>('/reservations', data);
    if (response.success) {
      eventEmitter.emit(EVENTS.RESERVATION_CREATED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  update: async (id: number, data: UpdateReservationRequest): Promise<Reservation> => {
    const response = await apiClient.put<{ success: boolean; data: Reservation }>(`/reservations/${id}`, data);
    if (response.success) {
      eventEmitter.emit(EVENTS.RESERVATION_UPDATED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Reservation> => {
    const response = await apiClient.patch<{ success: boolean; data: Reservation }>(`/reservations/${id}/status`, { status });
    if (response.success) {
      eventEmitter.emit(EVENTS.RESERVATION_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`/reservations/${id}`);
    if (response.success) {
      eventEmitter.emit(EVENTS.RESERVATION_DELETED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response;
  },
};

export default reservationService;

import apiClient from './api';
import { eventEmitter, EVENTS } from '@/lib/events';

export interface Payment {
  id: number;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  guest?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  reservation?: {
    id: number;
    reservationNumber: string;
  };
}

export interface CreatePaymentRequest {
  reservationId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface RefundRequest {
  amount: number;
}

export interface ReceivePaymentRequest {
  reservationId: number;
  amount: number;
  method: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PendingPayment {
  reservationId: number;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: string;
  dueDate: string;
  createdAt: string;
}

export const paymentService = {
  getAll: async (): Promise<{ success: boolean; data: Payment[] }> => {
    const response = await apiClient.get<{ success: boolean; data: Payment[] }>('/payments');
    return response;
  },

  getById: async (id: number): Promise<Payment> => {
    const response = await apiClient.get<{ success: boolean; data: Payment }>(`/payments/${id}`);
    return response.data;
  },

  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<{ success: boolean; data: Payment }>('/payments', data);
    if (response.success) {
      eventEmitter.emit(EVENTS.PAYMENT_CREATED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  refund: async (id: number, data: RefundRequest): Promise<Payment> => {
    const response = await apiClient.post<{ success: boolean; data: Payment }>(`/payments/${id}/refund`, data);
    if (response.success) {
      eventEmitter.emit(EVENTS.PAYMENT_UPDATED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    }
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/payments/${id}`);
    eventEmitter.emit(EVENTS.PAYMENT_DELETED);
    eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
  },

  getPendingPayments: async (): Promise<{ success: boolean; data: PendingPayment[] }> => {
    const response = await apiClient.get<{ success: boolean; data: PendingPayment[] }>('/payments/pending');
    return response;
  },

  receivePayment: async (data: ReceivePaymentRequest): Promise<{ success: boolean; data: Payment }> => {
    const response = await apiClient.post<{ success: boolean; data: Payment }>('/payments/receive', {
      ...data,
      method: data.method // Ensure the field name matches backend
    });
    return response;
  },
};

export default paymentService;
import apiClient from './api';

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalReservations: number;
  activeReservations: number;
  pendingReservations: number;
  totalGuests: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingHousekeeping: number;
}

export interface RevenueData {
  day: string;
  revenue: number;
}

export interface OccupancyData {
  day: string;
  occupancy: number;
}

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data;
  },

  getRevenue: async (startDate: Date, endDate: Date): Promise<RevenueData[]> => {
    const response = await apiClient.get<{ success: boolean; data: RevenueData[] }>(
      `/dashboard/revenue?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    return response.data;
  },

  getOccupancyRates: async (startDate: Date, endDate: Date): Promise<OccupancyData[]> => {
    const response = await apiClient.get<{ success: boolean; data: OccupancyData[] }>(
      `/dashboard/occupancy?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    return response.data;
  },

  getRecentActivity: async (): Promise<ActivityItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: ActivityItem[] }>('/dashboard/activity');
    return response.data;
  },
};

export default dashboardService;
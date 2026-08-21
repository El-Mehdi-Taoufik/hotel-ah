import apiClient from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export const authService = {
 login: async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<{ success: boolean; data: any }>(
    "/auth/login",
    { email, password }
  );

  console.log("FULL LOGIN RESPONSE:", response);
  console.log("LOGIN DATA:", response.data);

  const data = response.data;

  return {
    token: data.AccessToken || data.accessToken || data.token,
    refreshToken: data.RefreshToken || data.refreshToken,
    user: data.user,
  };
},

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<{ success: boolean; data: any }>("/auth/register", data);
    const responseData = response.data;
    return {
      token: responseData.AccessToken || responseData.accessToken || responseData.token,
      refreshToken: responseData.RefreshToken || responseData.refreshToken,
      user: responseData.user,
    };
  },

  // باقي logout و getCurrentUser و refreshToken...


  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) await apiClient.post('/auth/logout', { refreshToken });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<{ success: boolean; data: any }>('/auth/refresh-token', { refreshToken });
    const responseData = response.data;
    return {
      token: responseData.AccessToken || responseData.accessToken || responseData.token,
      refreshToken: responseData.RefreshToken || responseData.refreshToken,
      user: responseData.user
    };
  },
};


export default authService;

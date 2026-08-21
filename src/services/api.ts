// API configuration and base client
// Note: Install axios with: npm install axios

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const handleErrorResponse = async (response: Response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || error.detail || error.title || `HTTP ${response.status}: ${response.statusText}`);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
};

const handleUnauthorized = async () => {
  // Clear token and redirect to login
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
};

const refreshToken = async (): Promise<string | null> => {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newToken = data.data?.AccessToken || data.data?.accessToken || data.data?.token;
    const newRefreshToken = data.data?.RefreshToken || data.data?.refreshToken;

    if (newToken) {
      localStorage.setItem('token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      return newToken;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

const subscribeToRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

export const apiClient = {
  get: async <T>(url: string, headers?: Record<string, string>): Promise<T> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
      });
      
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;

          if (newToken) {
            onRefreshed(newToken);
            // Retry the original request with new token
            return apiClient.get<T>(url, headers);
          } else {
            handleUnauthorized();
            throw new Error('Unauthorized - Please log in again');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            subscribeToRefresh((newToken: string) => {
              apiClient.get<T>(url, headers)
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
      
      if (!response.ok) {
        await handleErrorResponse(response);
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType) {
        return {} as T;
      }
      
      // Only parse JSON if content type indicates JSON
      if (contentType.includes('application/json')) {
        return response.json();
      }
      
      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to backend at ${API_URL}. Please ensure the backend is running.`);
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },

  post: async <T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;

          if (newToken) {
            onRefreshed(newToken);
            // Retry the original request with new token
            return apiClient.post<T>(url, data, headers);
          } else {
            handleUnauthorized();
            throw new Error('Unauthorized - Please log in again');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            subscribeToRefresh((newToken: string) => {
              apiClient.post<T>(url, data, headers)
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
      
      if (!response.ok) {
        await handleErrorResponse(response);
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType) {
        return {} as T;
      }
      
      // Only parse JSON if content type indicates JSON
      if (contentType.includes('application/json')) {
        return response.json();
      }
      
      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to backend at ${API_URL}. Please ensure the backend is running.`);
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },

  put: async <T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;

          if (newToken) {
            onRefreshed(newToken);
            // Retry the original request with new token
            return apiClient.put<T>(url, data, headers);
          } else {
            handleUnauthorized();
            throw new Error('Unauthorized - Please log in again');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            subscribeToRefresh((newToken: string) => {
              apiClient.put<T>(url, data, headers)
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
      
      if (!response.ok) {
        await handleErrorResponse(response);
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType) {
        return {} as T;
      }
      
      // Only parse JSON if content type indicates JSON
      if (contentType.includes('application/json')) {
        return response.json();
      }
      
      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to backend at ${API_URL}. Please ensure the backend is running.`);
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },

  delete: async <T>(url: string, headers?: Record<string, string>): Promise<T> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
      });
      
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;

          if (newToken) {
            onRefreshed(newToken);
            // Retry the original request with new token
            return apiClient.delete<T>(url, headers);
          } else {
            handleUnauthorized();
            throw new Error('Unauthorized - Please log in again');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            subscribeToRefresh((newToken: string) => {
              apiClient.delete<T>(url, headers)
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
      
      if (!response.ok) {
        await handleErrorResponse(response);
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType) {
        return {} as T;
      }
      
      // Only parse JSON if content type indicates JSON
      if (contentType.includes('application/json')) {
        return response.json();
      }
      
      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to backend at ${API_URL}. Please ensure the backend is running.`);
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },

  patch: async <T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;

          if (newToken) {
            onRefreshed(newToken);
            // Retry the original request with new token
            return apiClient.patch<T>(url, data, headers);
          } else {
            handleUnauthorized();
            throw new Error('Unauthorized - Please log in again');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            subscribeToRefresh((newToken: string) => {
              apiClient.patch<T>(url, data, headers)
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
      
      if (!response.ok) {
        await handleErrorResponse(response);
      }
      
      if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) return {} as T;
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Unable to connect to backend at ${API_URL}. Please ensure the backend is running.`);
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },
};

export default apiClient;

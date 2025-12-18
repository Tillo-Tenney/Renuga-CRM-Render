// Type definition for runtime configuration
interface RuntimeConfig {
  apiUrl: string;
}

// Extend Window interface to include runtime config
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

// Placeholder constant used during build
const API_URL_PLACEHOLDER = '__VITE_API_URL__';

// API configuration with runtime support
// Priority: Runtime config > Build-time env var > Default localhost
function getApiBaseUrl(): string {
  // Check for runtime configuration (set via public/config.js)
  const runtimeConfig = window.__RUNTIME_CONFIG__;
  if (runtimeConfig?.apiUrl && runtimeConfig.apiUrl !== API_URL_PLACEHOLDER) {
    if (import.meta.env.DEV) {
      console.log('[API Config] Using runtime config:', runtimeConfig.apiUrl);
    }
    return runtimeConfig.apiUrl;
  }
  
  // Fall back to build-time environment variable
  const buildTimeUrl = import.meta.env.VITE_API_URL;
  if (buildTimeUrl) {
    if (import.meta.env.DEV) {
      console.log('[API Config] Using build-time env var:', buildTimeUrl);
    }
    return buildTimeUrl;
  }
  
  // Default to localhost for development
  if (import.meta.env.DEV) {
    console.log('[API Config] Using default localhost');
  }
  return 'http://localhost:3001';
}

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('crm_token');
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper function to make authenticated requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}

// Authentication API
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiRequest<{
      success: boolean;
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token
    if (response.token) {
      localStorage.setItem('crm_token', response.token);
    }
    
    return response;
  },

  async validateToken() {
    return apiRequest<{
      valid: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
      };
    }>('/api/auth/validate');
  },

  async logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user_id');
    return apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },
};

// Call Logs API
export const callLogsApi = {
  getAll: () => apiRequest<any[]>('/api/call-logs'),
  getById: (id: string) => apiRequest<any>(`/api/call-logs/${id}`),
  create: (data: any) => apiRequest<any>('/api/call-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/call-logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<any>(`/api/call-logs/${id}`, {
    method: 'DELETE',
  }),
};

// Leads API
export const leadsApi = {
  getAll: () => apiRequest<any[]>('/api/leads'),
  getById: (id: string) => apiRequest<any>(`/api/leads/${id}`),
  create: (data: any) => apiRequest<any>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<any>(`/api/leads/${id}`, {
    method: 'DELETE',
  }),
};

// Orders API
export const ordersApi = {
  getAll: () => apiRequest<any[]>('/api/orders'),
  getById: (id: string) => apiRequest<any>(`/api/orders/${id}`),
  create: (data: any) => apiRequest<any>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<any>(`/api/orders/${id}`, {
    method: 'DELETE',
  }),
};

// Products API
export const productsApi = {
  getAll: () => apiRequest<any[]>('/api/products'),
  getById: (id: string) => apiRequest<any>(`/api/products/${id}`),
  create: (data: any) => apiRequest<any>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<any>(`/api/products/${id}`, {
    method: 'DELETE',
  }),
};

// Tasks API
export const tasksApi = {
  getAll: () => apiRequest<any[]>('/api/tasks'),
  create: (data: any) => apiRequest<any>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<any>(`/api/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Customers API
export const customersApi = {
  getAll: () => apiRequest<any[]>('/api/customers'),
  create: (data: any) => apiRequest<any>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Users API
export const usersApi = {
  getAll: () => apiRequest<any[]>('/api/users'),
};

// Shift Notes API
export const shiftNotesApi = {
  getAll: () => apiRequest<any[]>('/api/shift-notes'),
  create: (data: any) => apiRequest<any>('/api/shift-notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/api/shift-notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Remark Logs API
export const remarkLogsApi = {
  getAll: (entityType?: string, entityId?: string) => {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/api/remark-logs${query}`);
  },
  create: (data: any) => apiRequest<any>('/api/remark-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

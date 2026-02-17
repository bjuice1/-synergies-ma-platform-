import axios, { AxiosInstance } from 'axios';
import { getToken, removeToken } from './auth';
import type {
  Synergy,
  LoginResponse,
  Industry,
  Function,
  Category,
  Entity,
  CreateSynergyInput,
  UpdateSynergyInput,
  SynergyFilters,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      removeToken();
    }
  },
};

// Synergies endpoints
export const synergiesApi = {
  getAll: async (filters?: SynergyFilters): Promise<Synergy[]> => {
    const params = new URLSearchParams();

    if (filters?.industry_id) params.append('industry_id', String(filters.industry_id));
    if (filters?.function_id) params.append('function_id', String(filters.function_id));
    if (filters?.category_id) params.append('category_id', String(filters.category_id));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const url = queryString ? `/synergies?${queryString}` : '/synergies';

    const response = await api.get<Synergy[]>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Synergy> => {
    const response = await api.get<Synergy>(`/synergies/${id}`);
    return response.data;
  },

  create: async (data: CreateSynergyInput): Promise<Synergy> => {
    const response = await api.post<Synergy>('/synergies', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateSynergyInput>): Promise<Synergy> => {
    const response = await api.put<Synergy>(`/synergies/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/synergies/${id}`);
  },
};

// Industries endpoints
export const industriesApi = {
  getAll: async (): Promise<Industry[]> => {
    const response = await api.get<Industry[]>('/industries');
    return response.data;
  },

  getById: async (id: number): Promise<Industry> => {
    const response = await api.get<Industry>(`/industries/${id}`);
    return response.data;
  },
};

// Functions endpoints
export const functionsApi = {
  getAll: async (): Promise<Function[]> => {
    const response = await api.get<Function[]>('/functions');
    return response.data;
  },

  getById: async (id: number): Promise<Function> => {
    const response = await api.get<Function>(`/functions/${id}`);
    return response.data;
  },
};

// Categories endpoints
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },
};

// Entities endpoints
export const entitiesApi = {
  getAll: async (): Promise<Entity[]> => {
    const response = await api.get<Entity[]>('/entities');
    return response.data;
  },

  getById: async (id: number): Promise<Entity> => {
    const response = await api.get<Entity>(`/entities/${id}`);
    return response.data;
  },
};

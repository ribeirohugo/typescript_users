import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export const TOKEN_KEY = 'example_token';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

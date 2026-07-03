import { apiClient } from '@/lib/api';
import type { AuthTokens, LoginRequest, RegisterRequest, User } from '@/types';

export const authApi = {
  login: async (body: LoginRequest): Promise<AuthTokens> => {
    const { data } = await apiClient.post('/auth/login', body);
    return data;
  },

  register: async (body: RegisterRequest): Promise<User> => {
    const { data } = await apiClient.post('/auth/register', body);
    return data;
  },

  profile: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/profile');
    return data;
  },

  updateProfile: async (body: {
    name?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
  }): Promise<User> => {
    const { data } = await apiClient.patch('/auth/profile', body);
    return data;
  },
};

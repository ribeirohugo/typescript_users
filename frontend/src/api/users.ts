import { apiClient } from '@/lib/api';
import type { User } from '@/types';

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  create: async (body: CreateUserRequest): Promise<User> => {
    const { data } = await apiClient.post('/users', body);
    return data;
  },

  update: async (id: string, body: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}`, body);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

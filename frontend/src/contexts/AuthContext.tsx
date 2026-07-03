import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { TOKEN_KEY } from '@/lib/api';
import type { User } from '@/types';
import { AuthContext } from './auth-context';

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    authApi
      .profile()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const u = await authApi.profile();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authApi.profile();
    setUser(u);
  }, []);

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}

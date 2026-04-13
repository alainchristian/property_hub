import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../api/axios';

export interface AuthUser {
  id: string;
  email: string;
  role: 'owner' | 'manager' | 'tenant' | 'vendor' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AuthUser['role'];
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

function storeSession(data: { user: AuthUser; accessToken: string; refreshToken: string }) {
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth/login', { email, password });
    storeSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterData): Promise<AuthUser> => {
    const { data } = await api.post('/auth/register', payload);
    storeSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => {});
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

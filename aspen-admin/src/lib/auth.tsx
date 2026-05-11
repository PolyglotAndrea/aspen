/**
 * Admin Authentication Context
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { adminAuthApi } from './api';

interface Admin {
  id: string;
  username: string;
  displayName: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<Admin>;
  logout: () => void;
}

export function getDefaultRedirect(role: string): string {
  return role === 'super_admin' ? '/super/overview' : '/';
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      adminAuthApi.me()
        .then((data) => {
          setAdmin(data.admin);
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await adminAuthApi.login({ username, password });
    localStorage.setItem('admin_token', data.token);
    setToken(data.token);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdmin(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      admin,
      token,
      isAuthenticated: !!token && !!admin,
      isSuperAdmin: admin?.role === 'super_admin',
      loading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

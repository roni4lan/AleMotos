// ============================================
// Ale Motos — Auth Context
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api';

interface User {
  userId: string;
  email: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then((profile) => {
          setUser(profile);
        })
        .catch(() => {
          api.clearToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await api.login(email, password);
      api.setToken(result.token);
      const profile = await api.getProfile();
      setUser(profile);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

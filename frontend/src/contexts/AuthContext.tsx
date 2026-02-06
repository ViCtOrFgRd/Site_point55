'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      // Priorizar localStorage (mais rápido e confiável)
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          setUser(cachedUser);
          setLoading(false);
          return; // Retornar imediatamente sem chamar API
        } catch (e) {
          console.error('Erro ao parsear user do localStorage:', e);
        }
      }
      
      // Fallback: tentar carregar da API apenas se não houver cache
      if (token) {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const response = await Promise.race([
          authService.getProfile(),
          timeoutPromise
        ]) as any;
        
        if (response.success && response.data) {
          setUser(response.data);
          // Salvar no localStorage para próximas vezes
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    const response = await authService.login(email, senha);
    if (response.success && response.data) {
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
    } else {
      throw new Error(response.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    if (response.success && response.data) {
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
    } else {
      throw new Error(response.message || 'Erro ao fazer registro');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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
  updateUser: (nextUser: User) => void;
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

      if (!token) {
        if (userStr) {
          localStorage.removeItem('user');
        }
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Priorizar localStorage (mais rápido e confiável)
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          setUser(cachedUser);

          // Se o cache já possui campos essenciais, evita chamada extra
          if (cachedUser?.cpf) {
            setLoading(false);
            return;
          }

          // Cache legado sem CPF: complementar dados via perfil
          try {
            const response = await authService.getProfile();
            if (response.success && response.data) {
              setUser(response.data as User);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          } catch (profileError) {
            console.error('Erro ao complementar perfil a partir do cache:', profileError);
          }

          setLoading(false);
          return;
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
      const authData: any = response.data;
      const { token, usuario } = authData;
      localStorage.setItem('token', token);

      // Garante dados completos (ex.: CPF) já na primeira renderização pós-login
      let usuarioCompleto = usuario;
      if (!usuario?.cpf) {
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            usuarioCompleto = profileResponse.data;
          }
        } catch (profileError) {
          console.error('Erro ao carregar perfil completo após login:', profileError);
        }
      }

      localStorage.setItem('user', JSON.stringify(usuarioCompleto));
      setUser(usuarioCompleto);
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
      const authData: any = response.data;
      const { token, usuario } = authData;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
    } else {
      throw new Error(response.message || 'Erro ao fazer registro');
    }
  };

  const updateUser = (nextUser: User) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
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

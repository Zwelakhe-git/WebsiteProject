// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { UserInterface } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Проверка токена при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user as UserInterface);
      
      return user;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка входа. Проверьте email и пароль.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role: 'organizer' | 'participant') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        role,
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка регистрации. Попробуйте снова.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedData: Partial<UserInterface>) => {
    if (user) {
      setUser({ ...user, ...updatedData });
    }
  };

  return {
    user,
    setUser,
    login,
    register,
    logout,
    updateUser,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!user,
  };
};
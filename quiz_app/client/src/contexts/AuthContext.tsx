// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { UserInterface } from '@/types';
import { SocketClient } from '@/lib/socket';

interface AuthContextType {
  user: UserInterface | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<UserInterface>;
  register: (username: string, email: string, password: string, role: 'organizer' | 'participant') => Promise<UserInterface>;
  logout: () => void;
  updateUser: (data: Partial<UserInterface>) => void;
  socketClient: SocketClient | null;
  connectSocket: (roomCode: string, userId: string, username: string, role?: "organizer" | "participant") => void;
  disconnectSocket: () => void;
  isSocketConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Убираем useNavigate() отсюда!
  const [user, setUser] = useState<UserInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  // Храним SocketClient как ref, чтобы он не пересоздавался
  const socketClientRef = useRef<SocketClient | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  // Инициализация SocketClient один раз
  useEffect(() => {
    if (!socketClientRef.current) {
      console.log('🔄 Initializing SocketClient...');
      socketClientRef.current = new SocketClient();
    }

    return () => {
      // Отключаем сокет при размонтировании
      if (socketClientRef.current) {
        console.log('🧹 Cleaning up SocketClient...');
        socketClientRef.current.disconnect();
        socketClientRef.current = null;
      }
    };
  }, []);

  // Проверка токена при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...');
      const token = localStorage.getItem('token');
      console.log('🔐 Token exists:', !!token);
      
      if (token) {
        try {
          console.log('🔐 Validating token...');
          const response = await api.get('/auth/me');
          console.log('🔐 User data received:', response.data.user);
          setUser(response.data.user);
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsInitialized(true);
      console.log('🔐 Auth initialized');
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔑 Login attempt:', email);
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      console.log('🔑 Login success, user:', user);
      
      localStorage.setItem('token', token);
      setUser(user);
      
      console.log('🔑 User state updated');
      return user;
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const message = err.response?.data?.error || 'Ошибка входа. Проверьте email и пароль.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role: 'organizer' | 'participant') => {
    console.log('📝 Register attempt:', username, email);
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
      
      console.log('📝 Register success, user:', user);
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return user;
    } catch (err: any) {
      console.error('❌ Register error:', err);
      const message = err.response?.data?.error || 'Ошибка регистрации. Попробуйте снова.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // logout БЕЗ navigate
  const logout = () => {
    console.log('🚪 Logout');
    // Отключаем сокет при выходе
    if (socketClientRef.current) {
      socketClientRef.current.disconnect();
      setIsSocketConnected(false);
      currentRoomRef.current = null;
    }
    localStorage.removeItem('token');
    setUser(null);
    // navigate вызывается в компоненте
  };

  const updateUser = (updatedData: Partial<UserInterface>) => {
    if (user) {
      console.log('🔄 Updating user:', updatedData);
      setUser({ ...user, ...updatedData });
    }
  };

  const connectSocket = (roomCode: string, userId: string, username: string, role?: "organizer" | "participant") => {
    if (!socketClientRef.current) {
      console.error('❌ SocketClient not initialized');
      return;
    }

    // Если уже подключены к этой комнате, не переподключаемся
    if (currentRoomRef.current === roomCode && socketClientRef.current.connected()) {
      console.log(`ℹ️ Already connected to room ${roomCode}`);
      return;
    }

    // Если подключены к другой комнате, отключаемся
    if (socketClientRef.current.connected()) {
      console.log(`🔄 Disconnecting from current room: ${currentRoomRef.current}`);
      socketClientRef.current.disconnect();
      setIsSocketConnected(false);
    }

    console.log(`🔌 Connecting to room ${roomCode}...`);
    const socket = socketClientRef.current.connect(roomCode, userId, username, role || 'participant');
    
    // Сохраняем текущую комнату
    currentRoomRef.current = roomCode;
    setIsSocketConnected(true);

    // Добавляем обработчик отключения
    socket?.on('disconnect', () => {
      console.log(`🔌 Socket disconnected from room ${roomCode}`);
      setIsSocketConnected(false);
    });

    socket?.on('connect', () => {
      console.log(`✅ Socket connected to room ${roomCode}`);
      setIsSocketConnected(true);
    });

    // Обработчик ошибок
    socket?.on('error', (data: { message: string }) => {
      console.error('❌ Socket error:', data.message);
    });
  };

  const disconnectSocket = () => {
    if (socketClientRef.current) {
      console.log('🔌 Disconnecting socket...');
      socketClientRef.current.disconnect();
      setIsSocketConnected(false);
      currentRoomRef.current = null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      isInitialized,
      login,
      register,
      logout,
      updateUser,
      socketClient: socketClientRef.current,
      connectSocket,
      disconnectSocket,
      isSocketConnected,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
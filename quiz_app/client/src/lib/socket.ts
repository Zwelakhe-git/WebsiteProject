// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

export class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private _isConnected = false;
  private currentRoomCode: string | null = null;

  connect(roomCode: string, userId: string, username: string, role?: 'organizer' | 'participant') {
    console.log(`🔌 SocketClient.connect: room=${roomCode}, user=${username}`);
    
    // Если уже подключены и сокет активен, не пересоздаем
    if (this.socket?.connected && this.currentRoomCode === roomCode) {
      console.log('ℹ️ Already connected to this room');
      return this.socket;
    }

    // Если есть старое соединение, отключаем
    if (this.socket) {
      console.log('🔄 Disconnecting old socket...');
      this.disconnect();
    }

    this.currentRoomCode = roomCode;
    
    console.log(`🔄 Creating new socket connection to ${WS_URL}...`);
    this.socket = io(WS_URL, {
      query: { 
        roomCode, 
        userId, 
        username, 
        role: role || 'participant' 
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this._isConnected = true;
      // Автоматически присоединяемся к комнате
      this.emit('join-room', { roomCode, userId, username });
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`🔌 WebSocket disconnected: ${reason}`);
      this._isConnected = false;
      if (reason === 'io server disconnect') {
        // Сервер разорвал соединение, пробуем переподключиться
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this._isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this._isConnected = true;
      // Повторно присоединяемся к комнате
      if (this.currentRoomCode) {
        this.emit('join-room', { 
          roomCode: this.currentRoomCode, 
          userId, 
          username 
        });
      }
    });

    // Передаем все события в слушатели
    this.socket.onAny((event, ...args) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => callback(...args));
      }
    });

    return this.socket;
  }

  disconnect() {
    console.log('🔌 SocketClient.disconnect()');
    if (this.socket) {
      // Отправляем leave-room перед отключением
      if (this.currentRoomCode && this._isConnected) {
        this.emit('leave-room', { roomCode: this.currentRoomCode });
      }
      this.socket.disconnect();
      this.socket = null;
      this._isConnected = false;
      this.currentRoomCode = null;
    }
    // Очищаем слушатели
    this.listeners.clear();
  }

  emit(event: string, data: any) {
    if (this.socket && this._isConnected) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}, socket not connected`);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    console.log(`📋 Listener added for event: ${event}`);
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
    }
  }

  removeAllListeners() {
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this._isConnected && this.socket?.connected || false;
  }

  connected(): boolean {
    return this.isConnected();
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getCurrentRoom(): string | null {
    return this.currentRoomCode;
  }
}
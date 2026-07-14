// src/pages/game/WaitingRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import { 
  Users, 
  Copy, 
  LogOut,
  Loader2,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Crown,
  UserPlus,
  Trophy,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface Participant {
  userId: string;
  username: string;
  isReady: boolean;
}

interface WaitingRoomState {
  roomCode: string;
  quizTitle: string;
  quizId: string;
  organizer: string;
  organizerId: string;
  participants: Participant[];
  isStarted: boolean;
  readyCount: number;
  totalParticipants: number;
}

export const WaitingRoom = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, connectSocket, disconnectSocket, isSocketConnected, socketClient } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<WaitingRoomState>({
    roomCode: roomCode || '',
    quizTitle: location.state?.quizTitle || 'Квиз',
    quizId: location.state?.quizId || '',
    organizer: location.state?.organizer || 'Организатор',
    organizerId: location.state?.organizerId || '',
    participants: [],
    isStarted: false,
    readyCount: 0,
    totalParticipants: 0,
  });
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Проверяем, является ли пользователь организатором
  useEffect(() => {
    if (user && state.organizerId) {
      setIsOrganizer(user.id === state.organizerId);
      console.log('👑 Is organizer:', user.id === state.organizerId);
    }
  }, [user, state.organizerId]);

  // Подключение к WebSocket
  useEffect(() => {
    if (!roomCode || !user) {
      console.log('❌ No roomCode or user, redirecting to join');
      navigate('/join-quiz');
      return;
    }

    console.log('🔄 Connecting to WebSocket...', { roomCode, userId: user.id });

    connectSocket(roomCode, user.id, user.username, 'participant');
    setIsConnecting(!isSocketConnected);

    // Проверяем, является ли пользователь организатором
    setIsOrganizer(user.id === state.organizerId);

    // Настраиваем слушатели событий
    const socket = socketClient?.getSocket();
    if (!socket) return;

    // Обработчики событий
    const onConnect = () => {
      console.log('✅ WaitingRoom: Socket connected!');
      setIsConnecting(false);
      setConnectionError(null);
    };

    const onConnectError = (error: Error) => {
      console.error('❌ WaitingRoom: Socket connection error:', error);
      setConnectionError(`Ошибка подключения: ${error.message}`);
      setIsConnecting(false);
    };

    const onParticipantsUpdate = (data: { participants: Participant[] }) => {
      console.log('👥 WaitingRoom: Participants update:', data);
      setState(prev => ({
        ...prev,
        participants: data.participants || [],
        totalParticipants: data.participants?.length || 0,
        readyCount: data.participants?.filter(p => p.isReady).length || 0,
      }));
    };

    const onPlayerReadyUpdate = (data: { 
      userId: string; 
      isReady: boolean; 
      readyCount: number;
      totalParticipants: number;
    }) => {
      console.log('🔄 WaitingRoom: Player ready update:', data);
      
      setState(prev => ({
        ...prev,
        participants: prev.participants.map(p => 
          p.userId === data.userId 
            ? { ...p, isReady: data.isReady }
            : p
        ),
        readyCount: data.readyCount,
        totalParticipants: data.totalParticipants,
      }));

      if (data.userId === user?.id) {
        setIsReady(data.isReady);
      }
    };

    const onCountdown = (data: { seconds: number }) => {
      console.log('⏱️ WaitingRoom: Countdown:', data.seconds);
      setCountdown(data.seconds);
    };

    const onQuizStarted = () => {
      console.log('🚀 WaitingRoom: Quiz started!');
      setState(prev => ({ ...prev, isStarted: true }));
      
      // Используем replace, чтобы нельзя было вернуться назад
      navigate(`/game/${roomCode}/play`, { replace: true });
    };

    const onError = (data: { message: string }) => {
      console.error('❌ WaitingRoom: Socket error:', data);
      setConnectionError(data.message);
    };

    // Регистрируем обработчики
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('participants-update', onParticipantsUpdate);
    socket.on('player-ready-update', onPlayerReadyUpdate);
    socket.on('countdown', onCountdown);
    socket.on('quiz-started', onQuizStarted);
    socket.on('error', onError);

    // Cleanup
    return () => {
      console.log('🧹 WaitingRoom: Cleaning up event listeners...');
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('participants-update', onParticipantsUpdate);
      socket.off('player-ready-update', onPlayerReadyUpdate);
      socket.off('countdown', onCountdown);
      socket.off('quiz-started', onQuizStarted);
      socket.off('error', onError);
      
      // НЕ отключаем сокет, так как он может понадобиться на QuestionScreen
    };
  }, [roomCode, user, navigate]);

  // Переключение готовности
  const toggleReady = () => {
    if (!socketClient?.connected()) return;
    
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    console.log(`🔄 WaitingRoom: Toggling ready: ${newReadyState}`);
    socketClient.emit('player-ready', { 
      roomCode, 
      userId: user?.id,
      isReady: newReadyState,
    });
  };

  const handleLeave = () => {
    disconnectSocket();
    navigate('/participant/dashboard');
  };

  const handleReconnect = () => {
    setConnectionError(null);
    setIsConnecting(true);
    if (roomCode && user) {
      connectSocket(roomCode, user.id, user.username, 'participant');
    }
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const readyPercentage = state.totalParticipants > 0 
    ? (state.readyCount / state.totalParticipants) * 100 
    : 0;

  // Если ошибка подключения
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button onClick={handleReconnect} className="w-full">
                Попробовать снова
              </Button>
              <Button variant="outline" onClick={handleLeave} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если загрузка
  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md text-center p-8">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Подключение к комнате...</h3>
          <p className="text-gray-500 text-sm mt-2">Пожалуйста, подождите</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{state.quizTitle}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>Код комнаты:</span>
              <span className="font-mono font-bold text-purple-600">{roomCode}</span>
              <Button variant="ghost" size="sm" onClick={copyRoomCode}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={handleLeave} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  {state.isStarted ? (
                    <div className="space-y-2">
                      <div className="text-4xl mb-2">🚀</div>
                      <h3 className="text-xl font-semibold text-green-600">Квиз начался!</h3>
                      <p className="text-gray-500">Первый вопрос скоро появится</p>
                    </div>
                  ) : countdown ? (
                    <div className="space-y-2">
                      <div className="text-6xl font-bold text-purple-600 animate-pulse">
                        {countdown}
                      </div>
                      <p className="text-gray-500">Квиз начнется через...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-6xl mb-2">🎯</div>
                      <h3 className="text-xl font-semibold">
                        {state.totalParticipants > 1 
                          ? `Готовы ${state.readyCount} из ${state.totalParticipants} участников`
                          : 'Ожидание участников...'}
                      </h3>
                      
                      {/* Progress bar готовности */}
                      {state.totalParticipants > 0 && (
                        <div className="max-w-xs mx-auto">
                          <Progress value={readyPercentage} className="h-2" />
                          <p className="text-sm text-gray-500 mt-1">
                            {Math.round(readyPercentage)}% готовы
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-center gap-3">
                        <Button
                          className={`${
                            isReady
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                          onClick={toggleReady}
                          disabled={state.totalParticipants < 1}
                        >
                          {isReady ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Готов!
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Я готов
                            </>
                          )}
                        </Button>
                      </div>

                      {state.totalParticipants < 2 && (
                        <p className="text-sm text-yellow-600">
                          ⚠️ Нужно минимум 2 участника для начала игры
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{state.totalParticipants}</p>
                  <p className="text-sm text-gray-500">Участников</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Crown className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium truncate">{state.organizer}</p>
                  <p className="text-sm text-gray-500">Организатор</p>
                  {isOrganizer && (
                    <Badge className="mt-1 bg-purple-600 text-white text-xs">
                      Это вы
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Participants List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Участники</span>
                <Badge variant="secondary">{state.totalParticipants}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {state.participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                        {getInitials(participant.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {participant.username}
                        {participant.userId === user?.id && (
                          <span className="text-xs text-gray-400 ml-1">(Вы)</span>
                        )}
                      </p>
                    </div>
                    {participant.isReady ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-gray-400">⏳</span>
                    )}
                  </div>
                ))}
                {state.participants.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Ожидание участников</p>
                    <p>Поделитесь кодом комнаты</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
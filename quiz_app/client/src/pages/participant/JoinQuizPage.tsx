// src/pages/participant/JoinQuizPage.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Award,
  AlertCircle,
  CheckCircle,
  Sparkles,
  QrCode,
  Copy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface RoomInfo {
  quizId: string;
  title: string;
  description: string;
  organizer: string;
  participantsCount: number;
  status: string;
  startTime?: string;
}

export const JoinQuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [roomCode, setRoomCode] = useState(searchParams.get('room') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const handleCheckRoom = async () => {
    if (!roomCode.trim()) {
      setError('Введите код комнаты');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoomInfo(null);

    try {
      const response = await api.post('/room/check', { 
        roomCode: roomCode.trim().toUpperCase() 
      });
      
      if (response.data.success) {
        // Получаем полную информацию о комнате
        const infoResponse = await api.get(`/room/${roomCode.trim().toUpperCase()}`);
        setRoomInfo(infoResponse.data.room);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Комната не найдена');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    console.log("joining quiz");
    if (!roomInfo || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Подключаемся к комнате через WebSocket (будет установлено при переходе)
      setIsJoined(true);
      console.log("joining quiz...");
      // Переходим в комнату ожидания
      navigate(`/game/${roomCode.trim().toUpperCase()}/waiting`, {
        state: { 
          quizId: roomInfo.quizId,
          roomCode: roomCode.trim().toUpperCase(),
          quizTitle: roomInfo.title,
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckRoom();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
    if (roomInfo) setRoomInfo(null);
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Присоединиться к квизу</CardTitle>
            <p className="text-gray-500 text-sm">
              Введите код комнаты, чтобы начать
            </p>
          </CardHeader>
          <CardContent>
            {!roomInfo ? (
              // Форма ввода кода
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomCode">Код комнаты</Label>
                  <div className="flex gap-2">
                    <Input
                      id="roomCode"
                      placeholder="Например: ABC123"
                      value={roomCode}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="text-center text-2xl font-mono uppercase tracking-widest"
                      maxLength={6}
                      autoFocus
                    />
                    <Button
                      onClick={handleCheckRoom}
                      disabled={isLoading || roomCode.length < 3}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? '...' : 'Проверить'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Введите 6-значный код, полученный от организатора
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">или</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Здесь можно добавить сканирование QR-кода
                    // или вставку из буфера обмена
                  }}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Сканировать QR-код
                </Button>
              </div>
            ) : (
              // Информация о комнате
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Комната найдена! Вы можете присоединиться.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-purple-600">
                      {roomInfo.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {roomInfo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Участников</p>
                      <p className="font-bold">{roomInfo.participantsCount}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <Award className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Организатор</p>
                      <p className="font-bold text-sm truncate">{roomInfo.organizer}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {roomInfo.status === 'active' 
                        ? 'Квиз активен, вы можете присоединиться' 
                        : 'Ожидание начала...'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleJoinRoom}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Подключение...'
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Присоединиться
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-gray-500"
                    onClick={() => {
                      setRoomInfo(null);
                      setRoomCode('');
                      setError(null);
                    }}
                  >
                    Ввести другой код
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>💡 Код комнаты можно скопировать у организатора</p>
          <p className="mt-1">Код состоит из 6 букв и цифр</p>
        </div>
      </div>
    </div>
  );
};
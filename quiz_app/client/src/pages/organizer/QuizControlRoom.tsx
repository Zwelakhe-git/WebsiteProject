// src/pages/organizer/QuizControlRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import {
  Play,
  Pause,
  Users,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BarChart3,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  UserCheck,
  Timer,
  Trophy,
  Share2,
  QrCode,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Participant {
  id: string;
  username: string;
  score: number;
  hasAnswered: boolean;
  answerTime?: number;
}

interface Question {
  id: string;
  type: 'text' | 'image' | 'single_choice' | 'multiple_choice';
  questionText: string;
  imageUrl?: string;
  options: { text: string; isCorrect: boolean }[];
  points: number;
  order: number;
  correctAnswer?: string;
}

interface QuizStats {
  totalParticipants: number;
  answeredCount: number;
  correctCount: number;
  averageScore: number;
}

export const QuizControlRoom = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [stats, setStats] = useState<QuizStats>({
    totalParticipants: 0,
    answeredCount: 0,
    correctCount: 0,
    averageScore: 0,
  });
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLimit = 30; // из настроек квиза

  // Подключение к WebSocket
  useEffect(() => {
    if (!roomCode) {
      navigate('/organizer/dashboard');
      return;
    }

    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      query: { roomCode, role: 'organizer', userId: user?.id },
    });

    setSocket(newSocket);

    // Загрузка данных квиза
    loadQuizData();

    return () => {
      newSocket.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode]);

  // WebSocket обработчики
  useEffect(() => {
    if (!socket) return;

    socket.on('participants-update', (data: { participants: string[] }) => {
      // Обновляем список участников
      setParticipants(prev => {
        const currentIds = new Set(prev.map(p => p.id));
        const newParticipants = data.participants
          .filter(id => !currentIds.has(id))
          .map(id => ({
            id,
            username: `Участник ${id.slice(0, 6)}`,
            score: 0,
            hasAnswered: false,
          }));
        return [...prev, ...newParticipants];
      });
    });

    socket.on('participant-joined', (data: { userId: string; username: string }) => {
      setParticipants(prev => [
        ...prev,
        {
          id: data.userId,
          username: data.username,
          score: 0,
          hasAnswered: false,
        },
      ]);
      updateStats();
    });

    socket.on('participant-left', (data: { userId: string }) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      updateStats();
    });

    socket.on('answer-received', (data: { 
      userId: string; 
      isCorrect: boolean; 
      points: number;
    }) => {
      setParticipants(prev => 
        prev.map(p => 
          p.id === data.userId 
            ? { 
                ...p, 
                score: p.score + (data.isCorrect ? data.points : 0),
                hasAnswered: true,
              }
            : p
        )
      );
      updateStats();
    });

    socket.on('quiz-ended', () => {
      setShowResults(true);
      setIsQuizActive(false);
      setIsQuestionActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      socket.off('participants-update');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('answer-received');
      socket.off('quiz-ended');
    };
  }, [socket]);

  const loadQuizData = async () => {
    try {
      const response = await api.get(`/quiz/${quizId}`);
      const quiz = response.data.quiz;
      setQuizTitle(quiz.title);
      setQuestions(quiz.questions || []);
      
      // Подсчет участников
      if (quiz.participants) {
        //console.log(quiz.participants);
        setParticipants(quiz.participants.map((p: any) => ({
          id: p._id,
          username: p.username,
          score: 0,
          hasAnswered: false,
        })));
      }
      
      setIsQuizActive(quiz.status === 'active');
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const updateStats = () => {
    const total = participants.length;
    const answered = participants.filter(p => p.hasAnswered).length;
    const correct = participants.filter(p => p.score > 0).length;
    const avgScore = total > 0 
      ? participants.reduce((sum, p) => sum + p.score, 0) / total 
      : 0;

    setStats({
      totalParticipants: total,
      answeredCount: answered,
      correctCount: correct,
      averageScore: avgScore,
    });
  };

  const startTimer = (duration: number) => {
    setTimer(duration);
    setIsTimerRunning(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimerRunning(false);
          // Автоматически завершаем вопрос
          if (isQuestionActive) {
            endCurrentQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startQuiz = () => {
    if (!socket || questions.length === 0) return;
    
    setIsQuizActive(true);
    setCurrentQuestionIndex(-1);
    setShowResults(false);
    
    // Обновляем статус квиза
    api.post(`/room/start/${quizId}`).catch(console.error);
  };

  const startQuestion = (index: number) => {
    if (!socket || index >= questions.length) return;

    setCurrentQuestionIndex(index);
    setIsQuestionActive(true);
    setShowResults(false);
    
    // Сброс статуса ответа у участников
    setParticipants(prev => prev.map(p => ({ ...p, hasAnswered: false })));
    
    // Отправляем вопрос через WebSocket
    socket.emit('start-question', {
      roomCode,
      questionIndex: index,
    });

    // Запускаем таймер
    startTimer(timeLimit);
    
    // Обновляем статистику
    updateStats();
  };

  const endCurrentQuestion = () => {
    setIsQuestionActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsTimerRunning(false);
    }
    
    // Отправляем результаты вопроса
    socket?.emit('end-question', { roomCode });
    
    // Показываем результаты через секунду
    setTimeout(() => {
      updateStats();
    }, 1000);
  };

  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      startQuestion(nextIndex);
    } else {
      // Квиз завершен
      endQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      startQuestion(currentQuestionIndex - 1);
    }
  };

  const endQuiz = () => {
    if (!socket) return;
    setIsEnding(true);
    
    console.log('🏁 Ending quiz...', { roomCode, quizId });
    
    // Отправляем событие завершения с quizId
    socket.emit('end-quiz', { roomCode, quizId });
    
    // Слушаем ответ от сервера
    socket.once('quiz-ended', (data) => {
      console.log('📊 Quiz ended with results:', data);
      // Переходим на страницу результатов с quizId
      setTimeout(() => {
        navigate(`/leaderboard/${quizId}`);
      }, 1500);
    });

    // Таймаут на случай, если ответ не пришел
    setTimeout(() => {
      if (isEnding) {
        console.log('⚠️ Timeout waiting for quiz-ended event, redirecting...');
        navigate(`/leaderboard/${quizId}`);
      }
    }, 5000);
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  const getInitials = (name: string) => {
    return name?.slice(0, 2).toUpperCase();
  };

  const getStatusColor = (hasAnswered: boolean) => {
    return hasAnswered ? 'text-green-500' : 'text-gray-400';
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const currentQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < questions.length
    ? questions[currentQuestionIndex]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/organizer/dashboard')}
              >
                ← Назад
              </Button>
              <div>
                <h1 className="text-xl font-bold">{quizTitle}</h1>
                <p className="text-sm text-gray-500">
                  {isQuizActive ? 'Квиз активен' : 'Квиз не запущен'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {roomCode && (
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-purple-600">Код комнаты:</span>
                  <span className="font-bold text-lg tracking-wider">{roomCode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRoomCode}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {!isQuizActive && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={startQuiz}
                  disabled={questions.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Запустить квиз
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Status */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold">{participants.length}</span>
                      <span className="text-sm text-gray-500">участников</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">{stats.answeredCount}</span>
                      <span className="text-sm text-gray-500">ответили</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">{Math.round(stats.averageScore)}</span>
                      <span className="text-sm text-gray-500">средний балл</span>
                    </div>
                  </div>
                  
                  {isQuestionActive && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-xl text-orange-500">{timer}</span>
                        <span className="text-sm text-gray-500">сек</span>
                      </div>
                      <Progress value={(timer / timeLimit) * 100} className="w-32" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {isQuizActive && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length
                        ? `Вопрос ${currentQuestionIndex + 1} из ${questions.length}`
                        : 'Ожидание начала'}
                    </CardTitle>
                    {isQuestionActive && (
                      <Badge className="bg-green-100 text-green-700">
                        Активен
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {currentQuestion ? (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {currentQuestion.points} баллов
                          </Badge>
                          <Badge variant="outline">
                            {currentQuestion.type === 'text' && 'Текстовый ответ'}
                            {currentQuestion.type === 'image' && 'С изображением'}
                            {currentQuestion.type === 'single_choice' && 'Одиночный выбор'}
                            {currentQuestion.type === 'multiple_choice' && 'Множественный выбор'}
                          </Badge>
                        </div>
                        <p className="text-lg font-medium">
                          {currentQuestion.questionText}
                        </p>
                        {currentQuestion.imageUrl && (
                          <div className="mt-4">
                            <img
                              src={currentQuestion.imageUrl}
                              alt="Question"
                              className="max-h-48 object-contain rounded-lg"
                            />
                          </div>
                        )}
                      </div>

                      {/* Options Preview */}
                      {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">Варианты ответов:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {currentQuestion.options.map((option, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded-lg border ${
                                  option.isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                {option.text}
                                {option.isCorrect && (
                                  <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentQuestion.type === 'text' && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">Правильный ответ:</p>
                          <p className="font-medium text-green-600">
                            {currentQuestion.correctAnswer}
                          </p>
                        </div>
                      )}

                      {/* Question Controls */}
                      <div className="flex justify-between pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={previousQuestion}
                            disabled={currentQuestionIndex === 0 || isQuestionActive}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Предыдущий
                          </Button>
                          <Button
                            variant="outline"
                            onClick={nextQuestion}
                            disabled={!isQuestionActive || currentQuestionIndex === questions.length - 1}
                          >
                            Следующий
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {isQuestionActive ? (
                            <Button
                              variant="destructive"
                              onClick={endCurrentQuestion}
                            >
                              Завершить вопрос
                            </Button>
                          ) : (
                            <Button
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => startQuestion(currentQuestionIndex)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Запустить вопрос
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Нажмите "Запустить вопрос", чтобы начать</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Not Started */}
            {!isQuizActive && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold mb-2">Квиз еще не запущен</h3>
                    <p className="text-gray-500 mb-6">
                      {questions.length > 0
                        ? `Готов к запуску! ${questions.length} вопросов загружено.`
                        : 'Добавьте вопросы в квиз перед запуском'}
                    </p>
                    {questions.length === 0 && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/organizer/quiz/${quizId}/edit`)}
                      >
                        Добавить вопросы
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* End Quiz Button */}
            {isQuizActive && (
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={endQuiz}
                  disabled={isEnding}
                >
                  {isEnding ? 'Завершение...' : 'Завершить квиз'}
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Participants */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Участники</span>
                  <Badge variant="secondary">{participants.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Нет участников</p>
                    <p className="text-sm">Поделитесь кодом комнаты</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {participants
                      .sort((a, b) => b.score - a.score)
                      .map((participant, index) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium text-gray-400 w-6">
                            #{index + 1}
                          </span>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                              {getInitials(participant.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">
                              {participant.username}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {participant.hasAnswered && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            <Badge variant="outline" className="font-mono">
                              {participant.score}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Room Card */}
            {roomCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Поделиться комнатой</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={copyRoomCode}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Скопировать код
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        const url = `${window.location.origin}/join-quiz?room=${roomCode}`;
                        navigator.clipboard.writeText(url);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Скопировать ссылку
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
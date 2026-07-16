// src/pages/organizer/QuizControlRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import {
  Play,
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
  Timer,
  Trophy,
  Share2,
  Loader2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
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
  const { user, connectSocket, disconnectSocket, isSocketConnected, socketClient } = useAuth();
  
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
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(30);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Подключение к WebSocket через AuthContext
  useEffect(() => {
    if (!roomCode) {
      navigate('/organizer/dashboard');
      return;
    }

    if (!user) {
      console.log('❌ No user, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('🔄 QuizControlRoom: Setting up socket connection...');
    
    // Подключаемся через AuthContext
    connectSocket(roomCode, user.id, user.username, 'organizer');

    // Загрузка данных квиза
    loadQuizData();

    // Cleanup
    return () => {
      console.log('🧹 QuizControlRoom: Cleaning up...');
      if (timerRef.current) clearInterval(timerRef.current);
      // НЕ отключаем сокет, так как он может понадобиться
    };
  }, [roomCode, user]);

  // Настройка WebSocket обработчиков
  useEffect(() => {
    if (!socketClient || !isSocketConnected) {
      console.log('⏳ Waiting for socket connection...');
      return;
    }

    const socket = socketClient.getSocket();
    if (!socket) {
      console.log('❌ No socket available');
      return;
    }

    console.log('✅ QuizControlRoom: Setting up socket event listeners...');

    // Обработчики событий
    const onParticipantsUpdate = (data: { participants: any[] }) => {
      console.log('👥 QuizControlRoom: Participants update:', data);
      
      setParticipants(prev => {
        const currentIds = new Set(prev.map(p => p.id));
        const newParticipants = data.participants
          .filter(p => !currentIds.has(p.userId))
          .map(p => ({
            id: p.userId,
            username: p.username,
            score: 0,
            hasAnswered: false,
          }));
        return [...prev, ...newParticipants];
      });
      updateStats();
    };

    const onPlayerReadyUpdate = (data: { 
      userId: string; 
      isReady: boolean; 
      readyCount: number;
      totalParticipants: number;
    }) => {
      console.log('🔄 QuizControlRoom: Player ready update:', data);
    };

    const onAnswerReceived = (data: { 
      userId: string; 
      isCorrect: boolean; 
      points: number;
    }) => {
      console.log('📊 QuizControlRoom: Answer received:', data);
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
    };

    const onLeaderboardUpdate = (data: { leaderboard: any[] }) => {
      console.log('🏆 QuizControlRoom: Leaderboard update:', data);
      setParticipants(prev => 
        prev.map(p => {
          const entry = data.leaderboard.find(l => l.userId === p.id);
          return entry ? { ...p, score: entry.score } : p;
        })
      );
      updateStats();
    };

    const onQuizEnded = (data: any) => {
      console.log('🏁 QuizControlRoom: Quiz ended:', data);
      setShowResults(true);
      setIsQuizActive(false);
      setIsQuestionActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Переход на страницу результатов
      setTimeout(() => {
        navigate(`/leaderboard/${quizId}`);
      }, 2000);
    };

    const onError = (data: { message: string }) => {
      console.error('❌ QuizControlRoom: Socket error:', data);
      setConnectionError(data.message);
    };

    // Регистрируем обработчики
    socket.on('participants-update', onParticipantsUpdate);
    socket.on('player-ready-update', onPlayerReadyUpdate);
    socket.on('answer-received', onAnswerReceived);
    socket.on('leaderboard-update', onLeaderboardUpdate);
    socket.on('quiz-ended', onQuizEnded);
    socket.on('error', onError);

    // Cleanup
    return () => {
      console.log('🧹 QuizControlRoom: Removing socket event listeners...');
      socket.off('participants-update', onParticipantsUpdate);
      socket.off('player-ready-update', onPlayerReadyUpdate);
      socket.off('answer-received', onAnswerReceived);
      socket.off('leaderboard-update', onLeaderboardUpdate);
      socket.off('quiz-ended', onQuizEnded);
      socket.off('error', onError);
    };
  }, [socketClient, isSocketConnected, quizId, navigate]);

  const loadQuizData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/quiz/${quizId}`);
      const quiz = response.data.quiz;
      setQuizTitle(quiz.title);
      setQuestions(quiz.questions || []);
      setTimeLimit(quiz.timeLimit || 30);
      
      // Подсчет участников
      if (quiz.participants) {
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
    } finally {
      setIsLoading(false);
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

  const startQuiz = async () => {
    if (!socketClient?.isConnected() || questions.length === 0) return;
    
    try {
      setIsQuizActive(true);
      setCurrentQuestionIndex(-1);
      setShowResults(false);
      
      // Обновляем статус квиза
      await api.post(`/room/start/${quizId}`);
      
      // Отправляем событие через WebSocket
      socketClient.emit('start-quiz', { roomCode });
      
      console.log('🚀 Quiz started!');
    } catch (error) {
      console.error('Error starting quiz:', error);
      setConnectionError('Не удалось запустить квиз');
    }
  };

  const startQuestion = (index: number) => {
    if (!socketClient?.isConnected() || index >= questions.length) return;

    setCurrentQuestionIndex(index);
    setIsQuestionActive(true);
    setShowResults(false);
    
    // Сброс статуса ответа у участников
    setParticipants(prev => prev.map(p => ({ ...p, hasAnswered: false })));
    
    // Отправляем вопрос через WebSocket
    socketClient.emit('start-question', {
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
    socketClient?.emit('end-question', { roomCode });
    
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
    if (!socketClient?.isConnected()) return;
    setIsEnding(true);
    
    console.log('🏁 Ending quiz...', { roomCode, quizId });
    
    // Отправляем событие завершения с quizId
    socketClient.emit('end-quiz', { roomCode, quizId });
    
    // Ждем ответа от сервера
    const socket = socketClient.getSocket();
    socket?.once('quiz-ended', (data) => {
      console.log('📊 Quiz ended with results:', data);
      setIsEnding(false);
      // Переходим на страницу результатов с quizId
      setTimeout(() => {
        navigate(`/leaderboard/${quizId}`);
      }, 1500);
    });

    // Таймаут на случай, если ответ не пришел
    setTimeout(() => {
      if (isEnding) {
        console.log('⚠️ Timeout waiting for quiz-ended event, redirecting...');
        setIsEnding(false);
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
    return name?.slice(0, 2).toUpperCase() || '??';
  };

  const currentQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < questions.length
    ? questions[currentQuestionIndex]
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка квиза...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  {isEnding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Завершение...
                    </>
                  ) : (
                    'Завершить квиз'
                  )}
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
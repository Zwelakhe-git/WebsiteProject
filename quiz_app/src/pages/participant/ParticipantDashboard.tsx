// src/pages/participant/ParticipantDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import {
  Trophy,
  Users,
  Clock,
  Award,
  Calendar,
  Gamepad2,
  LogOut,
  Settings,
  History,
  BarChart3,
  Medal,
  Sparkles,
  PlusCircle,
  User,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useAuthWithNavigate } from '@/hooks/useAuthWithNavigate';

interface QuizHistory {
  id: string;
  quizId: string,
  title: string;
  category: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  rank: number;
  totalParticipants: number;
  isCompleted: boolean;
}

interface Stats {
  totalQuizzes: number;
  totalQuestions: number;
  correctPercentage: number;
  averageScore: number;
  bestRank: number;
  totalPoints: number;
}

export const ParticipantDashboard = () => {
  const navigate = useNavigate();
  //const { user, logout } = useAuth();
  const { user, logoutAndNavigate } = useAuthWithNavigate();
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalQuizzes: 0,
    totalQuestions: 0,
    correctPercentage: 0,
    averageScore: 0,
    bestRank: 0,
    totalPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Получаем историю участия пользователя
      const response = await api.get('/participant/history');
      const data = response.data;
      
      console.log('📊 Dashboard data:', data);
      
      if (data.history && data.history.length > 0) {
        setHistory(data.history);
        
        // Используем статистику с сервера
        setStats({
          totalQuizzes: data.stats.totalQuizzes || 0,
          totalQuestions: data.history.reduce((sum: number, q: QuizHistory) => sum + q.totalQuestions, 0),
          correctPercentage: data.history.length > 0 
            ? Math.round((data.history.reduce((sum: number, q: QuizHistory) => sum + q.correctAnswers, 0) / 
                data.history.reduce((sum: number, q: QuizHistory) => sum + q.totalQuestions, 0)) * 100) 
            : 0,
          averageScore: data.stats.averageScore || 0,
          bestRank: data.stats.bestRank || 0,
          totalPoints: data.stats.totalPoints || 0,
        });
      } else {
        setHistory([]);
        setStats({
          totalQuizzes: 0,
          totalQuestions: 0,
          correctPercentage: 0,
          averageScore: 0,
          bestRank: 0,
          totalPoints: 0,
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      setError(error.response?.data?.error || 'Не удалось загрузить данные');
      
      if (error.response?.status === 404) {
        setHistory([]);
        setStats({
          totalQuizzes: 0,
          totalQuestions: 0,
          correctPercentage: 0,
          averageScore: 0,
          bestRank: 0,
          totalPoints: 0,
        });
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 900) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.slice(0, 2).toUpperCase();
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'История': '📜',
      'География': '🌍',
      'Наука': '🔬',
      'Кино': '🎬',
      'Музыка': '🎵',
      'Спорт': '⚽',
      'Литература': '📚',
      'Искусство': '🎨',
      'Технологии': '💻',
      'Разное': '📌',
    };
    return emojis[category] || '📌';
  };
  const handleLogout = () => {
    logoutAndNavigate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">😕</div>
            <h3 className="text-xl font-semibold mb-2">Ошибка загрузки</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadDashboardData} className="bg-purple-600 hover:bg-purple-700">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <span className="text-2xl font-bold text-purple-600">Quizify</span>
              </Link>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                Участник
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex justify-between items-center gap-1">
                <Link to="/">
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleLogout}>Выйти</Button>
                </Link>
                <Link to="/join-quiz">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Присоединиться
                </Button>
              </Link>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {getInitials(user?.username || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.username}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Настройки
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/participant/dashboard')}>
                    <History className="w-4 h-4 mr-2" />
                    История
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logoutAndNavigate} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Пройдено квизов</p>
                  <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Правильных ответов</p>
                  <p className="text-2xl font-bold">{stats.correctPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={stats.correctPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Средний балл</p>
                  <p className="text-2xl font-bold">{stats.averageScore}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Лучшее место</p>
                  <p className="text-2xl font-bold">
                    {stats.bestRank > 0 ? `#${stats.bestRank}` : '—'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Готовы к новому квизу?</h3>
                  <p className="text-sm text-gray-500">Покажите свои знания в реальном времени</p>
                </div>
              </div>
              <Link to="/join-quiz">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Присоединиться к квизу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <span>История участия</span>
              </div>
              <Badge variant="secondary">{history.length} квизов</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600">Нет пройденных квизов</h3>
                <p className="text-gray-400 mb-4">Присоединитесь к первому квизу!</p>
                <Link to="/join-quiz">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Присоединиться
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex flex-wrap items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">
                          {getCategoryEmoji(quiz.category)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{quiz.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {quiz.category}
                          </Badge>
                          {quiz.isCompleted ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Завершен
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                              В процессе
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(quiz.date)}
                          </span>
                          <span>
                            {quiz.correctAnswers}/{quiz.totalQuestions} правильных
                          </span>
                          {quiz.rank <= 3 && quiz.rank > 0 && (
                            <span className="flex items-center gap-1">
                              {getMedalIcon(quiz.rank)}
                              Место #{quiz.rank}
                            </span>
                          )}
                          {quiz.totalParticipants > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {quiz.totalParticipants} участников
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold text-lg ${getScoreColor(quiz.score)}`}>
                          {quiz.score}
                        </p>
                        <p className="text-xs text-gray-500">баллов</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/leaderboard/${quiz.quizId}`)}
                        title="Посмотреть результаты"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
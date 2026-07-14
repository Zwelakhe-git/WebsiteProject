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
  TrendingUp,
  Calendar,
  Star,
  Gamepad2,
  LogOut,
  Settings,
  History,
  BarChart3,
  Medal,
  Sparkles,
  ChevronRight,
  PlusCircle,
  User,
  CheckCircle
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

interface QuizHistory {
  id: string;
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
  const { user, logout } = useAuth();
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // В реальном приложении здесь будут запросы к API
      // Пока используем моковые данные
      
      // Моковая история квизов
      const mockHistory: QuizHistory[] = [
        {
          id: '1',
          title: 'Викторина по истории России',
          category: 'История',
          date: '2024-01-15T14:30:00',
          score: 850,
          totalQuestions: 10,
          correctAnswers: 8,
          rank: 2,
          totalParticipants: 25,
          isCompleted: true,
        },
        {
          id: '2',
          title: 'География мира',
          category: 'География',
          date: '2024-01-14T18:45:00',
          score: 720,
          totalQuestions: 10,
          correctAnswers: 7,
          rank: 5,
          totalParticipants: 30,
          isCompleted: true,
        },
        {
          id: '3',
          title: 'Научные факты',
          category: 'Наука',
          date: '2024-01-13T20:00:00',
          score: 950,
          totalQuestions: 10,
          correctAnswers: 9,
          rank: 1,
          totalParticipants: 20,
          isCompleted: true,
        },
        {
          id: '4',
          title: 'Кино и сериалы',
          category: 'Кино',
          date: '2024-01-12T16:20:00',
          score: 680,
          totalQuestions: 10,
          correctAnswers: 6,
          rank: 8,
          totalParticipants: 35,
          isCompleted: true,
        },
        {
          id: '5',
          title: 'Музыкальная викторина',
          category: 'Музыка',
          date: '2024-01-11T19:30:00',
          score: 790,
          totalQuestions: 10,
          correctAnswers: 8,
          rank: 3,
          totalParticipants: 22,
          isCompleted: true,
        },
      ];

      setHistory(mockHistory);

      // Подсчет статистики
      const totalQuizzes = mockHistory.length;
      const totalQuestions = mockHistory.reduce((sum, q) => sum + q.totalQuestions, 0);
      const totalCorrect = mockHistory.reduce((sum, q) => sum + q.correctAnswers, 0);
      const totalPoints = mockHistory.reduce((sum, q) => sum + q.score, 0);
      const bestRank = Math.min(...mockHistory.map(q => q.rank));

      setStats({
        totalQuizzes,
        totalQuestions,
        correctPercentage: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        averageScore: totalQuizzes > 0 ? Math.round(totalPoints / totalQuizzes) : 0,
        bestRank,
        totalPoints,
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка...</p>
        </div>
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
              <Link to="/join-quiz">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Присоединиться
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2">
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
                  <DropdownMenuItem>
                    <History className="w-4 h-4 mr-2" />
                    История
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
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
                  <p className="text-2xl font-bold">#{stats.bestRank}</p>
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
                          {quiz.category === 'История' && '📜'}
                          {quiz.category === 'География' && '🌍'}
                          {quiz.category === 'Наука' && '🔬'}
                          {quiz.category === 'Кино' && '🎬'}
                          {quiz.category === 'Музыка' && '🎵'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{quiz.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {quiz.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(quiz.date)}
                          </span>
                          <span>
                            {quiz.correctAnswers}/{quiz.totalQuestions} правильных
                          </span>
                          {quiz.rank <= 3 && (
                            <span className="flex items-center gap-1">
                              {getMedalIcon(quiz.rank)}
                              Место #{quiz.rank}
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
                        onClick={() => navigate(`/leaderboard/${quiz.id}`)}
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
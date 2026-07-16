// src/pages/organizer/OrganizerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  Plus, 
  Play, 
  Pencil, 
  Trash2, 
  Users, 
  Clock, 
  Trophy,
  MoreVertical,
  Copy,
  Eye
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthWithNavigate } from '@/hooks/useAuthWithNavigate';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'completed';
  questionsCount: number;
  participantsCount: number;
  roomCode?: string;
  createdAt: string;
}

export const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user, logoutAndNavigate } = useAuthWithNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]); // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalParticipants: 0,
  });
  const [organizerStats, setOrganizerStats] = useState({
    totalQuizzesOrganized: 0,
    totalParticipants: 0,
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/quiz/my-quizzes');
      let data = [];
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.quizzes && Array.isArray(response.data.quizzes)) {
        data = response.data.quizzes;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find an array property
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          data = possibleArrays[0];
        }
      }
      console.log("fetch quiz response: ", response);
      
      setQuizzes(data || []);
      
      // Подсчет статистики (safe access)
      const safeData = data || [];
      const active = safeData.filter((q: Quiz) => q.status === 'active').length;
      const completed = safeData.filter((q: Quiz) => q.status === 'completed').length;
      const totalParticipants = safeData.reduce((sum: number, q: Quiz) => sum + (q.participantsCount || 0), 0);
      
      setStats({
        total: safeData.length,
        active,
        completed,
        totalParticipants,
      });

      const userResponse = await api.get('/auth/me');
      setOrganizerStats({
        totalQuizzesOrganized: userResponse.data.user.totalQuizzesOrganized || 0,
        totalParticipants: totalParticipants,
      });
    } catch (error) {
      console.error('Error loading quizzes:', error);
      // Set empty state on error
      setQuizzes([]);
      setStats({
        total: 0,
        active: 0,
        completed: 0,
        totalParticipants: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот квиз?')) return;
    
    try {
      await api.delete(`/quiz/${quizId}`);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      const response = await api.post(`/room/start/${quizId}`);
      const { roomCode } = response.data;
      navigate(`/organizer/quiz/${quizId}/control?room=${roomCode}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600' },
      active: { label: 'Активен', className: 'bg-green-100 text-green-600' },
      completed: { label: 'Завершен', className: 'bg-blue-100 text-blue-600' },
    };
    const variant = variants[status as keyof typeof variants] || variants.draft;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  const handleLogout = () => {
    logoutAndNavigate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Панель организатора</h1>
              <p className="text-gray-500">Добро пожаловать, {user?.username || 'Организатор'}!</p>
            </div>
            <div className="flex justify-between items-center gap-1">
              <Link to="/">
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleLogout}>Выйти</Button>
              </Link>
              <Link to="/organizer/create-quiz/step1">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать квиз
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Всего квизов</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Активных</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">▶️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Завершено</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Всего участников</p>
                  <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-xl">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quiz List */}
      <section className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Мои квизы</span>
              <span className="text-sm font-normal text-gray-500">
                {quizzes?.length || 0} квизов
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">У вас пока нет квизов</h3>
                <p className="text-gray-500 mb-4">Создайте свой первый квиз!</p>
                <Link to="/organizer/create-quiz/step1">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Создать квиз
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                        {getStatusBadge(quiz.status)}
                        {quiz.roomCode && quiz.status === 'active' && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            Код: {quiz.roomCode}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{quiz.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">📚</span>
                          {quiz.questionsCount || 0} вопросов
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">👥</span>
                          {quiz.participantsCount || 0} участников
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">📅</span>
                          {formatDate(quiz.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">🏷️</span>
                          {quiz.category || 'Без категории'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {quiz.status === 'draft' && (
                        <>
                          <Link to={`/organizer/quiz/${quiz.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStartQuiz(quiz.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Запустить
                          </Button>
                        </>
                      )}
                      {quiz.status === 'active' && (
                        <Link to={`/organizer/quiz/${quiz.id}/control?room=${quiz.roomCode}`}>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Eye className="w-4 h-4 mr-1" />
                            Управлять
                          </Button>
                        </Link>
                      )}
                      {quiz.status === 'completed' && (
                        <Link to={`/leaderboard/${quiz.id}`}>
                          <Button size="sm" variant="outline">
                            <Trophy className="w-4 h-4 mr-1" />
                            Результаты
                          </Button>
                        </Link>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="sm">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {quiz.roomCode && (
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(quiz.roomCode || '');
                            }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Скопировать код комнаты
                            </DropdownMenuItem>
                          )}
                          {quiz.status !== 'active' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(quiz.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
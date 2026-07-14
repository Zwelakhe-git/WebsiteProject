// src/pages/game/FinalScreen.tsx - полное обновление

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  PartyPopper,
  Home,
  RefreshCw,
  Share2,
  BarChart3,
  Users,
  Clock,
  Award,
  Crown,
} from 'lucide-react';
import { api, quizApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, Result } from '@/types';

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  answersCount: number;
  timeTaken?: number;
  isCurrentUser?: boolean;
}

interface QuizResult {
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  totalParticipants: number;
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  userScore?: number;
  isOrganizer: boolean;
}

export const FinalScreen = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      loadResults();
    } else {
      setError('ID квиза не найден');
      setIsLoading(false);
    }
  }, [quizId]);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Получаем информацию о квизе
      console.log('📊 Loading quiz data for ID:', quizId);
      const quizResponse = await quizApi.getQuiz(`${quizId}`);
      const quiz = quizResponse.data.quiz;
      
      console.log('📊 Quiz data:', quiz);

      // 2. Получаем результаты
      const resultsResponse = await api.get(`/quiz/${quizId}/results`);
      const results = resultsResponse.data.results;
      
      console.log('📊 Results:', results);

      // 3. Формируем лидерборд
      let leaderboard: LeaderboardEntry[] = [];
      
      if (results && results.length > 0) {
        leaderboard = results.map((r: any) => ({
          userId: r.userId?._id || r.userId,
          username: r.userId?.username || 'Неизвестный',
          score: r.score || 0,
          answersCount: r.answers?.length || 0,
          timeTaken: r.timeTaken || 0,
          isCurrentUser: (r.userId?._id === user?.id || r.userId === user?.id),
        }));
        
        // Сортируем по убыванию баллов
        leaderboard.sort((a, b) => b.score - a.score);
      }

      // Находим текущего пользователя
      const userIndex = leaderboard.findIndex(entry => entry.isCurrentUser);
      const userRank = userIndex !== -1 ? userIndex + 1 : undefined;
      const userScore = userIndex !== -1 ? leaderboard[userIndex].score : undefined;

      // Проверяем, является ли пользователь организатором
      const isOrganizer = quiz.organizerId === user?.id || 
                         (typeof quiz.organizerId === 'object' && quiz.organizerId?._id === user?.id);

      setResult({
        quizId: quiz.id,
        quizTitle: quiz.title,
        totalQuestions: quiz.questions?.length || 0,
        totalParticipants: results?.length || 0,
        leaderboard,
        userRank,
        userScore,
        isOrganizer,
      });

      // Показываем анимацию через секунду
      setTimeout(() => setShowCelebration(true), 500);

    } catch (error: any) {
      console.error('❌ Error loading results:', error);
      setError(error.response?.data?.error || 'Не удалось загрузить результаты');
    } finally {
      setIsLoading(false);
    }
  };

  const getMedal = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1: return <Medal className="w-7 h-7 text-gray-400" />;
      case 2: return <Medal className="w-7 h-7 text-amber-600" />;
      default: return <span className="text-lg font-semibold text-gray-400 w-8 text-center">#{position + 1}</span>;
    }
  };

  const getPositionClass = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-50 border-yellow-200';
      case 1: return 'bg-gray-50 border-gray-200';
      case 2: return 'bg-amber-50 border-amber-200';
      default: return '';
    }
  };

  const handleBackToDashboard = () => {
    if (result?.isOrganizer) {
      navigate('/organizer/dashboard');
    } else {
      navigate('/participant/dashboard');
    }
  };

  const handleNewQuiz = () => {
    if (result?.isOrganizer) {
      navigate('/organizer/create-quiz/step1');
    } else {
      navigate('/join-quiz');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Загрузка результатов...</h3>
        </Card>
      </div>
    );
  }

  if (error || !result || result.leaderboard.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md text-center p-8">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold mb-2">
            {error || 'Результаты не найдены'}
          </h3>
          <p className="text-gray-500 mb-4">
            {!result?.leaderboard?.length && !error 
              ? 'Нет участников в этом квизе' 
              : 'Попробуйте вернуться позже'}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={handleBackToDashboard} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Home className="w-4 h-4 mr-2" />
              {result?.isOrganizer ? 'В панель организатора' : 'В личный кабинет'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const topThree = result.leaderboard.slice(0, 3);
  const rest = result.leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {showCelebration && (
              <div className="animate-bounce">
                <PartyPopper className="w-16 h-16 text-purple-600" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏆 {result.quizTitle}</h1>
          <p className="text-gray-500 mt-1">
            {result.totalParticipants} участников • {result.totalQuestions} вопросов
          </p>
          {result.isOrganizer && (
            <Badge className="mt-2 bg-yellow-600 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Организатор
            </Badge>
          )}
          {result.userRank && (
            <Badge className="mt-2 bg-purple-600 text-white text-lg px-4 py-1 ml-2">
              Ваше место: #{result.userRank} • {result.userScore} баллов
            </Badge>
          )}
        </div>

        {/* Top 3 */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {topThree.map((entry, index) => (
              <Card
                key={entry.userId}
                className={`text-center border-2 ${getPositionClass(index)} ${
                  entry.isCurrentUser ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-center mb-2">
                    {getMedal(index)}
                  </div>
                  <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm truncate">{entry.username}</p>
                  <p className="text-2xl font-bold text-purple-600">{entry.score}</p>
                  <p className="text-xs text-gray-500">
                    {entry.answersCount}/{result.totalQuestions} ответов
                  </p>
                  {entry.isCurrentUser && (
                    <Badge className="mt-2 bg-purple-600">Это вы!</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full Leaderboard */}
        {rest.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Полный рейтинг
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rest.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      entry.isCurrentUser ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-400 w-8 text-center">
                      #{index + 4}
                    </span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {entry.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.username}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{entry.answersCount} ответов</span>
                        {entry.timeTaken && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.timeTaken}с
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.score}</p>
                      <p className="text-xs text-gray-500">баллов</p>
                    </div>
                    {entry.isCurrentUser && (
                      <Badge className="bg-purple-600 text-white">Вы</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
          >
            <Home className="w-4 h-4 mr-2" />
            {result?.isOrganizer ? 'В панель организатора' : 'В личный кабинет'}
          </Button>
          <Button
            variant="outline"
            onClick={handleNewQuiz}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {result?.isOrganizer ? 'Создать новый квиз' : 'Новый квиз'}
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              const text = `Я прошел квиз "${result.quizTitle}" и занял ${result.userRank || 'участвовал'} место! 🎉`;
              navigator.clipboard.writeText(text);
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Поделиться
          </Button>
          {result.userRank && result.userRank <= 3 && (
            <Button className="bg-green-600 hover:bg-green-700">
              <Award className="w-4 h-4 mr-2" />
              Забрать награду
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
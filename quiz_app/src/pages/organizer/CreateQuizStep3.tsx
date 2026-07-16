// src/pages/organizer/CreateQuizStep3.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Users, 
  Tag,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useQuizCreation } from '@/hooks/useQuizCreation';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { quizApi, questionApi } from '@/lib/api';

export const CreateQuizStep3 = () => {
  const navigate = useNavigate();
  const { quizData, resetQuizData } = useQuizCreation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedQuizId, setPublishedQuizId] = useState<string | null>(null);

  const totalQuestions = quizData.questions.length;
  const totalPoints = quizData.questions.reduce((sum, q) => sum + q.points, 0);

  const handlePublish = async () => {
  setIsPublishing(true);
  setPublishError(null);

  try {
    // 1. Создаем квиз
    const quizResponse = await quizApi.create({
      title: quizData.title,
      description: quizData.description,
      category: quizData.category,
      timeLimit: quizData.timeLimit,
    });

    const quizId = quizResponse.data.quiz.id;

    // 2. Добавляем вопросы
    const questionsData = quizData.questions.map((q, index) => ({
      quizId,
      type: q.type,
      questionText: q.questionText,
      imageUrl: q.imageUrl || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      points: q.points,
      order: index,
    }));

    await questionApi.bulkAdd({
      quizId,
      questions: questionsData,
    });

    setPublishedQuizId(quizId);
    resetQuizData();

    // Переход на страницу управления
    setTimeout(() => {
      navigate(`/organizer/quiz/${quizId}/control`);
    }, 1500);

  } catch (error: any) {
    setPublishError(error.response?.data?.error || 'Ошибка при публикации квиза');
  } finally {
    setIsPublishing(false);
  }
};

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'single_choice': return '🔘';
      case 'multiple_choice': return '☑️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="h-0.5 flex-1 bg-purple-600" />
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="h-0.5 flex-1 bg-purple-600" />
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Основная информация</span>
            <span>Добавление вопросов</span>
            <span className="text-purple-600 font-semibold">Публикация</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Preview Card */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Предпросмотр квиза</CardTitle>
                <p className="text-gray-500">Проверьте все данные перед публикацией</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Основная информация */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Основная информация</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Название</p>
                      <p className="font-medium">{quizData.title || 'Без названия'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Категория</p>
                      <p className="font-medium">{quizData.category || 'Не выбрана'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Описание</p>
                      <p className="font-medium">{quizData.description || 'Без описания'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* Статистика */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Статистика</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <BookOpen className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Вопросов</p>
                      <p className="font-bold text-lg">{totalQuestions}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Время на вопрос</p>
                      <p className="font-bold text-lg">{quizData.timeLimit}с</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <Tag className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Всего баллов</p>
                      <p className="font-bold text-lg">{totalPoints}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <Users className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Макс. участников</p>
                      <p className="font-bold text-lg">100</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* Список вопросов */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Вопросы</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {quizData.questions.map((q, index) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-500 w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm">{getTypeIcon(q.type)}</span>
                        <p className="flex-1 text-sm line-clamp-1">
                          {q.questionText || 'Без текста'}
                        </p>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {q.points} баллов
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Publish */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Готов к публикации</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Вопросов</span>
                  <span className="font-semibold">{totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Категория</span>
                  <span className="font-semibold">{quizData.category || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Время на вопрос</span>
                  <span className="font-semibold">{quizData.timeLimit}с</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Всего баллов</span>
                  <span className="font-semibold text-purple-600">{totalPoints}</span>
                </div>

                {totalQuestions === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Добавьте хотя бы один вопрос
                    </AlertDescription>
                  </Alert>
                )}

                {publishError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{publishError}</AlertDescription>
                  </Alert>
                )}

                {publishedQuizId && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Квиз опубликован!</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Перенаправление в комнату управления...
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handlePublish}
                  disabled={totalQuestions === 0 || isPublishing || !!publishedQuizId}
                >
                  {isPublishing ? (
                    <>Публикация...</>
                  ) : publishedQuizId ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Опубликовано!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Опубликовать квиз
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/organizer/create-quiz/step2')}
                >
                  ← Назад
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-gray-500"
                  onClick={() => navigate('/organizer/dashboard')}
                >
                  Отмена
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
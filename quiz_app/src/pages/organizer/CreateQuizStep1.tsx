// src/pages/organizer/CreateQuizStep1.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Slider } from '@/app/components/ui/slider';
import { useQuizCreation } from '@/hooks/useQuizCreation';

const CATEGORIES = [
  'Наука',
  'История',
  'География',
  'Литература',
  'Искусство',
  'Спорт',
  'Кино',
  'Музыка',
  'Технологии',
  'Разное',
];

export const CreateQuizStep1 = () => {
  const navigate = useNavigate();
  const { quizData, updateQuizData } = useQuizCreation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: Record<string, string> = {};
    if (!quizData.title.trim()) newErrors.title = 'Название обязательно';
    if (!quizData.description.trim()) newErrors.description = 'Описание обязательно';
    if (!quizData.category) newErrors.category = 'Выберите категорию';
    if (quizData.timeLimit < 5) newErrors.timeLimit = 'Минимальное время - 5 секунд';
    if (quizData.timeLimit > 300) newErrors.timeLimit = 'Максимальное время - 300 секунд';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateQuizData({
      title: quizData.title.trim(),
      description: quizData.description.trim(),
      category: quizData.category,
      timeLimit: quizData.timeLimit,
    });

    navigate('/organizer/create-quiz/step2');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="h-0.5 flex-1 bg-purple-600" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="h-0.5 flex-1 bg-gray-200" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span className="text-purple-600 font-semibold">Основная информация</span>
            <span>Добавление вопросов</span>
            <span>Публикация</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Шаг 1: Основная информация</CardTitle>
            <p className="text-gray-500">Заполните основные данные о вашем квизе</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Название */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Название квиза <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Например: Викторина по истории"
                  value={quizData.title}
                  onChange={(e) => updateQuizData({ title: e.target.value })}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
              </div>

              {/* Описание */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Описание <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Напиши правила и информацию квиза..."
                  value={quizData.description}
                  onChange={(e) => updateQuizData({ description: e.target.value })}
                  className={errors.description ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>

              {/* Категория */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Категория <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={quizData.category}
                  onValueChange={(value) => updateQuizData({ category: value })}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>

              {/* Время на вопрос */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="timeLimit">Время на вопрос</Label>
                  <span className="text-sm font-semibold text-purple-600">
                    {quizData.timeLimit} секунд
                  </span>
                </div>
                <Slider
                  id="timeLimit"
                  min={5}
                  max={300}
                  step={5}
                  value={[quizData.timeLimit]}
                  onValueChange={(value) => updateQuizData({ timeLimit: value[0] })}
                  className={errors.timeLimit ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>5 сек</span>
                  <span>300 сек</span>
                </div>
                {errors.timeLimit && (
                  <p className="text-red-500 text-sm">{errors.timeLimit}</p>
                )}
              </div>

              {/* Кнопки навигации */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/organizer/dashboard')}
                >
                  Отмена
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Далее →
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
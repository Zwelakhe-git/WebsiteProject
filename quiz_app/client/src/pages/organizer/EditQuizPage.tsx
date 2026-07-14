// src/pages/organizer/EditQuizPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/app/components/ui/select';
import { Slider } from '@/app/components/ui/slider';
import { Badge } from '@/app/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus,
  GripVertical,
  Edit,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, Question } from '@/types';

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

const QUESTION_TYPES = [
  { value: 'text', label: 'Текстовый ответ' },
  { value: 'single_choice', label: 'Одиночный выбор' },
  { value: 'multiple_choice', label: 'Множественный выбор' },
  { value: 'image', label: 'Вопрос с изображением' },
];

export const EditQuizPage = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [quizData, setQuizData] = useState<Partial<Quiz>>({
    title: '',
    description: '',
    category: '',
    timeLimit: 30,
    questions: [],
    status: 'draft',
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'text',
    questionText: '',
    imageUrl: '',
    options: [{ text: '', isCorrect: false }],
    points: 10,
  });
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});

  // Загрузка данных квиза
  useEffect(() => {
    loadQuizData();
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/quiz/${quizId}`);
      const quiz = response.data.quiz;
      
      setQuizData({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timeLimit: quiz.timeLimit || 30,
        questions: quiz.questions || [],
        status: quiz.status,
      });
      
      console.log('📝 Quiz loaded:', quiz);
    } catch (error: any) {
      console.error('❌ Error loading quiz:', error);
      setError(error.response?.data?.error || 'Не удалось загрузить квиз');
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение квиза
  const handleSave = async () => {
    if (!quizData.title?.trim()) {
      setError('Название квиза обязательно');
      return;
    }
    if (!quizData.description?.trim()) {
      setError('Описание квиза обязательно');
      return;
    }
    if (!quizData.category) {
      setError('Выберите категорию');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      await api.put(`/quiz/${quizId}`, {
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        timeLimit: quizData.timeLimit,
      });
      
      setSuccess('Квиз успешно сохранен!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error saving quiz:', error);
      setError(error.response?.data?.error || 'Не удалось сохранить квиз');
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление квиза
  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот квиз?')) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await api.delete(`/quiz/${quizId}`);
      
      navigate('/organizer/dashboard');
    } catch (error: any) {
      console.error('❌ Error deleting quiz:', error);
      setError(error.response?.data?.error || 'Не удалось удалить квиз');
      setIsDeleting(false);
    }
  };

  // Создание/редактирование вопроса
  const openCreateDialog = () => {
    setEditingIndex(null);
    setCurrentQuestion({
      type: 'text',
      questionText: '',
      imageUrl: '',
      options: [{ text: '', isCorrect: false }],
      points: 10,
    });
    setQuestionErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setCurrentQuestion({ ...quizData.questions![index] });
    setQuestionErrors({});
    setIsDialogOpen(true);
  };

  const handleAddOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), { text: '', isCorrect: false }],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = currentQuestion.options?.filter((_, i) => i !== index) || [];
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...(currentQuestion.options || [])];
    if (field === 'text') {
      newOptions[index].text = value as string;
    } else {
      newOptions[index].isCorrect = value as boolean;
      if (currentQuestion.type === 'single_choice' && value === true) {
        newOptions.forEach((opt, i) => {
          if (i !== index) opt.isCorrect = false;
        });
      }
    }
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const handleSaveQuestion = () => {
    // Валидация
    const newErrors: Record<string, string> = {};
    if (!currentQuestion.questionText?.trim()) {
      newErrors.questionText = 'Введите текст вопроса';
    }
    
    if (currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') {
      const hasCorrect = currentQuestion.options?.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        newErrors.options = 'Выберите правильный ответ';
      }
      const hasEmpty = currentQuestion.options?.some(opt => !opt.text.trim());
      if (hasEmpty) {
        newErrors.options = 'Заполните все варианты ответов';
      }
      if ((currentQuestion.options?.length || 0) < 2) {
        newErrors.options = 'Добавьте минимум 2 варианта ответа';
      }
    }

    if (currentQuestion.type === 'text' && !currentQuestion.correctAnswer?.trim()) {
      newErrors.correctAnswer = 'Введите правильный ответ';
    }

    if (Object.keys(newErrors).length > 0) {
      setQuestionErrors(newErrors);
      return;
    }

    const questionData: Omit<Question, 'id' | 'order'> = {
      type: currentQuestion.type as Question['type'],
      questionText: currentQuestion.questionText!,
      imageUrl: currentQuestion.imageUrl || '',
      options: currentQuestion.options || [],
      correctAnswer: currentQuestion.correctAnswer || '',
      points: currentQuestion.points || 10,
      createdAt: currentQuestion.createdAt || new Date(),
      quizId: currentQuestion.quizId || ''
    };

    // В реальном приложении здесь будет API запрос
    // Пока обновляем локальное состояние
    const updatedQuestions = [...(quizData.questions || [])];
    
    if (editingIndex !== null) {
      // Обновляем существующий вопрос
      updatedQuestions[editingIndex] = {
        ...updatedQuestions[editingIndex],
        ...questionData,
      };
    } else {
      // Добавляем новый вопрос
      updatedQuestions.push({
        id: Date.now().toString(),
        ...questionData,
        order: updatedQuestions.length,
      } as any);
    }

    setQuizData({ ...quizData, questions: updatedQuestions });
    setIsDialogOpen(false);
    setEditingIndex(null);
    setCurrentQuestion({
      type: 'text',
      questionText: '',
      imageUrl: '',
      options: [{ text: '', isCorrect: false }],
      points: 10,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (!confirm('Удалить этот вопрос?')) return;
    
    const updatedQuestions = (quizData.questions || []).filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(quizData.questions || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQuizData({ ...quizData, questions: items });
  };

  const getQuestionTypeLabel = (type: string) => {
    const found = QUESTION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getQuestionPreview = (question: Question) => {
    if (question.type === 'text') return '📝 Текстовый ответ';
    if (question.type === 'image') return '🖼️ С изображением';
    if (question.type === 'single_choice') {
      return `🔘 Одиночный выбор (${question.options?.filter(o => o.isCorrect).length || 0} прав.)`;
    }
    if (question.type === 'multiple_choice') {
      return `☑️ Множественный выбор (${question.options?.filter(o => o.isCorrect).length || 0} прав.)`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center p-8">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Загрузка квиза...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/organizer/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Редактирование квиза</h1>
              <p className="text-gray-500 text-sm">
                {quizData.status === 'draft' ? 'Черновик' : 'Активный'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {quizData.status !== 'active' && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Удалить
              </Button>
            )}
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSave}
              disabled={isSaving || quizData.status === 'active'}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Основная информация */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название квиза</Label>
              <Input
                id="title"
                value={quizData.title || ''}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                disabled={quizData.status === 'active'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={quizData.description || ''}
                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                disabled={quizData.status === 'active'}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={quizData.category}
                  onValueChange={(value) => setQuizData({ ...quizData, category: value })}
                  disabled={quizData.status === 'active'}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Время на вопрос (секунд)</Label>
                <Slider
                  id="timeLimit"
                  min={5}
                  max={300}
                  step={5}
                  value={[quizData.timeLimit || 30]}
                  onValueChange={(value) => setQuizData({ ...quizData, timeLimit: value[0] })}
                  disabled={quizData.status === 'active'}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>5 сек</span>
                  <span className="font-semibold text-purple-600">{quizData.timeLimit} сек</span>
                  <span>300 сек</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Вопросы */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Вопросы
                <Badge variant="secondary" className="ml-2">
                  {quizData.questions?.length || 0}
                </Badge>
              </CardTitle>
              {quizData.status !== 'active' && (
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить вопрос
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(quizData.questions?.length || 0) === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">❓</div>
                <h3 className="text-xl font-semibold mb-2">Нет вопросов</h3>
                <p className="text-gray-500">Добавьте вопросы для вашего квиза</p>
                {quizData.status !== 'active' && (
                  <Button onClick={openCreateDialog} className="mt-4 bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить вопрос
                  </Button>
                )}
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {quizData.questions?.map((question, index) => (
                        <Draggable
                          key={question.id}
                          draggableId={question.id!}
                          index={index}
                          isDragDisabled={quizData.status === 'active'}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div {...provided.dragHandleProps} className="cursor-move text-gray-400 hover:text-gray-600">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-purple-600 border-purple-300">
                                    #{index + 1}
                                  </Badge>
                                  <Badge className="bg-purple-100 text-purple-700">
                                    {getQuestionTypeLabel(question.type)}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {getQuestionPreview(question)}
                                  </span>
                                </div>
                                <p className="font-medium mt-1 line-clamp-2">
                                  {question.questionText || 'Без текста вопроса'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  {question.points} баллов
                                </Badge>
                                {quizData.status !== 'active' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(index)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleRemoveQuestion(index)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog для создания/редактирования вопроса */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Редактировать вопрос' : 'Новый вопрос'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Тип вопроса */}
            <div className="space-y-2">
              <Label>Тип вопроса</Label>
              <Select
                value={currentQuestion.type}
                onValueChange={(value: any) => {
                  setCurrentQuestion({
                    ...currentQuestion,
                    type: value,
                    options: value === 'text' ? [] : [{ text: '', isCorrect: false }],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип вопроса" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Текст вопроса */}
            <div className="space-y-2">
              <Label htmlFor="questionText">Текст вопроса</Label>
              <Textarea
                id="questionText"
                placeholder="Введите текст вопроса..."
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  questionText: e.target.value,
                })}
                className={questionErrors.questionText ? 'border-red-500' : ''}
                rows={3}
              />
              {questionErrors.questionText && (
                <p className="text-red-500 text-sm">{questionErrors.questionText}</p>
              )}
            </div>

            {/* URL изображения */}
            {currentQuestion.type === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL изображения</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={currentQuestion.imageUrl}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    imageUrl: e.target.value,
                  })}
                />
                {currentQuestion.imageUrl && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Preview"
                      className="max-h-40 object-contain mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Варианты ответов */}
            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Варианты ответов</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Добавить вариант
                  </Button>
                </div>

                {questionErrors.options && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{questionErrors.options}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <Input
                        placeholder={`Вариант ${String.fromCharCode(65 + index)}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        className={`px-3 py-1 text-sm rounded border ${
                          option.isCorrect
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleOptionChange(index, 'isCorrect', !option.isCorrect)}
                      >
                        {currentQuestion.type === 'single_choice' ? 'Верно' : '✓'}
                      </button>
                      {currentQuestion.options && currentQuestion.options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Правильный ответ для текстового вопроса */}
            {currentQuestion.type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Правильный ответ</Label>
                <Input
                  id="correctAnswer"
                  placeholder="Введите правильный ответ..."
                  value={currentQuestion.correctAnswer}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    correctAnswer: e.target.value,
                  })}
                  className={questionErrors.correctAnswer ? 'border-red-500' : ''}
                />
                {questionErrors.correctAnswer && (
                  <p className="text-red-500 text-sm">{questionErrors.correctAnswer}</p>
                )}
              </div>
            )}

            {/* Баллы */}
            <div className="space-y-2">
              <Label htmlFor="points">Баллы за вопрос</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  points: parseInt(e.target.value) || 10,
                })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveQuestion} className="bg-purple-600 hover:bg-purple-700">
              {editingIndex !== null ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
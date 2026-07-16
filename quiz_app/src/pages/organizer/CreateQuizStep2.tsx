// src/pages/organizer/CreateQuizStep2.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit, 
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { useQuizCreation, Question } from '@/hooks/useQuizCreation';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

const QUESTION_TYPES = [
  { value: 'text', label: 'Текстовый ответ' },
  { value: 'single_choice', label: 'Одиночный выбор' },
  { value: 'multiple_choice', label: 'Множественный выбор' },
  { value: 'image', label: 'Вопрос с изображением' },
];

export const CreateQuizStep2 = () => {
  const navigate = useNavigate();
  const { quizData, addQuestion, updateQuestion, removeQuestion, reorderQuestions } = useQuizCreation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'text',
    questionText: '',
    imageUrl: '',
    options: [{ text: '', isCorrect: false }],
    points: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreateDialog = () => {
    setEditingIndex(null);
    setCurrentQuestion({
      type: 'text',
      questionText: '',
      imageUrl: '',
      options: [{ text: '', isCorrect: false }],
      points: 10,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setCurrentQuestion({ ...quizData.questions[index] });
    setErrors({});
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
      // Для одиночного выбора снимаем другие варианты
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
      currentQuestion.correctAnswer = JSON.stringify(currentQuestion.options?.filter(opt => opt.isCorrect).sort());
    }

    if (currentQuestion.type === 'text' && !currentQuestion.correctAnswer?.trim()) {
      newErrors.correctAnswer = 'Введите правильный ответ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const questionData: Omit<Question, 'id' | 'order'> = {
      type: currentQuestion.type as Question['type'],
      questionText: currentQuestion.questionText!,
      imageUrl: currentQuestion.imageUrl || '',
      options: currentQuestion.options || [],
      correctAnswer: currentQuestion.correctAnswer || '',
      points: currentQuestion.points || 10,
    };

    if (editingIndex !== null) {
      updateQuestion(editingIndex, questionData);
    } else {
      addQuestion(questionData);
    }

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderQuestions(result.source.index, result.destination.index);
  };

  const getQuestionTypeLabel = (type: string) => {
    const found = QUESTION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getQuestionPreview = (question: Question) => {
    if (question.type === 'text') {
      return `📝 Текстовый ответ`;
    }
    if (question.type === 'image') {
      return `🖼️ С изображением`;
    }
    if (question.type === 'single_choice') {
      return `🔘 Одиночный выбор (${question.options?.filter(o => o.isCorrect).length || 0} прав.)`;
    }
    if (question.type === 'multiple_choice') {
      return `☑️ Множественный выбор (${question.options?.filter(o => o.isCorrect).length || 0} прав.)`;
    }
    return '';
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
            <div className="h-0.5 flex-1 bg-gray-200" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Основная информация</span>
            <span className="text-purple-600 font-semibold">Добавление вопросов</span>
            <span>Публикация</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Шаг 2: Добавление вопросов</CardTitle>
                <p className="text-gray-500 mt-1">
                  Добавьте вопросы для вашего квиза. Всего: {quizData.questions.length} вопросов
                </p>
              </div>
              <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Добавить вопрос
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {quizData.questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">❓</div>
                <h3 className="text-xl font-semibold mb-2">Нет вопросов</h3>
                <p className="text-gray-500 mb-4">Добавьте первый вопрос для вашего квиза</p>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить вопрос
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {quizData.questions.map((question, index) => (
                        <Draggable key={question.id} draggableId={question.id!} index={index}>
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
                                  onClick={() => removeQuestion(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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

            {/* Навигация */}
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => navigate('/organizer/create-quiz/step1')}
              >
                ← Назад
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/organizer/dashboard')}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => navigate('/organizer/create-quiz/step3')}
                  disabled={quizData.questions.length === 0}
                >
                  Далее →
                </Button>
              </div>
            </div>
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
              <Label htmlFor="questionText">
                Текст вопроса <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="questionText"
                placeholder="Введите текст вопроса..."
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  questionText: e.target.value,
                })}
                className={errors.questionText ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.questionText && (
                <p className="text-red-500 text-sm">{errors.questionText}</p>
              )}
            </div>

            {/* URL изображения для вопроса с изображением */}
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

            {/* Варианты ответов для вопросов с выбором */}
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

                {errors.options && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.options}</AlertDescription>
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

                {currentQuestion.type === 'single_choice' && (
                  <p className="text-sm text-gray-500">
                    🔘 Выберите один правильный вариант
                  </p>
                )}
                {currentQuestion.type === 'multiple_choice' && (
                  <p className="text-sm text-gray-500">
                    ☑️ Выберите один или несколько правильных вариантов
                  </p>
                )}
              </div>
            )}

            {/* Правильный ответ для текстового вопроса */}
            {currentQuestion.type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">
                  Правильный ответ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="correctAnswer"
                  placeholder="Введите правильный ответ..."
                  value={currentQuestion.correctAnswer}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    correctAnswer: e.target.value,
                  })}
                  className={errors.correctAnswer ? 'border-red-500' : ''}
                />
                {errors.correctAnswer && (
                  <p className="text-red-500 text-sm">{errors.correctAnswer}</p>
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
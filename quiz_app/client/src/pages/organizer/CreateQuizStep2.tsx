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
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit, 
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useQuizCreation, Question } from '@/hooks/useQuizCreation';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Answer' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'image', label: 'Image Question' },
];

// Progress Steps Component
const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Basic Info', 'Questions', 'Preview & Publish'];
  
  return (
    <div className="mb-10">
      <div className="flex justify-between mb-3">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`text-xs font-semibold transition-colors ${
              currentStep > i ? "text-[#6C63FF]" : currentStep === i + 1 ? "text-[#1a1535]" : "text-[#6b6a8a]"
            }`}
          >
            Step {i + 1}: {s}
          </span>
        ))}
      </div>
      <div className="h-2 bg-[#ededf5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(currentStep / 3) * 100}%`,
            background: "linear-gradient(90deg, #6C63FF, #4f46e5)",
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all -mt-5 border-2 ${
              currentStep > i
                ? "bg-[#6C63FF] border-[#6C63FF] text-white"
                : currentStep === i + 1
                ? "bg-white border-[#6C63FF] text-[#6C63FF]"
                : "bg-white border-[#ededf5] text-[#6b6a8a]"
            }`}
          >
            {currentStep > i ? '✓' : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

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
    const newErrors: Record<string, string> = {};
    if (!currentQuestion.questionText?.trim()) {
      newErrors.questionText = 'Enter question text';
    }
    
    if (currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') {
      const hasCorrect = currentQuestion.options?.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        newErrors.options = 'Select the correct answer(s)';
      }
      const hasEmpty = currentQuestion.options?.some(opt => !opt.text.trim());
      if (hasEmpty) {
        newErrors.options = 'Fill in all answer options';
      }
      if ((currentQuestion.options?.length || 0) < 2) {
        newErrors.options = 'Add at least 2 answer options';
      }
    }

    if (currentQuestion.type === 'text' && !currentQuestion.correctAnswer?.trim()) {
      newErrors.correctAnswer = 'Enter the correct answer';
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
    if (question.type === 'text') return '📝 Text Answer';
    if (question.type === 'image') return '🖼️ With Image';
    if (question.type === 'single_choice') {
      return `🔘 Single Choice (${question.options?.filter(o => o.isCorrect).length || 0} correct)`;
    }
    if (question.type === 'multiple_choice') {
      return `☑️ Multiple Choice (${question.options?.filter(o => o.isCorrect).length || 0} correct)`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] pt-24 pb-16 px-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <ProgressSteps currentStep={2} />

        <div className="bg-white rounded-3xl shadow-sm border border-[rgba(108,99,255,0.08)] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f0efff] flex items-center justify-center">
                <Zap size={22} className="text-[#6C63FF]" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#1a1535]" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Questions
                </h2>
                <p className="text-[#6b6a8a] text-sm">
                  {quizData.questions.length} questions added
                </p>
              </div>
            </div>
            <Button
              onClick={openCreateDialog}
              className="flex items-center gap-2 bg-[#6C63FF] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#5550e8] transition-all shadow-md shadow-[#6C63FF]/25 active:scale-95 text-sm"
            >
              <Plus size={18} />
              Add Question
            </Button>
          </div>

          {quizData.questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-[#1a1535] mb-2">No questions yet</h3>
              <p className="text-[#6b6a8a] text-sm mb-6">Add your first question to get started</p>
              <Button
                onClick={openCreateDialog}
                className="flex items-center gap-2 bg-[#6C63FF] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#5550e8] transition-all shadow-md shadow-[#6C63FF]/25 active:scale-95"
              >
                <Plus size={18} />
                Add Question
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 mb-6">
                    {quizData.questions.map((question, index) => (
                      <Draggable key={question.id} draggableId={question.id!} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-4 p-4 bg-[#f8f7ff] rounded-2xl border border-[rgba(108,99,255,0.08)] group hover:border-[#6C63FF]/25 transition-all"
                          >
                            <div {...provided.dragHandleProps} className="cursor-move text-[#c4c2e8] hover:text-[#6C63FF] transition-colors">
                              <GripVertical size={16} />
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center text-xs font-bold text-[#6C63FF] shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#1a1535] truncate">
                                {question.questionText || 'No text'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-[#6b6a8a]">{getQuestionTypeLabel(question.type)}</span>
                                <span className="text-xs text-[#6b6a8a]">•</span>
                                <span className="text-xs text-[#6b6a8a]">{question.points} pts</span>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                                question.type === 'text'
                                  ? "bg-[#f0faf0] text-[#4CAF50]"
                                  : "bg-[#f0efff] text-[#6C63FF]"
                              }`}
                            >
                              {question.type === 'text' && 'Text'}
                              {question.type === 'single_choice' && 'Single'}
                              {question.type === 'multiple_choice' && 'Multiple'}
                              {question.type === 'image' && 'Image'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(index)}
                              className="text-[#6b6a8a] hover:text-[#6C63FF]"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                              className="text-[#6b6a8a] hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </Button>
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

          <div className="flex justify-between pt-6 border-t border-[rgba(108,99,255,0.08)]">
            <Button
              variant="outline"
              onClick={() => navigate('/organizer/create-quiz/step1')}
              className="flex items-center gap-2 text-sm font-semibold text-[#6b6a8a] hover:text-[#1a1535] transition-colors px-5 py-3 rounded-xl hover:bg-white border-2 border-[rgba(108,99,255,0.15)]"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/organizer/dashboard')}
                className="text-sm font-semibold text-[#6b6a8a] hover:text-red-600 transition-colors px-5 py-3 rounded-xl hover:bg-white border-2 border-[rgba(108,99,255,0.15)]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => navigate('/organizer/create-quiz/step3')}
                disabled={quizData.questions.length === 0}
                className="flex items-center gap-2 text-sm font-bold bg-[#6C63FF] text-white px-6 py-3 rounded-xl hover:bg-[#5550e8] transition-all shadow-md shadow-[#6C63FF]/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog для создания/редактирования вопроса */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#1a1535]" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {editingIndex !== null ? 'Edit Question' : 'New Question'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#1a1535]">Question Type</label>
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
                <SelectTrigger className="w-full bg-[#f4f3ff] border-2 border-[rgba(108,99,255,0.12)] rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all">
                  <SelectValue placeholder="Select question type" />
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#1a1535]">
                Question Text <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter your question..."
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  questionText: e.target.value,
                })}
                className={`w-full bg-[#f4f3ff] border-2 ${errors.questionText ? 'border-red-500' : 'border-[rgba(108,99,255,0.12)]'} rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all resize-none`}
                rows={3}
              />
              {errors.questionText && <p className="text-red-500 text-xs">{errors.questionText}</p>}
            </div>

            {currentQuestion.type === 'image' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1a1535]">Image URL</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={currentQuestion.imageUrl}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    imageUrl: e.target.value,
                  })}
                  className="w-full bg-[#f4f3ff] border-2 border-[rgba(108,99,255,0.12)] rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all"
                />
                {currentQuestion.imageUrl && (
                  <div className="mt-2 p-2 border border-[rgba(108,99,255,0.12)] rounded-xl">
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

            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1a1535]">Answer Options</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 text-sm font-semibold text-[#6C63FF] border-[rgba(108,99,255,0.2)] hover:bg-[#f0efff]"
                  >
                    <Plus size={14} />
                    Add Option
                  </Button>
                </div>

                {errors.options && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600 text-sm">{errors.options}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#6b6a8a] w-6">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                        className="flex-1 bg-[#f4f3ff] border-2 border-[rgba(108,99,255,0.12)] rounded-xl px-4 py-2.5 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all"
                      />
                      <button
                        type="button"
                        className={`px-3 py-1.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                          option.isCorrect
                            ? 'bg-[#4CAF50] text-white border-[#4CAF50]'
                            : 'bg-white border-[rgba(108,99,255,0.15)] text-[#6b6a8a] hover:border-[#6C63FF]/30'
                        }`}
                        onClick={() => handleOptionChange(index, 'isCorrect', !option.isCorrect)}
                      >
                        {currentQuestion.type === 'single_choice' ? 'Correct' : '✓'}
                      </button>
                      {currentQuestion.options && currentQuestion.options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-[#6b6a8a] hover:text-red-600"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {currentQuestion.type === 'single_choice' && (
                  <p className="text-xs text-[#6b6a8a]">🔘 Select one correct answer</p>
                )}
                {currentQuestion.type === 'multiple_choice' && (
                  <p className="text-xs text-[#6b6a8a]">☑️ Select one or more correct answers</p>
                )}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1a1535]">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter the correct answer..."
                  value={currentQuestion.correctAnswer}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    correctAnswer: e.target.value,
                  })}
                  className={`w-full bg-[#f4f3ff] border-2 ${errors.correctAnswer ? 'border-red-500' : 'border-[rgba(108,99,255,0.12)]'} rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all`}
                />
                {errors.correctAnswer && <p className="text-red-500 text-xs">{errors.correctAnswer}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#1a1535]">Points</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  points: parseInt(e.target.value) || 10,
                })}
                className="w-full bg-[#f4f3ff] border-2 border-[rgba(108,99,255,0.12)] rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-2 border-[rgba(108,99,255,0.15)] text-[#6b6a8a] hover:text-[#1a1535] hover:bg-white px-6 py-2.5 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              className="bg-[#6C63FF] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#5550e8] transition-all shadow-md shadow-[#6C63FF]/25 active:scale-95"
            >
              {editingIndex !== null ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
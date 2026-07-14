// src/hooks/useQuizCreation.ts
import { useState } from 'react';

export interface QuizData {
  id?: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number;
  questions: Question[];
}

export interface Question {
  id?: string;
  type: 'text' | 'image' | 'single_choice' | 'multiple_choice';
  questionText: string;
  imageUrl?: string;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  points: number;
  order: number;
}

const initialState: QuizData = {
  title: '',
  description: '',
  category: '',
  timeLimit: 30,
  questions: [],
};

export const useQuizCreation = () => {
  const [quizData, setQuizData] = useState<QuizData>(() => {
    const saved = sessionStorage.getItem('quizCreationData');
    return saved ? JSON.parse(saved) : initialState;
  });
  const [currentStep, setCurrentStep] = useState(1);

  const updateQuizData = (data: Partial<QuizData>) => {
    setQuizData(prev => {
      const newData = { ...prev, ...data };
      sessionStorage.setItem('quizCreationData', JSON.stringify(newData));
      return newData;
    });
  };

  const addQuestion = (question: Omit<Question, 'id' | 'order'>) => {
    const newQuestion: Question = {
      ...question,
      id: Date.now().toString(),
      order: quizData.questions.length,
    };
    updateQuizData({
      questions: [...quizData.questions, newQuestion],
    });
  };

  const updateQuestion = (index: number, question: Partial<Question>) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...question };
    updateQuizData({ questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    updateQuizData({ questions: updatedQuestions });
  };

  const reorderQuestions = (startIndex: number, endIndex: number) => {
    const result = Array.from(quizData.questions);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    updateQuizData({ questions: result });
  };

  const resetQuizData = () => {
    sessionStorage.removeItem('quizCreationData');
    setQuizData(initialState);
    setCurrentStep(1);
  };

  return {
    quizData,
    currentStep,
    setCurrentStep,
    updateQuizData,
    addQuestion,
    updateQuestion,
    removeQuestion,
    reorderQuestions,
    resetQuizData,
  };
};
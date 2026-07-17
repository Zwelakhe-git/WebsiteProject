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
  ChevronLeft,
  Sparkles,
  Eye,
  Star,
  Zap,
} from 'lucide-react';
import { useQuizCreation } from '@/hooks/useQuizCreation';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { quizApi, questionApi } from '@/lib/api';

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
      const quizResponse = await quizApi.create({
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        timeLimit: quizData.timeLimit,
      });

      const quizId = quizResponse.data.quiz.id;

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

      setTimeout(() => {
        navigate(`/organizer/quiz/${quizId}/control`);
      }, 1500);

    } catch (error: any) {
      setPublishError(error.response?.data?.error || 'Error publishing quiz');
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
    <div className="min-h-screen bg-[#f8f7ff] pt-24 pb-16 px-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <ProgressSteps currentStep={3} />

        <div className="space-y-5">
          <div className="bg-white rounded-3xl shadow-sm border border-[rgba(108,99,255,0.08)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#f0efff] flex items-center justify-center">
                <Eye size={22} className="text-[#6C63FF]" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#1a1535]" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Preview &amp; Publish
                </h2>
                <p className="text-[#6b6a8a] text-xs">Everything looks good? Hit publish!</p>
              </div>
            </div>

            {/* Mini quiz card - как в Figma */}
            <div
              className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #6C63FF, #2563eb)" }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                {quizData.category || 'General'}
              </div>
              <h3 className="text-xl font-extrabold mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {quizData.title || 'Untitled Quiz'}
              </h3>
              <p className="text-white/70 text-sm mb-4">
                {quizData.description || 'No description provided'}
              </p>
              <div className="flex gap-4 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {quizData.timeLimit}s / question
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  {totalQuestions} questions
                </span>
              </div>
            </div>

            {/* Questions preview */}
            <div className="space-y-2">
              {quizData.questions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-3 py-3 border-b border-[rgba(108,99,255,0.06)] last:border-0">
                  <span className="text-xs font-bold text-[#6b6a8a] w-5 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-[#1a1535] font-medium flex-1">{q.questionText}</span>
                  <span className="text-xs text-[#6b6a8a]">{q.points} pts</span>
                  <span className="text-xs text-[#6b6a8a]">{getTypeIcon(q.type)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Publish button - как в Figma */}
          <button
            onClick={handlePublish}
            disabled={totalQuestions === 0 || isPublishing || !!publishedQuizId}
            className="w-full flex items-center justify-center gap-3 text-white font-bold py-5 rounded-2xl text-base shadow-xl shadow-[#6C63FF]/25 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6C63FF, #4f46e5)" }}
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Publishing...
              </>
            ) : publishedQuizId ? (
              <>
                <CheckCircle size={20} />
                Published!
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Publish Quiz
              </>
            )}
          </button>

          {publishError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600 text-sm">{publishError}</AlertDescription>
            </Alert>
          )}

          {totalQuestions === 0 && (
            <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-600 text-sm">
                Add at least one question before publishing
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/organizer/create-quiz/step2')}
              className="flex items-center gap-2 text-sm font-semibold text-[#6b6a8a] hover:text-[#1a1535] transition-colors px-5 py-3 rounded-xl hover:bg-white border-2 border-[rgba(108,99,255,0.15)]"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/organizer/dashboard')}
              className="text-sm font-semibold text-[#6b6a8a] hover:text-red-600 transition-colors px-5 py-3 rounded-xl hover:bg-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
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
import { ChevronLeft, ChevronRight, Zap, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'Science',
  'History',
  'Geography',
  'Arts',
  'Technology',
  'Sports',
  'Entertainment',
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

export const CreateQuizStep1 = () => {
  const navigate = useNavigate();
  const { quizData, updateQuizData } = useQuizCreation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!quizData.title.trim()) newErrors.title = 'Title is required';
    if (!quizData.description.trim()) newErrors.description = 'Description is required';
    if (!quizData.category) newErrors.category = 'Please select a category';
    if (quizData.timeLimit < 5) newErrors.timeLimit = 'Minimum time is 5 seconds';
    if (quizData.timeLimit > 300) newErrors.timeLimit = 'Maximum time is 300 seconds';
    
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
    <div className="min-h-screen bg-[#f8f7ff] pt-24 pb-16 px-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <ProgressSteps currentStep={1} />

        <div className="bg-white rounded-3xl shadow-sm border border-[rgba(108,99,255,0.08)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#f0efff] flex items-center justify-center">
              <Zap size={22} className="text-[#6C63FF]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#1a1535]" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Basic Information
              </h2>
              <p className="text-[#6b6a8a] text-sm">Set up your quiz details and preferences.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#1a1535] mb-2">Quiz Title</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => updateQuizData({ title: e.target.value })}
                placeholder="Enter quiz title..."
                className={`w-full bg-[#f4f3ff] border-2 ${errors.title ? 'border-red-500' : 'border-[rgba(108,99,255,0.12)]'} rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1a1535] mb-2">Description, rules</label>
              <textarea
                rows={3}
                value={quizData.description}
                onChange={(e) => updateQuizData({ description: e.target.value })}
                placeholder="Describe your quiz, and layout the rules..."
                className={`w-full bg-[#f4f3ff] border-2 ${errors.description ? 'border-red-500' : 'border-[rgba(108,99,255,0.12)]'} rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all resize-none`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1a1535] mb-2">Category</label>
              <Select
                value={quizData.category}
                onValueChange={(value) => updateQuizData({ category: value })}
              >
                <SelectTrigger className={`w-full bg-[#f4f3ff] border-2 ${errors.category ? 'border-red-500' : 'border-[rgba(108,99,255,0.12)]'} rounded-xl px-4 py-3 text-[#1a1535] text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all`}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-semibold text-[#1a1535]">Time Limit per Question</label>
                <span className="text-sm font-bold text-[#6C63FF]">{quizData.timeLimit}s</span>
              </div>
              <Slider
                min={10}
                max={120}
                step={5}
                value={[quizData.timeLimit]}
                onValueChange={(value) => updateQuizData({ timeLimit: value[0] })}
                className={`w-full accent-[#6C63FF] ${errors.timeLimit ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between text-xs text-[#6b6a8a] mt-1">
                <span>10s</span><span>30s</span><span>60s</span><span>120s</span>
              </div>
              {errors.timeLimit && <p className="text-red-500 text-xs mt-1">{errors.timeLimit}</p>}
            </div>

            <div className="flex justify-between pt-4 border-t border-[rgba(108,99,255,0.08)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/organizer/dashboard')}
                className="flex items-center gap-2 text-sm font-semibold text-[#6b6a8a] hover:text-[#1a1535] transition-colors px-5 py-3 rounded-xl hover:bg-white border-2 border-[rgba(108,99,255,0.15)]"
              >
                <ChevronLeft size={16} />
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex items-center gap-2 text-sm font-bold bg-[#6C63FF] text-white px-6 py-3 rounded-xl hover:bg-[#5550e8] transition-all shadow-md shadow-[#6C63FF]/25 active:scale-95"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
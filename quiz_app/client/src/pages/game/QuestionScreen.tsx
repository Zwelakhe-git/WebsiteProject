// src/pages/game/QuestionScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  Award,
  AlertCircle,
  Loader2,
  Users,
  ChevronRight,
  Star,
  ArrowLeft,
  Zap,
  Send,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: string;
  quizId: string;
  type: 'text' | 'image' | 'single_choice' | 'multiple_choice';
  questionText: string;
  imageUrl?: string;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  points: number;
  order: number;
  currentIndex: number;
  totalQuestions: number;
  startTime: number;
}

interface AnswerResult {
  isCorrect: boolean;
  points: number;
  correctAnswer: string | string[];
  totalScore: number;
}

interface Participant {
  id: string;
  username: string;
  hasAnswered: boolean;
  isMe?: boolean;
}

// ─── TimerCircle Component ────────────────────────────────────────────────────
const TimerCircle = ({ time, totalTime }: { time: number; totalTime: number }) => {
  const percentage = (time / totalTime) * 100;
  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const timerColor = time > 10 ? '#6C63FF' : '#ef4444';

  return (
    <div className="relative w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#ededf5" strokeWidth="6" />
        <circle
          cx="40" cy="40" r="34"
          fill="none"
          stroke={timerColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-xl font-extrabold transition-colors"
        style={{ color: timerColor, fontFamily: "'Nunito', sans-serif" }}
      >
        {time}
      </div>
    </div>
  );
};

export const QuestionScreen = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user, socketClient, isSocketConnected } = useAuth();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [points, setPoints] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLimit = 28; // Из макета

  // Подключение к WebSocket
  useEffect(() => {
    if (!roomCode || !user) {
      navigate('/join-quiz');
      return;
    }

    console.log('🔄 QuestionScreen: Setting up event listeners...');
    
    if (!isSocketConnected) {
      console.log('⚠️ QuestionScreen: Socket not connected, waiting...');
      setIsConnecting(true);
      return;
    }

    setIsConnecting(false);

    const socket = socketClient?.getSocket();
    if (!socket) {
      console.error('❌ QuestionScreen: No socket available');
      return;
    }

    // Обработчики событий
    const onParticipantsUpdate = (data: { participants: any[] }) => {
      console.log('👥 QuestionScreen: Participants update:', data);
      setParticipants(
        (data.participants || []).map((p: any) => ({
          id: p.userId || p.id,
          username: p.username || 'Unknown',
          hasAnswered: p.hasAnswered || false,
          isMe: (p.userId === user?.id || p.id === user?.id),
        }))
      );
    };

    const onJoinedRoom = (data: { participants: string[] }) => {
      console.log('✅ QuestionScreen: Joined room, participants:', data);
      setParticipants(
        (data.participants || []).map((id: string) => ({
          id,
          username: `Player ${id.slice(0, 4)}`,
          hasAnswered: false,
          isMe: id === user?.id,
        }))
      );
    };

    const onQuestionDisplay = (data: Question) => {
      console.log('📝 QuestionScreen: Question received:', data);
      setQuestion(data);
      setResult(null);
      setShowResult(false);
      setSelectedOptions([]);
      setTextAnswer('');
      setError(null);
      setIsWaitingForNext(false);
      
      setTimer(timeLimit);
      setIsTimerRunning(true);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            if (!result && !isSubmitting) {
              handleAutoSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const onAnswerResult = (data: AnswerResult) => {
      console.log('📊 QuestionScreen: Answer result:', data);
      setResult(data);
      setShowResult(true);
      setIsSubmitting(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
      if (data.isCorrect) {
        setPoints(prev => prev + data.points);
      }
    };

    const onQuestionEnded = () => {
      console.log('⏰ QuestionScreen: Question ended');
      if (!result) {
        setError('Time\'s up!');
      }
      setIsWaitingForNext(true);
    };

    const onQuizEnded = (data: any) => {
      console.log('🏁 QuestionScreen: Quiz ended:', data);
      if (data?.quizId) {
        navigate(`/leaderboard/${data.quizId}`, { replace: true });
      } else {
        navigate(`/game/${roomCode}/final`, { replace: true });
      }
    };

    const onLeaderboardUpdate = (data: { leaderboard: any[] }) => {
      console.log('🏆 QuestionScreen: Leaderboard update:', data);
    };

    const onError = (data: { message: string }) => {
      console.error('❌ QuestionScreen: Socket error:', data);
      setError(data.message);
    };

    // Регистрируем обработчики
    socket.on('participants-update', onParticipantsUpdate);
    socket.on('question-display', onQuestionDisplay);
    socket.on('answer-result', onAnswerResult);
    socket.on('question-ended', onQuestionEnded);
    socket.on('quiz-ended', onQuizEnded);
    socket.on('leaderboard-update', onLeaderboardUpdate);
    socket.on('joined-room', onJoinedRoom);
    socket.on('error', onError);

    // Cleanup
    return () => {
      console.log('🧹 QuestionScreen: Cleaning up event listeners...');
      socket.off('participants-update', onParticipantsUpdate);
      socket.off('question-display', onQuestionDisplay);
      socket.off('answer-result', onAnswerResult);
      socket.off('question-ended', onQuestionEnded);
      socket.off('quiz-ended', onQuizEnded);
      socket.off('leaderboard-update', onLeaderboardUpdate);
      socket.off('joined-room', onJoinedRoom);
      socket.off('error', onError);
      
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode, user, navigate, isSocketConnected]);

  const handleOptionSelect = (optionText: string) => {
    if (showResult || isSubmitting || !question) return;

    if (question.type === 'single_choice') {
      setSelectedOptions([optionText]);
    } else if (question.type === 'multiple_choice') {
      setSelectedOptions(prev =>
        prev.includes(optionText)
          ? prev.filter(opt => opt !== optionText)
          : [...prev, optionText]
      );
    }
  };

  const handleTextAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showResult || isSubmitting) return;
    setTextAnswer(e.target.value);
  };

  const handleAutoSubmit = () => {
    if (!socketClient?.isConnected() || !question || result) return;
    
    const answer = question.type === 'text' 
      ? textAnswer || 'No answer'
      : selectedOptions;
      
    submitAnswer(answer);
  };

  const handleSubmit = () => {
    if (!socketClient?.isConnected() || !question || result || isSubmitting) return;

    let answer: string | string[];
    
    if (question.type === 'text') {
      if (!textAnswer.trim()) {
        setError('Please enter your answer');
        return;
      }
      answer = textAnswer.trim();
    } else {
      if (selectedOptions.length === 0) {
        setError('Please select an answer');
        return;
      }
      answer = selectedOptions;
    }

    submitAnswer(answer);
  };

  const submitAnswer = (answer: string | string[]) => {
    setIsSubmitting(true);
    setError(null);

    socketClient?.emit('submit-answer', {
      roomCode,
      questionId: question?.id,
      selectedOption: answer,
      answer: typeof answer === 'string' ? answer : undefined,
    });
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  const isOptionSelected = (optionText: string) => {
    return selectedOptions.includes(optionText);
  };

  const isOptionCorrect = (optionText: string) => {
    if (!result || !question) return false;
    if (question.type === 'single_choice') {
      return optionText === result.correctAnswer;
    }
    if (question.type === 'multiple_choice') {
      return Array.isArray(result.correctAnswer) && result.correctAnswer.includes(optionText);
    }
    return false;
  };

  const isOptionWrong = (optionText: string) => {
    if (!result || !question || !isOptionSelected(optionText)) return false;
    return !isOptionCorrect(optionText);
  };

  const isMultipleChoiceCorrect = (selectedOptions: string[], correctAnswers: string[]) => {
    if (!selectedOptions.length || !correctAnswers.length) return false;
    
    const sortedSelected = [...selectedOptions].sort();
    const sortedCorrect = [...correctAnswers].sort();
    
    if (sortedSelected.length !== sortedCorrect.length) return false;
    
    return sortedSelected.every((val, index) => val === sortedCorrect[index]);
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  // Если ошибка подключения
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-[#6C63FF] hover:bg-[#5550e8] text-white"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/participant/dashboard')} 
                className="w-full border-2 border-[rgba(108,99,255,0.15)] text-[#6b6a8a]"
              >
                Exit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если загрузка
  if (isConnecting || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
        <Card className="w-full max-w-md text-center p-8 border-0 shadow-none bg-transparent">
          <Loader2 className="w-12 h-12 text-[#6C63FF] animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#1a1535]" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Waiting for question...
          </h3>
          <p className="text-[#6b6a8a] text-sm mt-2">
            The host will start the next question soon
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top bar - как в Figma */}
      <div className="bg-white border-b border-[rgba(108,99,255,0.08)] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/participant/dashboard')} className="text-[#6b6a8a] hover:text-[#6C63FF] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-[#1a1535] text-sm">Quiz Session</span>
        </div>
        <div className="flex items-center gap-2 bg-[#f4f3ff] px-3 py-1.5 rounded-xl">
          <span className="text-xs font-semibold text-[#6b6a8a]">Question</span>
          <span className="text-sm font-extrabold text-[#6C63FF]">
            {question.currentIndex}/{question.totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#4CAF50]">
            <Star size={15} className="fill-[#4CAF50]" />
            {points.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-0">
        {/* Main question area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Timer - как в Figma */}
          <div className="mb-8">
            <TimerCircle time={timer} totalTime={timeLimit} />
          </div>

          {/* Question card - как в Figma */}
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-[rgba(108,99,255,0.08)] p-8 mb-6">
            {/* Image placeholder - как в Figma */}
            {question.imageUrl ? (
              <img
                src={question.imageUrl}
                alt="Question"
                className="w-full h-32 object-cover rounded-2xl mb-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-[#f0efff] to-[#e8e6ff] rounded-2xl mb-6 flex items-center justify-center">
                <span className="text-[#6b6a8a] text-sm font-medium">Image placeholder</span>
              </div>
            )}
            <p className="text-xl font-bold text-[#1a1535] text-center leading-snug" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {question.questionText}
            </p>
          </div>

          {/* Options grid - как в Figma */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
            {question.options.map((option, index) => {
              const isSelected = isOptionSelected(option.text);
              const isCorrect = showResult && isOptionCorrect(option.text);
              const isWrong = showResult && isOptionWrong(option.text);
              
              let variant: 'default' | 'outline' | 'success' | 'destructive' = 'outline';
              let bgClass = 'bg-white border-[rgba(108,99,255,0.12)] text-[#1a1535] hover:border-[#6C63FF]/40 hover:bg-[#f0efff]';
              
              if (isSelected && !showResult) {
                variant = 'default';
                bgClass = 'bg-[#6C63FF] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25';
              } else if (showResult && isCorrect) {
                variant = 'success';
                bgClass = 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-lg shadow-[#4CAF50]/25';
              } else if (showResult && isWrong) {
                variant = 'destructive';
                bgClass = 'bg-[#ef4444] border-[#ef4444] text-white shadow-lg shadow-[#ef4444]/25';
              } else if (showResult && !isSelected && isOptionCorrect(option.text)) {
                bgClass = 'bg-[#f0faf0] border-[#4CAF50] text-[#4CAF50]';
              }

              return (
                <button
                  key={index}
                  disabled={showResult || isSubmitting}
                  onClick={() => handleOptionSelect(option.text)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-semibold text-sm text-left ${bgClass}`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      isSelected && !showResult ? 'bg-white/20 text-white' : 'bg-[#f0efff] text-[#6C63FF]'
                    }`}
                  >
                    {getOptionLabel(index)}
                  </span>
                  {option.text}
                  {showResult && isCorrect && (
                    <CheckCircle className="w-5 h-5 ml-auto text-white" />
                  )}
                  {showResult && isWrong && (
                    <XCircle className="w-5 h-5 ml-auto text-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Submit / Next - как в Figma */}
          <div className="mt-6 w-full max-w-xl">
            {!showResult ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || showResult}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-[#6C63FF]/20 active:scale-[0.98] ${
                  selectedOptions.length > 0 || (question.type === 'text' && textAnswer.trim())
                    ? 'bg-gradient-to-r from-[#6C63FF] to-[#4f46e5]'
                    : 'bg-[#ededf5] text-[#6b6a8a]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Answer
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsWaitingForNext(false);
                  // Следующий вопрос будет автоматически показан
                }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white shadow-lg shadow-[#4CAF50]/20 active:scale-[0.98] bg-gradient-to-r from-[#4CAF50] to-[#2e7d32]"
              >
                {isWaitingForNext ? 'Waiting for next question...' : 'Next Question'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Participants sidebar - как в Figma */}
        <div className="hidden lg:flex flex-col w-60 border-l border-[rgba(108,99,255,0.08)] bg-white p-5">
          <h3 className="text-xs font-bold text-[#6b6a8a] uppercase tracking-wider mb-4">
            Players
            <span className="ml-2 text-[#6C63FF]">({participants.length})</span>
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {participants.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  p.isMe ? "bg-[#f0efff]" : "hover:bg-[#f8f7ff]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    p.isMe ? "bg-[#6C63FF] text-white" : "bg-[#ededf5] text-[#6b6a8a]"
                  }`}
                >
                  {getInitials(p.username)}
                </div>
                <span className={`text-sm font-semibold flex-1 ${p.isMe ? "text-[#6C63FF]" : "text-[#1a1535]"}`}>
                  {p.username}
                  {p.isMe && <span className="text-xs text-[#6b6a8a] ml-1">(You)</span>}
                </span>
                {p.hasAnswered ? (
                  <CheckCircle size={14} className="text-[#4CAF50]" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#ededf5]" />
                )}
              </div>
            ))}
            {participants.length === 0 && (
              <div className="text-center py-8 text-[#6b6a8a] text-sm">
                <Users size={24} className="mx-auto mb-2 text-[#c4c2e8]" />
                <p>Waiting for players...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
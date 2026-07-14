// src/pages/game/QuestionScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  Award,
  AlertCircle,
  Loader2,
  Users,
  ChevronRight,
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

export const QuestionScreen = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user, socketClient, isSocketConnected } = useAuth();
  
  //const [socket, setSocket] = useState<Socket | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Подключение к WebSocket
  useEffect(() => {
    if (!roomCode || !user) {
      navigate('/join-quiz');
      return;
    }

    console.log('🔄 QuestionScreen: Setting up event listeners...');
    
    // Проверяем подключение
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
      setParticipantsCount(data.participants?.length || 0);
    };

    const onJoinedRoom = (data: { participants: string[] }) => {
      console.log('✅ QuestionScreen: Joined room, participants:', data);
      setParticipantsCount(data.participants?.length || 0);
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
      
      const timeLimit = 30;
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
    };

    const onQuestionEnded = () => {
      console.log('⏰ QuestionScreen: Question ended');
      if (!result) {
        setError('Время вышло!');
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
      // НЕ отключаем сокет, так как он может понадобиться на FinalScreen
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
    if (!socketClient?.connected() || !question || result) return;
    
    const answer = question.type === 'text' 
      ? textAnswer || 'Нет ответа'
      : selectedOptions;
      
    submitAnswer(answer);
  };

  const handleSubmit = () => {
    if (!socketClient?.connected() || !question || result || isSubmitting) return;

    let answer: string | string[];
    
    if (question.type === 'text') {
      if (!textAnswer.trim()) {
        setError('Введите ответ');
        return;
      }
      answer = textAnswer.trim();
    } else {
      if (selectedOptions.length === 0) {
        setError('Выберите вариант ответа');
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

  // Если ошибка подключения
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Попробовать снова
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/participant/dashboard')} 
                className="w-full"
              >
                Выйти
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md text-center p-8">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Ожидание вопроса...</h3>
          <p className="text-gray-500 text-sm mt-2">Организатор скоро запустит следующий вопрос</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              Вопрос {question.currentIndex} из {question.totalQuestions}
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              <Award className="w-3 h-3 mr-1" />
              {question.points} баллов
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {isTimerRunning && (
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                <span className={`font-bold text-xl ${timer <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                  {timer}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{participantsCount}</span>
            </div>
          </div>
        </div>

        {/* Timer Progress */}
        {isTimerRunning && (
          <div className="mb-6">
            <Progress value={(timer / 30) * 100} className="h-2" />
          </div>
        )}

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">
              {question.questionText}
            </h2>

            {question.imageUrl && (
              <div className="mb-6">
                <img
                  src={question.imageUrl}
                  alt="Question"
                  className="max-h-64 object-contain rounded-lg mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Options */}
            {question.type === 'single_choice' && (
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = isOptionSelected(option.text);
                  const isCorrect = showResult && isOptionCorrect(option.text);
                  const isWrong = showResult && isOptionWrong(option.text);
                  
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`w-full justify-start text-left h-auto py-3 px-4 ${
                        showResult && isCorrect ? 'bg-green-500 hover:bg-green-600 text-white' : ''
                      } ${
                        showResult && isWrong ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                      }`}
                      onClick={() => handleOptionSelect(option.text)}
                      disabled={showResult || isSubmitting}
                    >
                      <span className="font-medium mr-3">
                        {getOptionLabel(index)}
                      </span>
                      {option.text}
                      {showResult && isCorrect && (
                        <CheckCircle className="w-5 h-5 ml-auto" />
                      )}
                      {showResult && isWrong && (
                        <XCircle className="w-5 h-5 ml-auto" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}

            {question.type === 'multiple_choice' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">
                  Выберите все правильные варианты
                </p>
                {question.options.map((option, index) => {
                  const isSelected = isOptionSelected(option.text);
                  const isCorrectAnswer = question.correctAnswer ? 
                    (Array.isArray(question.correctAnswer) 
                      ? question.correctAnswer.includes(option.text)
                      : option.text === question.correctAnswer) : false;
                  
                  // Определяем состояние варианта
                  let variant: 'default' | 'outline' | 'success' | 'destructive' | 'secondary' | 'link' | 'ghost' = 'outline';
                  let isCorrectDisplay = false;
                  let isWrongDisplay = false;
                  
                  if (showResult && result) {
                    const isAnswerCorrect = isMultipleChoiceCorrect(
                      selectedOptions,
                      Array.isArray(result.correctAnswer) ? result.correctAnswer : [result.correctAnswer]
                    );
                    
                    if (isAnswerCorrect) {
                      // Если ответ правильный - все выбранные зеленые
                      if (isSelected) {
                        variant = 'success';
                        isCorrectDisplay = true;
                      }
                    } else {
                      // Если ответ неправильный
                      if (isSelected && isCorrectAnswer) {
                        // Выбранный и правильный - зеленый
                        variant = 'success';
                        isCorrectDisplay = true;
                      } else if (isSelected && !isCorrectAnswer) {
                        // Выбранный, но неправильный - красный
                        variant = 'destructive';
                        isWrongDisplay = true;
                      } else if (!isSelected && isCorrectAnswer) {
                        // Не выбранный, но правильный - показываем как правильный (слабо зеленый)
                        variant = 'success';
                        isCorrectDisplay = true;
                      }
                    }
                  } else if (isSelected) {
                    variant = 'default';
                  }

                  return (
                    <Button
                      key={index}
                      variant={variant}
                      className={`w-full justify-start text-left h-auto py-3 px-4 ${
                        showResult && variant === 'success' && !isSelected && isCorrectAnswer 
                          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-50' 
                          : ''
                      } ${
                        showResult && variant === 'success' && isSelected 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : ''
                      } ${
                        showResult && variant === 'destructive' 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : ''
                      }`}
                      onClick={() => handleOptionSelect(option.text)}
                      disabled={showResult || isSubmitting}
                    >
                      <span className="font-medium mr-3">
                        {getOptionLabel(index)}
                      </span>
                      {option.text}
                      {showResult && variant === 'success' && (
                        <CheckCircle className="w-5 h-5 ml-auto text-white" />
                      )}
                      {showResult && variant === 'destructive' && (
                        <XCircle className="w-5 h-5 ml-auto text-white" />
                      )}
                      {showResult && variant === 'success' && !isSelected && isCorrectAnswer && (
                        <span className="ml-auto text-sm text-green-600">(Правильный)</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}

            {question.type === 'text' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Введите ваш ответ..."
                  value={textAnswer}
                  onChange={handleTextAnswerChange}
                  disabled={showResult || isSubmitting}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
                {showResult && result && (
                  <Alert className={result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                    {result.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {result.isCorrect ? (
                        `✅ Правильно! Вы получаете ${result.points} баллов`
                      ) : (
                        `❌ Неправильно. Правильный ответ: ${result.correctAnswer}`
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!showResult ? (
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSubmit}
              disabled={isSubmitting || showResult}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  Ответить
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  {result?.isCorrect ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-semibold text-green-600">Правильно!</p>
                        <p className="text-sm text-gray-500">
                          +{result.points} баллов
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="font-semibold text-red-600">Неправильно</p>
                        <p className="text-sm text-gray-500">
                          Правильный ответ: {Array.isArray(result?.correctAnswer) 
                            ? result?.correctAnswer.join(', ') 
                            : result?.correctAnswer}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="ml-auto">
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      Всего: {result?.totalScore || 0} баллов
                    </Badge>
                  </div>
                </div>
                {isWaitingForNext && (
                  <p className="text-sm text-gray-500 mt-4">
                    Ожидание следующего вопроса...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
// src/pages/game/FinalScreen.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  PartyPopper,
  Home,
  RefreshCw,
  Share2,
  BarChart3,
  Users,
  Clock,
  Award,
  Crown,
  Star,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, Result } from '@/types';

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  answersCount: number;
  timeTaken?: number;
  isCurrentUser?: boolean;
}

interface QuizResult {
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  totalParticipants: number;
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  userScore?: number;
  isOrganizer: boolean;
}

// ─── Confetti Component ────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    color: ["#6C63FF", "#FFD700", "#4CAF50", "#FF6B9D", "#00BCD4"][i % 5],
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute -top-4 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            transform: `rotate(${p.rotate})`,
            animation: `confettiFall ${p.duration} ${p.delay} linear infinite`,
            opacity: 0.85,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export const FinalScreen = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      loadResults();
    } else {
      setError('ID квиза не найден');
      setIsLoading(false);
    }
  }, [quizId]);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 Loading quiz data for ID:', quizId);
      const quizResponse = await api.get(`/quiz/${quizId}`);
      const quiz = quizResponse.data.quiz;
      
      console.log('📊 Quiz data:', quiz);

      const resultsResponse = await api.get(`/quiz/${quizId}/results`);
      const results = resultsResponse.data.results;
      
      console.log('📊 Results:', results);

      let leaderboard: LeaderboardEntry[] = [];
      
      if (results && results.length > 0) {
        leaderboard = results.map((r: any) => ({
          userId: r.userId?._id || r.userId,
          username: r.userId?.username || 'Неизвестный',
          score: r.score || 0,
          answersCount: r.answers?.length || 0,
          timeTaken: r.timeTaken || 0,
          isCurrentUser: (r.userId?._id === user?.id || r.userId === user?.id),
        }));
        
        leaderboard.sort((a, b) => b.score - a.score);
      }

      const userIndex = leaderboard.findIndex(entry => entry.isCurrentUser);
      const userRank = userIndex !== -1 ? userIndex + 1 : undefined;
      const userScore = userIndex !== -1 ? leaderboard[userIndex].score : undefined;

      const isOrganizer = quiz.organizerId === user?.id || 
                         (typeof quiz.organizerId === 'object' && quiz.organizerId?._id === user?.id);

      setResult({
        quizId: quiz.id,
        quizTitle: quiz.title,
        totalQuestions: quiz.questions?.length || 0,
        totalParticipants: results?.length || 0,
        leaderboard,
        userRank,
        userScore,
        isOrganizer,
      });

      setTimeout(() => setShowCelebration(true), 500);

    } catch (error: any) {
      console.error('❌ Error loading results:', error);
      setError(error.response?.data?.error || 'Не удалось загрузить результаты');
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Crown size={24} className="text-[#FFD700]" />;
    if (position === 1) return <Medal size={22} className="text-[#C0C0C0]" />;
    if (position === 2) return <Medal size={22} className="text-[#CD7F32]" />;
    return null;
  };

  const getMedalColor = (position: number) => {
    if (position === 0) return '#FFD700';
    if (position === 1) return '#C0C0C0';
    if (position === 2) return '#CD7F32';
    return '';
  };

  const handleBackToDashboard = () => {
    if (result?.isOrganizer) {
      navigate('/organizer/dashboard');
    } else {
      navigate('/participant/dashboard');
    }
  };

  const handleNewQuiz = () => {
    if (result?.isOrganizer) {
      navigate('/organizer/create-quiz/step1');
    } else {
      navigate('/join-quiz');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
        <Card className="w-full max-w-md text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6C63FF] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#1a1535]">Loading results...</h3>
        </Card>
      </div>
    );
  }

  if (error || !result || result.leaderboard.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
        <Card className="w-full max-w-md text-center p-8">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-[#1a1535] mb-2">
            {error || 'No results found'}
          </h3>
          <p className="text-[#6b6a8a] text-sm mb-4">
            {!result?.leaderboard?.length && !error 
              ? 'No participants in this quiz yet.' 
              : 'Please try again later.'}
          </p>
          <Button 
            onClick={handleBackToDashboard} 
            className="w-full bg-[#6C63FF] hover:bg-[#5550e8] text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const maxScore = result.leaderboard[0]?.score || 1;
  const topThree = result.leaderboard.slice(0, 3);
  const rest = result.leaderboard.slice(3);

  // Подготовка для подиума: [2nd, 1st, 3rd]
  const podium = [
    topThree[1] || null, // 2nd place
    topThree[0] || null, // 1st place
    topThree[2] || null, // 3rd place
  ];

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalIcons = [Crown, Medal, Medal];

  return (
    <div className="min-h-screen bg-[#f8f7ff]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Gradient header with confetti - как в Figma */}
      <div
        className="relative overflow-hidden px-6 pt-12 pb-32"
        style={{ background: "linear-gradient(135deg, #6C63FF 0%, #4f46e5 50%, #2563eb 100%)" }}
      >
        <Confetti />
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#FFD700]/20 backdrop-blur-sm mb-4 border border-[#FFD700]/30">
            <Trophy size={40} className="text-[#FFD700] drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Quiz Complete!
          </h1>
          <p className="text-white/70 text-base">
            {result.quizTitle} — Final Rankings
          </p>
          
          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-4 text-white/80 text-sm">
            <span className="flex items-center gap-2">
              <Users size={16} />
              {result.totalParticipants} players
            </span>
            <span className="flex items-center gap-2">
              <Zap size={16} />
              {result.totalQuestions} questions
            </span>
            {result.userRank && (
              <span className="flex items-center gap-2 text-[#FFD700]">
                <Star size={16} className="fill-[#FFD700]" />
                #{result.userRank} place
              </span>
            )}
          </div>
        </div>

        {/* Top 3 podium - как в Figma */}
        <div className="relative z-10 flex items-end justify-center gap-4 mt-10">
          {podium.map((entry, idx) => {
            const rank = [2, 1, 3][idx];
            const heights = ["h-24", "h-32", "h-20"];
            const MedalIcon = medalIcons[rank - 1];
            const medalColor = medalColors[rank - 1];
            
            if (!entry) return <div key={idx} className="w-20" />;
            
            return (
              <div key={entry.userId} className={`flex flex-col items-center ${idx === 1 ? "scale-105" : ""}`}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white mb-2 shadow-lg"
                  style={{ 
                    background: `${medalColor}33`, 
                    border: `2px solid ${medalColor}66` 
                  }}
                >
                  {entry.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-white text-xs font-semibold mb-1 truncate max-w-[60px]">
                  {entry.username.split(" ")[0]}
                </div>
                <div className="text-white text-sm font-extrabold mb-2">
                  {entry.score.toLocaleString()}
                </div>
                <div
                  className={`w-20 ${heights[idx]} rounded-t-2xl flex items-start justify-center pt-3 transition-all`}
                  style={{ 
                    background: `${medalColor}30`, 
                    border: `1px solid ${medalColor}50` 
                  }}
                >
                  <MedalIcon size={20} style={{ color: medalColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full rankings table - как в Figma */}
      <div className="px-6 -mt-6 pb-16 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-[rgba(108,99,255,0.08)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-3 bg-[#f8f7ff] border-b border-[rgba(108,99,255,0.06)]">
            <span className="col-span-1 text-xs font-bold text-[#6b6a8a] uppercase">#</span>
            <span className="col-span-5 text-xs font-bold text-[#6b6a8a] uppercase">Player</span>
            <span className="col-span-3 text-xs font-bold text-[#6b6a8a] uppercase">Score</span>
            <span className="col-span-3 text-xs font-bold text-[#6b6a8a] uppercase">Time</span>
          </div>
          
          {/* Table rows */}
          {result.leaderboard.map((entry) => {
            const isTop3 = result.leaderboard.indexOf(entry) < 3;
            const medalEmoji = ['🥇', '🥈', '🥉'][result.leaderboard.indexOf(entry)] || null;
            
            return (
              <div
                key={entry.userId}
                className={`grid grid-cols-12 items-center px-5 py-4 border-b border-[rgba(108,99,255,0.04)] last:border-0 transition-colors ${
                  entry.isCurrentUser ? "bg-[#f0efff]" : "hover:bg-[#fafaff]"
                }`}
              >
                <div className="col-span-1">
                  {isTop3 ? (
                    <span className="text-base">{medalEmoji}</span>
                  ) : (
                    <span className="text-sm font-bold text-[#6b6a8a]">
                      {result.leaderboard.indexOf(entry) + 1}
                    </span>
                  )}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      entry.isCurrentUser 
                        ? "bg-[#6C63FF] text-white" 
                        : "bg-[#f0efff] text-[#6C63FF]"
                    }`}
                  >
                    {entry.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`text-sm font-semibold ${entry.isCurrentUser ? "text-[#6C63FF]" : "text-[#1a1535]"}`}>
                    {entry.username} {entry.isCurrentUser && <span className="text-xs text-[#6b6a8a]">(You)</span>}
                  </span>
                </div>
                <div className="col-span-3">
                  <div className="text-sm font-bold text-[#1a1535] mb-1">{entry.score.toLocaleString()}</div>
                  <div className="h-1.5 bg-[#ededf5] rounded-full overflow-hidden w-16">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(entry.score / maxScore) * 100}%`,
                        background: entry.isCurrentUser 
                          ? "#6C63FF" 
                          : "linear-gradient(90deg, #4CAF50, #2e7d32)",
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-1 text-sm text-[#6b6a8a] font-medium">
                  <Clock size={12} />
                  {entry.timeTaken || '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions - как в Figma */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleBackToDashboard}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-4 rounded-2xl border-2 border-[rgba(108,99,255,0.15)] text-[#6C63FF] hover:bg-[#f0efff] transition-all"
          >
            <Home size={16} />
            Back to Dashboard
          </button>
          <button
            onClick={handleNewQuiz}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-4 rounded-2xl text-white shadow-lg shadow-[#6C63FF]/25 hover:opacity-90 transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6C63FF, #4f46e5)" }}
          >
            <RefreshCw size={16} />
            New Quiz
          </button>
        </div>
      </div>
    </div>
  );
};
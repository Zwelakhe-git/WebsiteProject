// src/app/router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Components
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { EditQuizPage } from '@/pages/organizer/EditQuizPage'; // Добавляем
import { OrganizerDashboard } from '@/pages/organizer/OrganizerDashboard';
import { CreateQuizStep1 } from '@/pages/organizer/CreateQuizStep1';
import { CreateQuizStep2 } from '@/pages/organizer/CreateQuizStep2';
import { CreateQuizStep3 } from '@/pages/organizer/CreateQuizStep3';
import { QuizControlRoom } from '@/pages/organizer/QuizControlRoom';
import { ParticipantDashboard } from '@/pages/participant/ParticipantDashboard';
import { JoinQuizPage } from '@/pages/participant/JoinQuizPage';
import { WaitingRoom } from '@/pages/game/WaitingRoom';
import { QuestionScreen } from '@/pages/game/QuestionScreen';
import { FinalScreen } from '@/pages/game/FinalScreen';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { JSX } from 'react/jsx-runtime';
// Helper для проверки роли
const RequireRole = ({ children, role }: { children: JSX.Element; role: 'organizer' | 'participant' }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export const router = createBrowserRouter([
  // Публичные маршруты
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  
  // Защищенные маршруты для организатора
  {
    path: '/organizer',
    element: <ProtectedRoute allowedRoles={['organizer']} />,
    children: [
      {
        index: true,
        element: <Navigate to="/organizer/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <OrganizerDashboard />,
      },
      {
        path: 'create-quiz/step1',
        element: <CreateQuizStep1 />,
      },
      {
        path: 'quiz/:id/edit',
        element: <EditQuizPage />, // Добавляем
      },
      {
        path: 'create-quiz/step2',
        element: <CreateQuizStep2 />,
      },
      {
        path: 'create-quiz/step3',
        element: <CreateQuizStep3 />,
      },
      {
        path: 'quiz/:id/control',
        element: <QuizControlRoom />,
      },
    ],
  },
  
  // Защищенные маршруты для участника
  {
    path: '/participant',
    element: <ProtectedRoute allowedRoles={['participant']} />,
    children: [
      {
        index: true,
        element: <Navigate to="/participant/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <ParticipantDashboard />,
      },
    ],
  },
  
  // Общие защищенные маршруты
  {
    path: '/join-quiz',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <JoinQuizPage />,
      },
    ],
  },
  
  // Игровые маршруты
  {
    path: '/game/:roomCode',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'waiting',
        element: <WaitingRoom />,
      },
      {
        path: 'play',
        element: <QuestionScreen />,
      },
      {
        path: 'final',
        element: <FinalScreen />,
      },
    ],
  },
  
  // Лидерборд
  {
    path: '/leaderboard/:quizId',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <FinalScreen />, // Можно использовать отдельный компонент LeaderboardPage
      },
    ],
  },
  
  // Перенаправление по умолчанию
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
// src/types/index.ts
export interface UserInterface {
  id: string;
  username: string;
  email: string;
  role: 'organizer' | 'participant';
  createdAt?: string;
  totalQuizzesPlayed?: number;
  totalQuizzesOrganized?: number;
  averageScore?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  role: 'organizer' | 'participant';
}

export interface AuthResponse {
  token: string;
  user: UserInterface;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number;
  status: 'draft' | 'active' | 'completed';
  roomCode?: string;
  organizerId: string;
  questions: Question[];
  participants: UserInterface[];
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  type: 'text' | 'image' | 'single_choice' | 'multiple_choice';
  questionText: string;
  imageUrl?: string;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  points: number;
  order: number;
  createdAt: Date;
}

export interface Result {
  id: string;
  quizId: string;
  userId: string | {
    _id: string;
    username: string;
    email: string;
  };
  score: number;
  answers: {
    questionId: string;
    selectedOption: string | string[];
    isCorrect: boolean;
    timeSpent: number;
  }[];
  timeTaken: number;
  completedAt: Date;
}


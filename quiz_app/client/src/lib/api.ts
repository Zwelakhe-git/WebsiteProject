// src/lib/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Интерцептор для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('token not found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem('token');
      // Если не на странице логина, перенаправляем
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Вспомогательные методы
export const auth = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (username: string, email: string, password: string, role: string) =>
    api.post('/auth/register', { username, email, password, role }),
  
  getMe: () => api.get('/auth/me'),
};

export const quizApi = {
  create: (data: any) => api.post('/quiz/create', data),
  getMyQuizzes: () => api.get('/quiz/my-quizzes'),
  getQuiz: (id: string) => api.get(`/quiz/${id}`),
  update: (id: string, data: any) => api.put(`/quiz/${id}`, data),
  delete: (id: string) => api.delete(`/quiz/${id}`),
};

export const questionApi = {
  add: (data: any) => api.post('/questions/add', data),
  bulkAdd: (data: any) => api.post('/questions/bulk-add', data),
  getQuizQuestions: (quizId: string) => api.get(`/questions/quiz/${quizId}`),
  update: (id: string, data: any) => api.put(`/questions/${id}`, data),
  delete: (id: string) => api.delete(`/questions/${id}`),
};

export const roomApi = {
  startQuiz: (quizId: string) => api.post(`/room/start/${quizId}`),
  checkRoom: (roomCode: string) => api.post('/room/check', { roomCode }),
  getRoomInfo: (roomCode: string) => api.get(`/room/${roomCode}`),
  endQuiz: (roomCode: string) => api.post(`/room/end/${roomCode}`),
};
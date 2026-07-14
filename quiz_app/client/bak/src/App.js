import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import './App.css';

// Компоненты (будем создавать позже)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateQuizPage from './pages/CreateQuizPage';
import JoinQuizPage from './pages/JoinQuizPage';
import QuizRoomPage from './pages/QuizRoomPage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create-quiz" element={<CreateQuizPage />} />
            <Route path="/join-quiz" element={<JoinQuizPage />} />
            <Route path="/quiz-room/:roomCode" element={<QuizRoomPage />} />
            <Route path="/leaderboard/:quizId" element={<LeaderboardPage />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
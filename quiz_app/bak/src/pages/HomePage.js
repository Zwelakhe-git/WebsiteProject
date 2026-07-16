import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <header className="hero">
        <h1>Quizify</h1>
        <p>Создавайте и проходите квизы в реальном времени</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">
            Начать
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Войти
          </Link>
        </div>
      </header>
      
      <section className="features">
        <div className="feature-card">
          <h3>🎯 Создавайте квизы</h3>
          <p>Разрабатывайте вопросы с текстом и изображениями</p>
        </div>
        <div className="feature-card">
          <h3>👥 Участвуйте</h3>
          <p>Присоединяйтесь к квизам по коду комнаты</p>
        </div>
        <div className="feature-card">
          <h3>🏆 Соревнуйтесь</h3>
          <p>Следите за лидербордом в реальном времени</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
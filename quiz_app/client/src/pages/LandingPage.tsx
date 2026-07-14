// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const LandingPage = () => {
  const { user, logout } = useAuth();
  const handleLogout = () => {
    logout();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-purple-600">Quizify</span>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </div>
        <div className="flex gap-4">
          { user ?
          <>
          <Button onClick={handleLogout}>Выйти</Button>
          </> : 
          <>
          <Link to="/login">
            <Button variant="ghost">Войти</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Начать
            </Button>
          </Link>
          </>}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Создавайте и проходите
            <span className="text-purple-600"> квизы</span> в реальном времени
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Играй. Учись. Побеждай. — Интерактивные квизы для образования и развлечения
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? 
            <>
            <Link to={`/${user.role}/dashboard`}>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">Дашборд</Button>
            </Link>
            </> : 
            <>
            <Link to="/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                Начать бесплатно
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                Войти
              </Button>
            </Link>
            </>}
            
          </div>
          <p className="text-sm text-gray-500 mt-4">
            🚀 Бесплатно. Без ограничений. До 100 участников.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Быстрая наладка</h3>
              <p className="text-gray-600">
                Создайте квиз за 5 минут. Добавляйте вопросы с текстом и изображениями
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">До 100 игр в день</h3>
              <p className="text-gray-600">
                Проводите сколько угодно. Подключайтесь по коду комнаты
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Результаты в реальном времени</h3>
              <p className="text-gray-600">
                Мгновенный подсчет баллов и обновление лидерборда
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      { !user && <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Готовы начать?
            </h2>
            <p className="text-purple-100 mb-8 text-lg">
              Присоединяйтесь к тысячам пользователей, которые уже создают и проходят квизы
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50 px-8">
                Создать аккаунт
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 Quizify. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};
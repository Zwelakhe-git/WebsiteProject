// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useAuthWithNavigate } from '@/hooks/useAuthWithNavigate';

export const RegisterPage = () => {
  const { registerAndNavigate, isLoading, error } = useAuthWithNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'participant' as 'organizer' | 'participant'
  });
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    setPasswordError('');

    try {
      await registerAndNavigate(
        formData.username,
        formData.email,
        formData.password,
        formData.role
      );
      // navigate происходит внутри registerAndNavigate
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-3xl font-bold text-purple-600">Quizify</span>
          </div>
          <CardTitle className="text-2xl">Создайте аккаунт</CardTitle>
          <p className="text-gray-500 text-sm">Начните свой путь в мире квизов</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || passwordError) && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error || passwordError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                placeholder="Ваше имя"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Роль</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.role === 'participant' ? 'default' : 'outline'}
                  className={formData.role === 'participant' ? 'bg-purple-600' : ''}
                  onClick={() => setFormData({ ...formData, role: 'participant' })}
                >
                  Участник
                </Button>
                <Button
                  type="button"
                  variant={formData.role === 'organizer' ? 'default' : 'outline'}
                  className={formData.role === 'organizer' ? 'bg-purple-600' : ''}
                  onClick={() => setFormData({ ...formData, role: 'organizer' })}
                >
                  Организатор
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Зарегистрироваться'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-purple-600 font-semibold hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
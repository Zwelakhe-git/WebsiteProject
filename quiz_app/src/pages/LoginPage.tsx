// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useAuthWithNavigate } from '@/hooks/useAuthWithNavigate';

export const LoginPage = () => {
  const { loginAndNavigate, isLoading, error } = useAuthWithNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAndNavigate(formData.email, formData.password);
      // navigate происходит внутри loginAndNavigate
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
          <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
          <p className="text-gray-500 text-sm">Войдите в свой аккаунт</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
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
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Запомнить меня
              </label>
              <Link to="/forgot-password" className="text-purple-600 hover:underline">
                Забыли пароль?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-purple-600 font-semibold hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
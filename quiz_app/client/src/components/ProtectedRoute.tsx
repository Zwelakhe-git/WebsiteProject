// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('organizer' | 'participant')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isInitialized } = useAuth();

  console.log('🔒 ProtectedRoute - User:', user);
  console.log('🔒 ProtectedRoute - isInitialized:', isInitialized);

  // Ждем инициализации
  if (!isInitialized) {
    console.log('⏳ Auth not initialized yet');
    return null;
  }

  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`❌ Role ${user.role} not allowed, redirecting`);
    return <Navigate to="/" replace />;
  }

  console.log('✅ Access granted');
  return <Outlet />;
};
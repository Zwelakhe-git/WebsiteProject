// src/hooks/useAuthWithNavigate.ts
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthWithNavigate = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const loginAndNavigate = async (email: string, password: string) => {
    try {
      const user = await auth.login(email, password);
      console.log('🔄 Login success, navigating...');
      
      if (user.role === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/participant/dashboard', { replace: true });
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const registerAndNavigate = async (
    username: string,
    email: string,
    password: string,
    role: 'organizer' | 'participant'
  ) => {
    try {
      const user = await auth.register(username, email, password, role);
      console.log('🔄 Register success, navigating...');
      
      if (user.role === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/participant/dashboard', { replace: true });
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logoutAndNavigate = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  return {
    ...auth,
    loginAndNavigate,
    registerAndNavigate,
    logoutAndNavigate,
  };
};
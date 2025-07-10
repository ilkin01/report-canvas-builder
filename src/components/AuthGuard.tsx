import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      // Əgər authentication tələb olunursa və user login deyilsə, login səhifəsinə yönləndir
      navigate('/login');
    } else if (!requireAuth && isAuthenticated) {
      // Əgər authentication tələb olunmur (məsələn, login səhifəsi) və user artıq login olubsa, ana səhifəyə yönləndir
      navigate('/');
    }
  }, [isAuthenticated, requireAuth, navigate]);

  return <>{children}</>;
}; 
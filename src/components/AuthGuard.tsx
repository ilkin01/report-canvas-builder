import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { fetchUserProfile } from '@/redux/slices/authSlice';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      if (requireAuth && !isAuthenticated) {
        const token = localStorage.getItem('authToken');
        if (token) {
          setRestoring(true);
          try {
            await dispatch(fetchUserProfile()).unwrap();
          } catch {
            if (!cancelled) navigate('/login');
          } finally {
            if (!cancelled) setRestoring(false);
          }
        } else {
          navigate('/login');
        }
      } else if (!requireAuth && isAuthenticated) {
        navigate('/');
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, [isAuthenticated, requireAuth, navigate, dispatch]);

  // Show nothing while restoring session
  if (restoring || (requireAuth && !isAuthenticated && localStorage.getItem('authToken'))) {
    return null;
  }

  return <>{children}</>;
}; 
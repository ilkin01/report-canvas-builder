import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUserProfile } from '@/redux/slices/authSlice';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Index from './pages/Index';
import TemplateCreator from './pages/TemplateCreator';
import Editor from './pages/Editor';
import NotFound from './pages/NotFound';
import ReportCreator from './pages/report-creator';
import ReportUpdater from './pages/report-updater';
import Settings from './pages/Settings';
import SendFileToPatient from './pages/SendFileToPatient';
import UpdatePatientFile from './pages/UpdatePatientFile';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setToken } from '@/redux/slices/authSlice';

const AppRoutes = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const [checked, setChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const localToken = localStorage.getItem('authToken');
      if (localToken) {
        if (!isAuthenticated) {
          dispatch(setToken(localToken));
        }
        try {
          await dispatch(fetchUserProfile()).unwrap();
        } catch {
        }
      }
      setChecked(true);
    };
    check();
  }, [dispatch, isAuthenticated]);

  if (!checked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Index />} />
        <Route path="/template-creator" element={<TemplateCreator />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/report-creator" element={<ReportCreator />} />
        <Route path="/report-updater" element={<ReportUpdater />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/send-file-to-patient" element={<SendFileToPatient />} />
        <Route path="/update-patient-file/:id" element={<UpdatePatientFile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
};

export default AppRoutes; 
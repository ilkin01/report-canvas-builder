
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AuthGuard } from './components/AuthGuard';
import Login from "./pages/Login";
import Index from "./pages/Index";
import TemplateCreator from "./pages/TemplateCreator";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";
import ReportCreator from "./pages/report-creator";
import ReportUpdater from "./pages/report-updater";
import Settings from "./pages/Settings";
import SendFileToPatient from "./pages/SendFileToPatient";
import UpdatePatientFile from "./pages/UpdatePatientFile";
import './i18n/config';
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchUserProfile } from "@/redux/slices/authSlice";
import AppRoutes from "./AppRoutes";


const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>
);

export default App;

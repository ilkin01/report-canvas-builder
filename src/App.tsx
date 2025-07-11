
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import './i18n/config';

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            } />
            <Route path="/" element={
              <AuthGuard requireAuth={true}>
                <Index />
              </AuthGuard>
            } />
            <Route path="/template-creator" element={
              <AuthGuard requireAuth={true}>
                <TemplateCreator />
              </AuthGuard>
            } />
            <Route path="/editor" element={
              <AuthGuard requireAuth={true}>
                <Editor />
              </AuthGuard>
            } />
            <Route path="/report-creator" element={
              <AuthGuard requireAuth={true}>
                <ReportCreator />
              </AuthGuard>
            } />
            <Route path="/report-updater" element={<ReportUpdater />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;

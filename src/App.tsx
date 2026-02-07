import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { UsersPage } from '@/pages/UsersPage';
import { useAuthStore } from '@/features/auth/useAuthStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

import { Dashboard } from '@/features/dashboard/Dashboard';
import { ProjectList } from '@/features/projects/ProjectList';
import { ProjectDetails } from '@/features/projects/ProjectDetails';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { MeetingTimeline } from '@/features/meetings/MeetingTimeline';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      checkAuth(); // This will clear the state
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" expand={false} richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>


          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="meetings" element={<MeetingTimeline />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

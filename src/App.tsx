import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { MeetingList } from '@/features/meetings/components/MeetingList';
import { MeetingDetail } from '@/features/meetings/components/MeetingDetail';
import { MeetingUpload } from '@/features/meetings/components/MeetingUpload';
import { LiveMeeting } from '@/features/meetings/components/LiveMeeting';
import { WeeklyCalendar } from '@/features/meetings/components/WeeklyCalendar';

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
          <Route path="documents" element={<DocumentsPage />} />

          {/* Meeting Routes */}
          <Route path="meetings" element={<MeetingsPageLayout />} />
          <Route path="meetings/:id" element={<MeetingDetail />} />
          <Route path="meet/new" element={<LiveMeeting />} /> {/* New Live Meeting Route */}
          <Route path="meet/:id" element={<LiveMeeting />} /> {/* Join Scheduled Meeting */}

          <Route path="users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Simple layout wrapper for the main list page to include the Upload button/component
const MeetingsPageLayout = () => {
  const [showUpload, setShowUpload] = React.useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Meetings & Transcripts</h1>
        <div className="flex gap-2">
          <Link
            to="/meet/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>Start Live Meeting</span>
          </Link>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            {showUpload ? 'Cancel Upload' : 'Upload Request'}
          </button>
        </div>
      </div>

      {showUpload && (
        <MeetingUpload onUploadComplete={() => {
          setShowUpload(false);
          // Ideally force refresh list, but for now user can refresh or we rely on swr/react-query if we had it.
          // With simple useEffect in List, we might need to trigger reload. 
          window.location.reload();
        }} />
      )}

      <WeeklyCalendar />

      <MeetingList />
    </div>
  );
};
import React from 'react';

export default App;

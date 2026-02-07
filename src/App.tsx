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
import { ProjectDetails } from '@/features/projects/ProjectDetails';
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
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="documents" element={<DocumentsPage />} />

          {/* Meeting Routes */}
          <Route path="meetings" element={<MeetingsPageLayout />} />
          <Route path="meetings/:id" element={<MeetingDetail />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        {/* Full Screen Meeting Routes */}
        <Route path="meet/new" element={
          <ProtectedRoute>
            <LiveMeeting />
          </ProtectedRoute>
        } />
        <Route path="meet/:id" element={
          <ProtectedRoute>
            <LiveMeeting />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Simple layout wrapper for the main list page to include the Upload button/component
import { ScheduleMeetingModal } from '@/features/meetings/components/ScheduleMeetingModal';
import { Plus, Upload, Video } from 'lucide-react';

const MeetingsPageLayout = () => {
  const [showUpload, setShowUpload] = React.useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);

  return (
    <div className="space-y-10 relative">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Réunions & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Comptes-rendus</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
            Gérez vos visioconférences, retrouvez vos transcriptions intelligentes et collaborez efficacement avec votre équipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex-1 lg:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-all px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 group"
          >
            <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
              <Plus size={18} className="text-slate-600" />
            </div>
            Planifier
          </button>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex-1 lg:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-all px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 group"
          >
            <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
              <Upload size={18} className="text-slate-600" />
            </div>
            {showUpload ? 'Fermer' : 'Importer'}
          </button>

          <Link
            to="/meet/new"
            className="flex-1 lg:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2.5"
          >
            <Video size={20} className="fill-white/20" />
            <span>Démarrer maintenant</span>
          </Link>
        </div>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <MeetingUpload onUploadComplete={() => {
              setShowUpload(false);
              window.location.reload();
            }} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-10">
        <WeeklyCalendar />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-indigo-600"></div>
              Analyses & Enregistrements
            </h2>
            {/* Filter controls could go here */}
          </div>
          <MeetingList />
        </div>
      </div>

      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};
import React from 'react';

export default App;

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { UsersPage } from '@/pages/UsersPage';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { SessionTimeoutWarning } from '@/components/ui/SessionTimeoutWarning';
import { LoadingAnnouncer } from '@/lib/hooks/useLoadingAnnouncement';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';
import { useGlobalKeyboardShortcuts } from '@/lib/hooks/useGlobalKeyboardShortcuts';
import { TTSProvider } from '@/features/tts/TTSContext';
import { Plus, Upload, Video } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import React from 'react';

import { Dashboard } from '@/features/dashboard/Dashboard';
import { ProjectList } from '@/features/projects/ProjectList';
import { ProjectDetails } from '@/features/projects/ProjectDetails';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { MeetingList } from '@/features/meetings/components/MeetingList';
import { MeetingDetail } from '@/features/meetings/components/MeetingDetail';
import { MeetingUpload } from '@/features/meetings/components/MeetingUpload';
import { LiveMeeting } from '@/features/meetings/components/LiveMeeting';
import { WeeklyCalendar } from '@/features/meetings/components/WeeklyCalendar';
import { ScheduleMeetingModal } from '@/features/meetings/components/ScheduleMeetingModal';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Wrapper component inside Router to use keyboard shortcuts
const AppWithKeyboardShortcuts = () => {
  useGlobalKeyboardShortcuts();
  return null;
};

// Simple layout wrapper for the main list page to include the Upload button/component
const MeetingsPageLayout = () => {
  const [showUpload, setShowUpload] = React.useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  
  // Set page title
  usePageTitle('Meetings');

  return (
    <div className="space-y-10 relative">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Réunions & <span className="text-primary">Comptes-rendus</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Gérez vos visioconférences, retrouvez vos transcriptions intelligentes et collaborez efficacement avec votre équipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex-1 lg:flex-none bg-card hover:bg-accent text-foreground border border-border shadow-sm hover:shadow-md transition-all px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Planifier une nouvelle réunion"
          >
            <div className="p-1 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <Plus size={18} className="text-primary" aria-hidden="true" />
            </div>
            Planifier
          </button>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex-1 lg:flex-none bg-card hover:bg-accent text-foreground border border-border shadow-sm hover:shadow-md transition-all px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showUpload ? "Fermer le panneau d'import" : "Importer un enregistrement"}
            aria-expanded={showUpload}
          >
            <div className="p-1 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <Upload size={18} className="text-primary" aria-hidden="true" />
            </div>
            {showUpload ? 'Fermer' : 'Importer'}
          </button>

          <Link
            to="/meet/new"
            className="flex-1 lg:flex-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Démarrer une réunion maintenant"
          >
            <Video size={20} className="fill-primary-foreground/20" aria-hidden="true" />
            <span>Démarrer maintenant</span>
          </Link>
        </div>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-muted rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
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
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-primary"></div>
              Analyses & Enregistrements
            </h2>
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

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  // Initialize keyboard navigation tracking (doesn't need Router)
  useKeyboardNavigation();

  useEffect(() => {
    console.log('App useEffect: checkAuth called');
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
      <TTSProvider>
        {/* Global keyboard shortcuts handler (needs Router context) */}
        <AppWithKeyboardShortcuts />
        
        {/* Route Announcer for Screen Readers */}
        <div 
          id="route-announcer" 
          className="sr-only" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
        />
        
        {/* Loading Announcer for async operations */}
        <LoadingAnnouncer />
        
        {/* Session Timeout Warning */}
        <SessionTimeoutWarning />
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsModal />
        
        <Toaster position="top-right" expand={false} richColors closeButton />
        
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="documents" element={<DocumentsPage />} />
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
      </TTSProvider>
    </BrowserRouter>
  );
}

export default App;

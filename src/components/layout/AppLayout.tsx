import { Outlet, useLocation } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { TiliBot } from '@/features/bot/TiliBot';
import { AnimatedSidebar } from './AnimatedSidebar';
import { AccessibilityPanel } from '@/components/ui/AccessibilityPanel';
import { NotificationCenter } from '@/components/messages/NotificationCenter';
import { useMessagesStore } from '@/lib/messagesStore';
import { useAuthStore } from '@/lib/authStore';
import { useEffect, useState } from 'react';
import { TTSControls } from '@/features/tts/components/TTSControls';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

export const AppLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { token } = useAuthStore();
    const { connect, disconnect } = useMessagesStore();
    const { t } = useTranslation('common');

    // Connecter le WebSocket de messagerie au montage
    useEffect(() => {
        if (token) {
            connect(token);
        }
        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    // Map paths to readable titles
    const getPageTitle = (pathname: string) => {
        if (pathname === '/') return t('layout.pageTitle.overview');
        if (pathname === '/projects') return t('layout.pageTitle.projects');
        if (pathname === '/documents') return t('layout.pageTitle.documents');
        if (pathname === '/meetings') return t('layout.pageTitle.meetings');
        if (pathname === '/users') return t('layout.pageTitle.teamMembers');
        return t('layout.pageTitle.dashboard');
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden relative text-foreground font-sans">
            {/* Skip Navigation Link */}
            <a href="#main-content" className="skip-link">
                {t('layout.skipToMain')}
            </a>

            {/* Route Announcer for Screen Readers */}
            <div 
                id="route-announcer" 
                className="sr-only" 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
            />

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                    role="presentation"
                />
            )}

            {/* Desktop Sidebar - Always Visible, Arrow Collapses */}
            <div className="hidden md:flex flex-col">
                <AnimatedSidebar />
            </div>

            {/* Mobile Sidebar - Hidden Until Hamburger Clicked */}
            {mobileMenuOpen && (
                <div className="fixed top-0 left-0 h-screen z-50 md:hidden">
                    <AnimatedSidebar onMobileClose={() => setMobileMenuOpen(false)} isMobileOpen={mobileMenuOpen} />
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10 flex flex-col w-full">
                <header
                    className="border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 md:px-8"
                    role="banner"
                >
                    <div className="max-w-7xl mx-auto h-16 sm:h-20 flex items-center justify-between">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="flex-1 flex items-center gap-2 md:gap-3 text-muted-foreground ml-2 md:ml-0 min-w-0">
                            <span className="text-xs uppercase tracking-wider font-semibold hidden sm:inline">{t('layout.workspace')}</span>
                            <span className="text-muted-foreground/50 hidden sm:inline" aria-hidden="true">/</span>
                            <span className="text-sm sm:text-base text-foreground font-semibold truncate">
                                {getPageTitle(location.pathname)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                            <AccessibilityPanel />
                            <NotificationCenter />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 content-shell overflow-x-hidden" role="main">
                    <PageTransition className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
                        <Outlet />
                    </PageTransition>
                </div>
            </main>

            <TiliBot />
            <TTSControls />
        </div>
    );
};

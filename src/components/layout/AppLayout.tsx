import { Outlet, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { TiliBot } from '@/features/bot/TiliBot';
import { AnimatedSidebar } from './AnimatedSidebar';
import { NotificationPopOver } from '@/features/notifications/components/NotificationPopOver';
import { AccessibilityPanel } from '@/components/ui/AccessibilityPanel';
import { NotificationCenter } from '@/components/messages/NotificationCenter';
import { useMessagesStore } from '@/lib/messagesStore';
import { useAuthStore } from '@/lib/authStore';
import { useEffect } from 'react';

export const AppLayout = () => {
    const location = useLocation();
    const { token } = useAuthStore();
    const { connect, disconnect } = useMessagesStore();

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
        if (pathname === '/') return 'Overview';
        if (pathname === '/projects') return 'Projects';
        if (pathname === '/documents') return 'Documents';
        if (pathname === '/meetings') return 'Meetings';
        if (pathname === '/users') return 'Team Members';
        return 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden relative text-foreground font-sans">
            {/* Skip Navigation Link */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Route Announcer for Screen Readers */}
            <div 
                id="route-announcer" 
                className="sr-only" 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
            />

            <AnimatedSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10 flex flex-col">
                <header
                    className="h-20 border-b border-border/70 flex items-center justify-between px-8 bg-card/80 backdrop-blur-md sticky top-0 z-30"
                    role="banner"
                >
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-xs uppercase tracking-wider font-semibold">Workspace</span>
                        <span className="text-muted-foreground/50" aria-hidden="true">/</span>
                        <span className="text-base text-foreground font-semibold">
                            {getPageTitle(location.pathname)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <form
                            role="search"
                            aria-label="Site search"
                            className="hidden md:flex items-center h-10 px-3 rounded-lg bg-background border border-input text-muted-foreground text-sm w-72 hover:border-ring/40 transition-colors group focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <Search size={16} className="mr-2 group-focus-within:text-primary transition-colors" aria-hidden="true" />
                            <label htmlFor="global-search" className="sr-only">
                                Search workspace
                            </label>
                            <input
                                id="global-search"
                                type="search"
                                className="bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/70"
                                placeholder="Search..."
                                aria-label="Search workspace"
                                aria-describedby="search-shortcut"
                            />
                            <span
                                id="search-shortcut"
                                className="ml-auto text-[10px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border font-mono"
                                aria-label="Keyboard shortcut: Command K or Control K"
                            >
                                ⌘K
                            </span>
                        </form>

                        <AccessibilityPanel />
                        <NotificationCenter />
                        <ThemeToggle />
                        <NotificationPopOver />
                    </div>
                </header>

                <div id="main-content" className="flex-1 p-6 md:p-8 content-shell" role="main">
                    <PageTransition className="max-w-7xl mx-auto w-full space-y-8">
                        <Outlet />
                    </PageTransition>
                </div>
            </main>

            <TiliBot />
        </div>
    );
};

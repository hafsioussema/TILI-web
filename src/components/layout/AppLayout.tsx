import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { AnimatedSidebar } from './AnimatedSidebar';

export const AppLayout = () => {
    const location = useLocation();

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
            <AnimatedSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10 flex flex-col">
                <header className="h-16 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="text-sm font-medium">Workspace</span>
                        <span className="text-muted-foreground/50">/</span>
                        <span className="text-sm text-foreground font-semibold">
                            {getPageTitle(location.pathname)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center h-9 px-3 rounded-md bg-secondary/50 border border-input text-muted-foreground text-sm w-64 hover:border-ring/30 transition-colors cursor-text group focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/20">
                            <Search size={14} className="mr-2 group-focus-within:text-primary transition-colors" />
                            <input
                                className="bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/70"
                                placeholder="Search..."
                            />
                            <span className="ml-auto text-[10px] bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground border border-border font-mono">⌘K</span>
                        </div>

                        <ThemeToggle />

                        <button className="h-9 w-9 rounded-full hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-background"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-8">
                    <PageTransition className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </PageTransition>
                </div>
            </main>
        </div>
    );
};

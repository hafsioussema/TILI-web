import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Users, LayoutDashboard, LogOut, ChevronRight, Command, Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/features/theme/ThemeToggle';

export const AppLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/users', label: 'Team Members', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden relative text-foreground">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 260 : 72 }}
                className="relative z-20 flex flex-col border-r border-border bg-[hsl(var(--sidebar-bg))] transition-all duration-300 ease-[0.22, 1, 0.36, 1]"
            >
                <div className="h-16 flex items-center px-4 border-b border-border/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-black font-bold shrink-0">
                            <Command size={18} />
                        </div>
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="whitespace-nowrap"
                                >
                                    <h1 className="text-sm font-semibold text-white tracking-wide">
                                        TILI <span className="text-gray-500 font-normal">Workspace</span>
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1 mt-2">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => cn(
                                "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />

                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -5 }}
                                                className="ml-3 text-sm whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-border/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
                        title="Logout"
                    >
                        <LogOut size={18} className="shrink-0" />
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="ml-3 text-sm font-medium overflow-hidden whitespace-nowrap"
                                >
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    {isSidebarOpen && (
                        <div className="mt-4 px-2 py-3 bg-secondary/50 rounded-xl border border-border flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                {user?.prenom?.[0]}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-medium text-foreground truncate">{user?.prenom} {user?.nom}</p>
                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user?.role}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-8 h-6 w-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all z-50 cursor-pointer shadow-sm"
                >
                    <ChevronRight size={12} className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")} />
                </button>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10">
                <header className="h-16 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4 text-gray-500">
                        <span className="text-sm">Workspace</span>
                        <span className="text-gray-700">/</span>
                        <span className="text-sm text-white">
                            {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center h-9 px-3 rounded-md bg-secondary/50 border border-input text-muted-foreground text-sm w-64 hover:border-ring/30 transition-colors cursor-text">
                            <Search size={14} className="mr-2" />
                            <span>Search...</span>
                            <span className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground border border-border">⌘K</span>
                        </div>

                        <ThemeToggle />

                        <button className="h-9 w-9 rounded-full hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                            <Bell size={18} />
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

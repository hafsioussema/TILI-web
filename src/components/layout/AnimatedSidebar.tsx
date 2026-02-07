import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Users, LayoutDashboard, LogOut, ChevronRight, Command, FolderKanban, FileText, Calendar } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '@/types';

export const AnimatedSidebar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        {
            path: '/',
            label: 'Overview',
            icon: LayoutDashboard,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET, UserRole.CONSULTANT]
        },
        {
            path: '/projects',
            label: 'Projects',
            icon: FolderKanban,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET]
        },
        {
            path: '/documents',
            label: 'Documents',
            icon: FileText,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET, UserRole.CONSULTANT]
        },
        {
            path: '/meetings',
            label: 'Meetings',
            icon: Calendar,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET, UserRole.CONSULTANT]
        },
        {
            path: '/users',
            label: 'Team Members',
            icon: Users,
            roles: [UserRole.ADMIN]
        },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarOpen ? 268 : 72 }}
            className="relative z-20 flex flex-col border-r border-border/70 bg-[hsl(var(--sidebar-bg))] transition-all duration-300 ease-[0.22, 1, 0.36, 1]"
            role="complementary"
            aria-label="Sidebar navigation"
        >
            <div className="h-20 flex items-center px-4 border-b border-border/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
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
                                <h1 className="text-sm font-semibold text-foreground tracking-wide">
                                    TILI <span className="text-muted-foreground font-normal">Workspace</span>
                                </h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="px-4 pt-4 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Navigation
            </div>
            <nav className="flex-1 p-3 space-y-2 mt-1" aria-label="Main navigation">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => cn(
                            "group flex items-center px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden border",
                            isActive
                                ? "bg-primary/12 text-primary font-semibold border-primary/30 shadow-sm"
                                : "text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />

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
                    className="w-full flex items-center p-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group cursor-pointer border border-transparent hover:border-destructive/30"
                    aria-label="Sign out from workspace"
                    title="Sign out"
                >
                    <LogOut size={18} className="shrink-0" aria-hidden="true" />
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

                {isSidebarOpen && user && (
                    <div className="mt-4 px-3 py-3 bg-card rounded-xl border border-border/70 flex items-center gap-3" role="status" aria-label="Current user information">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-xs font-bold text-white" aria-hidden="true">
                            {user.prenom?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-foreground truncate">{user.prenom} {user.nom}</p>
                            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user.role}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-10 h-7 w-7 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all z-50 cursor-pointer shadow-sm"
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-expanded={isSidebarOpen}
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
                <ChevronRight size={12} className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")} aria-hidden="true" />
            </button>
        </motion.aside>
    );
};

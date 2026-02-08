import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Users, LayoutDashboard, LogOut, ChevronRight, Command, FolderKanban, FileText, Calendar, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@/types';
import { ProfileSettingsModal } from '@/components/ui/ProfileSettingsModal';

interface AnimatedSidebarProps {
    onMobileClose?: () => void;
    isMobileOpen?: boolean;
}

export const AnimatedSidebar = ({ onMobileClose, isMobileOpen }: AnimatedSidebarProps) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { t } = useTranslation('common');

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        // On mobile, close sidebar after clicking a nav item
        if (isMobile && isMobileOpen) {
            onMobileClose?.();
        }
    };

    const menuItems = [
        {
            path: '/',
            label: t('nav.overview'),
            icon: LayoutDashboard,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET, UserRole.CONSULTANT]
        },
        {
            path: '/projects',
            label: t('nav.projects'),
            icon: FolderKanban,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET]
        },
        {
            path: '/documents',
            label: t('nav.documents'),
            icon: FileText,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET, UserRole.CONSULTANT]
        },
        {
            path: '/meetings',
            label: t('nav.meetings'),
            icon: Calendar,
            roles: [UserRole.ADMIN, UserRole.CHEF_PROJET, UserRole.CONSULTANT]
        },
        {
            path: '/users',
            label: t('nav.teamMembers'),
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
            animate={{ width: isMobile ? 268 : (isSidebarOpen ? 268 : 72) }}
            className="relative z-20 flex flex-col border-r border-border/70 bg-[hsl(var(--sidebar-bg))] transition-all duration-300 ease-[0.22, 1, 0.36, 1]"
            role="complementary"
            aria-label={t('nav.sidebarAria')}
        >
            <div className="h-20 flex items-center px-4 border-b border-border/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        <Command size={18} />
                    </div>
                    <AnimatePresence>
                        {(isSidebarOpen || isMobile) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="whitespace-nowrap"
                            >
                                <h1 className="text-sm font-semibold text-foreground tracking-wide">
                                    TILI <span className="text-muted-foreground font-normal">{t('app.workspace')}</span>
                                </h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="px-4 pt-4 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t('nav.navigation')}
            </div>
            <nav className="flex-1 p-3 space-y-2 mt-1" aria-label="Main navigation">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={handleNavClick}
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
                                    {(isSidebarOpen || isMobile) && (
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
                    aria-label={t('nav.signOut')}
                    title={t('nav.signOutTitle')}
                >
                    <LogOut size={18} className="shrink-0" aria-hidden="true" />
                    <AnimatePresence>
                        {(isSidebarOpen || isMobile) && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="ml-3 text-sm font-medium overflow-hidden whitespace-nowrap"
                            >
                                {t('nav.signOut')}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {(isSidebarOpen || isMobile) && user && (
                    <div className="mt-4 px-3 py-3 bg-card rounded-xl border border-border/70 flex items-center gap-3" role="status" aria-label="Current user information">
                        <button 
                            onClick={() => setShowProfileModal(true)}
                            className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                            aria-hidden="true"
                            title={t('nav.profileEditTitle')}
                        >
                            {user.avatar ? (
                                <img 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.avatar}`}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                user.prenom?.[0]
                            )}
                        </button>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">{user.prenom} {user.nom}</p>
                            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user.role}</p>
                        </div>
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title={t('nav.profileSettingsTitle')}
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Settings Modal */}
            <ProfileSettingsModal 
                isOpen={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
            />

            {/* Toggle Button - Desktop: Collapse | Mobile: Hidden */}
            {!isMobile && (
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="hidden md:flex absolute -right-3 top-10 h-7 w-7 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all z-50 cursor-pointer shadow-sm"
                    aria-label={isSidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                    aria-expanded={isSidebarOpen}
                    title={isSidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                >
                    <ChevronRight size={12} className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")} aria-hidden="true" />
                </button>
            )}
        </motion.aside>
    );
};

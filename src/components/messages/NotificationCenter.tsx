import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    AtSign,
    MessageCircle,
    CheckCheck,
    X,
    Volume2,
    VolumeX,
    Calendar,
    AlertTriangle,
    Info,
    Clock,
} from 'lucide-react';
import { useMessagesStore } from '@/lib/messagesStore';
import type { Message } from '@/types/messages';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notificationService, type Notification } from '@/features/notifications/services/notificationService';

export function NotificationCenter() {
    const {
        unreadCounts,
        unreadMentions,
        loadUnreadCounts,
        loadUnreadMentions,
        markMessagesAsRead,
        openProjectChat,
    } = useMessagesStore();

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'notifications'>('all');
    const [isMuted, setIsMuted] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const panelRef = useRef<HTMLDivElement>(null);

    // Total des non lus
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    const totalUnread = unreadCounts.reduce((sum, c) => sum + c.count, 0) + unreadMentions.length + unreadNotifications;

    // Charger les notifications de système
    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Charger les données
    useEffect(() => {
        loadUnreadCounts();
        loadUnreadMentions();
        fetchNotifications();
        
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(() => {
            loadUnreadCounts();
            loadUnreadMentions();
            fetchNotifications();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [loadUnreadCounts, loadUnreadMentions]);

    // Fermer en cliquant ailleurs
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMentionClick = (mention: Message) => {
        if (mention.projectId) {
            openProjectChat(mention.projectId.toString());
        }
        markMessagesAsRead([mention._id]);
        setIsOpen(false);
    };

    const handleProjectClick = (projectId: string) => {
        openProjectChat(projectId);
        setIsOpen(false);
    };

    const handleMarkAllRead = () => {
        const mentionIds = unreadMentions.map(m => m._id);
        if (mentionIds.length > 0) {
            markMessagesAsRead(mentionIds);
        }
        loadUnreadMentions();
    };

    const handleMarkNotificationAsRead = async (id: string, link?: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            if (link) {
                window.location.href = link;
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleMarkAllNotificationsAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bouton */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-11 w-11 rounded-xl hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                aria-label={`Notifications. ${totalUnread} unread notification${totalUnread !== 1 ? 's' : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {totalUnread > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-background text-[10px] text-white font-bold leading-none">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/20">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" aria-hidden="true" />
                                <h3 className="font-semibold text-foreground">
                                    Notifications
                                </h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-1.5 hover:bg-secondary/80 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                                    title={isMuted ? 'Activer les sons' : 'Couper les sons'}
                                    aria-label={isMuted ? 'Activer les sons' : 'Couper les sons'}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-4 h-4" aria-hidden="true" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-secondary/80 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                                    title="Fermer les notifications"
                                    aria-label="Fermer les notifications"
                                >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-border px-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 py-2.5 text-sm font-medium transition-colors px-4 rounded-t-xl ${
                                    activeTab === 'all'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                                    Messages
                                    {unreadCounts.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                            {unreadCounts.reduce((sum, c) => sum + c.count, 0)}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('mentions')}
                                className={`flex-1 py-2.5 text-sm font-medium transition-colors px-4 rounded-t-xl ${
                                    activeTab === 'mentions'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <AtSign className="w-4 h-4" aria-hidden="true" />
                                    Mentions
                                    {unreadMentions.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                            {unreadMentions.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`flex-1 py-2.5 text-sm font-medium transition-colors px-4 rounded-t-xl ${
                                    activeTab === 'notifications'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <Bell className="w-4 h-4" aria-hidden="true" />
                                    Notifications
                                    {unreadNotifications > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                            {unreadNotifications}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50">
                            {activeTab === 'all' ? (
                                <UnreadMessagesList 
                                    unreadCounts={unreadCounts}
                                    onProjectClick={handleProjectClick}
                                />
                            ) : activeTab === 'mentions' ? (
                                <MentionsList 
                                    mentions={unreadMentions}
                                    onMentionClick={handleMentionClick}
                                />
                            ) : (
                                <NotificationsList
                                    notifications={notifications}
                                    onMarkAsRead={handleMarkNotificationAsRead}
                                    onDelete={handleDeleteNotification}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        {activeTab === 'mentions' && unreadMentions.length > 0 && (
                            <div className="px-4 py-2 border-t border-border bg-secondary/20">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                                    aria-label="Mark all mentions as read"
                                >
                                    <CheckCheck className="w-4 h-4" aria-hidden="true" />
                                    Tout marquer comme lu
                                </button>
                            </div>
                        )}
                        {activeTab === 'notifications' && unreadNotifications > 0 && (
                            <div className="px-4 py-2 border-t border-border bg-secondary/20">
                                <button
                                    onClick={handleMarkAllNotificationsAsRead}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                                    aria-label="Mark all notifications as read"
                                >
                                    <CheckCheck className="w-4 h-4" aria-hidden="true" />
                                    Tout marquer comme lu
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface UnreadMessagesListProps {
    unreadCounts: { projectId: string; count: number }[];
    onProjectClick: (projectId: string) => void;
}

function UnreadMessagesList({ unreadCounts, onProjectClick }: UnreadMessagesListProps) {
    if (unreadCounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" role="listitem">
                <MessageCircle className="w-12 h-12 mb-2 opacity-30" aria-hidden="true" />
                <p className="text-sm">Aucun message non lu</p>
            </div>
        );
    }

    return (
        <>
            {unreadCounts.map(({ projectId, count }) => (
                <button
                    key={projectId}
                    onClick={() => onProjectClick(projectId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    role="listitem"
                >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            Projet
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {count} message{count > 1 ? 's' : ''} non lu{count > 1 ? 's' : ''}
                        </p>
                    </div>
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex-shrink-0">
                        {count}
                    </span>
                </button>
            ))}
        </>
    );
}

interface MentionsListProps {
    mentions: Message[];
    onMentionClick: (mention: Message) => void;
}

function MentionsList({ mentions, onMentionClick }: MentionsListProps) {
    if (mentions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" role="listitem">
                <AtSign className="w-12 h-12 mb-2 opacity-30" aria-hidden="true" />
                <p className="text-sm">Aucune mention</p>
            </div>
        );
    }

    return (
        <>
            {mentions.map((mention) => {
                const timeAgo = formatDistanceToNow(new Date(mention.createdAt), { 
                    addSuffix: true,
                    locale: fr,
                });
                const sender = mention.senderId;

                return (
                    <button
                        key={mention._id}
                        onClick={() => onMentionClick(mention)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                        role="listitem"
                    >
                        {sender.avatar ? (
                            <img
                                src={sender.avatar}
                                alt={sender.prenom}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                    {sender.prenom[0]}{sender.nom[0]}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-foreground">
                                    {sender.prenom} {sender.nom}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {timeAgo}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                vous a mentionné: "{mention.content.slice(0, 100)}..."
                            </p>
                        </div>
                        <AtSign className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                    </button>
                );
            })}
        </>

    );
}

interface NotificationsListProps {
    notifications: Notification[];
    onMarkAsRead: (id: string, link?: string) => void;
    onDelete: (id: string) => void;
}

function NotificationsList({ notifications, onMarkAsRead, onDelete }: NotificationsListProps) {
    const getTypeMeta = (type: string) => {
        switch (type) {
            case 'INVITATION':
                return {
                    label: 'Invitation',
                    icon: <Calendar className="w-4 h-4 text-primary" />,
                    badge: 'bg-primary/10 text-primary border-primary/20'
                };
            case 'UPDATE':
                return {
                    label: 'Update',
                    icon: <Info className="w-4 h-4 text-primary" />,
                    badge: 'bg-primary/10 text-primary border-primary/20'
                };
            case 'CANCELLATION':
                return {
                    label: 'Cancellation',
                    icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
                    badge: 'bg-destructive/10 text-destructive border-destructive/20'
                };
            case 'REMINDER':
                return {
                    label: 'Reminder',
                    icon: <Clock className="w-4 h-4 text-primary" />,
                    badge: 'bg-primary/10 text-primary border-primary/20'
                };
            default:
                return {
                    label: 'General',
                    icon: <Bell className="w-4 h-4 text-muted-foreground" />,
                    badge: 'bg-secondary/50 text-muted-foreground border-border'
                };
        }
    };

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" role="listitem">
                <Bell className="w-12 h-12 mb-2 opacity-30" aria-hidden="true" />
                <p className="text-sm">Pas de notifications pour le moment</p>
            </div>
        );
    }

    return (
        <>
            {notifications.map((notif) => {
                const typeMeta = getTypeMeta(notif.type);
                const timeAgo = formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                    locale: fr,
                });

                return (
                    <div
                        key={notif.id}
                        className={`p-4 hover:bg-secondary/50 transition-colors group relative ${!notif.isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => onMarkAsRead(notif.id, notif.link)}
                        role="listitem"
                    >
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {typeMeta.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm truncate text-foreground ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                                        {notif.title}
                                    </h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {timeAgo}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {notif.message}
                                </p>
                                <div className="flex gap-2 items-center flex-wrap">
                                    <span className={`inline-flex items-center text-[10px] rounded-full border px-2 py-0.5 font-semibold ${typeMeta.badge}`}>
                                        {typeMeta.label}
                                    </span>
                                    <span className={`inline-flex items-center text-[10px] rounded-full border px-2 py-0.5 font-semibold ${notif.isRead ? 'bg-secondary/50 text-muted-foreground border-border' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                        {notif.isRead ? 'Lu' : 'Non lu'}
                                    </span>
                                </div>
                                {notif.link && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkAsRead(notif.id, notif.link);
                                        }}
                                        className="inline-flex text-[10px] font-bold text-primary hover:underline mt-2"
                                    >
                                        Voir les détails →
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                                title="Supprimer"
                                aria-label="Supprimer la notification"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </>
    );
}

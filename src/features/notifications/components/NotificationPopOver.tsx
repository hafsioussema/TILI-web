import React, { useEffect, useState, useRef } from 'react';
import { Bell, Calendar, AlertTriangle, Info, Clock, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import { Link } from 'react-router-dom';

export const NotificationPopOver: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            await notificationService.deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getTypeMeta = (type: string) => {
        switch (type) {
            case 'INVITATION':
                return {
                    label: 'Invitation',
                    icon: <Calendar className="w-4 h-4 text-blue-500" aria-hidden="true" />,
                    badge: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800'
                };
            case 'UPDATE':
                return {
                    label: 'Update',
                    icon: <Info className="w-4 h-4 text-amber-500" aria-hidden="true" />,
                    badge: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-800'
                };
            case 'CANCELLATION':
                return {
                    label: 'Cancellation',
                    icon: <AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />,
                    badge: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800'
                };
            case 'REMINDER':
                return {
                    label: 'Reminder',
                    icon: <Clock className="w-4 h-4 text-emerald-500" aria-hidden="true" />,
                    badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800'
                };
            default:
                return {
                    label: 'General',
                    icon: <Bell className="w-4 h-4 text-slate-500" aria-hidden="true" />,
                    badge: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-800'
                };
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-11 w-11 rounded-xl hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative border border-transparent hover:border-border"
                aria-label={`Notifications. ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <Bell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-background text-[10px] text-white font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-80 md:w-96 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                    role="dialog"
                    aria-label="Notifications panel"
                    aria-modal="false"
                >
                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-sm">Notifications</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Vous avez {unreadCount} messages non lus</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-bold text-primary hover:underline"
                                aria-label="Mark all notifications as read"
                            >
                                Tout lire
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50" role="list" aria-label="Notification list">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground" role="listitem">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" aria-hidden="true" />
                                <p className="text-sm">Pas de notifications pour le moment</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const typeMeta = getTypeMeta(notif.type);
                                const statusLabel = notif.isRead ? 'Read' : 'Unread';

                                return (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors group relative ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    role="listitem"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleMarkAsRead(notif.id);
                                        }
                                    }}
                                    aria-label={`${notif.title}. ${notif.message}. ${!notif.isRead ? 'Unread' : 'Read'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {typeMeta.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={`text-sm leading-tight truncate pr-4 ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>{notif.title}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notif.message}</p>

                                            <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${typeMeta.badge}`}>
                                                    {typeMeta.label}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${notif.isRead ? 'bg-secondary text-muted-foreground border-border' : 'bg-primary/10 text-primary border-primary/30'}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>

                                            {notif.link && (
                                                <Link
                                                    to={notif.link}
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        handleMarkAsRead(notif.id);
                                                    }}
                                                    className="inline-flex items-center text-[10px] font-bold text-primary hover:underline"
                                                >
                                                    Voir les détails
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDelete(notif.id, e)}
                                        className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-background border border-border transition-all text-muted-foreground hover:text-red-500"
                                        aria-label="Delete notification"
                                        title="Delete notification"
                                    >
                                        <X size={12} aria-hidden="true" />
                                    </button>
                                </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-2 border-t border-border bg-muted/10 text-center">
                            <span className="text-[10px] text-muted-foreground">TILI Workspace Notifications</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

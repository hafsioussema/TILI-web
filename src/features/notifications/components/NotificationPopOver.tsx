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

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'INVITATION': return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'UPDATE': return <Info className="w-4 h-4 text-amber-500" />;
            case 'CANCELLATION': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'REMINDER': return <Clock className="w-4 h-4 text-purple-500" />;
            default: return <Bell className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 rounded-full hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-background text-[10px] text-white font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-sm">Notifications</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Vous avez {unreadCount} messages non lus</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-bold text-primary hover:underline"
                            >
                                Tout lire
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Pas de notifications pour le moment</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors group relative ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={`text-sm leading-tight truncate pr-4 ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>{notif.title}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notif.message}</p>

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
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))
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

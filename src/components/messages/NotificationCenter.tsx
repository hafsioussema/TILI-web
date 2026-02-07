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
} from 'lucide-react';
import { useMessagesStore } from '@/lib/messagesStore';
import type { Message } from '@/types/messages';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
    const [isMuted, setIsMuted] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Total des non lus
    const totalUnread = unreadCounts.reduce((sum, c) => sum + c.count, 0) + unreadMentions.length;

    // Charger les données
    useEffect(() => {
        loadUnreadCounts();
        loadUnreadMentions();
        
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(() => {
            loadUnreadCounts();
            loadUnreadMentions();
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
        // Recharger
        loadUnreadMentions();
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bouton */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
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
                        className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Notifications
                                </h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title={isMuted ? 'Activer les sons' : 'Couper les sons'}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Volume2 className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Fermer les notifications"
                                    aria-label="Fermer les notifications"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'all'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    Messages
                                    {unreadCounts.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                                            {unreadCounts.reduce((sum, c) => sum + c.count, 0)}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('mentions')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'mentions'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <AtSign className="w-4 h-4" />
                                    Mentions
                                    {unreadMentions.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                                            {unreadMentions.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {activeTab === 'all' ? (
                                <UnreadMessagesList 
                                    unreadCounts={unreadCounts}
                                    onProjectClick={handleProjectClick}
                                />
                            ) : (
                                <MentionsList 
                                    mentions={unreadMentions}
                                    onMentionClick={handleMentionClick}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        {activeTab === 'mentions' && unreadMentions.length > 0 && (
                            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4" />
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
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Aucun message non lu</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {unreadCounts.map(({ projectId, count }) => (
                <button
                    key={projectId}
                    onClick={() => onProjectClick(projectId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            Projet
                        </p>
                        <p className="text-xs text-gray-500">
                            {count} message{count > 1 ? 's' : ''} non lu{count > 1 ? 's' : ''}
                        </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {count}
                    </span>
                </button>
            ))}
        </div>
    );
}

interface MentionsListProps {
    mentions: Message[];
    onMentionClick: (mention: Message) => void;
}

function MentionsList({ mentions, onMentionClick }: MentionsListProps) {
    if (mentions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <AtSign className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Aucune mention</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                        {sender.avatar ? (
                            <img
                                src={sender.avatar}
                                alt={sender.prenom}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {sender.prenom[0]}{sender.nom[0]}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {sender.prenom} {sender.nom}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {timeAgo}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                vous a mentionné: "{mention.content.slice(0, 100)}..."
                            </p>
                        </div>
                        <AtSign className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    </button>
                );
            })}
        </div>
    );
}

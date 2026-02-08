import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Send, 
    MessageCircle,
    Users,
} from 'lucide-react';
import { useMessagesStore } from '@/lib/messagesStore';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { Message } from '@/types/messages';
import { MentionInput } from './MentionInput';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ProjectChatPanelProps {
    projectId: string;
    projectName: string;
    members?: { _id: string; nom: string; prenom: string; avatar?: string }[];
}

export function ProjectChatPanel({ projectId, projectName, members = [] }: ProjectChatPanelProps) {
    const { user } = useAuthStore();
    const {
        messages,
        typingUsers,
        isChatPanelOpen,
        isLoading,
        openProjectChat,
        closeProjectChat,
        sendMessage,
        markMessagesAsRead,
        sendTypingIndicator,
    } = useMessagesStore();

    const [messageInput, setMessageInput] = useState('');
    const [mentions, setMentions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const projectMessages = useMemo(() => messages[projectId] || [], [messages, projectId]);
    const currentTypingUsers = typingUsers[projectId]?.filter(u => u.userId !== user?.id) || [];

    // Ouvrir le chat quand le panel s'ouvre
    useEffect(() => {
        if (isChatPanelOpen && projectId) {
            openProjectChat(projectId);
        }
    }, [isChatPanelOpen, projectId, openProjectChat]);

    // Scroll vers le bas quand de nouveaux messages arrivent
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [projectMessages]);

    // Marquer les messages comme lus
    useEffect(() => {
        if (projectMessages.length > 0 && user) {
            const unreadIds = projectMessages
                .filter(m => !m.readBy.includes(user.id) && m.senderId._id !== user.id)
                .map(m => m._id);
            
            if (unreadIds.length > 0) {
                markMessagesAsRead(unreadIds);
            }
        }
    }, [projectMessages, user, markMessagesAsRead]);

    // Gestion de la frappe
    const handleInputChange = useCallback((value: string, mentionIds: string[]) => {
        setMessageInput(value);
        setMentions(mentionIds);
        
        // Envoyer l'indicateur de frappe
        sendTypingIndicator(true);
        
        // Annuler le timeout précédent
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Arrêter l'indicateur après 2s d'inactivité
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingIndicator(false);
        }, 2000);
    }, [sendTypingIndicator]);

    const handleSend = async () => {
        if (!messageInput.trim()) return;
        
        await sendMessage(messageInput, mentions);
        setMessageInput('');
        setMentions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isChatPanelOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-16 bottom-0 w-96 bg-card border-l border-border shadow-2xl z-40 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-muted">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {projectName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                <Users className="w-3 h-3" />
                                <span>{members.length} membre{members.length > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={closeProjectChat}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Fermer le chat"
                        aria-label="Fermer le chat"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted">
                    {isLoading && projectMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                        </div>
                    ) : projectMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                                <MessageCircle className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Aucun message</p>
                            <p className="text-xs text-muted-foreground mt-1">Commencez la conversation !</p>
                        </div>
                    ) : (
                        projectMessages.map((message) => (
                            <ChatMessage 
                                key={message._id} 
                                message={message} 
                                isOwnMessage={message.senderId._id === user?.id}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {currentTypingUsers.length > 0 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 bg-muted">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                        <span>
                            {currentTypingUsers.map(u => u.userName).join(', ')} {currentTypingUsers.length === 1 ? 'écrit' : 'écrivent'}...
                        </span>
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border bg-card backdrop-blur-sm">
                    <MentionInput
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        members={members}
                        placeholder="Écrire un message... (@pour mentionner)"
                    />
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleSend}
                            disabled={!messageInput.trim()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Send className="w-4 h-4" />
                            Envoyer
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

interface ChatMessageProps {
    message: Message;
    isOwnMessage: boolean;
}

function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
    const sender = message.senderId;
    const timeAgo = formatDistanceToNow(new Date(message.createdAt), { 
        addSuffix: true,
        locale: fr,
    });

    // Parser le contenu pour afficher les mentions
    const renderContent = (content: string) => {
        const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Ajouter le texte avant la mention
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index));
            }
            // Ajouter la mention stylisée
            parts.push(
                <span 
                    key={match.index} 
                    className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium"
                >
                    @{match[1]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }

        // Ajouter le reste du texte
        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    // Obtenir les initiales
    const getInitials = () => {
        const firstInitial = sender.prenom?.[0] || '';
        const lastInitial = sender.nom?.[0] || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    // Construire l'URL de l'avatar
    const getAvatarUrl = () => {
        if (!sender.avatar) return null;
        if (sender.avatar.startsWith('http')) return sender.avatar;
        return `${API_URL}${sender.avatar}`;
    };

    const avatarUrl = getAvatarUrl();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={`${sender.prenom} ${sender.nom}`}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center ring-2 ring-border">
                        <span className="text-xs font-bold text-white">{getInitials()}</span>
                    </div>
                )}
            </div>

            {/* Message content */}
            <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : ''}`}>
                <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-foreground">
                        {sender.prenom} {sender.nom}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                </div>
                <div 
                    className={`px-4 py-2.5 rounded-2xl ${
                        isOwnMessage 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {renderContent(message.content)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

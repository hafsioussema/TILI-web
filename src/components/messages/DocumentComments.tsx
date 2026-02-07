import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Send, 
    MessageSquare,
    Check,
    CheckCheck,
    CornerDownRight,
    User,
} from 'lucide-react';
import { useMessagesStore } from '@/lib/messagesStore';
import { useAuthStore } from '@/features/auth/useAuthStore';
import type { Message } from '@/types/messages';
import { MentionInput } from './MentionInput';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentCommentsProps {
    documentId: string;
    documentName: string;
    projectMembers?: { _id: string; nom: string; prenom: string; avatar?: string }[];
}

export function DocumentComments({ documentId, documentName, projectMembers = [] }: DocumentCommentsProps) {
    const { user } = useAuthStore();
    const {
        messages,
        isDocumentCommentsOpen,
        isLoading,
        openDocumentComments,
        closeDocumentComments,
        sendMessage,
        resolveComment,
        markMessagesAsRead,
    } = useMessagesStore();

    const [messageInput, setMessageInput] = useState('');
    const [mentions, setMentions] = useState<string[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const comments = useMemo(() => messages[documentId] || [], [messages, documentId]);

    // Ouvrir les commentaires
    useEffect(() => {
        if (isDocumentCommentsOpen && documentId) {
            openDocumentComments(documentId);
        }
    }, [isDocumentCommentsOpen, documentId, openDocumentComments]);

    // Scroll vers le bas
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    // Marquer comme lus
    useEffect(() => {
        if (comments.length > 0 && user) {
            const unreadIds = comments
                .filter(c => !c.readBy.includes(user.id) && c.senderId._id !== user.id)
                .map(c => c._id);
            
            if (unreadIds.length > 0) {
                markMessagesAsRead(unreadIds);
            }
        }
    }, [comments, user, markMessagesAsRead]);

    const handleInputChange = (value: string, mentionIds: string[]) => {
        setMessageInput(value);
        setMentions(mentionIds);
    };

    const handleSend = async () => {
        if (!messageInput.trim()) return;
        
        await sendMessage(messageInput, mentions, replyingTo?._id);
        setMessageInput('');
        setMentions([]);
        setReplyingTo(null);
    };

    const handleResolve = async (commentId: string) => {
        await resolveComment(commentId);
    };

    const toggleThread = (messageId: string) => {
        setExpandedThreads(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    // Séparer les commentaires résolus et non résolus
    const unresolvedComments = comments.filter(c => !c.isResolved && !c.parentId);
    const resolvedComments = comments.filter(c => c.isResolved && !c.parentId);

    if (!isDocumentCommentsOpen) return null;

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-16 bottom-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            Commentaires
                        </h3>
                        <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                            {documentName}
                        </span>
                    </div>
                </div>
                <button
                    onClick={closeDocumentComments}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Fermer les commentaires"
                    aria-label="Fermer les commentaires"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Stats */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex gap-4 text-xs">
                <span className="text-orange-600 font-medium">
                    {unresolvedComments.length} non résolus
                </span>
                <span className="text-green-600 font-medium">
                    {resolvedComments.length} résolus
                </span>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading && comments.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm">Aucun commentaire</p>
                        <p className="text-xs">Ajoutez un commentaire pour démarrer une discussion</p>
                    </div>
                ) : (
                    <>
                        {/* Non résolus */}
                        {unresolvedComments.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase">
                                    À traiter
                                </h4>
                                {unresolvedComments.map((comment) => (
                                    <CommentThread
                                        key={comment._id}
                                        comment={comment}
                                        allComments={comments}
                                        isExpanded={expandedThreads.has(comment._id)}
                                        onToggle={() => toggleThread(comment._id)}
                                        onResolve={() => handleResolve(comment._id)}
                                        onReply={() => setReplyingTo(comment)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Résolus */}
                        {resolvedComments.length > 0 && (
                            <div className="space-y-3 mt-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                    <CheckCheck className="w-4 h-4 text-green-500" />
                                    Résolus
                                </h4>
                                {resolvedComments.map((comment) => (
                                    <CommentThread
                                        key={comment._id}
                                        comment={comment}
                                        allComments={comments}
                                        isExpanded={expandedThreads.has(comment._id)}
                                        onToggle={() => toggleThread(comment._id)}
                                        isResolved
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Reply indicator */}
            {replyingTo && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <CornerDownRight className="w-4 h-4" />
                        <span>Réponse à {replyingTo.senderId.prenom}</span>
                    </div>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Annuler la réponse"
                        aria-label="Annuler la réponse"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <MentionInput
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    members={projectMembers}
                    placeholder="Ajouter un commentaire..."
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        <Send className="w-4 h-4" />
                        {replyingTo ? 'Répondre' : 'Commenter'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

interface CommentThreadProps {
    comment: Message;
    allComments: Message[];
    isExpanded: boolean;
    onToggle: () => void;
    onResolve?: () => void;
    onReply?: () => void;
    isResolved?: boolean;
}

function CommentThread({ 
    comment, 
    allComments, 
    isExpanded, 
    onToggle, 
    onResolve,
    onReply,
    isResolved = false,
}: CommentThreadProps) {
    const replies = allComments.filter(c => c.parentId === comment._id);
    const sender = comment.senderId;
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { 
        addSuffix: true,
        locale: fr,
    });

    // Parser le contenu pour afficher les mentions
    const renderContent = (content: string) => {
        const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
        return content.replace(mentionRegex, (_match, name) => `@${name}`);
    };

    return (
        <div className={`rounded-lg border ${
            isResolved 
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}>
            {/* Main comment */}
            <div className="p-3">
                <div className="flex items-start gap-2">
                    {sender.avatar ? (
                        <img
                            src={sender.avatar}
                            alt={sender.prenom}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {sender.prenom} {sender.nom}
                            </span>
                            <span className="text-xs text-gray-400">{timeAgo}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                            {renderContent(comment.content)}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                            {!isResolved && onReply && (
                                <button
                                    onClick={onReply}
                                    className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
                                >
                                    Répondre
                                </button>
                            )}
                            {!isResolved && onResolve && (
                                <button
                                    onClick={onResolve}
                                    className="text-xs text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Résoudre
                                </button>
                            )}
                            {replies.length > 0 && (
                                <button
                                    onClick={onToggle}
                                    className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {isExpanded ? 'Masquer' : `Voir ${replies.length} réponse(s)`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Replies */}
            <AnimatePresence>
                {isExpanded && replies.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
                    >
                        <div className="p-3 space-y-3">
                            {replies.map((reply) => (
                                <div key={reply._id} className="flex items-start gap-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                                    {reply.senderId.avatar ? (
                                        <img
                                            src={reply.senderId.avatar}
                                            alt={reply.senderId.prenom}
                                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-xs">
                                            {reply.senderId.prenom[0]}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {reply.senderId.prenom} {reply.senderId.nom}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(reply.createdAt), { 
                                                    addSuffix: true,
                                                    locale: fr,
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                            {renderContent(reply.content)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

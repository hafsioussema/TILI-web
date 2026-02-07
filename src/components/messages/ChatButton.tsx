import { MessageCircle } from 'lucide-react';
import { useMessagesStore } from '@/lib/messagesStore';
import { motion } from 'framer-motion';

interface ChatButtonProps {
    projectId: string;
    className?: string;
}

export function ChatButton({ projectId, className = '' }: ChatButtonProps) {
    const { 
        unreadCounts, 
        isChatPanelOpen, 
        setChatPanelOpen,
        currentProjectId,
    } = useMessagesStore();

    const unreadCount = unreadCounts.find(c => c.projectId === projectId)?.count || 0;
    const isActive = isChatPanelOpen && currentProjectId === projectId;

    const handleClick = () => {
        if (isActive) {
            setChatPanelOpen(false);
        } else {
            setChatPanelOpen(true);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${className}`}
        >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Chat</span>
            
            {unreadCount > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </motion.button>
    );
}

// Floating Chat Button (pour afficher en bas à droite)
interface FloatingChatButtonProps {
    projectId: string;
}

export function FloatingChatButton({ projectId }: FloatingChatButtonProps) {
    const { 
        unreadCounts, 
        isChatPanelOpen, 
        setChatPanelOpen,
        currentProjectId,
    } = useMessagesStore();

    const unreadCount = unreadCounts.find(c => c.projectId === projectId)?.count || 0;
    const isActive = isChatPanelOpen && currentProjectId === projectId;

    const handleClick = () => {
        if (isActive) {
            setChatPanelOpen(false);
        } else {
            setChatPanelOpen(true);
        }
    };

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
            <MessageCircle className="w-6 h-6" />
            
            {unreadCount > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </motion.button>
    );
}

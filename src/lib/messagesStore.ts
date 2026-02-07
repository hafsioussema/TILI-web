import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import messagesService from '@/lib/messagesService';
import type { Message, UnreadCount, TypingUser } from '@/types/messages';
import { MessageType } from '@/types/messages';

interface MessagesState {
    // État du chat
    messages: Record<string, Message[]>; // Clé: projectId ou documentId
    currentProjectId: string | null;
    currentDocumentId: string | null;
    
    // Compteurs non lus
    unreadCounts: UnreadCount[];
    unreadMentions: Message[];
    
    // Indicateurs de frappe
    typingUsers: Record<string, TypingUser[]>; // Clé: projectId ou documentId
    
    // Panel ouvert
    isChatPanelOpen: boolean;
    isDocumentCommentsOpen: boolean;
    
    // Chargement
    isLoading: boolean;
    error: string | null;

    // Actions
    connect: (token: string) => void;
    disconnect: () => void;
    
    // Chat par projet
    openProjectChat: (projectId: string) => Promise<void>;
    closeProjectChat: () => void;
    loadProjectMessages: (projectId: string) => Promise<void>;
    
    // Commentaires document
    openDocumentComments: (documentId: string) => Promise<void>;
    closeDocumentComments: () => void;
    loadDocumentComments: (documentId: string) => Promise<void>;
    
    // Messages
    sendMessage: (content: string, mentions?: string[], parentId?: string) => Promise<void>;
    deleteMessage: (messageId: string) => void;
    markMessagesAsRead: (messageIds: string[]) => void;
    resolveComment: (messageId: string) => Promise<void>;
    
    // Compteurs
    loadUnreadCounts: () => Promise<void>;
    loadUnreadMentions: () => Promise<void>;
    
    // UI
    toggleChatPanel: () => void;
    setChatPanelOpen: (open: boolean) => void;
    
    // Typing
    sendTypingIndicator: (isTyping: boolean) => void;
}

export const useMessagesStore = create<MessagesState>()(
    devtools(
        (set, get) => ({
            // Initial state
            messages: {},
            currentProjectId: null,
            currentDocumentId: null,
            unreadCounts: [],
            unreadMentions: [],
            typingUsers: {},
            isChatPanelOpen: false,
            isDocumentCommentsOpen: false,
            isLoading: false,
            error: null,

            // Connexion WebSocket
            connect: (token: string) => {
                messagesService.connect(token);
                
                // Écouter les nouveaux messages
                messagesService.on('newMessage', (data) => {
                    const message = data.message || data;
                    const state = get();
                    
                    // Ajouter le message à la bonne liste
                    const key = message.projectId || message.documentId;
                    if (key) {
                        const existingMessages = state.messages[key] || [];
                        // Éviter les doublons
                        if (!existingMessages.find(m => m._id === message._id)) {
                            set({
                                messages: {
                                    ...state.messages,
                                    [key]: [...existingMessages, message], // Ajouter à la fin pour l'ordre chronologique
                                },
                            });
                        }
                    }
                });

                // Écouter les mentions
                messagesService.on('newMention', (data) => {
                    const state = get();
                    set({
                        unreadMentions: [data.message, ...state.unreadMentions],
                    });
                });

                // Écouter les indicateurs de frappe
                messagesService.on('userTyping', (data: TypingUser) => {
                    const state = get();
                    const key = state.currentProjectId || state.currentDocumentId || '';
                    const currentTyping = state.typingUsers[key] || [];
                    
                    if (data.isTyping) {
                        // Ajouter l'utilisateur
                        if (!currentTyping.find(u => u.userId === data.userId)) {
                            set({
                                typingUsers: {
                                    ...state.typingUsers,
                                    [key]: [...currentTyping, data],
                                },
                            });
                        }
                    } else {
                        // Retirer l'utilisateur
                        set({
                            typingUsers: {
                                ...state.typingUsers,
                                [key]: currentTyping.filter(u => u.userId !== data.userId),
                            },
                        });
                    }
                });

                // Charger les compteurs initiaux
                get().loadUnreadCounts();
                get().loadUnreadMentions();
            },

            disconnect: () => {
                messagesService.disconnect();
                set({
                    messages: {},
                    currentProjectId: null,
                    currentDocumentId: null,
                    typingUsers: {},
                });
            },

            // Ouvrir le chat d'un projet
            openProjectChat: async (projectId: string) => {
                const state = get();
                
                // Quitter l'ancien projet si différent
                if (state.currentProjectId && state.currentProjectId !== projectId) {
                    messagesService.leaveProject(state.currentProjectId);
                }

                set({ 
                    currentProjectId: projectId, 
                    currentDocumentId: null,
                    isChatPanelOpen: true,
                    isDocumentCommentsOpen: false,
                });
                
                messagesService.joinProject(projectId);
                await get().loadProjectMessages(projectId);
            },

            closeProjectChat: () => {
                const state = get();
                if (state.currentProjectId) {
                    messagesService.leaveProject(state.currentProjectId);
                }
                set({ 
                    currentProjectId: null,
                    isChatPanelOpen: false,
                });
            },

            loadProjectMessages: async (projectId: string) => {
                set({ isLoading: true, error: null });
                try {
                    console.log('[MessagesStore] Loading messages for project:', projectId);
                    const messages = await messagesService.getMessages({
                        projectId,
                        limit: 50,
                    });
                    console.log('[MessagesStore] Received messages:', messages);
                    // Trier du plus ancien au plus récent
                    const sortedMessages = [...messages].sort((a, b) => 
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                    console.log('[MessagesStore] Sorted messages:', sortedMessages);
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [projectId]: sortedMessages,
                        },
                        isLoading: false,
                    }));
                } catch (error: any) {
                    console.error('[MessagesStore] Error loading messages:', error);
                    set({ error: error.message, isLoading: false });
                }
            },

            // Ouvrir les commentaires d'un document
            openDocumentComments: async (documentId: string) => {
                const state = get();
                
                if (state.currentDocumentId && state.currentDocumentId !== documentId) {
                    messagesService.leaveDocument(state.currentDocumentId);
                }

                set({ 
                    currentDocumentId: documentId, 
                    isDocumentCommentsOpen: true,
                });
                
                messagesService.joinDocument(documentId);
                await get().loadDocumentComments(documentId);
            },

            closeDocumentComments: () => {
                const state = get();
                if (state.currentDocumentId) {
                    messagesService.leaveDocument(state.currentDocumentId);
                }
                set({ 
                    currentDocumentId: null,
                    isDocumentCommentsOpen: false,
                });
            },

            loadDocumentComments: async (documentId: string) => {
                set({ isLoading: true, error: null });
                try {
                    const messages = await messagesService.getMessages({
                        documentId,
                        limit: 100,
                    });
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [documentId]: messages.reverse(),
                        },
                        isLoading: false,
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // Envoyer un message
            sendMessage: async (content: string, mentions?: string[], parentId?: string) => {
                const state = get();
                const { currentProjectId, currentDocumentId } = state;

                if (!currentProjectId && !currentDocumentId) return;

                try {
                    const messageType = currentDocumentId 
                        ? MessageType.DOCUMENT_COMMENT 
                        : MessageType.PROJECT_CHAT;

                    // Envoyer via WebSocket pour temps réel
                    messagesService.sendMessage({
                        content,
                        projectId: currentProjectId || undefined,
                        documentId: currentDocumentId || undefined,
                        parentId,
                        type: messageType,
                        mentions,
                    });

                    // Arrêter l'indicateur de frappe
                    get().sendTypingIndicator(false);
                } catch (error: any) {
                    set({ error: error.message });
                }
            },

            deleteMessage: (messageId: string) => {
                messagesService.deleteMessage(messageId);
                
                // Retirer localement
                const state = get();
                const key = state.currentProjectId || state.currentDocumentId;
                if (key && state.messages[key]) {
                    set({
                        messages: {
                            ...state.messages,
                            [key]: state.messages[key].filter(m => m._id !== messageId),
                        },
                    });
                }
            },

            markMessagesAsRead: (messageIds: string[]) => {
                messagesService.markReadRealtime(messageIds);
            },

            resolveComment: async (messageId: string) => {
                try {
                    await messagesService.updateMessage(messageId, { isResolved: true });
                    
                    // Mettre à jour localement
                    const state = get();
                    const key = state.currentDocumentId;
                    if (key && state.messages[key]) {
                        set({
                            messages: {
                                ...state.messages,
                                [key]: state.messages[key].map(m => 
                                    m._id === messageId ? { ...m, isResolved: true } : m
                                ),
                            },
                        });
                    }
                } catch (error: any) {
                    set({ error: error.message });
                }
            },

            loadUnreadCounts: async () => {
                try {
                    const counts = await messagesService.getUnreadCounts();
                    set({ unreadCounts: counts });
                } catch (error) {
                    console.error('Erreur chargement unread counts:', error);
                }
            },

            loadUnreadMentions: async () => {
                try {
                    const mentions = await messagesService.getUnreadMentions();
                    set({ unreadMentions: mentions });
                } catch (error) {
                    console.error('Erreur chargement unread mentions:', error);
                }
            },

            toggleChatPanel: () => {
                set((state) => ({ isChatPanelOpen: !state.isChatPanelOpen }));
            },

            setChatPanelOpen: (open: boolean) => {
                set({ isChatPanelOpen: open });
            },

            sendTypingIndicator: (isTyping: boolean) => {
                const state = get();
                messagesService.sendTypingIndicator(
                    state.currentProjectId || undefined,
                    state.currentDocumentId || undefined,
                    isTyping
                );
            },
        }),
        { name: 'messages-store' }
    )
);

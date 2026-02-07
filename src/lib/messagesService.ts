import { apiClient } from './axios';
import { io, Socket } from 'socket.io-client';
import type {
    Message,
    CreateMessageDto,
    UpdateMessageDto,
    QueryMessagesDto,
    UnreadCount,
    CommentCount,
    OnlineUser,
    NewMessageEvent,
    NewMentionEvent,
    TypingUser,
    UserJoinedEvent,
    UserLeftEvent,
} from '@/types/messages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (data: any) => void;

class MessagesService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<EventCallback>> = new Map();

    // ===============================
    // REST API Methods
    // ===============================

    /**
     * Créer un message
     */
    async createMessage(dto: CreateMessageDto): Promise<Message> {
        const response = await apiClient.post('/messages', dto);
        return response.data;
    }

    /**
     * Récupérer les messages
     */
    async getMessages(query: QueryMessagesDto): Promise<Message[]> {
        const response = await apiClient.get('/messages', { params: query });
        return response.data;
    }

    /**
     * Récupérer un message par ID
     */
    async getMessage(id: string): Promise<Message> {
        const response = await apiClient.get(`/messages/${id}`);
        return response.data;
    }

    /**
     * Récupérer les réponses à un message
     */
    async getReplies(messageId: string): Promise<Message[]> {
        const response = await apiClient.get(`/messages/${messageId}/replies`);
        return response.data;
    }

    /**
     * Mettre à jour un message
     */
    async updateMessage(id: string, dto: UpdateMessageDto): Promise<Message> {
        const response = await apiClient.put(`/messages/${id}`, dto);
        return response.data;
    }

    /**
     * Supprimer un message
     */
    async deleteMessage(id: string): Promise<void> {
        await apiClient.delete(`/messages/${id}`);
    }

    /**
     * Marquer des messages comme lus
     */
    async markAsRead(messageIds: string[]): Promise<void> {
        await apiClient.post('/messages/mark-read', { messageIds });
    }

    /**
     * Récupérer les compteurs de messages non lus
     */
    async getUnreadCounts(): Promise<UnreadCount[]> {
        const response = await apiClient.get('/messages/unread-counts');
        return response.data;
    }

    /**
     * Récupérer les mentions non lues
     */
    async getUnreadMentions(): Promise<Message[]> {
        const response = await apiClient.get('/messages/unread-mentions');
        return response.data;
    }

    /**
     * Récupérer les compteurs de commentaires par document
     */
    async getCommentCounts(documentIds: string[]): Promise<CommentCount[]> {
        const response = await apiClient.post('/messages/comment-counts', { documentIds });
        return response.data;
    }

    // ===============================
    // WebSocket Methods
    // ===============================

    /**
     * Connecter au WebSocket
     */
    connect(token: string): void {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(`${API_URL}/messages`, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('[MessagesService] WebSocket connecté');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[MessagesService] WebSocket déconnecté:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[MessagesService] Erreur de connexion:', error);
        });

        // Configurer les listeners d'événements
        this.setupEventListeners();
    }

    /**
     * Déconnecter le WebSocket
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.listeners.clear();
    }

    /**
     * Configurer les listeners d'événements WebSocket
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Écouter les nouveaux messages
        this.socket.on('newMessage', (data: NewMessageEvent) => {
            this.emitToListeners('newMessage', data);
        });

        // Écouter les nouvelles mentions
        this.socket.on('newMention', (data: NewMentionEvent) => {
            this.emitToListeners('newMention', data);
        });

        // Écouter les indicateurs de frappe
        this.socket.on('userTyping', (data: TypingUser) => {
            this.emitToListeners('userTyping', data);
        });

        // Écouter les utilisateurs qui rejoignent
        this.socket.on('userJoined', (data: UserJoinedEvent) => {
            this.emitToListeners('userJoined', data);
        });

        // Écouter les utilisateurs qui quittent
        this.socket.on('userLeft', (data: UserLeftEvent) => {
            this.emitToListeners('userLeft', data);
        });
    }

    /**
     * Rejoindre une room de projet
     */
    joinProject(projectId: string): void {
        this.socket?.emit('joinProject', { projectId });
    }

    /**
     * Quitter une room de projet
     */
    leaveProject(projectId: string): void {
        this.socket?.emit('leaveProject', { projectId });
    }

    /**
     * Rejoindre une room de document
     */
    joinDocument(documentId: string): void {
        this.socket?.emit('joinDocument', { documentId });
    }

    /**
     * Quitter une room de document
     */
    leaveDocument(documentId: string): void {
        this.socket?.emit('leaveDocument', { documentId });
    }

    /**
     * Envoyer un message via WebSocket
     */
    sendMessage(dto: CreateMessageDto): void {
        this.socket?.emit('sendMessage', dto);
    }

    /**
     * Indiquer que l'utilisateur est en train de taper
     */
    sendTypingIndicator(projectId?: string, documentId?: string, isTyping: boolean = true): void {
        this.socket?.emit('typing', { projectId, documentId, isTyping });
    }

    /**
     * Marquer des messages comme lus via WebSocket
     */
    markReadRealtime(messageIds: string[]): void {
        this.socket?.emit('markRead', { messageIds });
    }

    /**
     * Obtenir les utilisateurs en ligne d'un projet
     */
    async getOnlineUsers(projectId: string): Promise<OnlineUser[]> {
        return new Promise((resolve) => {
            if (!this.socket) {
                resolve([]);
                return;
            }

            this.socket.emit('getOnlineUsers', { projectId }, (response: { users: OnlineUser[] }) => {
                resolve(response.users || []);
            });
        });
    }

    // ===============================
    // Event Subscription Methods
    // ===============================

    /**
     * S'abonner à un événement
     */
    on(event: string, callback: (data: any) => void): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Retourner une fonction pour se désabonner
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Émettre aux listeners locaux
     */
    private emitToListeners(event: string, data: any): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((callback) => callback(data));
        }
    }

    /**
     * Vérifier si le socket est connecté
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Exporter une instance singleton
export const messagesService = new MessagesService();
export default messagesService;

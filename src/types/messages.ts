// Types pour la messagerie interne

export enum MessageType {
    PROJECT_CHAT = 'PROJECT_CHAT',
    DOCUMENT_COMMENT = 'DOCUMENT_COMMENT',
    DIRECT_MESSAGE = 'DIRECT_MESSAGE',
}

export interface MessageUser {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    avatar?: string;
}

export interface Message {
    _id: string;
    content: string;
    senderId: MessageUser;
    projectId?: string;
    documentId?: string;
    parentId?: string;
    type: MessageType;
    mentions: MessageUser[];
    readBy: string[];
    isResolved: boolean;
    isDeleted: boolean;
    attachments: string[];
    createdAt: string;
    updatedAt: string;
    replies?: Message[]; // Pour les threads
}

export interface CreateMessageDto {
    content: string;
    projectId?: string;
    documentId?: string;
    parentId?: string;
    type: MessageType;
    mentions?: string[];
    attachments?: string[];
}

export interface UpdateMessageDto {
    content?: string;
    isResolved?: boolean;
}

export interface QueryMessagesDto {
    projectId?: string;
    documentId?: string;
    limit?: number;
    offset?: number;
    parentId?: string;
}

export interface UnreadCount {
    projectId: string;
    count: number;
}

export interface CommentCount {
    documentId: string;
    count: number;
}

export interface OnlineUser {
    id: string;
    name: string;
}

export interface TypingUser {
    userId: string;
    userName: string;
    isTyping: boolean;
}

// Events WebSocket
export interface NewMessageEvent {
    message: Message;
}

export interface NewMentionEvent {
    message: Message;
    from: string;
}

export interface UserJoinedEvent {
    userId: string;
    userName: string;
}

export interface UserLeftEvent {
    userId: string;
    userName: string;
}

import { apiClient } from '@/lib/axios';

export interface BotMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface BotChatResponse {
    reply: string;
}

export interface BotConversationResponse {
    messages: BotMessage[];
}

export const botService = {
    getConversation: async (): Promise<BotMessage[]> => {
        const response = await apiClient.get<BotConversationResponse>('/bot/conversation');
        return response.data.messages ?? [];
    },

    chat: async (message: string, history?: BotMessage[]): Promise<string> => {
        const response = await apiClient.post<BotChatResponse>('/bot/chat', {
            message,
            history: history ?? [],
        });
        return response.data.reply;
    },
};

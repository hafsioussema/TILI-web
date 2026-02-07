import axios from 'axios';

const API_URL = 'http://localhost:3000/notifications';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface Notification {
    id: string;
    userEmail: string;
    type: 'INVITATION' | 'UPDATE' | 'CANCELLATION' | 'REMINDER';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    getNotifications: async (): Promise<Notification[]> => {
        const response = await apiClient.get('/');
        return response.data;
    },

    markAsRead: async (id: string): Promise<Notification> => {
        const response = await apiClient.patch(`/${id}/read`);
        return response.data;
    },

    markAllAsRead: async (): Promise<void> => {
        await apiClient.post('/read-all');
    },

    deleteNotification: async (id: string): Promise<void> => {
        await apiClient.delete(`/${id}`);
    },
};

import { apiClient } from '@/lib/axios';
import { DocumentType } from '@/types/documents';

export interface DashboardStats {
    projects: {
        active: number;
        closed: number;
        archived: number;
        total: number;
    };
    documents: {
        byType: Record<DocumentType, number>;
        total: number;
    };
}

export interface GlobalActivity {
    _id: string;
    action: string;
    userId: {
        _id: string;
        nom: string;
        prenom: string;
        email: string;
    };
    documentId: {
        _id: string;
        name: string;
        type: DocumentType;
        projectId: {
            _id: string;
            name: string;
        };
    };
    version: number;
    metadata?: any;
    createdAt: string;
}

const BASE_URL = '/dashboard';

export const dashboardService = {
    /**
     * Get dashboard statistics
     */
    getStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get<DashboardStats>(`${BASE_URL}/stats`);
        return response.data;
    },

    /**
     * Get global activity feed
     */
    getActivity: async (limit = 10): Promise<GlobalActivity[]> => {
        const response = await apiClient.get<GlobalActivity[]>(`${BASE_URL}/activity?limit=${limit}`);
        return response.data;
    },
};

import { apiClient } from '@/lib/axios';
import { toast } from 'sonner';
import type {
    Project,
    CreateProjectDto,
    UpdateProjectDto,
    QueryProjectsDto
} from '@/types/documents';

const BASE_URL = '/projects';

export interface ProjectHistoryItem {
    type: 'project_created' | 'document_added' | 'task_created';
    date: string;
    label: string;
    metadata?: {
        documentId?: string;
        documentName?: string;
        taskId?: string;
        taskTitle?: string;
        taskStatus?: string;
        userName?: string;
    };
}

export const projectService = {
    /**
     * Create a new project
     */
    create: async (dto: CreateProjectDto): Promise<Project> => {
        const response = await apiClient.post<Project>(BASE_URL, dto);
        toast.success(`Projet ${dto.name} créé avec succès`);
        return response.data;
    },

    /**
     * Get all projects with optional filters
     */
    getAll: async (query?: QueryProjectsDto): Promise<Project[]> => {
        const params = new URLSearchParams();
        if (query?.status) params.append('status', query.status);
        if (query?.search) params.append('search', query.search);

        const response = await apiClient.get<Project[]>(`${BASE_URL}?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single project by ID
     */
    getById: async (id: string): Promise<Project> => {
        const response = await apiClient.get<Project>(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Get project activity history (timeline)
     */
    getHistory: async (id: string): Promise<ProjectHistoryItem[]> => {
        const response = await apiClient.get<ProjectHistoryItem[]>(`${BASE_URL}/${id}/history`);
        return response.data;
    },

    /**
     * Close project (set status COMPLETED, mark all tasks DONE, progress 100)
     */
    close: async (id: string): Promise<Project> => {
        const response = await apiClient.post<Project>(`${BASE_URL}/${id}/close`);
        return response.data;
    },

    /**
     * Update a project
     */
    update: async (id: string, dto: UpdateProjectDto): Promise<Project> => {
        const response = await apiClient.put<Project>(`${BASE_URL}/${id}`, dto);
        toast.success('Projet mis à jour');
        return response.data;
    },

    /**
     * Delete a project
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
        toast.success('Projet supprimé');
    },
};

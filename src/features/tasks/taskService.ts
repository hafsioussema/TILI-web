import { apiClient } from '@/lib/axios';
import { toast } from 'sonner';

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: any;
    projectId: string;
    order: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    projectId: string;
    tags?: string[];
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> { }

const BASE_URL = '/tasks';

export const taskService = {
    getAll: async (params: { projectId?: string; status?: TaskStatus } = {}): Promise<Task[]> => {
        const response = await apiClient.get<Task[]>(BASE_URL, { params });
        return response.data;
    },

    getById: async (id: string): Promise<Task> => {
        const response = await apiClient.get<Task>(`${BASE_URL}/${id}`);
        return response.data;
    },

    create: async (dto: CreateTaskDto): Promise<Task> => {
        const response = await apiClient.post<Task>(BASE_URL, dto);
        toast.success('Tâche créée avec succès');
        return response.data;
    },

    update: async (id: string, dto: UpdateTaskDto): Promise<Task> => {
        const response = await apiClient.put<Task>(`${BASE_URL}/${id}`, dto);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
        toast.success('Tâche supprimée');
    },
};

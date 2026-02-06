import { apiClient } from '@/lib/axios';
import type { User, CreateUserDto, UpdateUserDto } from '@/types';

// Assuming these DTOs need to be defined in types/index.ts or here.
// But CreateUserDto and UpdateUserDto are not in types/index.ts yet.
// I should add them to types/index.ts or define them inline if they are simple match to backend.
// Backend CreateUserDto has specific fields. I'll defer to type update or just use any/partial for now if types not ready.
// Actually I should update types/index.ts to include CreateUserDto/UpdateUserDto as well.
// But for now let's write the service and assume types exist or use placeholders.
// Re-reading step 29, backend has create-user.dto.ts.
// I will update types/index.ts later or assume they are there?
// I'll add them to types/index.ts first or in this step?
// Better to simple write the service and fix types in next step or valid types now.
// I'll use imports and fix types/index.ts in next step if missing.

export const userService = {
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    getOne: async (id: string): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: CreateUserDto): Promise<User> => {
        const response = await apiClient.post<User>('/users', data);
        return response.data;
    },

    update: async (id: string, data: UpdateUserDto): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    toggleStatus: async (id: string): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}/toggle-status`);
        return response.data;
    },
};

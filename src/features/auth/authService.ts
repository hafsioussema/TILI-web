import { apiClient } from '@/lib/axios';
import type { AuthResponse, LoginDto, User, ChangePasswordDto, UpdateProfileDto } from '@/types';

export const authService = {
    login: async (data: LoginDto): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    getProfile: async (): Promise<User> => {
        const response = await apiClient.get<User>('/auth/profile');
        return response.data;
    },

    refreshToken: async (): Promise<{ accessToken: string }> => {
        const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileDto): Promise<User> => {
        const response = await apiClient.patch<User>('/auth/profile', data);
        return response.data;
    },

    changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
        return response.data;
    },
};

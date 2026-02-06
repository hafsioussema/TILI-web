import { create } from 'zustand';
import type { User } from '@/types';
import { authService } from './authService';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    isLoading: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true, // Start loading to check auth

    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const response = await authService.login({ email, password });
            localStorage.setItem('token', response.accessToken);
            // Fetch full profile after login to get all fields
            const user = await authService.getProfile();
            set({ user: user, token: response.accessToken, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false });
            return;
        }

        try {
            const user = await authService.getProfile();
            set({ user, isLoading: false });
        } catch (error) {
            console.error('Auth check failed', error);
            localStorage.removeItem('token');
            set({ user: null, token: null, isLoading: false });
        }
    },
}));

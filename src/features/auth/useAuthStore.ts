import { create } from 'zustand';
import type { User } from '@/types';
import { authService } from './authService';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,

    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
    },

    login: async (email, password) => {
        const response = await authService.login(email, password);
        localStorage.setItem('token', response.access_token);
        set({ user: response.user, token: response.access_token });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },
}));

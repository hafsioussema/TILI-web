
import type { AuthResponse } from '@/types';

export const authService = {
    login: async (email: string, _password: string): Promise<AuthResponse> => {
        // MOCK FOR DEMO PURPOSES
        console.log(`Attempting login with ${email}`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Return mock success always for testing
        return {
            access_token: "mock-jwt-token-xyz-123",
            user: {
                id: "1",
                nom: "Admin",
                prenom: "Super",
                email: email,
                role: "ADMIN" as any, // Cast to avoid circular dep issues in mock
                statut: "ACTIVE" as any,
                photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            }
        };
    },
};

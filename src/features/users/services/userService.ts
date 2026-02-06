
import { UserRole, UserStatus } from '@/types';
import type { User } from '@/types';

export interface CreateUserPayload {
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    telephone?: string;
    poste?: string;
    photo?: string;
}

// MOCK DATA STORAGE
const MOCK_USERS: User[] = [
    {
        id: '1',
        nom: 'Ben Ali',
        prenom: 'Mohamed',
        email: 'mohamed.benali@tili.tn',
        role: UserRole.ADMIN,
        statut: UserStatus.ACTIVE,
        telephone: '55 123 456',
        poste: 'Directeur Général',
        photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
        id: '2',
        nom: 'Trabelsi',
        prenom: 'Sarah',
        email: 'sarah.trabelsi@tili.tn',
        role: UserRole.CHEF_PROJET,
        statut: UserStatus.ACTIVE,
        telephone: '98 765 432',
        poste: 'Responsable Projets Inclusion',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
        id: '3',
        nom: 'Jaziri',
        prenom: 'Ahmed',
        email: 'ahmed.jaziri@tili.tn',
        role: UserRole.CONSULTANT,
        statut: UserStatus.INACTIVE,
        telephone: '22 111 000',
        poste: 'Expert Juridique',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
        id: '4',
        nom: 'Gharbi',
        prenom: 'Leila',
        email: 'leila.gharbi@tili.tn',
        role: UserRole.CHEF_PROJET,
        statut: UserStatus.ACTIVE,
        telephone: '50 222 333',
        poste: 'Coordinatrice Terrain',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    }
];

export const userService = {
    getAll: async (): Promise<User[]> => {
        // MOCK
        return [...MOCK_USERS];
    },

    getById: async (id: string): Promise<User> => {
        // MOCK
        const user = MOCK_USERS.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
    },

    create: async (payload: CreateUserPayload): Promise<User> => {
        // MOCK
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            ...payload,
            statut: UserStatus.ACTIVE // Default
        };
        MOCK_USERS.push(newUser);
        return newUser;
    },

    update: async (id: string, payload: Partial<User>): Promise<User> => {
        // MOCK
        const index = MOCK_USERS.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');
        MOCK_USERS[index] = { ...MOCK_USERS[index], ...payload };
        return MOCK_USERS[index];
    },

    updateStatus: async (id: string, statut: UserStatus): Promise<User> => {
        // MOCK
        const index = MOCK_USERS.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');
        MOCK_USERS[index].statut = statut;
        return MOCK_USERS[index];
    },

    delete: async (id: string): Promise<void> => {
        // MOCK
        const index = MOCK_USERS.findIndex(u => u.id === id);
        if (index !== -1) MOCK_USERS.splice(index, 1);
    },
};

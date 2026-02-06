export enum UserRole {
    ADMIN = 'ADMIN',
    CHEF_PROJET = 'CHEF_PROJET',
    CONSULTANT = 'CONSULTANT',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    statut: UserStatus;
    telephone?: string;
    poste?: string;
    derniere_connexion?: string;
    photo?: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    CHEF_PROJET = 'CHEF_PROJET',
    CONSULTANT = 'CONSULTANT',
}

export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
    telephone?: string;
    poste?: string;
    lastLogin?: string | Date; // Date string from backend
    avatar?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: Partial<User>; // Login returns partial user
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface ChangePasswordDto {
    currentPassword?: string;
    newPassword?: string;
}

export interface UpdateProfileDto {
    nom?: string;
    prenom?: string;
    telephone?: string;
    poste?: string;
    avatar?: string;
}

export interface CreateUserDto {
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    telephone?: string;
    poste?: string;
}

export interface UpdateUserDto {
    nom?: string;
    prenom?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    telephone?: string;
    poste?: string;
}

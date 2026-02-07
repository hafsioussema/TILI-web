export { UserRole } from "./index";

// Document Types
export enum DocumentType {
  RAPPORT = "RAPPORT",
  CR_REUNION = "CR_REUNION",
  ADMINISTRATIF = "ADMINISTRATIF",
  PROJET = "PROJET",
}

export enum DocumentAction {
  UPLOAD = "UPLOAD",
  UPDATE = "UPDATE",
  DOWNLOAD = "DOWNLOAD",
  DELETE = "DELETE",
}

export enum ProjectStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export interface TiliDocument {
  _id: string;
  name: string;
  type: DocumentType;
  path: string;
  mimeType: string;
  size: number;
  version: number;
  projectId: string | Project;
  uploadedBy: string | DocumentUser;
  description?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUser {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
}

export interface DocumentHistory {
  _id: string;
  documentId: string;
  action: DocumentAction;
  userId: string | DocumentUser;
  version: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  managerId: string | DocumentUser;
  members: (string | DocumentUser)[];
  startDate?: string;
  endDate?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// DTO Types
export interface CreateDocumentDto {
  name: string;
  type: DocumentType;
  projectId: string;
  description?: string;
}

export interface UpdateDocumentDto {
  name?: string;
  type?: DocumentType;
  description?: string;
}

export interface QueryDocumentsDto {
  type?: DocumentType;
  projectId?: string;
  search?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  managerId?: string;
  members?: string[];
  startDate?: string;
  endDate?: string;
  progress?: number;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  managerId?: string;
  members?: string[];
  endDate?: string;
  progress?: number;
}

export interface QueryProjectsDto {
  status?: ProjectStatus;
  search?: string;
}

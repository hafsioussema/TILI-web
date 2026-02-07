import { apiClient } from '@/lib/axios';
import type {
    TiliDocument,
    DocumentHistory,
    CreateDocumentDto,
    UpdateDocumentDto,
    QueryDocumentsDto
} from '@/types/documents';

const BASE_URL = '/documents';

export const documentService = {
    /**
     * Upload a new document
     */
    upload: async (file: File, dto: CreateDocumentDto): Promise<TiliDocument> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', dto.name);
        formData.append('type', dto.type);
        formData.append('projectId', dto.projectId);
        if (dto.description) {
            formData.append('description', dto.description);
        }

        const response = await apiClient.post<TiliDocument>(BASE_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Get all documents with optional filters
     */
    getAll: async (query?: QueryDocumentsDto): Promise<TiliDocument[]> => {
        const params = new URLSearchParams();
        if (query?.type) params.append('type', query.type);
        if (query?.projectId) params.append('projectId', query.projectId);
        if (query?.search) params.append('search', query.search);

        const response = await apiClient.get<TiliDocument[]>(`${BASE_URL}?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single document by ID
     */
    getById: async (id: string): Promise<TiliDocument> => {
        const response = await apiClient.get<TiliDocument>(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Get document as blob for preview (inline viewing without download)
     */
    getPreviewBlob: async (id: string): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/${id}/download`, {
            responseType: 'blob',
        });
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        return new Blob([response.data], { type: contentType });
    },

    /**
     * Download a document
     */
    download: async (id: string, fileName: string): Promise<void> => {
        const response = await apiClient.get(`${BASE_URL}/${id}/download`, {
            responseType: 'blob',
        });

        // Get content type from headers
        const contentType = response.headers['content-type'] || 'application/octet-stream';

        // Create download link with explicit MIME type
        const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
        const link = document.createElement('a');
        link.href = url;

        // Ensure fileName has extension if missing and we can detect it
        // (Simple check for now, backend should ideally provide correct name)
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Get document history
     */
    getHistory: async (id: string): Promise<DocumentHistory[]> => {
        const response = await apiClient.get<DocumentHistory[]>(`${BASE_URL}/${id}/history`);
        return response.data;
    },

    /**
     * Update a document
     */
    update: async (id: string, file?: File, dto?: UpdateDocumentDto): Promise<TiliDocument> => {
        const formData = new FormData();
        if (file) {
            formData.append('file', file);
        }
        if (dto?.name) formData.append('name', dto.name);
        if (dto?.type) formData.append('type', dto.type);
        if (dto?.description) formData.append('description', dto.description);

        const response = await apiClient.put<TiliDocument>(`${BASE_URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Delete a document
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    },
};

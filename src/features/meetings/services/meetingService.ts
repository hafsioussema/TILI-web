
import axios from 'axios';
import type { Meeting } from '../types';

const API_URL = 'http://localhost:3000/meetings';

// Create axios instance with interceptor for JWT
const apiClient = axios.create();

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const meetingService = {
    createMeeting: async (data: { title: string; date: string; participants: string[]; minPresenceDuration?: number }): Promise<Meeting> => {
        const response = await apiClient.post(API_URL, data);
        return response.data;
    },

    uploadAudio: async (id: string, file: File, isLive: boolean = false, onProgress?: (progress: number) => void): Promise<Meeting> => {
        const formData = new FormData();
        formData.append('file', file);
        if (isLive) {
            formData.append('isLive', 'true');
        }

        const response = await apiClient.post(`${API_URL}/${id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    },

    // Legacy "Quick Upload"
    uploadMeeting: async (file: File, onProgress?: (progress: number) => void): Promise<Meeting> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(API_URL + '/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    },

    getAllMeetings: async (): Promise<Meeting[]> => {
        const response = await apiClient.get(API_URL);
        return response.data;
    },

    getMeeting: async (id: string): Promise<Meeting> => {
        const response = await apiClient.get(`${API_URL}/${id}`);
        return response.data;
    },

    deleteMeeting: async (id: string): Promise<void> => {
        await apiClient.delete(`${API_URL}/${id}`);
    },

    updateMeeting: async (id: string, data: { title?: string; date?: string; participants?: string[]; minPresenceDuration?: number; status?: string; attendance?: string }): Promise<Meeting> => {
        const response = await apiClient.post(`${API_URL}/${id}`, data);
        return response.data;
    },

    // Document association methods
    addDocument: async (meetingId: string, documentId: string): Promise<Meeting> => {
        const response = await apiClient.post(`${API_URL}/${meetingId}/documents`, { documentId });
        return response.data;
    },

    removeDocument: async (meetingId: string, documentId: string): Promise<Meeting> => {
        const response = await apiClient.delete(`${API_URL}/${meetingId}/documents/${documentId}`);
        return response.data;
    },

    getDocuments: async (meetingId: string): Promise<string[]> => {
        const response = await apiClient.get(`${API_URL}/${meetingId}/documents`);
        return response.data;
    },

    finalizeWithoutAudio: async (meetingId: string): Promise<Meeting> => {
        const response = await apiClient.post(`${API_URL}/${meetingId}/finalize`);
        return response.data;
    },
};

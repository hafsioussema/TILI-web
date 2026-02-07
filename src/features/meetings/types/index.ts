

export interface Meeting {
    id: string;
    title: string;
    date: string;
    duration?: number;
    status: 'SCHEDULED' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    audioUrl?: string; // Optional now
    participants?: string; // JSON string of emails array
    createdAt: string;
    transcript?: Transcript;
    summary?: Summary;
    actions?: ActionItem[];
    attendance?: string; // JSON string
}

export interface Transcript {
    id: string;
    content: string;
    segments: string; // JSON string
}

export interface Summary {
    id: string;
    content: string;
}

export interface ActionItem {
    id: string;
    description: string;
    assignee?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
    dueDate?: string;
}

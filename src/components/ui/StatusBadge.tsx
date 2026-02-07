import { CheckCircle, Clock, XCircle, Archive, AlertCircle, PlayCircle, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 
    | 'success' 
    | 'pending' 
    | 'error' 
    | 'warning' 
    | 'active' 
    | 'inactive' 
    | 'completed' 
    | 'archived'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'ARCHIVED'
    | 'EN_ATTENTE'
    | 'EN_COURS'
    | 'TERMINE';

interface StatusBadgeProps {
    status: StatusType | string;
    label?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const statusConfig: Record<string, {
    icon: React.ComponentType<{ className?: string }>;
    bgClass: string;
    textClass: string;
    borderClass: string;
    label: string;
}> = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-green-50 dark:bg-green-950/30',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-200 dark:border-green-800',
        label: 'Success'
    },
    COMPLETED: {
        icon: CheckCircle,
        bgClass: 'bg-green-50 dark:bg-green-950/30',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-200 dark:border-green-800',
        label: 'Completed'
    },
    TERMINE: {
        icon: CheckCircle,
        bgClass: 'bg-green-50 dark:bg-green-950/30',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-200 dark:border-green-800',
        label: 'Terminé'
    },
    completed: {
        icon: CheckCircle,
        bgClass: 'bg-green-50 dark:bg-green-950/30',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-200 dark:border-green-800',
        label: 'Completed'
    },
    pending: {
        icon: Clock,
        bgClass: 'bg-amber-50 dark:bg-amber-950/30',
        textClass: 'text-amber-700 dark:text-amber-400',
        borderClass: 'border-amber-200 dark:border-amber-800',
        label: 'Pending'
    },
    EN_ATTENTE: {
        icon: Clock,
        bgClass: 'bg-amber-50 dark:bg-amber-950/30',
        textClass: 'text-amber-700 dark:text-amber-400',
        borderClass: 'border-amber-200 dark:border-amber-800',
        label: 'En attente'
    },
    EN_COURS: {
        icon: PlayCircle,
        bgClass: 'bg-blue-50 dark:bg-blue-950/30',
        textClass: 'text-blue-700 dark:text-blue-400',
        borderClass: 'border-blue-200 dark:border-blue-800',
        label: 'En cours'
    },
    error: {
        icon: XCircle,
        bgClass: 'bg-red-50 dark:bg-red-950/30',
        textClass: 'text-red-700 dark:text-red-400',
        borderClass: 'border-red-200 dark:border-red-800',
        label: 'Error'
    },
    warning: {
        icon: AlertCircle,
        bgClass: 'bg-orange-50 dark:bg-orange-950/30',
        textClass: 'text-orange-700 dark:text-orange-400',
        borderClass: 'border-orange-200 dark:border-orange-800',
        label: 'Warning'
    },
    ACTIVE: {
        icon: PlayCircle,
        bgClass: 'bg-blue-50 dark:bg-blue-950/30',
        textClass: 'text-blue-700 dark:text-blue-400',
        borderClass: 'border-blue-200 dark:border-blue-800',
        label: 'Active'
    },
    active: {
        icon: PlayCircle,
        bgClass: 'bg-blue-50 dark:bg-blue-950/30',
        textClass: 'text-blue-700 dark:text-blue-400',
        borderClass: 'border-blue-200 dark:border-blue-800',
        label: 'Active'
    },
    inactive: {
        icon: PauseCircle,
        bgClass: 'bg-gray-50 dark:bg-gray-950/30',
        textClass: 'text-gray-700 dark:text-gray-400',
        borderClass: 'border-gray-200 dark:border-gray-800',
        label: 'Inactive'
    },
    ARCHIVED: {
        icon: Archive,
        bgClass: 'bg-gray-50 dark:bg-gray-950/30',
        textClass: 'text-gray-700 dark:text-gray-400',
        borderClass: 'border-gray-200 dark:border-gray-800',
        label: 'Archived'
    },
    archived: {
        icon: Archive,
        bgClass: 'bg-gray-50 dark:bg-gray-950/30',
        textClass: 'text-gray-700 dark:text-gray-400',
        borderClass: 'border-gray-200 dark:border-gray-800',
        label: 'Archived'
    },
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
};

const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
};

/**
 * Accessible status badge with both color and icon indicators
 * Meets WCAG 2.1 SC 1.4.1 (Use of Color)
 */
export const StatusBadge = ({ 
    status, 
    label, 
    showIcon = true, 
    size = 'md',
    className 
}: StatusBadgeProps) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    const displayLabel = label || config.label;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium border',
                config.bgClass,
                config.textClass,
                config.borderClass,
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label={`Status: ${displayLabel}`}
        >
            {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
            <span>{displayLabel}</span>
        </span>
    );
};

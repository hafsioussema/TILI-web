import { useEffect } from 'react';

/**
 * Hook to announce loading states to screen readers
 * @param isLoading - Whether content is currently loading
 * @param label - Description of what is loading
 * @returns JSX element that announces loading state
 */
export const useLoadingAnnouncement = (isLoading: boolean, label: string) => {
    useEffect(() => {
        const announcer = document.getElementById('loading-announcer');
        if (announcer) {
            if (isLoading) {
                announcer.textContent = `Loading ${label}...`;
            } else {
                announcer.textContent = `${label} loaded`;
                // Clear after announcement
                setTimeout(() => {
                    announcer.textContent = '';
                }, 1000);
            }
        }
    }, [isLoading, label]);

    return (
        <div 
            id="loading-announcer"
            className="sr-only" 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
        />
    );
};

/**
 * Component to place at app root for loading announcements
 */
export const LoadingAnnouncer = () => {
    return (
        <div 
            id="loading-announcer"
            className="sr-only" 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
        />
    );
};

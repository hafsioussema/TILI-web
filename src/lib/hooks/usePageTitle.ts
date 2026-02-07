import { useEffect } from 'react';

/**
 * Hook to manage page titles and announce route changes to screen readers
 * @param title - The title of the current page
 */
export const usePageTitle = (title: string) => {
    useEffect(() => {
        // Update document title
        document.title = `${title} - TILI Workspace`;
        
        // Announce page change to screen readers
        const announcement = document.getElementById('route-announcer');
        if (announcement) {
            announcement.textContent = `Navigated to ${title}`;
        }
    }, [title]);
};

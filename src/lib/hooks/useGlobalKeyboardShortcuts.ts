import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts handler
 * Prevents conflicts with browser shortcuts by checking context
 * and using preventDefault() appropriately
 */
export const useGlobalKeyboardShortcuts = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Track 'g' key for Gmail-style navigation sequences
        let lastKey: string | null = null;
        let lastKeyTime = 0;

        const findButtonByText = (labels: string[]) => {
            const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
            const lowered = labels.map((label) => label.toLowerCase());
            return buttons.find((button) => {
                const text = (button.textContent || '').toLowerCase();
                const aria = (button.getAttribute('aria-label') || '').toLowerCase();
                return lowered.some((label) => text.includes(label) || aria.includes(label));
            });
        };

        const handleGlobalShortcuts = (e: KeyboardEvent) => {
            // Check if user is typing in an input field
            const target = e.target as HTMLElement;
            const isTyping = 
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable;
            const key = e.key.toLowerCase();

            // Ctrl/Cmd + K = Focus search (prevent browser's "add bookmark")
            if ((e.ctrlKey || e.metaKey) && key === 'k') {
                if (!isTyping) {
                    if (e.cancelable) {
                        e.preventDefault(); // Prevent browser bookmark dialog
                        e.stopPropagation();
                    }
                    const searchInput = document.getElementById('global-search') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                    }
                }
            }

            // Ctrl/Cmd + N = Create new item (prevent browser's "new window")
            if ((e.ctrlKey || e.metaKey) && key === 'n' && !e.altKey) {
                if (!isTyping) {
                    if (e.cancelable) {
                        e.preventDefault(); // Prevent new browser window
                        e.stopPropagation();
                    }
                    // Context-dependent: try to find a "new" or "create" button
                    const newButton = document.querySelector<HTMLButtonElement>(
                        '[aria-label*="New"], [aria-label*="Create"], [aria-label*="Add"]'
                    );
                    if (newButton && !newButton.disabled) {
                        newButton.click();
                    }
                }
            }

            // Ctrl/Cmd + Alt + N = Create new item (fallback when browser blocks Ctrl+N)
            if ((e.ctrlKey || e.metaKey) && e.altKey && key === 'n') {
                if (!isTyping) {
                    if (e.cancelable) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    const newButton = document.querySelector<HTMLButtonElement>(
                        '[aria-label*="New"], [aria-label*="Create"], [aria-label*="Add"]'
                    );
                    if (newButton && !newButton.disabled) {
                        newButton.click();
                    }
                }
            }

            // Ctrl/Cmd + S = Save form (prevent browser's "save page")
            if ((e.ctrlKey || e.metaKey) && key === 's') {
                // Check if we're in a form or modal
                const isInForm = target.closest('form');
                const isInModal = target.closest('[role="dialog"]');
                
                if (isInForm || isInModal) {
                    if (e.cancelable) {
                        e.preventDefault(); // Prevent browser save dialog
                        e.stopPropagation();
                    }
                    
                    // Try to find and click submit button
                    const submitButton = document.querySelector<HTMLButtonElement>(
                        'button[type="submit"], form button[form]'
                    );
                    if (submitButton && !submitButton.disabled) {
                        submitButton.click();
                    }
                }
            }

            // Ctrl/Cmd + / = Show keyboard shortcuts help
            if ((e.ctrlKey || e.metaKey) && key === '/') {
                if (!isTyping) {
                    if (e.cancelable) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    // Trigger ? key event to open shortcuts modal
                    const questionMarkEvent = new KeyboardEvent('keydown', {
                        key: '?',
                        bubbles: true,
                        cancelable: true
                    });
                    window.dispatchEvent(questionMarkEvent);
                }
            }

            // Alt + Home = Navigate to home
            if (e.altKey && key === 'home' && !isTyping) {
                e.preventDefault();
                navigate('/');
            }

            // Alt + P = Navigate to projects
            if (e.altKey && key === 'p' && !isTyping) {
                e.preventDefault();
                navigate('/projects');
            }

            // Alt + D = Navigate to documents
            if (e.altKey && key === 'd' && !isTyping) {
                e.preventDefault();
                navigate('/documents');
            }

            // Alt + U = Navigate to users (admin only)
            if (e.altKey && key === 'u' && !isTyping) {
                e.preventDefault();
                navigate('/users');
            }

            // Alt + M = Navigate to meetings
            if (e.altKey && key === 'm' && !isTyping) {
                e.preventDefault();
                navigate('/meetings');
            }

            // Alt + T = Navigate to tasks (if exists)
            if (e.altKey && key === 't' && !isTyping) {
                e.preventDefault();
                navigate('/tasks');
            }

            // Ctrl/Cmd + B = Go back in history
            if ((e.ctrlKey || e.metaKey) && key === 'b' && !isTyping) {
                e.preventDefault();
                window.history.back();
            }

            // Ctrl/Cmd + Shift + P = New Project
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'p' && !isTyping) {
                e.preventDefault();
                navigate('/projects');
                // Try to find and click "New Project" button after navigation
                setTimeout(() => {
                    const newProjectBtn = findButtonByText([
                        'new project',
                        'nouveau projet',
                        'create project',
                        'add project'
                    ]);
                    newProjectBtn?.click();
                }, 100);
            }

            // Ctrl/Cmd + Shift + D = New Document
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'd' && !isTyping) {
                e.preventDefault();
                navigate('/documents');
                setTimeout(() => {
                    const newDocBtn = findButtonByText([
                        'new document',
                        'nouveau document',
                        'upload',
                        'televerser',
                        'add document'
                    ]);
                    newDocBtn?.click();
                }, 100);
            }

            // Ctrl/Cmd + Shift + M = New Meeting
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'm' && !isTyping) {
                e.preventDefault();
                navigate('/meetings');
                setTimeout(() => {
                    const newMeetingBtn = findButtonByText([
                        'new meeting',
                        'nouvelle reunion',
                        'nouvelle réunion',
                        'create meeting',
                        'add meeting'
                    ]);
                    newMeetingBtn?.click();
                }, 100);
            }

            // Gmail-style 'g' key sequences for navigation
            // g + h = Go Home
            // g + p = Go Projects
            // g + d = Go Documents
            // g + m = Go Meetings
            if (!isTyping && key === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const now = Date.now();
                if (now - lastKeyTime < 1000 && lastKey === 'g') {
                    // Already pressed 'g', ignore
                    return;
                }
                lastKey = 'g';
                lastKeyTime = now;
                e.preventDefault();
                return;
            }

            // Handle second key after 'g'
            if (!isTyping && lastKey === 'g' && Date.now() - lastKeyTime < 1000) {
                if (key === 'h') {
                    e.preventDefault();
                    navigate('/');
                    lastKey = null;
                }
                if (key === 'p') {
                    e.preventDefault();
                    navigate('/projects');
                    lastKey = null;
                }
                if (key === 'd') {
                    e.preventDefault();
                    navigate('/documents');
                    lastKey = null;
                }
                if (key === 'm') {
                    e.preventDefault();
                    navigate('/meetings');
                    lastKey = null;
                }
                if (key === 'u') {
                    e.preventDefault();
                    navigate('/users');
                    lastKey = null;
                }
            }

            // Reset 'g' sequence if too much time passed
            if (lastKey === 'g' && Date.now() - lastKeyTime > 1000) {
                lastKey = null;
            }

            // Ctrl + [ = Go back (alternative)
            if ((e.ctrlKey || e.metaKey) && key === '[' && !isTyping) {
                e.preventDefault();
                window.history.back();
            }

            // Ctrl + ] = Go forward
            if ((e.ctrlKey || e.metaKey) && key === ']' && !isTyping) {
                e.preventDefault();
                window.history.forward();
            }

            // Escape = Clear search or close sidebar (context-dependent)
            if (e.key === 'Escape' && !isTyping) {
                // Clear search input if focused
                const searchInput = document.getElementById('global-search') as HTMLInputElement;
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.value = '';
                    searchInput.blur();
                    e.preventDefault();
                }

                // Close any open dropdown menus
                const openDropdown = document.querySelector('[role="menu"][data-state="open"]');
                if (openDropdown) {
                    // Trigger Escape on the dropdown
                    const escEvent = new KeyboardEvent('keydown', {
                        key: 'Escape',
                        bubbles: true,
                        cancelable: true
                    });
                    openDropdown.dispatchEvent(escEvent);
                    e.preventDefault();
                }
            }
        };

        // Listen for keyboard events
        window.addEventListener('keydown', handleGlobalShortcuts, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleGlobalShortcuts, { capture: true });
        };
    }, [navigate]);
};

/**
 * Check if a keyboard event should be prevented from triggering shortcuts
 * @param e Keyboard event
 * @returns true if the event should be ignored
 */
export const shouldIgnoreShortcut = (e: KeyboardEvent): boolean => {
    const target = e.target as HTMLElement;
    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );
};

/**
 * Format keyboard shortcut for display
 * @param keys Array of keys (e.g., ['Ctrl', 'K'])
 * @returns Formatted string (e.g., 'Ctrl+K' or '⌘K' on Mac)
 */
export const formatShortcut = (keys: string[]): string => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return keys
        .map(key => {
            if (key === 'Ctrl' && isMac) return '⌘';
            if (key === 'Alt' && isMac) return '⌥';
            if (key === 'Shift') return '⇧';
            return key;
        })
        .join(isMac ? '' : '+');
};

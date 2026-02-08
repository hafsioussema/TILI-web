import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing keyboard navigation in the application
 * Tracks keyboard-only navigation and applies visual indicators
 */
export const useKeyboardNavigation = () => {
  const isKeyboardNavRef = useRef(false);
  const lastInteractionRef = useRef<'keyboard' | 'mouse' | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if Tab, Shift+Tab, or arrow keys are pressed (keyboard navigation)
    if (
      e.key === 'Tab' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Enter' ||
      e.key === ' '
    ) {
      isKeyboardNavRef.current = true;
      lastInteractionRef.current = 'keyboard';
      document.documentElement.setAttribute('data-keyboard-nav', 'true');
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    isKeyboardNavRef.current = false;
    lastInteractionRef.current = 'mouse';
    document.documentElement.removeAttribute('data-keyboard-nav');
  }, []);

  useEffect(() => {
    // Add global keyboard and mouse listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleMouseDown);
    };
  }, [handleKeyDown, handleMouseDown]);

  return {
    isKeyboardNav: isKeyboardNavRef.current,
    lastInteraction: lastInteractionRef.current,
  };
};

/**
 * Hook for managing focus within a modal or component
 * Traps focus when component is mounted
 */
export const useFocusTrap = (containerRef: React.RefObject<HTMLDivElement | null>, isActive = true) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element on mount
    firstElement.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
};

/**
 * Hook for announcing changes to screen readers
 */
export const useAnnouncementRegion = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('route-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, []);

  return { announce };
};

/**
 * Hook to get all focusable elements in a container
 */
export const useFocusableElements = (containerRef: React.RefObject<HTMLElement>) => {
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    return Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  }, [containerRef]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  return {
    getFocusableElements,
    focusFirst,
    focusLast,
  };
};

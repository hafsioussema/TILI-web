/**
 * Keyboard Navigation Utilities
 * Provides helper functions for keyboard-only navigation support
 */

/**
 * Check if the user is currently using keyboard navigation
 */
export const isUsingKeyboardNavigation = (): boolean => {
  return document.documentElement.getAttribute('data-keyboard-nav') === 'true';
};

/**
 * Trigger keyboard navigation mode (for testing / manual activation)
 */
export const enableKeyboardNavMode = (): void => {
  document.documentElement.setAttribute('data-keyboard-nav', 'true');
};

/**
 * Disable keyboard navigation mode
 */
export const disableKeyboardNavMode = (): void => {
  document.documentElement.removeAttribute('data-keyboard-nav');
};

/**
 * Get all focusable elements in a container
 */
export const getFocusableElements = (container = document.body): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
};

/**
 * Get the next focusable element from a given element
 */
export const getNextFocusableElement = (currentElement: HTMLElement): HTMLElement | null => {
  const focusableElements = getFocusableElements();
  const currentIndex = focusableElements.indexOf(currentElement);

  if (currentIndex === -1) return focusableElements[0] || null;
  if (currentIndex === focusableElements.length - 1) return focusableElements[0] || null;

  return focusableElements[currentIndex + 1] || null;
};

/**
 * Get the previous focusable element from a given element
 */
export const getPreviousFocusableElement = (currentElement: HTMLElement): HTMLElement | null => {
  const focusableElements = getFocusableElements();
  const currentIndex = focusableElements.indexOf(currentElement);

  if (currentIndex === -1) return focusableElements[focusableElements.length - 1] || null;
  if (currentIndex === 0) return focusableElements[focusableElements.length - 1] || null;

  return focusableElements[currentIndex - 1] || null;
};

/**
 * Announce a message to screen reader users
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcer = document.getElementById('route-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    // Clear after announcement to allow repeated announcements
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};

/**
 * Focus an element with optional announcement
 */
export const focusElement = (element: HTMLElement | null, announce = true): void => {
  if (!element) return;

  // Check if element is in view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus();

  // Announce the focused element if it has a label
  if (announce) {
    const inputValue = (element as HTMLInputElement | HTMLTextAreaElement).value;
    const label = element.getAttribute('aria-label') || element.textContent || inputValue;
    if (label) {
      announceToScreenReader(`Focused on ${label}`);
    }
  }
};

/**
 * Get all heading elements in a container
 */
export const getHeadingElements = (container = document.body): HTMLElement[] => {
  return Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
};

/**
 * Navigate by headings (useful for screen reader users)
 */
export const navigateByHeading = (direction: 'next' | 'prev' = 'next'): void => {
  const headings = getHeadingElements();
  const currentHeading = document.activeElement as HTMLElement;
  const currentIndex = headings.indexOf(currentHeading);

  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
    if (nextIndex >= headings.length) nextIndex = 0;
  } else {
    nextIndex = currentIndex === -1 ? headings.length - 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = headings.length - 1;
  }

  if (headings[nextIndex]) {
    focusElement(headings[nextIndex]);
  }
};

/**
 * Get all landmarks in a container (nav, main, footer, etc.)
 */
export const getLandmarks = (container = document.body): HTMLElement[] => {
  const landmarkSelectors = [
    'nav',
    'main',
    'footer',
    'aside',
    '[role="navigation"]',
    '[role="main"]',
    '[role="contentinfo"]',
    '[role="complementary"]',
    '[role="region"]',
    '[role="search"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(landmarkSelectors)) as HTMLElement[];
};

/**
 * Navigate by landmarks (useful for screen reader users)
 */
export const navigateByLandmark = (direction: 'next' | 'prev' = 'next'): void => {
  const landmarks = getLandmarks();
  const currentLandmark = document.activeElement as HTMLElement;
  const currentIndex = landmarks.findIndex((l) => l.contains(currentLandmark) || l === currentLandmark);

  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
    if (nextIndex >= landmarks.length) nextIndex = 0;
  } else {
    nextIndex = currentIndex === -1 ? landmarks.length - 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = landmarks.length - 1;
  }

  if (landmarks[nextIndex]) {
    focusElement(landmarks[nextIndex]);
  }
};

/**
 * Register a keyboard shortcut
 */
export const registerKeyboardShortcut = (
  key: string,
  callback: (e: KeyboardEvent) => void,
  modifiers = { ctrl: false, shift: false, alt: false }
): (() => void) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const matchesModifiers =
      e.ctrlKey === modifiers.ctrl && e.shiftKey === modifiers.shift && e.altKey === modifiers.alt;

    if (e.key.toLowerCase() === key.toLowerCase() && matchesModifiers) {
      callback(e);
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return unregister function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: Element): boolean => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return element.matches(focusableSelectors);
};

/**
 * Get visible focusable elements (filters out hidden elements)
 */
export const getVisibleFocusableElements = (container = document.body): HTMLElement[] => {
  const focusableElements = getFocusableElements(container);
  return focusableElements.filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
};

/**
 * Trap focus within a container (common for modals)
 * Returns cleanup function
 */
export const trapFocus = (container: HTMLElement, returnFocusTo?: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Save currently focused element
  const previouslyFocused = document.activeElement as HTMLElement;

  // Initial focus
  firstElement.focus();

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

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    // Restore focus if element still exists
    if (returnFocusTo && document.contains(returnFocusTo)) {
      returnFocusTo.focus();
    } else if (previouslyFocused && document.contains(previouslyFocused)) {
      previouslyFocused.focus();
    }
  };
};

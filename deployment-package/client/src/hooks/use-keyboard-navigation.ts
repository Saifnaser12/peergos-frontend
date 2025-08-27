import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardNavigationOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardNavigation({ shortcuts, enabled = true }: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const metaMatch = !!shortcut.metaKey === event.metaKey;
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const altMatch = !!shortcut.altKey === event.altKey;

      return keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Hook for focus management and navigation
export function useFocusManagement() {
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const focusNext = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    (focusableElements[nextIndex] as HTMLElement)?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    (focusableElements[prevIndex] as HTMLElement)?.focus();
  }, []);

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    focusElement,
    focusNext,
    focusPrevious,
    trapFocus
  };
}

// Hook for managing skip links
export function useSkipLinks() {
  useEffect(() => {
    const skipLinks = document.querySelectorAll('[data-skip-link]');
    
    skipLinks.forEach(link => {
      const handleClick = (event: Event) => {
        event.preventDefault();
        const target = link.getAttribute('href');
        if (target) {
          const targetElement = document.querySelector(target) as HTMLElement;
          if (targetElement) {
            targetElement.focus();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      };

      link.addEventListener('click', handleClick);
      
      return () => link.removeEventListener('click', handleClick);
    });
  }, []);
}

// Common keyboard shortcuts for the application
export const commonShortcuts = {
  search: { key: 'k', metaKey: true, description: 'Open search' },
  dashboard: { key: '1', metaKey: true, description: 'Go to dashboard' },
  taxes: { key: '2', metaKey: true, description: 'Go to taxes' },
  reports: { key: '3', metaKey: true, description: 'Go to reports' },
  settings: { key: '4', metaKey: true, description: 'Go to settings' },
  help: { key: '?', description: 'Show keyboard shortcuts' },
  save: { key: 's', metaKey: true, description: 'Save current form' },
  cancel: { key: 'Escape', description: 'Cancel/close current action' },
  submit: { key: 'Enter', metaKey: true, description: 'Submit current form' }
};

// Accessibility helpers
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
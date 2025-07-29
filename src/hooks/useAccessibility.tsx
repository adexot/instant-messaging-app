import { useEffect, useRef, useCallback } from 'react';
import { ScreenReaderAnnouncer, FocusManager, ARIA } from '../lib/accessibility';

// Hook for screen reader announcements
export function useScreenReader() {
  const announcer = useRef<ScreenReaderAnnouncer | undefined>(undefined);

  useEffect(() => {
    announcer.current = ScreenReaderAnnouncer.getInstance();
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcer.current?.announce(message, priority);
  }, []);

  const announceImmediate = useCallback((message: string) => {
    announcer.current?.announceImmediate(message);
  }, []);

  return { announce, announceImmediate };
}

// Hook for focus management
export function useFocusManagement() {
  const saveFocus = useCallback(() => {
    FocusManager.saveFocus();
  }, []);

  const restoreFocus = useCallback(() => {
    return FocusManager.restoreFocus();
  }, []);

  const focusFirstInteractive = useCallback((container: HTMLElement) => {
    return FocusManager.focusFirstInteractive(container);
  }, []);

  const focusLastInteractive = useCallback((container: HTMLElement) => {
    return FocusManager.focusLastInteractive(container);
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirstInteractive,
    focusLastInteractive,
  };
}

// Hook for generating stable ARIA IDs
export function useAriaId(prefix: string = 'aria') {
  const idRef = useRef<string | undefined>(undefined);

  if (!idRef.current) {
    idRef.current = ARIA.generateId(prefix);
  }

  return idRef.current;
}

// Hook for keyboard navigation in lists
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return;

    const newIndex = require('../lib/accessibility').KeyboardNavigation.handleArrowNavigation(
      event,
      items,
      currentIndexRef.current,
      options
    );

    currentIndexRef.current = newIndex;
  }, [items, options]);

  const setCurrentIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      currentIndexRef.current = index;
    }
  }, [items.length]);

  return {
    currentIndex: currentIndexRef.current,
    setCurrentIndex,
    handleKeyDown,
  };
}

// Hook for managing live regions
export function useLiveRegion(initialMessage: string = '') {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const { announce } = useScreenReader();

  const updateLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
    // Also use the screen reader announcer as fallback
    announce(message, priority);
  }, [announce]);

  const LiveRegion = useCallback(({ className = '' }: { className?: string }) => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {initialMessage}
    </div>
  ), [initialMessage]);

  return {
    updateLiveRegion,
    LiveRegion,
  };
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const addSkipLink = useCallback((targetId: string, text: string) => {
    if (!skipLinksRef.current) return;

    const skipLink = require('../lib/accessibility').createSkipLink(targetId, text);
    skipLinksRef.current.appendChild(skipLink);
  }, []);

  const SkipLinks = useCallback(({ className = '' }: { className?: string }) => (
    <div
      ref={skipLinksRef}
      className={`skip-links ${className}`}
      aria-label="Skip navigation links"
    />
  ), []);

  return {
    addSkipLink,
    SkipLinks,
  };
}

// Hook for reduced motion preferences
export function useReducedMotion() {
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion.current;
}
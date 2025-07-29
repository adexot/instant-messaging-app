/**
 * Accessibility utilities for the instant messaging app
 * Provides ARIA announcements, focus management, and keyboard navigation helpers
 */

// Screen reader announcement utility
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private announceElement: HTMLElement | null = null;

  private constructor() {
    this.createAnnounceElement();
  }

  public static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createAnnounceElement(): void {
    if (typeof window === 'undefined') return;

    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.setAttribute('aria-relevant', 'additions text');
    this.announceElement.className = 'sr-only';
    this.announceElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(this.announceElement);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);
    this.announceElement.textContent = message;

    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = '';
      }
    }, 1000);
  }

  public announceImmediate(message: string): void {
    this.announce(message, 'assertive');
  }
}

// Focus management utilities
export class FocusManager {
  private static focusHistory: HTMLElement[] = [];

  public static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement);
    }
  }

  public static restoreFocus(): boolean {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
      return true;
    }
    return false;
  }

  public static focusFirstInteractive(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }

  public static focusLastInteractive(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  }

  private static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  public static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      onSelect?: (index: number) => void;
    } = {}
  ): number {
    const { orientation = 'vertical', wrap = true, onSelect } = options;
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap 
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(0, currentIndex - 1);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap 
            ? (currentIndex + 1) % items.length
            : Math.min(items.length - 1, currentIndex + 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap 
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(0, currentIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap 
            ? (currentIndex + 1) % items.length
            : Math.min(items.length - 1, currentIndex + 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          event.preventDefault();
          onSelect(currentIndex);
        }
        break;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  }
}

// ARIA utilities
export const ARIA = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Common ARIA attributes for different component types
  button: (label: string, options: { pressed?: boolean; expanded?: boolean; describedBy?: string } = {}) => ({
    'aria-label': label,
    ...(options.pressed !== undefined && { 'aria-pressed': options.pressed }),
    ...(options.expanded !== undefined && { 'aria-expanded': options.expanded }),
    ...(options.describedBy && { 'aria-describedby': options.describedBy }),
  }),

  textbox: (label: string, options: { required?: boolean; invalid?: boolean; describedBy?: string } = {}) => ({
    'aria-label': label,
    ...(options.required && { 'aria-required': true }),
    ...(options.invalid && { 'aria-invalid': true }),
    ...(options.describedBy && { 'aria-describedby': options.describedBy }),
  }),

  listbox: (label: string, options: { multiselectable?: boolean; expanded?: boolean } = {}) => ({
    role: 'listbox',
    'aria-label': label,
    ...(options.multiselectable && { 'aria-multiselectable': true }),
    ...(options.expanded !== undefined && { 'aria-expanded': options.expanded }),
  }),

  option: (selected: boolean, options: { disabled?: boolean; describedBy?: string } = {}) => ({
    role: 'option',
    'aria-selected': selected,
    ...(options.disabled && { 'aria-disabled': true }),
    ...(options.describedBy && { 'aria-describedby': options.describedBy }),
  }),

  region: (label: string, options: { live?: 'polite' | 'assertive' | 'off'; atomic?: boolean } = {}) => ({
    role: 'region',
    'aria-label': label,
    ...(options.live && { 'aria-live': options.live }),
    ...(options.atomic !== undefined && { 'aria-atomic': options.atomic }),
  }),

  status: (options: { live?: 'polite' | 'assertive'; atomic?: boolean } = {}) => ({
    role: 'status',
    'aria-live': options.live || 'polite',
    'aria-atomic': options.atomic !== undefined ? options.atomic : true,
  }),

  alert: (options: { atomic?: boolean } = {}) => ({
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': options.atomic !== undefined ? options.atomic : true,
  }),
};

// Skip link utility for keyboard navigation
export const createSkipLink = (targetId: string, text: string): HTMLElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg';
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  return skipLink;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast detection
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};
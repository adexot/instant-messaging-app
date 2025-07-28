import { useEffect } from 'react';

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook for managing desktop keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow some shortcuts even in inputs (like Ctrl+A, Ctrl+C, etc.)
        const allowedInInputs = ['a', 'c', 'v', 'x', 'z', 'y'];
        if (!allowedInInputs.includes(event.key.toLowerCase()) || 
            !(event.ctrlKey || event.metaKey)) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const altMatches = !!shortcut.altKey === event.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Common keyboard shortcuts for chat applications
 */
export const createChatShortcuts = (actions: {
  focusInput?: () => void;
  sendMessage?: () => void;
  scrollToBottom?: () => void;
  clearInput?: () => void;
}): KeyboardShortcutConfig[] => [
  {
    key: 'k',
    ctrlKey: true,
    action: actions.focusInput || (() => {}),
    description: 'Focus message input',
  },
  {
    key: 'k',
    metaKey: true,
    action: actions.focusInput || (() => {}),
    description: 'Focus message input (Mac)',
  },
  {
    key: 'Enter',
    ctrlKey: true,
    action: actions.sendMessage || (() => {}),
    description: 'Send message',
  },
  {
    key: 'Enter',
    metaKey: true,
    action: actions.sendMessage || (() => {}),
    description: 'Send message (Mac)',
  },
  {
    key: 'End',
    ctrlKey: true,
    action: actions.scrollToBottom || (() => {}),
    description: 'Scroll to bottom',
  },
  {
    key: 'Escape',
    action: actions.clearInput || (() => {}),
    description: 'Clear input',
  },
];
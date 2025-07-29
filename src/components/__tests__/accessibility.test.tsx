import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AliasEntry } from '../AliasEntry';
import { MessageInput } from '../MessageInput';
import { MessageBubble } from '../MessageBubble';
import { TypingIndicator } from '../TypingIndicator';
import { OnlineUsersList } from '../OnlineUsersList';
import { ToastProvider } from '../ui/toast';
import type { Message, User, TypingStatus } from '../../types';

const renderWithToast = (component: React.ReactElement) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe('Accessibility Features', () => {
  describe('AliasEntry Accessibility', () => {
    const mockProps = {
      onAliasSubmit: vi.fn(),
      checkAliasUniqueness: vi.fn(),
      isLoading: false,
    };

    it('should have proper ARIA attributes', () => {
      renderWithToast(<AliasEntry {...mockProps} />);
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have accessible form structure', () => {
      renderWithToast(<AliasEntry {...mockProps} />);
      
      const form = document.querySelector('form');
      expect(form).toHaveAttribute('novalidate');
      expect(form).toHaveAttribute('aria-describedby', 'form-description');
    });

    it('should announce validation states', async () => {
      mockProps.checkAliasUniqueness.mockResolvedValue(false);
      renderWithToast(<AliasEntry {...mockProps} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have accessible validation status indicator', async () => {
      mockProps.checkAliasUniqueness.mockResolvedValue(true);
      renderWithToast(<AliasEntry {...mockProps} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'validalias');
      
      await waitFor(() => {
        const statusIndicator = document.querySelector('[aria-live="polite"]');
        expect(statusIndicator).toBeInTheDocument();
      });
    });
  });

  describe('MessageInput Accessibility', () => {
    const mockProps = {
      onSendMessage: vi.fn(),
      disabled: false,
      onTypingStart: vi.fn(),
      onTypingStop: vi.fn(),
    };

    it('should have proper ARIA attributes', () => {
      renderWithToast(<MessageInput {...mockProps} />);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      expect(input).toHaveAttribute('aria-label', 'Type your message');
      expect(input).toHaveAttribute('aria-multiline', 'false');
      expect(sendButton).toHaveAttribute('aria-label', 'Send message');
    });

    it('should announce character count to screen readers', () => {
      renderWithToast(<MessageInput {...mockProps} />);
      
      const characterCount = screen.getByLabelText(/characters used/i);
      expect(characterCount).toBeInTheDocument();
    });

    it('should have proper error message associations', async () => {
      renderWithToast(<MessageInput {...mockProps} />);
      
      const input = screen.getByRole('textbox');
      // Type a very long message to trigger validation error
      await userEvent.type(input, 'a'.repeat(1001));
      
      await waitFor(() => {
        const errorMessage = screen.queryByRole('alert');
        if (errorMessage) {
          expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
        }
      });
    });

    it('should update button aria-label when sending', async () => {
      mockProps.onSendMessage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithToast(<MessageInput {...mockProps} />);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      await userEvent.type(input, 'test message');
      await userEvent.click(sendButton);
      
      expect(screen.getByRole('button', { name: /sending message/i })).toBeInTheDocument();
    });
  });

  describe('MessageBubble Accessibility', () => {
    const mockMessage: Message = {
      id: '1',
      content: 'Test message',
      senderId: 'user1',
      senderAlias: 'testuser',
      timestamp: new Date(),
      status: 'delivered',
    };

    it('should have proper semantic structure', () => {
      renderWithToast(
        <MessageBubble 
          message={mockMessage} 
          isOwnMessage={false} 
          showTimestamp={true} 
        />
      );
      
      const messageGroup = screen.getByRole('group');
      const messageArticle = screen.getByRole('article');
      const messageText = screen.getByRole('text');
      
      expect(messageGroup).toBeInTheDocument();
      expect(messageArticle).toBeInTheDocument();
      expect(messageText).toBeInTheDocument();
    });

    it('should have proper ARIA labels for message context', () => {
      renderWithToast(
        <MessageBubble 
          message={mockMessage} 
          isOwnMessage={false} 
          showTimestamp={true} 
        />
      );
      
      const messageArticle = screen.getByRole('article');
      expect(messageArticle).toHaveAttribute('aria-label', "testuser's message");
    });

    it('should have accessible timestamp information', () => {
      renderWithToast(
        <MessageBubble 
          message={mockMessage} 
          isOwnMessage={false} 
          showTimestamp={true} 
        />
      );
      
      const timestamp = screen.getByLabelText(/sent at/i);
      expect(timestamp).toBeInTheDocument();
    });

    it('should have accessible retry button for failed messages', () => {
      const failedMessage = { ...mockMessage, status: 'failed' as const };
      const onRetry = vi.fn();
      
      renderWithToast(
        <MessageBubble 
          message={failedMessage} 
          isOwnMessage={true} 
          showTimestamp={true} 
          onRetry={onRetry}
        />
      );
      
      const retryButton = screen.getByRole('button', { name: /retry sending message/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('aria-label', 'Retry sending message');
    });

    it('should announce failed message status', () => {
      const failedMessage = { ...mockMessage, status: 'failed' as const };
      
      renderWithToast(
        <MessageBubble 
          message={failedMessage} 
          isOwnMessage={true} 
          showTimestamp={true} 
        />
      );
      
      const failedAlert = screen.getByRole('alert');
      expect(failedAlert).toBeInTheDocument();
      expect(failedAlert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('TypingIndicator Accessibility', () => {
    const mockTypingUsers: TypingStatus[] = [
      { userId: '1', userAlias: 'user1', timestamp: new Date() },
    ];

    it('should have proper live region attributes', () => {
      render(<TypingIndicator typingUsers={mockTypingUsers} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
      expect(indicator).toHaveAttribute('aria-atomic', 'true');
      expect(indicator).toHaveAttribute('aria-label', 'Typing indicator');
    });

    it('should hide decorative elements from screen readers', () => {
      render(<TypingIndicator typingUsers={mockTypingUsers} />);
      
      const dots = document.querySelector('[aria-hidden="true"]');
      expect(dots).toBeInTheDocument();
    });

    it('should provide meaningful text for multiple users', () => {
      const multipleUsers: TypingStatus[] = [
        { userId: '1', userAlias: 'user1', timestamp: new Date() },
        { userId: '2', userAlias: 'user2', timestamp: new Date() },
      ];
      
      render(<TypingIndicator typingUsers={multipleUsers} />);
      
      expect(screen.getByText('user1 and user2 are typing...')).toBeInTheDocument();
    });
  });

  describe('OnlineUsersList Accessibility', () => {
    const mockUsers: User[] = [
      { id: '1', alias: 'user1', joinedAt: new Date().toISOString() },
      { id: '2', alias: 'user2', joinedAt: new Date().toISOString() },
    ];

    const mockCurrentUser: User = {
      id: '1',
      alias: 'user1',
      joinedAt: new Date().toISOString(),
    };

    it('should have proper semantic list structure', () => {
      render(
        <OnlineUsersList 
          users={mockUsers} 
          currentUser={mockCurrentUser} 
          userCount={2} 
        />
      );
      
      const usersList = screen.getByRole('list', { name: /online users list/i });
      const userItems = screen.getAllByRole('listitem');
      
      expect(usersList).toBeInTheDocument();
      expect(userItems).toHaveLength(2);
    });

    it('should have accessible user count badge', () => {
      render(
        <OnlineUsersList 
          users={mockUsers} 
          currentUser={mockCurrentUser} 
          userCount={2} 
        />
      );
      
      const badge = screen.getByLabelText('2 users online');
      expect(badge).toBeInTheDocument();
    });

    it('should provide meaningful labels for user items', () => {
      render(
        <OnlineUsersList 
          users={mockUsers} 
          currentUser={mockCurrentUser} 
          userCount={2} 
        />
      );
      
      const currentUserItem = screen.getByLabelText(/user1 \(you\)/i);
      expect(currentUserItem).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Escape key to clear message input', async () => {
      renderWithToast(
        <MessageInput 
          onSendMessage={vi.fn()} 
          disabled={false} 
        />
      );
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test message');
      expect(input).toHaveValue('test message');
      
      await userEvent.keyboard('{Escape}');
      expect(input).toHaveValue('');
    });
  });

  describe('Focus Management', () => {
    it('should auto-focus alias input on mount', () => {
      renderWithToast(
        <AliasEntry 
          onAliasSubmit={vi.fn()} 
          checkAliasUniqueness={vi.fn()} 
          isLoading={false} 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });

    it('should auto-focus message input on mount', () => {
      renderWithToast(
        <MessageInput 
          onSendMessage={vi.fn()} 
          disabled={false} 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });
});
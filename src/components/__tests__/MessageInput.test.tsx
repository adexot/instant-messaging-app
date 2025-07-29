import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnTypingStart = vi.fn();
  const mockOnTypingStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input field and send button', () => {
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should disable send button when message is empty', () => {
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when message has content', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(input, 'Hello world');

    expect(sendButton).toBeEnabled();
  });

  it('should call onSendMessage when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(input, 'Hello world');
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('should call onSendMessage when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');

    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('should clear input after successful send', async () => {
    const user = userEvent.setup();
    mockOnSendMessage.mockResolvedValue(undefined);

    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');

    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should call typing callbacks when user types', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');

    await user.type(input, 'H');

    expect(mockOnTypingStart).toHaveBeenCalled();
  });

  it('should show character counter when near limit', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');
    
    // Type a message that's just over 80% of the limit (801 characters)
    const longMessage = 'a'.repeat(801);
    await user.type(input, longMessage);

    // Should show character counter in the overlay (remaining characters)
    expect(screen.getByText('199')).toBeInTheDocument();
  });

  it('should disable input and button when disabled prop is true', () => {
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('Connecting...');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should show loading state when sending', async () => {
    const user = userEvent.setup();
    // Mock a slow send operation
    mockOnSendMessage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        onTypingStart={mockOnTypingStart}
        onTypingStop={mockOnTypingStop}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');

    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');

    // Should show loading spinner
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
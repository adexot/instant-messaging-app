import { render, screen } from '@testing-library/react';
import { VirtualMessageList } from '../VirtualMessageList';
import { ToastProvider } from '../ui/toast';
import type { Message, User } from '../../types';
import { expect } from 'vitest';
import { vi } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';

// Mock react-window
vi.mock('react-window', () => ({
  VariableSizeList: vi.fn().mockImplementation(({ children, itemData, itemCount }) => {
    // Render a few items to test the component
    const items = [];
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const ItemComponent = children;
      items.push(
        <ItemComponent
          key={i}
          index={i}
          style={{}}
          data={itemData}
        />
      );
    }
    return <div data-testid="virtual-list">{items}</div>;
  }),
}));

const mockUser: User = {
  id: 'user1',
  alias: 'testuser',
  isOnline: true,
  lastSeen: new Date(),
  joinedAt: new Date(),
};

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello world',
    senderId: 'user1',
    senderAlias: 'testuser',
    timestamp: new Date(),
    status: 'delivered',
  },
  {
    id: '2',
    content: 'How are you?',
    senderId: 'user2',
    senderAlias: 'otheruser',
    timestamp: new Date(),
    status: 'delivered',
  },
];

const renderWithToast = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('VirtualMessageList', () => {
  it('should render virtual list with messages', () => {
    renderWithToast(
      <VirtualMessageList
        messages={mockMessages}
        currentUser={mockUser}
        height={400}
      />
    );

    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    renderWithToast(
      <VirtualMessageList
        messages={[]}
        currentUser={mockUser}
        height={400}
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Start the conversation!')).toBeInTheDocument();
  });

  it('should handle retry callback', () => {
    const onRetry = vi.fn();
    const failedMessage: Message = {
      id: '3',
      content: 'Failed message',
      senderId: 'user1',
      senderAlias: 'testuser',
      timestamp: new Date(),
      status: 'failed',
    };

    renderWithToast(
      <VirtualMessageList
        messages={[failedMessage]}
        currentUser={mockUser}
        height={400}
        onRetryFailedMessage={onRetry}
      />
    );

    const retryButton = screen.getByText('Retry');
    retryButton.click();

    expect(onRetry).toHaveBeenCalledWith('3');
  });
});
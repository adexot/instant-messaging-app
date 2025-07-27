import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AliasEntry } from '../AliasEntry';

// Mock the instant-db module
vi.mock('@/lib/instant', () => ({
  db: {
    // Mock as empty object since we're not using the actual query method in the current implementation
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle" className={className} />,
}));

const mockOnAliasSubmit = vi.fn();
const mockCheckAliasUniqueness = vi.fn();

describe('AliasEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to returning true (unique) for most tests
    mockCheckAliasUniqueness.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders the form with correct elements', () => {
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    expect(screen.getByRole('heading', { name: 'Join Chat' })).toBeInTheDocument();
    expect(screen.getByText('Choose a unique alias to start messaging')).toBeInTheDocument();
    expect(screen.getByLabelText('Alias')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your alias')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Chat' })).toBeInTheDocument();
  });

  it('shows validation error for empty alias', async () => {
    const user = userEvent.setup();
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    const submitButton = screen.getByRole('button', { name: 'Join Chat' });
    
    await user.type(input, 'a');
    await user.clear(input);
    
    expect(submitButton).toBeDisabled();
  });

  it('shows validation error for alias too short', async () => {
    const user = userEvent.setup();
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    
    await user.type(input, 'a');
    
    await waitFor(() => {
      expect(screen.getByText('Alias must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for alias too long', async () => {
    const user = userEvent.setup();
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    
    await user.type(input, 'a'.repeat(21)); // 21 characters, max is 20
    
    await waitFor(() => {
      expect(screen.getByText('Alias must be no more than 20 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid characters', async () => {
    const user = userEvent.setup();
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    
    await user.type(input, 'test@user');
    
    await waitFor(() => {
      expect(screen.getByText('Alias can only contain letters, numbers, underscores, and hyphens')).toBeInTheDocument();
    });
  });

  it('shows loading state during uniqueness check', async () => {
    const user = userEvent.setup();
    // Make the check take some time to show loading state
    mockCheckAliasUniqueness.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    
    await user.type(input, 'testuser');
    
    await waitFor(() => {
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  it('shows success icon for unique alias', async () => {
    const user = userEvent.setup();
    
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    
    await user.type(input, 'testuser');
    
    await waitFor(() => {
      expect(screen.getByTestId('check-circle')).toBeInTheDocument();
    });
  });

  it('enables submit button only when alias is valid and unique', async () => {
    const user = userEvent.setup();
    
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    const submitButton = screen.getByRole('button', { name: 'Join Chat' });
    
    expect(submitButton).toBeDisabled();
    
    await user.type(input, 'testuser');
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('calls onAliasSubmit with correct alias when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    const submitButton = screen.getByRole('button', { name: 'Join Chat' });
    
    await user.type(input, 'TestUser');
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    
    await user.click(submitButton);
    
    expect(mockOnAliasSubmit).toHaveBeenCalledWith('testuser'); // Should be lowercase
  });

  it('shows loading state when isLoading prop is true', () => {
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    const submitButton = screen.getByRole('button', { name: 'Joining...' });
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('transforms alias to lowercase', async () => {
    const user = userEvent.setup();
    
    render(<AliasEntry onAliasSubmit={mockOnAliasSubmit} checkAliasUniqueness={mockCheckAliasUniqueness} />);
    
    const input = screen.getByPlaceholderText('Enter your alias');
    const submitButton = screen.getByRole('button', { name: 'Join Chat' });
    
    await user.type(input, 'TestUser123');
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    
    await user.click(submitButton);
    
    // Should be called with lowercase version
    expect(mockOnAliasSubmit).toHaveBeenCalledWith('testuser123');
  });
});

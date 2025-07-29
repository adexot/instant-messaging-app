import { useRef, useEffect, memo, Suspense } from 'react';
import { AliasEntry } from './components/AliasEntry';
import { OnlineUsersList } from './components/OnlineUsersList';
import { MobileUsersSheet } from './components/MobileUsersSheet';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { TypingIndicator } from './components/TypingIndicator';
import { ConnectionStatus, ConnectionStatusHeader } from './components/ConnectionStatus';
import { CenteredLayout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToastHelpers } from './components/ui/toast';
import { ChatSkeleton } from './components/ui/skeleton';
import { useUserManagement } from './hooks/useUserManagement';
import { useMessages } from './hooks/useMessages';
import { useTyping } from './hooks/useTyping';
import { useTypingCleanup } from './hooks/useTypingCleanup';
import { useMobileKeyboard } from './hooks/useMobileKeyboard';
import { useKeyboardShortcuts, createChatShortcuts } from './hooks/useKeyboardShortcuts';
import { useScreenReader, useSkipLinks, useLiveRegion } from './hooks/useAccessibility';
import { Button } from '../@/components/ui/button';
import { LogOut } from 'lucide-react';
import { config, featureFlags } from './config/environment';

// Memoized components for better performance
const MemoizedMessageList = memo(MessageList);
const MemoizedOnlineUsersList = memo(OnlineUsersList);
const MemoizedTypingIndicator = memo(TypingIndicator);

function AppContent() {
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<{ scrollToBottom: () => void }>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const toast = useToastHelpers();

  // Accessibility hooks
  const { announce, announceImmediate } = useScreenReader();
  const { addSkipLink, SkipLinks } = useSkipLinks();
  const { updateLiveRegion, LiveRegion } = useLiveRegion();

  const {
    currentUser,
    onlineUsers,
    userCount,
    isLoading,
    error,
    joinChat,
    leaveChat,
    checkAliasUniqueness,
  } = useUserManagement();

  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    hasMoreMessages,
    sendMessage,
    loadMoreMessages,
    retryFailedMessage,
  } = useMessages({ currentUser });

  const {
    typingUsers,
    startTyping,
    stopTyping,
  } = useTyping({ currentUser });

  const keyboardState = useMobileKeyboard();

  // Cleanup old typing status records periodically
  useTypingCleanup({ enabled: !!currentUser });

  const handleAliasSubmit = async (alias: string) => {
    try {
      await joinChat(alias);
      toast.success('Welcome to the chat!', `You joined as ${alias}`);
      announce(`Successfully joined chat as ${alias}. You can now send and receive messages.`);

      // Focus the message input after joining
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again';
      toast.error('Failed to join chat', errorMessage);
      announceImmediate(`Failed to join chat: ${errorMessage}`);
    }
  };

  const handleLeaveChat = async () => {
    try {
      await leaveChat();
      toast.info('Left chat', 'You have left the chat room');
      announce('You have left the chat room');
    } catch (error) {
      toast.error('Failed to leave chat', 'Please refresh the page');
      announceImmediate('Failed to leave chat. Please refresh the page.');
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
      // Don't announce every message send to avoid spam
    } catch (error) {
      toast.error('Message failed to send', 'Your message could not be delivered');
      announceImmediate('Message failed to send. Please try again.');
    }
  };

  // Desktop keyboard shortcuts
  const shortcuts = createChatShortcuts({
    focusInput: () => messageInputRef.current?.focus(),
    scrollToBottom: () => messageListRef.current?.scrollToBottom(),
    clearInput: () => {
      if (messageInputRef.current) {
        messageInputRef.current.value = '';
        messageInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
  });

  useKeyboardShortcuts(shortcuts, !!currentUser);

  // Set up skip links
  useEffect(() => {
    if (currentUser) {
      addSkipLink('main-content', 'Skip to main content');
      addSkipLink('message-input', 'Skip to message input');
      addSkipLink('online-users', 'Skip to online users list');
    }
  }, [currentUser, addSkipLink]);

  // Announce user count changes
  useEffect(() => {
    if (currentUser && userCount > 0) {
      const message = userCount === 1
        ? 'You are the only user online'
        : `${userCount} users are currently online`;
      updateLiveRegion(message);
    }
  }, [userCount, currentUser, updateLiveRegion]);

  // Show loading skeleton while initializing
  if (isLoading && !currentUser && !error) {
    return <ChatSkeleton />;
  }

  if (!currentUser) {
    return (
      <>
        <SkipLinks />
        <LiveRegion />
        <CenteredLayout>
          <div className="space-y-4">
            <AliasEntry
              onAliasSubmit={handleAliasSubmit}
              checkAliasUniqueness={checkAliasUniqueness}
              isLoading={isLoading}
            />
            {error && (
              <div
                className="text-center text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
          </div>
        </CenteredLayout>
      </>
    );
  }

  return (
    <>
      <SkipLinks />
      <LiveRegion />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-fade-in">
        {/* Header - Mobile optimized */}
        <header
          className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 animate-slide-up"
          role="banner"
        >
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <span className="text-primary-foreground font-bold text-xs sm:text-sm">💬</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold truncate">Chat Room</h1>
                  <p
                    className="text-xs sm:text-sm text-muted-foreground truncate"
                    aria-label={`Logged in as ${currentUser.alias}`}
                  >
                    Welcome, {currentUser.alias}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Connection status indicator */}
                <ConnectionStatusHeader />

                {/* Mobile users sheet */}
                <MobileUsersSheet
                  users={onlineUsers}
                  currentUser={currentUser}
                  userCount={userCount}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveChat}
                  className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground shrink-0 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto"
                  aria-label="Leave chat room"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Leave</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Connection Status Banner */}
        <ConnectionStatus />

        {/* Main Content - Mobile-first responsive with keyboard adjustment */}
        <main
          ref={mainContentRef}
          id="main-content"
          className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]"
          style={{
            // Adjust height when mobile keyboard is visible
            height: keyboardState.isVisible
              ? `calc(100vh - 4rem - ${keyboardState.height}px)`
              : undefined
          }}
          role="main"
          aria-label="Chat application main content"
          tabIndex={-1}
        >
          <div className="h-full flex flex-col lg:flex-row lg:max-w-7xl lg:mx-auto lg:gap-4 lg:p-4">
            {/* Chat Area - Full width on mobile */}
            <div className="flex-1 flex flex-col lg:min-w-0">
              <div
                className="flex-1 bg-card lg:rounded-xl lg:shadow-sm lg:border overflow-hidden flex flex-col animate-fade-in"
                role="region"
                aria-label="Chat messages and input"
              >
                <MemoizedMessageList
                  ref={messageListRef}
                  messages={messages}
                  currentUser={currentUser}
                  isLoading={messagesLoading}
                  error={messagesError || undefined}
                  onLoadMore={loadMoreMessages}
                  hasMoreMessages={hasMoreMessages}
                  onRetryFailedMessage={retryFailedMessage}
                  useVirtualScrolling={featureFlags.isVirtualScrollingEnabled(messages.length)}
                />

                {/* Typing Indicator */}
                {featureFlags.isTypingIndicatorsEnabled() && (
                  <MemoizedTypingIndicator typingUsers={typingUsers} />
                )}

                {/* Message Input */}
                <MessageInput
                  ref={messageInputRef}
                  onSendMessage={handleSendMessage}
                  disabled={isLoading || !!error}
                  onTypingStart={startTyping}
                  onTypingStop={stopTyping}
                />
              </div>
            </div>

            {/* Sidebar - Hidden on mobile, overlay on tablet, sidebar on desktop */}
            <div className="hidden lg:block lg:w-80 xl:w-96 lg:shrink-0">
              <aside
                id="online-users"
                role="complementary"
                aria-label="Online users list"
                tabIndex={-1}
              >
                <MemoizedOnlineUsersList
                  users={onlineUsers}
                  currentUser={currentUser}
                  userCount={userCount}
                />
              </aside>
            </div>
          </div>

          {error && (
            <div
              className="mx-3 sm:mx-4 lg:mx-auto lg:max-w-7xl mt-4 text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In a real app, you might want to send this to an error reporting service
        console.error('App Error Boundary caught an error:', error, errorInfo);
        
        // Log to error reporting service in production
        if (config.instantDb.appId !== 'your-app-id') {
          // Only log in production with real app ID
          console.warn('Error logged to console. In production, this would be sent to an error reporting service.');
        }
      }}
    >
      <ToastProvider>
        <Suspense fallback={<ChatSkeleton />}>
          <AppContent />
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App
import { useRef } from 'react';
import { AliasEntry } from './components/AliasEntry';
import { OnlineUsersList } from './components/OnlineUsersList';
import { MobileUsersSheet } from './components/MobileUsersSheet';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { TypingIndicator } from './components/TypingIndicator';
import { ConnectionStatus, ConnectionStatusHeader } from './components/ConnectionStatus';
import { CenteredLayout } from './components/Layout';
import { useUserManagement } from './hooks/useUserManagement';
import { useMessages } from './hooks/useMessages';
import { useTyping } from './hooks/useTyping';
import { useMobileKeyboard } from './hooks/useMobileKeyboard';
import { useKeyboardShortcuts, createChatShortcuts } from './hooks/useKeyboardShortcuts';
import { Button } from '../@/components/ui/button';
import { LogOut } from 'lucide-react';

function App() {
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<{ scrollToBottom: () => void }>(null);
  
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

  const handleAliasSubmit = async (alias: string) => {
    await joinChat(alias);
  };

  const handleLeaveChat = async () => {
    await leaveChat();
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
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

  if (!currentUser) {
    return (
      <CenteredLayout>
        <div className="space-y-4">
          <AliasEntry 
            onAliasSubmit={handleAliasSubmit}
            checkAliasUniqueness={checkAliasUniqueness}
            isLoading={isLoading}
          />
          {error && (
            <div className="text-center text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </CenteredLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header - Mobile optimized */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">💬</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold truncate">Chat Room</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
              >
                <LogOut className="h-4 w-4" />
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
        className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]"
        style={{
          // Adjust height when mobile keyboard is visible
          height: keyboardState.isVisible 
            ? `calc(100vh - 4rem - ${keyboardState.height}px)` 
            : undefined
        }}
      >
        <div className="h-full flex flex-col lg:flex-row lg:max-w-7xl lg:mx-auto lg:gap-4 lg:p-4">
          {/* Chat Area - Full width on mobile */}
          <div className="flex-1 flex flex-col lg:min-w-0">
            <div className="flex-1 bg-card lg:rounded-xl lg:shadow-sm lg:border overflow-hidden flex flex-col">
              <MessageList
                ref={messageListRef}
                messages={messages}
                currentUser={currentUser}
                isLoading={messagesLoading}
                error={messagesError || undefined}
                onLoadMore={loadMoreMessages}
                hasMoreMessages={hasMoreMessages}
                onRetryFailedMessage={retryFailedMessage}
              />
              
              {/* Typing Indicator */}
              <TypingIndicator typingUsers={typingUsers} />
              
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
            <OnlineUsersList 
              users={onlineUsers}
              currentUser={currentUser}
              userCount={userCount}
            />
          </div>
        </div>
        
        {error && (
          <div className="mx-3 sm:mx-4 lg:mx-auto lg:max-w-7xl mt-4 text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

export default App
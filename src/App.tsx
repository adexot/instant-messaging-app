import { AliasEntry } from './components/AliasEntry';
import { OnlineUsersList } from './components/OnlineUsersList';
import { MessageList } from './components/MessageList';
import { CenteredLayout } from './components/Layout';
import { useUserManagement } from './hooks/useUserManagement';
import { useMessages } from './hooks/useMessages';
import { Button } from '../@/components/ui/button';
import { LogOut } from 'lucide-react';

function App() {
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

  const handleAliasSubmit = async (alias: string) => {
    await joinChat(alias);
  };

  const handleLeaveChat = async () => {
    await leaveChat();
  };

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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">💬</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold">Chat Room</h1>
                <p className="text-sm text-muted-foreground">Welcome, {currentUser.alias}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLeaveChat}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 h-[calc(100vh-5rem)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="flex-1 bg-card rounded-xl shadow-sm border overflow-hidden">
              <MessageList
                messages={messages}
                currentUser={currentUser}
                isLoading={messagesLoading}
                error={messagesError || undefined}
                onLoadMore={loadMoreMessages}
                hasMoreMessages={hasMoreMessages}
                onRetryFailedMessage={retryFailedMessage}
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <OnlineUsersList 
              users={onlineUsers}
              currentUser={currentUser}
              userCount={userCount}
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

export default App
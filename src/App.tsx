import { AliasEntry } from './components/AliasEntry';
import { OnlineUsersList } from './components/OnlineUsersList';
import { CenteredLayout } from './components/Layout';
import { useUserManagement } from './hooks/useUserManagement';
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {currentUser.alias}!
          </h1>
          <Button 
            variant="outline" 
            onClick={handleLeaveChat}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Leave Chat
          </Button>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
              <p className="text-lg mb-2">Chat interface will be implemented in the next tasks.</p>
              <p className="text-sm">For now, you can see the online users list on the right.</p>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <OnlineUsersList 
              users={onlineUsers}
              currentUser={currentUser}
              userCount={userCount}
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App
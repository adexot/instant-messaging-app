import { useState } from 'react';
import { AliasEntry } from './components/AliasEntry';
import { CenteredLayout } from './components/Layout';

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleAliasSubmit = (alias: string) => {
    setCurrentUser(alias);
    console.log('User joined with alias:', alias);
  };

  if (!currentUser) {
    return (
      <CenteredLayout>
        <AliasEntry onAliasSubmit={handleAliasSubmit} />
      </CenteredLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Welcome, {currentUser}!
        </h1>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">
            Chat interface will be implemented in the next tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App
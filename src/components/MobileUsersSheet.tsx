import { useState } from 'react';
import { Button } from '../../@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../@/components/ui/sheet';
import { OnlineUsersList } from './OnlineUsersList';
import { Users } from 'lucide-react';
import type { User } from '../types';

interface MobileUsersSheetProps {
  users: User[];
  currentUser: User | null;
  userCount: number;
}

export function MobileUsersSheet({ users, currentUser, userCount }: MobileUsersSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation"
        >
          <Users className="h-4 w-4" />
          <span className="text-xs">{userCount}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Online Users
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <OnlineUsersList
            users={users}
            currentUser={currentUser}
            userCount={userCount}
            className="h-full"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
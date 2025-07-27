import { useEffect, useState } from 'react';
import { Card } from '../../@/components/ui/card';
import { ScrollArea } from '../../@/components/ui/scroll-area';
import { Badge } from '../../@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import type { User } from '@/types';

interface OnlineUsersListProps {
  users: User[];
  currentUser: User | null;
  userCount: number;
  className?: string;
}

interface UserNotification {
  id: string;
  type: 'joined' | 'left';
  user: User;
  timestamp: Date;
}

export function OnlineUsersList({ 
  users, 
  currentUser, 
  userCount, 
  className = '' 
}: OnlineUsersListProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [previousUsers, setPreviousUsers] = useState<User[]>([]);

  // Track user join/leave events
  useEffect(() => {
    if (previousUsers.length === 0) {
      setPreviousUsers(users);
      return;
    }

    const previousUserIds = new Set(previousUsers.map(u => u.id));
    const currentUserIds = new Set(users.map(u => u.id));

    // Find newly joined users
    const joinedUsers = users.filter(user => 
      !previousUserIds.has(user.id) && user.id !== currentUser?.id
    );

    // Find users who left
    const leftUsers = previousUsers.filter(user => 
      !currentUserIds.has(user.id) && user.id !== currentUser?.id
    );

    // Add notifications for joined users
    joinedUsers.forEach(user => {
      const notification: UserNotification = {
        id: `joined-${user.id}-${Date.now()}`,
        type: 'joined',
        user,
        timestamp: new Date(),
      };
      setNotifications(prev => [...prev.slice(-4), notification]); // Keep last 5 notifications
    });

    // Add notifications for left users
    leftUsers.forEach(user => {
      const notification: UserNotification = {
        id: `left-${user.id}-${Date.now()}`,
        type: 'left',
        user,
        timestamp: new Date(),
      };
      setNotifications(prev => [...prev.slice(-4), notification]); // Keep last 5 notifications
    });

    setPreviousUsers(users);
  }, [users, currentUser?.id, previousUsers]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* User count header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Online Users</span>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            {userCount}
          </Badge>
        </div>
      </Card>

      {/* Online users list */}
      <Card className="p-4">
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users online
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    user.id === currentUser?.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.alias.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.alias}
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatTimeAgo(new Date(user.joinedAt))}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Join/Leave notifications */}
      {notifications.length > 0 && (
        <Card className="p-3">
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`text-xs p-2 rounded transition-all duration-300 ${
                  notification.type === 'joined'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}
              >
                <span className="font-medium">{notification.user.alias}</span>
                {notification.type === 'joined' ? ' joined the chat' : ' left the chat'}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
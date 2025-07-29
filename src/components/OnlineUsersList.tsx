import { useEffect, useState } from 'react';

import { ScrollArea } from '../../@/components/ui/scroll-area';
import { Badge } from '../../@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import type { User } from '../types';

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
      {/* Online users list */}
      <div 
        className="bg-card rounded-xl shadow-sm border overflow-hidden"
        role="region"
        aria-label="Online users"
      >
        {/* Header */}
        <div className="border-b bg-muted/30 px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium text-sm">Online</span>
            </div>
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 text-xs"
              aria-label={`${userCount} users online`}
            >
              <Circle className="h-2 w-2 fill-green-500 text-green-500" aria-hidden="true" />
              {userCount}
            </Badge>
          </div>
        </div>

        {/* Users List */}
        <ScrollArea className="h-64 sm:h-80">
          <div className="p-2 sm:p-3">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground">No users online</p>
              </div>
            ) : (
              <ul 
                className="space-y-1"
                role="list"
                aria-label="Online users list"
              >
                {users.map((user) => (
                  <li
                    key={user.id}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 touch-manipulation ${
                      user.id === currentUser?.id 
                        ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                        : 'hover:bg-muted/50 active:bg-muted/70'
                    }`}
                    role="listitem"
                    aria-label={`${user.alias}${user.id === currentUser?.id ? ' (you)' : ''}, joined ${formatTimeAgo(new Date(user.joinedAt))}`}
                  >
                    <div className="relative shrink-0">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border"
                        aria-hidden="true"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {user.alias.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-background"
                        aria-label="Online status indicator"
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {user.alias}
                        </p>
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">you</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatTimeAgo(new Date(user.joinedAt))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Join/Leave notifications */}
      {notifications.length > 0 && (
        <div 
          className="bg-card rounded-xl shadow-sm border overflow-hidden"
          role="region"
          aria-label="Recent activity"
        >
          <div className="border-b bg-muted/30 px-4 py-2">
            <span className="font-medium text-sm">Activity</span>
          </div>
          <div className="p-3 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`text-xs p-2 rounded-lg transition-all duration-300 border ${
                  notification.type === 'joined'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}
                role="status"
                aria-live="polite"
              >
                <span className="font-medium">{notification.user.alias}</span>
                {notification.type === 'joined' ? ' joined the chat' : ' left the chat'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/50',
        className
      )}
    />
  );
}

// Message skeleton components
export function MessageSkeleton({ isOwnMessage = false }: { isOwnMessage?: boolean }) {
  return (
    <div className={cn(
      "flex w-full mb-2 sm:mb-3",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
        {!isOwnMessage && (
          <Skeleton className="h-3 w-16 mb-1" />
        )}
        <div className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl p-3 sm:p-4",
          isOwnMessage
            ? "bg-muted/30 rounded-br-md"
            : "bg-muted/20 rounded-bl-md"
        )}>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-3 w-12 mt-1" />
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex-1 p-3 sm:p-4 space-y-4">
      <MessageSkeleton />
      <MessageSkeleton isOwnMessage />
      <MessageSkeleton />
      <MessageSkeleton />
      <MessageSkeleton isOwnMessage />
      <MessageSkeleton />
    </div>
  );
}

// User list skeleton
export function UserSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-2 rounded-full" />
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 border-b">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="p-2 space-y-1">
        <UserSkeleton />
        <UserSkeleton />
        <UserSkeleton />
        <UserSkeleton />
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Connection status skeleton
export function ConnectionSkeleton() {
  return (
    <div className="flex items-center space-x-2 p-2">
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Chat interface skeleton
export function ChatSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header skeleton */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]">
        <div className="h-full flex flex-col lg:flex-row lg:max-w-7xl lg:mx-auto lg:gap-4 lg:p-4">
          <div className="flex-1 flex flex-col lg:min-w-0">
            <div className="flex-1 bg-card lg:rounded-xl lg:shadow-sm lg:border overflow-hidden flex flex-col">
              <MessageListSkeleton />
              
              {/* Message input skeleton */}
              <div className="border-t bg-card/50 backdrop-blur-sm p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3">
                  <Skeleton className="flex-1 h-11" />
                  <Skeleton className="h-11 w-11" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar skeleton */}
          <div className="hidden lg:block lg:w-80 xl:w-96 lg:shrink-0">
            <div className="bg-card rounded-xl shadow-sm border h-full">
              <UserListSkeleton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
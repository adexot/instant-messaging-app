import { type ReactNode } from 'react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      "flex flex-col",
      "w-full max-w-full",
      className
    )}>
      {children}
    </div>
  );
}

interface ChatLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export function ChatLayout({ children, sidebar, className }: ChatLayoutProps) {
  return (
    <div className={cn(
      "flex h-screen w-full",
      "bg-background",
      className
    )}>
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
      
      {/* Sidebar - hidden on mobile, shown on desktop */}
      {sidebar && (
        <div className="hidden md:flex md:w-80 lg:w-96 border-l bg-muted/30">
          {sidebar}
        </div>
      )}
    </div>
  );
}

interface CenteredLayoutProps {
  children: ReactNode;
  className?: string;
}

export function CenteredLayout({ children, className }: CenteredLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-background p-4",
      className
    )}>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

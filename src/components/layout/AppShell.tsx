import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PrimaryNavigation } from './PrimaryNavigation';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '1440' | 'full';
  showNavigation?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  '1440': 'max-w-[1440px]',
  full: 'max-w-full',
};

export const AppShell: React.FC<AppShellProps> = ({
  children,
  className,
  contentClassName,
  maxWidth = '1440',
  showNavigation = true,
}) => {
  const { isBottomNav } = useBreakpoint();

  return (
    <div
      className={cn(
        'min-h-[100dvh] w-full overflow-x-hidden text-foreground',
        showNavigation && (isBottomNav
          ? 'pb-[calc(5rem+env(safe-area-inset-bottom))]'
          : 'pl-[76px]'),
        'bg-[#020b14]',
        className
      )}
      style={{
        background:
          'radial-gradient(circle at top, hsla(202, 90%, 65%, 0.18), transparent 35%), linear-gradient(180deg, #020b14 0%, #071827 100%)',
      }}
    >
      <div
        className={cn(
          'w-full mx-auto px-4 sm:px-6 lg:px-8',
          maxWidthMap[maxWidth],
          contentClassName
        )}
      >
        {children}
      </div>
      {showNavigation && <PrimaryNavigation />}
    </div>
  );
};

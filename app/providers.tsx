'use client';

import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { StreamProvider } from '@/lib/contexts/StreamContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StreamProvider>
          {children}
        </StreamProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 
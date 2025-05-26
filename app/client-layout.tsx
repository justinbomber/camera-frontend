'use client';

import Script from 'next/script'
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { StreamProvider } from '@/lib/contexts/StreamContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useEffect } from 'react';
import { checkAndRefreshVersion } from '@/lib/version';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // 在組件掛載時檢查版本
    checkAndRefreshVersion();
    
    // 添加焦點事件監聽器，當用戶切換回頁面時檢查版本
    const handleFocus = () => {
      checkAndRefreshVersion();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/missile.js"
        strategy="lazyOnload"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/h265webjs.js"
        strategy="lazyOnload"
      />
      <ErrorBoundary>
        <ThemeProvider>
          <StreamProvider>
            {children}
          </StreamProvider>
        </ThemeProvider>
      </ErrorBoundary>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful');
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `,
        }}
      />
    </>
  )
} 
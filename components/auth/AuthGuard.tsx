'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../lib/authService';
import LoadingScreen from '../ui/loading-screen';
import { useDeviceDetection } from '../../lib/deviceUtils';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 認證守衛元件
 * 檢查用戶是否已登入，未登入則重定向到登入頁面
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();
  const isMobile = useDeviceDetection();

  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log('AuthGuard: 開始認證檢查');
        
        const authenticated = AuthService.isAuthenticated();
        console.log('AuthGuard: 認證狀態:', authenticated);
        
        setIsAuthenticated(authenticated);
        
        if (!authenticated && !hasRedirected) {
          // 未登入，重定向到登入頁面
          console.log('AuthGuard: 未認證，重定向到登入頁面');
          setHasRedirected(true);
          router.replace('/login');
        }
      } catch (error) {
        console.error('AuthGuard: 認證檢查失敗:', error);
        // 發生錯誤時也重定向到登入頁面
        setIsAuthenticated(false);
        if (!hasRedirected) {
          setHasRedirected(true);
          router.replace('/login');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router, hasRedirected]);

  // 正在檢查認證狀態
  if (isChecking) {
    return fallback || <LoadingScreen message="檢查登入狀態..." isMobile={isMobile} />;
  }

  // 未認證且已重定向
  if (!isAuthenticated) {
    return fallback || <LoadingScreen message="重新導向到登入頁面..." isMobile={isMobile} />;
  }

  // 已認證，顯示受保護的內容
  return <>{children}</>;
};

/**
 * HOC 版本的認證守衛
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const AuthGuardedComponent = (props: P) => (
    <AuthGuard fallback={fallback}>
      <Component {...props} />
    </AuthGuard>
  );

  AuthGuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return AuthGuardedComponent;
} 
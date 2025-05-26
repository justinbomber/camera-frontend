import { useState, useEffect } from 'react';

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // 檢查用戶代理字符串
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
    const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // 檢查螢幕寬度
    const isMobileWidth = window.innerWidth < 768;
    
    // 檢查觸控支援
    const hasTouchScreen = 'ontouchstart' in window || (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0);
    
    return isMobileUserAgent || (isMobileWidth && hasTouchScreen);
  } catch (error) {
    console.warn('設備檢測失敗，默認為桌面設備:', error);
    return false;
  }
};

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      try {
        const mobile = isMobileDevice();
        setIsMobile(mobile);
        if (!isInitialized) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.warn('設備檢測失敗:', error);
        setIsMobile(false);
        setIsInitialized(true);
      }
    };

    // 立即檢測
    checkDevice();
    
    // 添加事件監聽器，但使用防抖
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCheckDevice = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkDevice, 100);
    };

    window.addEventListener('resize', debouncedCheckDevice);
    window.addEventListener('orientationchange', debouncedCheckDevice);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedCheckDevice);
      window.removeEventListener('orientationchange', debouncedCheckDevice);
    };
  }, [isInitialized]);

  return isMobile;
}; 
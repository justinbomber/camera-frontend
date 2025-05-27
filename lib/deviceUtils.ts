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
  // 初始狀態始終為 false 以避免 hydration 錯誤
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 客戶端 hydration 完成後再進行設備檢測
    setIsHydrated(true);
    
    const checkDevice = () => {
      try {
        const mobile = isMobileDevice();
        setIsMobile(mobile);
      } catch (error) {
        console.warn('設備檢測失敗:', error);
        setIsMobile(false);
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
  }, []);

  // 在 hydration 完成前返回預設值
  return isHydrated ? isMobile : false;
}; 
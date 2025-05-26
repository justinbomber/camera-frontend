// 版本控制機制
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

// 檢查並強制刷新的函數
export const checkAndRefreshVersion = () => {
  const currentVersion = localStorage.getItem('app_version');
  
  // 如果版本不匹配或不存在，強制刷新
  if (currentVersion !== APP_VERSION) {
    localStorage.setItem('app_version', APP_VERSION);
    window.location.reload();
  }
};

// 清除所有快取的函數
export const clearBrowserCache = () => {
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  // 清除 localStorage
  localStorage.clear();
  
  // 清除 sessionStorage
  sessionStorage.clear();
  
  // 強制重新載入頁面，繞過快取
  window.location.reload();
}; 
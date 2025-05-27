// 版本控制機制
const APP_VERSION = '1.0.0';

// 安全檢查並強制刷新的函數
export const checkAndRefreshVersion = () => {
  // 只在瀏覽器環境中執行
  if (typeof window === 'undefined') return;
  
  try {
    const currentVersion = localStorage.getItem('app_version');
    
    // 如果版本不匹配或不存在，強制刷新
    if (currentVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      window.location.reload();
    }
  } catch (error) {
    console.warn('版本檢查失敗:', error);
    // 發生錯誤時也強制刷新
    try {
      localStorage.setItem('app_version', APP_VERSION);
      window.location.reload();
    } catch (reloadError) {
      console.error('無法重新載入頁面:', reloadError);
    }
  }
};

// 清除所有快取的函數
export const clearBrowserCache = () => {
  // 只在瀏覽器環境中執行
  if (typeof window === 'undefined') return;
  
  try {
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
  } catch (error) {
    console.error('清除快取失敗:', error);
    // 即使清除失敗也嘗試重新載入
    try {
      window.location.reload();
    } catch (reloadError) {
      console.error('無法重新載入頁面:', reloadError);
    }
  }
}; 
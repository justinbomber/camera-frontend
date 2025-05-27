import { useState, useEffect } from 'react';

/**
 * 安全的 localStorage hook，避免 hydration 錯誤
 * @param key localStorage 鍵名
 * @param initialValue 初始值
 * @returns [value, setValue] 元組
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // 初始狀態始終使用 initialValue 避免 hydration 錯誤
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // 只在客戶端 hydration 完成後讀取 localStorage
  useEffect(() => {
    setIsHydrated(true);
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 允許使用函數來更新值
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // 更新狀態
      setStoredValue(valueToStore);
      
      // 只在客戶端保存到 localStorage
      if (isHydrated && typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
} 
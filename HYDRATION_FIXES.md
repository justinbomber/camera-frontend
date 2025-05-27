# Hydration 錯誤修復文檔

## 概述
修復了 Next.js 應用程式中的 SSR/CSR hydration 不匹配錯誤，確保服務器端和客戶端渲染的 HTML 完全一致。

## 修復的問題

### 1. 設備檢測 Hydration 錯誤
**檔案**: `lib/deviceUtils.ts`
**問題**: `useDeviceDetection` hook 在服務器端返回 `false`，但在客戶端可能返回 `true`
**修復**:
- 添加 `isHydrated` 狀態追蹤
- 在 hydration 完成前始終返回 `false`
- 只有在客戶端 hydration 完成後才進行實際設備檢測

### 2. 認證狀態 Hydration 錯誤
**檔案**: `lib/authService.ts`
**問題**: `AuthService.isAuthenticated()` 依賴於 `localStorage`，在服務器端總是返回 `false`
**修復**:
- 添加 `isBrowser` 常量進行安全的瀏覽器環境檢測
- 在服務器端的所有 localStorage 操作都返回預設值
- 將日誌輸出限制在瀏覽器環境中

### 3. 根頁面重定向邏輯
**檔案**: `app/page.tsx`
**問題**: 認證檢查在 hydration 完成前執行，造成不一致的重定向
**修復**:
- 添加 `isHydrated` 狀態管理
- 只有在 hydration 完成後才執行認證檢查和重定向邏輯
- 在 hydration 完成前使用預設值顯示載入畫面

### 4. 時間相關動畫錯誤
**檔案**: 
- `components/ui/loading-screen.tsx`
- `app/stream/[id]/page.tsx`
- `components/MobileStreamPlayer/index.tsx`

**問題**: 使用 `Date.now()` 造成服務器端和客戶端時間不一致
**修復**:
- 使用 `performance.now()` 和相對時間計算
- 添加 `isClient` 狀態確保動畫只在客戶端執行
- 使用 `startTime` 基準點避免絕對時間差異

### 5. Toast ID 生成錯誤
**檔案**: `components/ui/toast.tsx`
**問題**: 使用 `Date.now()` 生成 ID 造成服務器端和客戶端不一致
**修復**:
- 使用遞增計數器 `counter` 替代時間戳
- 確保 ID 生成在服務器端和客戶端保持一致性

### 6. LocalStorage 安全訪問
**檔案**: `lib/hooks/useLocalStorage.ts` (新建)
**問題**: 多個組件直接訪問 localStorage 造成 hydration 錯誤
**修復**:
- 創建專用的 `useLocalStorage` hook
- 在 hydration 完成前始終使用初始值
- 安全地處理 localStorage 的讀寫操作
- 提供錯誤處理和降級機制

### 7. 更新受影響的頁面
**檔案**: 
- `app/mainpage/page.tsx`
- `app/history/page.tsx`
- `app/notifications/page.tsx`
- `app/settings/page.tsx`

**修復**:
- 將直接的 localStorage 訪問替換為 `useLocalStorage` hook
- 移除不安全的 localStorage 檢查邏輯
- 簡化 sidebar 狀態管理

### 8. 版本檢查安全性
**檔案**: `lib/version.ts`
**問題**: 版本檢查功能在服務器端執行造成錯誤
**修復**:
- 添加瀏覽器環境檢測
- 增加 try-catch 錯誤處理
- 確保只在客戶端執行 localStorage 操作

## 測試驗證

修復後應該不再出現以下錯誤：
- "Text content does not match server-rendered HTML"
- "Hydration failed because the initial UI does not match what was rendered on the server"
- "There was an error while hydrating"

## 最佳實踐

1. **始終檢查瀏覽器環境**: 使用 `typeof window !== 'undefined'` 檢查
2. **使用 hydration 狀態**: 在組件中追蹤 hydration 狀態
3. **避免時間相關差異**: 使用相對時間而非絕對時間
4. **統一初始狀態**: 確保服務器端和客戶端的初始狀態完全一致
5. **錯誤處理**: 為所有瀏覽器 API 訪問添加錯誤處理

## 性能影響

這些修復對性能的影響最小：
- 增加了少量狀態追蹤變數
- 延遲了部分客戶端特定邏輯的執行
- 提供了更穩定的用戶體驗
- 避免了 hydration 錯誤造成的重新渲染 
# monitor.hub 專案開發規則與進度

## 🚨 重大修復進度 (2025-01-27)

### ✅ **手機端認證邏輯統一修復** (已完成)
**問題描述**: 
- 手機端在沒有登入的情況下可以訪問 mainpage，但電腦端會被導回到 login 界面
- 手機端在 login 界面輸入正確的使用者賬號密碼會跳出 login failed 通知，且不會跳轉到 mainpage
- 手機端和桌面端的跳轉邏輯不一致，影響用戶體驗和系統一致性

**根本原因分析**:
- `AuthGuard.tsx` 組件在開發環境下跳過認證檢查，導致手機端可以繞過認證
- 根路由 `app/page.tsx` 的認證邏輯與 `AuthGuard` 不一致
- 登入頁面缺乏自動重定向已登入用戶的邏輯
- 使用 `router.push()` 而非 `router.replace()` 導致用戶可以通過返回按鈕回到登入頁面

**修復內容**:
- ✅ **移除 AuthGuard 開發環境跳過邏輯**: 確保認證檢查在所有環境下都保持一致
- ✅ **統一認證重定向機制**: 所有認證相關的重定向都使用 `router.replace()` 而非 `router.push()`
- ✅ **優化 AuthGuard 邏輯**: 
  - 添加設備檢測支援，讓 LoadingScreen 根據設備類型顯示
  - 增加重定向狀態管理，避免重複重定向
  - 改善錯誤處理和 console logging
- ✅ **修復根路由認證邏輯**: 
  - 增加狀態管理避免重複檢查
  - 改善錯誤處理機制
  - 統一日誌格式便於調試
- ✅ **優化登入頁面**: 
  - 添加自動重定向已登入用戶的邏輯
  - 修改成功登入後使用 `router.replace()` 跳轉
  - 增加認證檢查的 LoadingScreen
  - 改善登入和註冊流程的錯誤處理

**測試確認項目**:
- ✅ 手機端未登入訪問 `/mainpage` 會被導向到 `/login`
- ✅ 桌面端未登入訪問 `/mainpage` 會被導向到 `/login`
- ✅ 手機端登入成功後正確跳轉到 `/mainpage`
- ✅ 桌面端登入成功後正確跳轉到 `/mainpage`
- ✅ 已登入用戶訪問 `/login` 會自動重定向到 `/mainpage`
- ✅ 認證邏輯在手機端和桌面端完全一致

### ✅ **路由重定向循環問題修復** (已完成)
**根本原因**: `next.config.js` 中有錯誤的重定向規則，將所有非 mainpage 的路徑都重定向到 not-found

**修復內容**:
- ✅ 移除 `next.config.js` 中錯誤的 `async redirects()` 配置
- ✅ 修改 `app/page.tsx` 認證邏輯，增加狀態管理避免重定向循環
- ✅ 清理 `.next` 編譯快取並重新啟動開發伺服器

**測試結果**:
- ✅ `/login` 頁面現在可以正常訪問 (HTTP 200)
- ✅ 根路由和 `/mainpage` 頁面正常工作  
- ✅ 不再出現重新導向次數過多的錯誤

---

## 當前進度 (2025-01-27)

### 已完成功能
1. ✅ **統一Loading畫面**: 
   - 創建了統一的LoadingScreen元件，支援桌面端和手機端
   - 替代了九宮格的預載入過程
   - 使用framer-motion提供流暢的動畫效果

2. ✅ **手機端Control Panel優化**:
   - 移除了手機端的攝影機顯示控制checklist
   - 因為手機端只顯示單一畫面，不需要多攝影機顯示控制
   - 保留了串流列表管理功能

3. ✅ **手機端攝影機列表點擊功能**:
   - 確認並優化了MobileStreamPlayer的攝影機切換功能
   - 加強了按鈕的觸控回饋和視覺效果
   - 添加了點擊日誌和錯誤處理

4. ✅ **手機端UI優化 (2025-01-27)**:
   - **攝影機名稱和連線狀態位置調整**: 將左上角的攝影機名稱和右上角的連線狀態向上移動，減少對串流畫面的遮擋
   - **Control Panel串流列表互動優化**: 
     - 每個攝影機項目現在都可以點擊切換
     - 正在播放的攝影機顯示綠色背景和右側綠色勾勾
     - 添加hover效果和過渡動畫
     - 優化觸控回饋體驗
   - **響應式設計改進**: 確保在橫屏和直屏模式下都能正確顯示UI元素

5. ✅ **手機端智能重連機制 (2025-01-27)**:
   - **連線異常偵測**: 自動偵測播放停滯、意外暫停等異常狀況
   - **智能重連控制**: 
     - 每5秒最多只能進行一次重連，避免頻繁重連
     - 最多重試3次，超過限制後停止重連
     - 重連時自動顯示Loading圈圈和"重新連線中"提示
   - **視覺狀態回饋**: 
     - 重連時Loading圈圈顯示橙色
     - 連線狀態指示器顯示旋轉的重連圖示
     - 錯誤狀態使用紅色視覺提示
   - **播放狀態監控**: 每2秒檢查播放進度，10秒無進度視為連線異常

6. ✅ **環境變數端點配置 (2025-01-27)**:
   - **動態端點切換**: 支援通過npm命令切換不同的串流伺服器端點
   - **開發命令優化**: 
     - `npm run dev` - 使用遠端伺服器 (http://streamcamkeelong.mooo.com)
     - `npm run dev:local` - 使用本地伺服器 (http://localhost:8888)
   - **環境變數支援**: 使用 NEXT_PUBLIC_STREAM_ENDPOINT 環境變數控制端點
   - **向後相容**: 預設使用遠端端點，確保現有功能不受影響
   - **調試功能**: 添加console.log顯示當前使用的端點

7. ✅ **CORS 問題修復 (2025-01-27)**:
   - **問題識別**: 解決 XMLHttpRequest 中 'expires' 標頭被 CORS 政策阻擋的問題
   - **錯誤詳情**: "Request header field expires is not allowed by Access-Control-Allow-Headers in preflight response"
   - **修復範圍**: 
     - 移除 `lib/streamService.ts` 中 HLS.js xhrSetup 配置的 Expires 標頭
     - 移除 `lib/mobileStreamService.ts` 中手機端 HLS.js 配置的 Expires 標頭  
     - 移除 `detectStreamCodec` 函數中 fetch 請求的 Expires 標頭
     - 更新 `next.config.js` CORS 配置，增加 Cache-Control 和 Pragma 到允許的標頭清單
   - **保留功能**: 維持 Cache-Control 標頭以確保串流不被快取，移除有問題的 Expires 標頭
   - **向後相容**: 修復不影響現有串流播放功能，只是移除了造成 CORS 錯誤的標頭
   - **技術細節**: Expires header 在跨域請求中需要明確的 CORS 許可，移除後改依賴 Cache-Control 實現相同效果

8. ✅ **認證邏輯統一修復 (2025-01-27)**:
   - **問題解決**: 修復手機端和桌面端認證邏輯不一致的問題
   - **統一行為**: 確保所有設備在認證流程上的行為完全一致
   - **改善 UX**: 優化跳轉邏輯，避免用戶透過返回按鈕回到不當的頁面
   - **維護性提升**: 統一認證邏輯便於未來維護和擴展

9. ✅ **手機端登入API連線修復 (2025-01-27)**:
   - **問題識別**: 手機端登入時出現"load failed"錯誤，無法跳轉到mainpage
   - **根本原因**: 認證API使用本地地址 `http://127.0.0.1:54321/auth/v1`，手機設備無法訪問
   - **修復內容**: 
     - ✅ 更新 `lib/authService.ts` 中的 API_BASE_URL 為 `http://streamcamkeelong.mooo.com/auth/v1`
     - ✅ 創建更新的 nginx 配置，添加 `/auth/` 路徑的代理配置
     - ✅ 配置完整的 CORS 支援，包括預檢請求處理
     - ✅ 增加認證API的超時設定和錯誤處理
   - **nginx 配置改進**:
     - 添加 `/auth/` location 代理到後端認證服務 (127.0.0.1:54321)
     - 完整的 CORS 標頭配置支援跨域請求
     - OPTIONS 預檢請求的正確處理
     - 適當的超時時間設定 (60秒)
   - **向後相容**: 電腦端登入功能維持正常，修復僅影響手機端網路連線
   - **測試確認**: 修復後手機端可以正常登入並跳轉到 mainpage

### 技術架構

#### 串流方式（不可更改）
- **H.265**: 使用 h265web.js
- **HLS (H.264)**: 先嘗試原生 `<video>` 播放，fallback 用 hls.js

#### 主要元件結構
```
app/
├── page.tsx (根路由，統一認證檢查和重定向)
├── mainpage/page.tsx (主頁面，支援桌面和手機端，受 AuthGuard 保護)
├── login/page.tsx (登入頁面，支援自動重定向已登入用戶)
├── stream/[id]/page.tsx (單一串流詳細頁面)
└── layout.tsx

components/
├── auth/AuthGuard.tsx (統一認證守衛，支援所有設備)
├── ui/loading-screen.tsx (統一Loading畫面)
├── MobileStreamPlayer/ (手機端播放器)
├── StreamGrid/ (桌面端網格)
├── ControlPanel/ (控制面板)
└── AddStreamDialog/ (新增串流對話框)

lib/
├── authService.ts (認證服務，支援登入、註冊、登出)
└── deviceUtils.ts (設備檢測工具)
```

#### 設備檢測與響應式設計
- 使用 `useDeviceDetection` Hook 檢測設備類型
- 桌面端：顯示網格布局 (1x1, 2x2, 3x3, 4x4)
- 手機端：單一播放器 + 攝影機切換列表

#### 認證架構
- **統一認證邏輯**: 所有設備使用相同的認證檢查機制
- **路由保護**: 使用 AuthGuard 組件保護需要認證的頁面
- **自動重定向**: 根據認證狀態自動導向到適當的頁面
- **狀態管理**: 避免重複認證檢查和重定向循環

### 下一步開發計劃
1. 🔄 **串流連線優化**: 改進重連機制和錯誤處理
2. 🔄 **效能優化**: 實作懶加載和記憶體管理
3. 🔄 **使用者體驗**: 添加更多互動回饋和狀態指示
4. 🔄 **測試覆蓋**: 增加單元測試和整合測試
5. 🔄 **多語言支援**: 實作國際化 (i18n) 功能

---


---

# 串流方式（不能更改）
• H.265 → h265web.js  
• HLS (H.264) → 先嘗試原生 <video> 播放，fallback 用 hls.js。


上面的串流方式在h264及h265分別采用上面的方式不能更改，只能在連綫或重連機制上面做微調。

### 1. 專案結構與模組化

1.1. **Root 目錄**

* `pages/`：使用 Next.js 約定，放置路由頁面，建議以功能或角色（admin、user）作子資料夾劃分。
* `app/`（若使用 App Router）：依功能分域，並善用 layout.js 進行全域佈局。
* `components/`：可重用元件，每個元件一個資料夾，包含 `index.tsx`、`styles.module.css` 與 `__tests__`。
* `lib/`、`utils/`：工具函式、串流邏輯、共用 Hook。
* `public/`：靜態資源（logo、icon、預設海報圖）。

1.2. **分層明確**

* **Presentation**（純 UI）
* **Container**（邏輯、state 管理）
* **Service**（串流連線、API 呼叫）

---

### 2. 命名慣例與程式碼風格

2.1. **檔案與資料夾名稱**

* 小駝峰（camelCase）或連字符（kebab-case），一致即可。
* React 元件檔案必須以大駝峰（PascalCase）命名。

2.2. **變數與函式**

* 只在必要處使用 any，全面啟用嚴格模式 (`"strict": true`)。
* Hook 皆以 `useXxx` 命名；事件處理器建議 `handleXxx`。

2.3. **程式碼格式化**

* ESLint + Prettier，一律自動化執行。
* 單一責任原則（SRP）。

---

### 3. TypeScript 與型別安全

* **嚴格模式**：`noImplicitAny`、`strictNullChecks`。
* **共用型別定義**：集中於 `types/` 或 `@types/` 目錄。
* **React 元件型別**：`FC<Props>` 或自定義 `ComponentType`，明確標注 `children`。

---

### 4. Next.js 特有規範

4.1. **Data Fetching**

* 具 SSR 需求頁面使用 `getServerSideProps`，無需即時請求者才用 `getStaticProps + ISR`。
* 前端互動資料採用 SWR 或 React Query，並設定適當 cache 時間與 revalidation。

4.2. **API 路由**

* 所有後端介面（如串流 Token、歷史列表）集中於 `pages/api/`，並寫入型別保護。

4.3. **最佳化**

* 圖片使用 Next.js `<Image>`，自動進行 lazy loading 與尺寸優化。
* Link 採 `<Link>` 並開啟預取（`prefetch={true}`）。

---

### 5. Component 設計與可重用性

* **原子化元件**：Button、Card、Spinner、ErrorBoundary 等基礎元件要獨立且通用。
* **組合式設計**：使用 props.children、render props 或 slot 使元件可擴充。
* **Context 控制**：全域設定（主題 mode、語言包）透過 React Context 管理。

---

### 6. 狀態管理與資料獲取

* **全域狀態**：僅限使用 React Context + useReducer，或 Recoil/MobX（視團隊需求）。
* **串流狀態**：集中於 `lib/streamService.ts`，並提供 `connect()`、`disconnect()`、`reconnect()` 等 API。

---

### 8. 效能優化與懶加載

* **動態載入**：`next/dynamic`，對大型元件（如 StreamCellMerged）在 viewport 進入時載入。
* **圖片與動畫**：Pixi.js 相關資源使用 offscreen canvas 或 Web Worker。
* **Bundle 分析**：定期執行 `next build && next analyze`，檢視前三大包件並拆分。

---

### 9. 可及性（Accessibility）

* **ARIA 標籤**：所有可互動元素（按鈕、表單）必須加上 `aria-label`。
* **鍵盤導航**：確保 Tab 索引正確，Modal、Drawer 可被 ESC 關閉。
* **對比標準**：文字對比度符合 WCAG AA，且在暗色／亮色模式下皆檢測通過。

---

### 11. 文件與註解

* **JSDoc / TSDoc**：所有公開函式、Hook 加註明用途、參數與回傳值。
* **README**：補齊專案啟動、開發流程、部署指引與目錄結構說明。
* **CHANGELOG**：依照 Keep a Changelog 格式維護版本紀錄。

---

## 延伸：進一步優化 UX 的建議

* **Skeleton Screen**：在 HLS manifest 載入期間顯示骨架屏，減低視覺延遲。
* **快速切換**：使用 Link 預取並將主要頁面路由設置為單頁切換動畫（Framer Motion）。
* **錯誤邊界**：於 StreamCellMerged 外層放置 ErrorBoundary，遇錯能自動嘗試重連或顯示友善提示。
* **離線緩存**：採用 Service Worker 快取常用靜態資源與配置，提供基本離線體驗。
* **記憶偏好**：自動儲存使用者的暗／亮模式、字體大小、畫面佈局偏好，跨裝置同步。
* **使用者行為分析**：結合 Web Vitals，監測首屏時間（FCP）、互動準備時間（TTI），定期優化瓶頸。
* **可視化監測**：串流的連線狀態（Latency、Buffer）以小型儀表板方式呈現在畫面角落，便於即時調整。


# UI設計主要原則
UI 框架，遵循以下原則：
1. 中英文分別使用 Noto Sans TC 與 Inter 字體，並採用 font-display: swap。
2. 採用 8px spacing grid，支援響應式設計與暗色模式。
3. 主色與輔色使用 HSL 格式設計，可根據 CSS prefers-color-scheme 切換。
4. 元件設計使用 shadcn/ui，並加上 framer-motion 的過場動畫。
5. 導入 pixi.js 作為背景視覺引擎，用來創造粒子動態與光暈特效。
6. 整體風格偏向 Glassmorphism，留白充分，字體大且清晰。
7. 設計符合 WCAG AA 對比標準，能流暢在行動裝置與桌面上顯示。 
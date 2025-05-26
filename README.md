# Camera Frontend

一個基於 Next.js 的攝影機串流前端應用，支援 H.264 HLS 和 H.265 串流播放。

## 🚀 功能特色

- **多串流支援**: 同時播放多個攝影機串流
- **雙編碼格式**: 支援 H.264 (HLS) 和 H.265 串流
- **響應式設計**: 適配桌面和行動裝置
- **實時重連**: 智能錯誤檢測和自動重連機制
- **Safari 優化**: 針對 iOS Safari 的特殊優化

### 🔧 Safari 手機端優化

針對 Safari 在手機端播放時容易遇到的卡頓黑屏問題，我們實作了以下優化：

#### 🎯 問題解決
- **自動重連機制**: 檢測到播放卡頓時自動重新建立連線
- **心跳檢測**: 每 2 秒檢查播放狀態，超過 8 秒無更新則觸發重連
- **手動重連**: 提供手動重連按鈕，讓使用者可以主動重試
- **連線狀態指示**: 即時顯示連線狀態（已連線/錯誤/離線）

#### 🛠️ 技術特色
- **事件監聽增強**: 監聽更多 video 事件（stalled, waiting, emptied, pause）
- **Safari 特定處理**: 針對 Safari 的播放特性進行特殊處理
- **漸進式重連**: 重連延遲遞增，避免過度重試
- **視覺反饋**: 載入動畫和錯誤狀態的視覺提示

## 🏗️ 技術架構

### 串流處理方式
- **H.265**: 使用 h265web.js 進行硬體解碼
- **H.264**: 優先使用原生 `<video>` 播放，降級至 hls.js

### 核心元件
- `StreamService`: 串流服務管理
- `StreamCell`: 單一串流顯示元件
- `StreamGrid`: 多串流網格佈局

## 📱 平台相容性

- ✅ Chrome (桌面/行動)
- ✅ Firefox (桌面/行動)
- ✅ Safari (桌面/行動) - 特別優化
- ✅ Edge (桌面)

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置產品版本
npm run build

# 啟動產品版本
npm start
```

## 🔧 設定說明

### 串流 URL 格式
```
rtmp://your-server.com/live/stream_name
```

### 環境變數
```env
NEXT_PUBLIC_STREAM_BASE_URL=your_stream_server
```

## 📖 使用說明

1. **新增串流**: 點擊 "+" 按鈕新增串流 URL
2. **移除串流**: 長按進入移除模式，選擇要移除的串流
3. **手動重連**: 遇到連線問題時，點擊錯誤提示中的重連按鈕

### Safari 手機端使用建議
- 確保網路連線穩定
- 如遇到黑屏，系統會自動嘗試重連
- 可手動點擊重連按鈕強制重新連線
- 連線狀態會即時顯示在畫面右上角

## 🐛 已知問題與解決方案

### Safari 手機端播放問題
**問題**: 網路不穩定時容易黑屏不重連
**解決**: 
- 實作心跳檢測機制
- 增強事件監聽
- 提供手動重連功能

### 網路波動處理
**問題**: 短暫網路中斷導致播放停止
**解決**: 
- 自動重連機制（最多重試 10 次）
- 漸進式重連延遲
- 視覺化載入狀態

## 🎨 UI/UX 設計原則

- 使用 Noto Sans TC 和 Inter 字體
- 遵循 8px spacing grid
- 支援暗色/亮色模式自動切換
- Glassmorphism 設計風格
- 符合 WCAG AA 對比標準

## mediamtx.yml 設定内容
```yaml
hls: yes
hlsAddress: :8888
hlsEncryption: no
hlsServerKey: server.key
hlsServerCert: server.crt
hlsAllowOrigin: '*'
hlsTrustedProxies: []
hlsAlwaysRemux: yes
# hlsVariant: lowLatency
# 使用 fmp4 格式，若要手機正常播放避免使用 lowLatency
hlsVariant: fmp4
hlsSegmentCount: 3
hlsSegmentDuration: 1s
hlsPartDuration: 200ms
hlsSegmentMaxSize: 50M
hlsDirectory: ''
hlsMuxerCloseAfter: 60s
```

## 🔄 更新日誌

### v2.1.0 - Safari 優化版本
- ✨ 新增 Safari 手機端播放優化
- 🔧 實作智能重連機制
- 🎯 加入連線狀態指示器
- 🐛 修復網路不穩定時的黑屏問題

### v2.0.0
- 🎉 支援 H.265 串流
- 🔧 重構串流服務架構
- 📱 優化行動裝置體驗

## 📄 授權

MIT License

---

如有任何問題或建議，歡迎提出 Issue 或 Pull Request。